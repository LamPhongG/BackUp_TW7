import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as store from "../services/documentStore";
import { processDocument } from "../services/documentProcessing";
import { sanitizeDocuments } from "../services/sanitize";
import { apiBlob, apiRequest, backendEnabled, uploadWithProgress } from "../services/apiClient";
import { mapChunks, mapDocument } from "../services/apiMappers";
import { useAuth } from "../hooks/useAuth";
import { compareVersions, computeLifecycle, familyOf, findCatalogEntry, normalizeVersion } from "../utils/documentValidation";
import { todayISO } from "../utils/helpers";

const DocumentsContext = createContext(null);

// Chế độ cố định lúc build (VITE_API_URL), nên provider luôn gọi cùng một hook — đúng luật thứ tự hook của React
const useDocumentSource = backendEnabled() ? useBackendDocuments : useBrowserDocuments;

export function DocumentsProvider({ children }) {
  const { records, loading, error, progress, processed, addDocuments, removeDocument, getFile, processDocuments } = useDocumentSource();

  // Gắn trạng thái vòng đời (tính lại mỗi lần danh sách đổi) + tên tiếng Việt từ danh mục
  const documents = useMemo(() => {
    const lifecycle = computeLifecycle(records, todayISO());
    return records
      .map(d => ({ ...d, title: d.title || findCatalogEntry(d.code)?.title?.replace(/\s*\(bản cũ\)$/, "") || d.titleEn, ...lifecycle[d.id] }))
      .sort((a, b) => a.code.localeCompare(b.code) || compareVersions(b.version, a.version));
  }, [records]);

  const chunksByDocId = useMemo(
    () => Object.fromEntries(Object.entries(processed).map(([id, r]) => [id, r.chunks || []])),
    [processed]
  );

  const value = useMemo(() => ({
    documents,
    activeDocuments: documents.filter(d => d.status === "active"),
    loading,
    error,
    addDocuments,
    removeDocument,
    getFile,
    progress,
    processed,
    chunksByDocId,
    processDocuments,
  }), [documents, loading, error, addDocuments, removeDocument, getFile, progress, processed, chunksByDocId, processDocuments]);

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

/** Tài liệu lưu trong IndexedDB, trích xuất + chia chunk ngay trong trình duyệt */
function useBrowserDocuments() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // id → { percent, stage } của tài liệu đang xử lý; không lưu lại vì chỉ có nghĩa trong phiên hiện tại
  const [progress, setProgress] = useState({});
  // id → { chunks, injection_flags, engine, page_count, ... }
  const [processed, setProcessed] = useState({});
  const inFlight = useRef(new Set());
  const autoStarted = useRef(false);

  const reload = useCallback(async () => {
    try {
      const list = sanitizeDocuments(await store.listDocuments());
      setRecords(list);
      const doneIds = list.filter(d => d.processing === "done").map(d => d.id);
      const results = await store.getProcessing(doneIds);
      setProcessed(Object.fromEntries(results.map(r => [r.id, {
        ...r,
        chunks: Array.isArray(r.chunks) ? r.chunks : [],
        injection_flags: Array.isArray(r.injection_flags) ? r.injection_flags : [],
      }])));
      setError(null);
      return list;
    } catch (e) {
      setError(e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Chạy tuần tự: pdf.js và mammoth tốn bộ nhớ, xử lý song song 20 file dễ treo tab
  const processDocuments = useCallback(async (docs) => {
    const queue = docs.filter(d => !inFlight.current.has(d.id));
    queue.forEach(d => inFlight.current.add(d.id));
    setProgress(prev => ({ ...prev, ...Object.fromEntries(queue.map(d => [d.id, { percent: 0, stage: "queued" }])) }));
    for (const doc of queue) {
      try {
        const blob = await store.getDocumentFile(doc.id);
        if (!blob) throw new Error("File not found");
        const result = await processDocument(doc, blob, p => setProgress(prev => ({ ...prev, [doc.id]: p })));
        await store.saveProcessing(doc.id, {
          processing: "done",
          processingEngine: result.engine,
          processedAt: result.processed_at,
          chunkCount: result.chunks.length,
          pageCount: result.page_count,
          injectionFlagCount: result.injection_flags.length,
          processingError: null,
        }, result);
      } catch (e) {
        await store.saveProcessing(doc.id, { processing: "failed", processingError: e.message }).catch(() => {});
      } finally {
        inFlight.current.delete(doc.id);
        setProgress(prev => {
          const next = { ...prev };
          delete next[doc.id];
          return next;
        });
      }
    }
    if (queue.length) await reload();
  }, [reload]);

  // Tài liệu tải lên trước khi có bước xử lý vẫn ở trạng thái "pending" — xử lý bù một lần khi mở app
  useEffect(() => {
    reload().then(list => {
      if (autoStarted.current) return;
      autoStarted.current = true;
      const pending = list.filter(d => d.processing === "pending");
      if (pending.length) processDocuments(pending);
    });
  }, [reload, processDocuments]);

  // drafts đã qua validateDraft; trả về số tài liệu đã lưu
  const addDocuments = useCallback(async (drafts, uploadedBy) => {
    const uploadedAt = new Date().toISOString();
    const entries = drafts.map(draft => {
      const code = draft.code.trim().toUpperCase();
      const titleEn = draft.titleEn.trim();
      return {
        file: draft.file,
        meta: {
          id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          code,
          titleEn,
          family: familyOf({ code, titleEn }),
          category: draft.category,
          department: draft.department,
          version: normalizeVersion(draft.version),
          effectiveDate: draft.effectiveDate,
          expiryDate: draft.expiryDate || null,
          fileName: draft.file.name,
          ext: draft.ext,
          mimeType: draft.file.type,
          size: draft.file.size,
          hash: draft.hash,
          uploadedAt,
          uploadedBy,
          processing: "pending",
        },
      };
    });
    await store.saveDocuments(entries);
    await reload();
    // Không chờ xử lý xong: modal tải lên đóng ngay, tiến độ hiện ở bảng tài liệu
    processDocuments(entries.map(e => e.meta));
    return entries.length;
  }, [reload, processDocuments]);

  const removeDocument = useCallback(async (id) => {
    await store.deleteDocument(id);
    await reload();
  }, [reload]);

  return { records, loading, error, progress, processed, addDocuments, removeDocument, getFile: store.getDocumentFile, processDocuments };
}

/** Tài liệu nằm ở backend: tải lên, trích xuất, chia chunk, quét injection đều do server làm */
function useBackendDocuments() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({});
  const [processed, setProcessed] = useState({});
  // Chunk chỉ HR / Reviewer xem được (để kiểm định); nhân viên đọc nội dung trong lộ trình
  const canReadChunks = user?.userRole === "hr" || user?.userRole === "reviewer";

  const reload = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setProcessed({});
      setLoading(false);
      return [];
    }
    try {
      const list = (await apiRequest("/documents")).map(mapDocument);
      setRecords(list);
      if (canReadChunks) {
        const ready = list.filter(d => d.processing === "done");
        const results = await Promise.all(ready.map(d => apiRequest(`/documents/${d.id}/chunks`).then(mapChunks)));
        setProcessed(Object.fromEntries(ready.map((d, i) => [d.id, results[i]])));
      }
      setError(null);
      return list;
    } catch (e) {
      setError(e);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, canReadChunks]);

  useEffect(() => { reload(); }, [reload]);

  // Server xử lý xong trong cùng request tải lên, nên chờ tất cả rồi mới đóng modal
  const addDocuments = useCallback(async (drafts) => {
    const failures = [];
    let saved = 0;
    for (const draft of drafts) {
      const form = new FormData();
      form.append("file", draft.file, draft.file.name);
      form.append("code", draft.code.trim().toUpperCase());
      form.append("title_en", draft.titleEn.trim());
      form.append("category", draft.category);
      form.append("department_code", draft.department);
      form.append("version", normalizeVersion(draft.version));
      form.append("effective_date", draft.effectiveDate);
      form.append("expiry_date", draft.expiryDate || "");
      try {
        await uploadWithProgress("/documents", form, ratio =>
          setProgress(prev => ({ ...prev, [draft.key]: { percent: Math.round(ratio * 90), stage: "upload" } })));
        saved++;
      } catch (e) {
        failures.push(`${draft.file.name}: ${e.message}`);
      } finally {
        setProgress(prev => {
          const next = { ...prev };
          delete next[draft.key];
          return next;
        });
      }
    }
    await reload();
    if (failures.length) throw new Error(failures.join("; "));
    return saved;
  }, [reload]);

  const removeDocument = useCallback(async (id) => {
    await apiRequest(`/documents/${id}`, { method: "DELETE" });
    await reload();
  }, [reload]);

  const getFile = useCallback(id => apiBlob(`/documents/${id}/file`), []);

  // "Thử lại" cho tài liệu xử lý lỗi: server đọc lại file đã lưu
  const processDocuments = useCallback(async (docs) => {
    for (const doc of docs) {
      setProgress(prev => ({ ...prev, [doc.id]: { percent: 50, stage: "extract" } }));
      try {
        await apiRequest(`/documents/${doc.id}/process`, { method: "POST" });
      } finally {
        setProgress(prev => {
          const next = { ...prev };
          delete next[doc.id];
          return next;
        });
      }
    }
    await reload();
  }, [reload]);

  return { records, loading, error, progress, processed, addDocuments, removeDocument, getFile, processDocuments };
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used inside <DocumentsProvider>");
  return ctx;
}

export async function openStoredFile(getFile, doc, { download = false, page = null } = {}) {
  const blob = await getFile(doc.id);
  if (!blob) throw new Error("File not found");
  const url = URL.createObjectURL(blob);
  if (download) {
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    // Trình xem PDF của trình duyệt hiểu #page=N — mở đúng trang được trích dẫn
    window.open(page && doc.ext === "pdf" ? `${url}#page=${page}` : url, "_blank", "noopener");
  }
  // Để tab mới kịp đọc blob trước khi thu hồi URL
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

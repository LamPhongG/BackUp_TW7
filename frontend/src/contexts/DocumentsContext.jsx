import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as store from "../services/documentStore";
import { compareVersions, computeLifecycle, familyOf, findCatalogEntry, normalizeVersion } from "../utils/documentValidation";
import { todayISO } from "../utils/helpers";

const DocumentsContext = createContext(null);

export function DocumentsProvider({ children }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setRecords(await store.listDocuments());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Gắn trạng thái vòng đời (tính lại mỗi lần danh sách đổi) + tên tiếng Việt từ danh mục
  const documents = useMemo(() => {
    const lifecycle = computeLifecycle(records, todayISO());
    return records
      .map(d => ({ ...d, title: findCatalogEntry(d.code)?.title?.replace(/\s*\(bản cũ\)$/, "") || d.titleEn, ...lifecycle[d.id] }))
      .sort((a, b) => a.code.localeCompare(b.code) || compareVersions(b.version, a.version));
  }, [records]);

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
          // Chưa có backend nên chưa trích xuất/chunk — không giả lập kết quả
          processing: "pending",
        },
      };
    });
    await store.saveDocuments(entries);
    await reload();
    return entries.length;
  }, [reload]);

  const removeDocument = useCallback(async (id) => {
    await store.deleteDocument(id);
    await reload();
  }, [reload]);

  const value = useMemo(() => ({
    documents,
    activeDocuments: documents.filter(d => d.status === "active"),
    loading,
    error,
    addDocuments,
    removeDocument,
    getFile: store.getDocumentFile,
    reload,
  }), [documents, loading, error, addDocuments, removeDocument, reload]);

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used inside <DocumentsProvider>");
  return ctx;
}

// Mở hoặc tải file đã lưu
export async function openStoredFile(getFile, doc, { download = false } = {}) {
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
    window.open(url, "_blank", "noopener");
  }
  // Để tab mới kịp đọc blob trước khi thu hồi URL
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

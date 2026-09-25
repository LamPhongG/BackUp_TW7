import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { newId, readJson, STORAGE_KEYS, writeJson } from "../services/localStore";
import { sanitizeAuditLog, sanitizePaths } from "../services/sanitize";
import { generateContent } from "../services/pipelineService";
import { approvalRule, can, validReason } from "../utils/pathWorkflow";
import { MIN_REASON_LENGTH } from "../utils/pathChecks";
import { apiRequest, backendEnabled } from "../services/apiClient";
import { mapAuditEntry, mapPath } from "../services/apiMappers";
import { useLanguage } from "./LanguageContext";

// Kho lộ trình + audit log, cùng một bộ hàm cho hai chế độ:
// - Trình duyệt: localStorage; mọi thao tác kiểm tra quyền theo vai trò và trạng thái (utils/pathWorkflow),
//   rồi ghi lộ trình và dòng audit trong cùng một lần lưu. Audit log chỉ thêm, không sửa, không xoá.
// - Backend (VITE_API_URL): /paths và /audit-logs; server sinh nội dung (Gemini), kiểm tra quyền và kiểm định.

const PathsContext = createContext(null);

export class PathError extends Error {
  constructor(key, vars) {
    super(key);
    this.key = key;
    this.vars = vars;
  }
}

const TITLES = {
  onboarding: ["Hội nhập", "Onboarding"],
  promotion: ["Bồi dưỡng thăng chức", "Promotion upskilling"],
};

// Chế độ cố định lúc build, nên provider luôn gọi cùng một hook
const usePathSource = backendEnabled() ? useBackendPaths : useBrowserPaths;

export function PathsProvider({ children }) {
  const source = usePathSource();
  const value = useMemo(() => ({
    ...source,
    getPath: id => source.paths.find(p => p.id === id) || null,
  }), [source]);
  return <PathsContext.Provider value={value}>{children}</PathsContext.Provider>;
}

function useBrowserPaths() {
  const { user } = useAuth();
  const [paths, setPaths] = useState(() => sanitizePaths(readJson(STORAGE_KEYS.paths, [])));
  const [auditLog, setAuditLog] = useState(() => sanitizeAuditLog(readJson(STORAGE_KEYS.auditLog, [])));
  // Bản mới nhất để các thao tác async (sinh nội dung) không ghi đè thay đổi xảy ra trong lúc chờ
  const latest = useRef({ paths, auditLog });
  latest.current = { paths, auditLog };

  const actor = useMemo(() => (user ? { id: user.id, name: user.name, role: user.userRole } : null), [user]);

  const commit = useCallback((nextPaths, entry) => {
    if (!actor) throw new PathError("err_login_required");
    const prevLog = latest.current.auditLog;
    const nextLog = entry
      ? [{ id: newId("LOG"), timestamp: new Date().toISOString(), actor_id: actor.id, actor_name: actor.name, actor_role: actor.role, ...entry }, ...prevLog]
      : prevLog;
    if (!writeJson(STORAGE_KEYS.paths, nextPaths)) throw new PathError("err_storage_write");
    if (entry && !writeJson(STORAGE_KEYS.auditLog, nextLog)) {
      writeJson(STORAGE_KEYS.paths, latest.current.paths);
      throw new PathError("err_storage_write");
    }
    latest.current = { paths: nextPaths, auditLog: nextLog };
    setPaths(nextPaths);
    setAuditLog(nextLog);
  }, [actor]);

  const get = (id) => {
    const p = latest.current.paths.find(x => x.id === id);
    if (!p) throw new PathError("err_path_not_found");
    return p;
  };

  const guard = (action, path) => {
    if (!actor) throw new PathError("err_login_required");
    if (!can(actor.role, action, path)) throw new PathError("err_action_not_allowed");
  };

  const replace = (updated) => latest.current.paths.map(p => (p.id === updated.id ? updated : p));

  const logBase = (p) => ({ path_id: p.id, path_title: p.titleEn, revision: p.revision });

  const createPath = useCallback(async ({ role, level, purpose, sourceDocs, processed, prompt }) => {
    if (actor?.role !== "hr") throw new PathError("err_action_not_allowed");
    const id = newId("LP");
    const content = await generateContent({ id, role, level, purpose, sourceDocs, processed, prompt });
    const now = new Date().toISOString();
    const [vi, en] = TITLES[purpose] || TITLES.onboarding;
    const path = {
      id,
      title: `${vi} — ${role.name}`,
      titleEn: `${en} — ${role.nameEn}`,
      purpose, level,
      target: { role_id: role.id, department: role.department },
      sources: sourceDocs.map(d => ({ id: d.id, code: d.code, version: d.version, title: d.title, titleEn: d.titleEn })),
      prompt,
      ...content,
      status: "draft",
      revision: 1,
      comments: [],
      approval: null,
      published_to: null,
      created_by: actor,
      created_at: now,
      updated_at: now,
    };
    commit([path, ...latest.current.paths], { ...logBase(path), action: "generate", status_before: null, status_after: "draft", details: { engine: content.engine, sources: path.sources.map(s => s.code).join(", ") } });
    return path;
  }, [actor, commit]);

  const regeneratePath = useCallback(async (id, { role, sourceDocs, processed, prompt }) => {
    const path = get(id);
    guard("regenerate", path);
    const content = await generateContent({ id, role, level: path.level, purpose: path.purpose, sourceDocs, processed, prompt: prompt ?? path.prompt });
    const current = get(id);
    const updated = {
      ...current,
      ...content,
      sources: sourceDocs.map(d => ({ id: d.id, code: d.code, version: d.version, title: d.title, titleEn: d.titleEn })),
      prompt: prompt ?? current.prompt,
      updated_at: new Date().toISOString(),
    };
    commit(replace(updated), { ...logBase(updated), action: "regenerate", status_before: current.status, status_after: current.status, details: { engine: content.engine } });
  }, [commit]);

  /** @param {(path) => path} mutate  trả về bản lộ trình đã sửa; details mô tả thay đổi cho audit */
  const editPath = useCallback((id, mutate, details) => {
    const path = get(id);
    guard("edit", path);
    const updated = { ...mutate(path), updated_at: new Date().toISOString() };
    commit(replace(updated), { ...logBase(path), action: "edit", status_before: path.status, status_after: path.status, details });
  }, [commit]);

  const submitPath = useCallback((id, { note, finalStatus }) => {
    const path = get(id);
    guard("submit", path);
    const resubmit = path.status === "changes_requested";
    const updated = { ...path, status: "in_review", revision: resubmit ? path.revision + 1 : path.revision, submitted_at: new Date().toISOString() };
    const comments = note?.trim() ? [...path.comments, newComment(actor, note.trim(), null)] : path.comments;
    commit(replace({ ...updated, comments }), { ...logBase(updated), action: resubmit ? "resubmit" : "submit", status_before: path.status, status_after: "in_review", final_status: finalStatus, reason: note?.trim() || null });
  }, [actor, commit]);

  const requestChanges = useCallback((id, { message, finalStatus }) => {
    const path = get(id);
    guard("request_changes", path);
    if (!validReason(message)) throw new PathError("err_reason_required", { n: MIN_REASON_LENGTH });
    const updated = { ...path, status: "changes_requested", comments: [...path.comments, newComment(actor, message.trim(), null)] };
    commit(replace(updated), { ...logBase(path), action: "request_changes", status_before: path.status, status_after: "changes_requested", final_status: finalStatus, reason: message.trim() });
  }, [actor, commit]);

  const approvePath = useCallback((id, { departments, roles, reason, checks }) => {
    const path = get(id);
    guard("approve", path);
    const rule = approvalRule(checks);
    if (!rule.allowed) throw new PathError("err_approve_blocked");
    if (rule.reasonRequired && !validReason(reason)) throw new PathError("err_reason_required", { n: MIN_REASON_LENGTH });
    if (!departments.length && !roles.length) throw new PathError("err_publish_target");
    const now = new Date().toISOString();
    const updated = {
      ...path,
      status: "published",
      published_to: { departments, roles },
      approval: { by: actor, at: now, final_status: checks.final_status, reason: reason?.trim() || null },
      published_at: now,
    };
    commit(replace(updated), {
      ...logBase(path), action: "approve", status_before: path.status, status_after: "published", final_status: checks.final_status,
      reason: reason?.trim() || null, details: { departments: departments.join(", "), roles: roles.join(", ") },
    });
  }, [actor, commit]);

  const archivePath = useCallback((id, reason) => {
    const path = get(id);
    guard("archive", path);
    if (!validReason(reason)) throw new PathError("err_reason_required", { n: MIN_REASON_LENGTH });
    commit(replace({ ...path, status: "archived", archived_at: new Date().toISOString() }), { ...logBase(path), action: "archive", status_before: path.status, status_after: "archived", reason: reason.trim() });
  }, [commit]);

  const deletePath = useCallback((id) => {
    const path = get(id);
    guard("delete", path);
    commit(latest.current.paths.filter(p => p.id !== id), { ...logBase(path), action: "delete", status_before: path.status, status_after: null });
  }, [commit]);

  const addComment = useCallback((id, { text, itemRef = null, replyTo = null }) => {
    const path = get(id);
    guard("comment", path);
    if (!text?.trim()) throw new PathError("err_comment_empty");
    const comment = { ...newComment(actor, text.trim(), itemRef), reply_to: replyTo };
    commit(replace({ ...path, comments: [...path.comments, comment] }), { ...logBase(path), action: "comment", status_before: path.status, status_after: path.status, reason: text.trim(), details: itemRef ? { item: itemRef.id } : undefined });
  }, [actor, commit]);

  const resolveComment = useCallback((id, commentId, resolved = true) => {
    const path = get(id);
    guard("comment", path);
    const comments = path.comments.map(c => (c.id === commentId ? { ...c, resolved, resolved_by: resolved ? actor : null } : c));
    commit(replace({ ...path, comments }), null);
  }, [actor, commit]);

  return useMemo(() => ({
    paths,
    auditLog,
    createPath, regeneratePath, editPath, submitPath, requestChanges, approvePath, archivePath, deletePath, addComment, resolveComment,
  }), [paths, auditLog, createPath, regeneratePath, editPath, submitPath, requestChanges, approvePath, archivePath, deletePath, addComment, resolveComment]);
}

// Lỗi nghiệp vụ của backend mang khoá dịch (err_...) → PathError để trang hiển thị như lỗi ở chế độ trình duyệt
function asPathError(e) {
  return e?.code ? new PathError(e.code, e.vars) : e;
}

function useBackendPaths() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [paths, setPaths] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const latest = useRef(paths);
  latest.current = paths;
  const canReadAudit = user?.userRole === "hr" || user?.userRole === "reviewer";

  const reloadAudit = useCallback(async () => {
    if (!canReadAudit) return;
    const page = await apiRequest("/audit-logs", { query: { limit: 1000 } });
    setAuditLog(page.items.map(mapAuditEntry));
  }, [canReadAudit]);

  useEffect(() => {
    if (!user) {
      setPaths([]);
      setAuditLog([]);
      return;
    }
    let cancelled = false;
    // Lấy kèm nội dung: danh sách, tiến độ học và kiểm định đều cần stages
    apiRequest("/paths", { query: { include_content: true } })
      .then(list => { if (!cancelled) setPaths(list.map(mapPath)); })
      .catch(() => { if (!cancelled) setPaths([]); });
    reloadAudit().catch(() => {});
    return () => { cancelled = true; };
  }, [user, reloadAudit]);

  /** Gọi API, thay bản lộ trình trả về vào danh sách, tải lại audit log */
  const call = useCallback(async (path, options) => {
    let result;
    try {
      result = await apiRequest(path, options);
    } catch (e) {
      throw asPathError(e);
    }
    const updated = result ? mapPath(result) : null;
    if (updated) {
      setPaths(prev => (prev.some(p => p.id === updated.id) ? prev.map(p => (p.id === updated.id ? updated : p)) : [updated, ...prev]));
    }
    reloadAudit().catch(() => {});
    return updated;
  }, [reloadAudit]);

  const createPath = useCallback(({ role, level, purpose, sourceDocs, prompt }) => call("/paths", {
    method: "POST",
    body: { job_position_id: role.id, level, purpose, source_document_ids: sourceDocs.map(d => d.id), prompt, language: lang },
  }), [call, lang]);

  const regeneratePath = useCallback((id, { sourceDocs, prompt }) => call(`/paths/${id}/regenerate`, {
    method: "POST",
    body: { source_document_ids: sourceDocs.map(d => d.id), prompt, language: lang },
  }), [call, lang]);

  const editPath = useCallback((id, mutate, details) => {
    const path = latest.current.find(p => p.id === id);
    if (!path) return Promise.reject(new PathError("err_path_not_found"));
    const detailStrings = details ? Object.fromEntries(Object.entries(details).map(([k, v]) => [k, String(v)])) : null;
    return call(`/paths/${id}`, { method: "PATCH", body: { stages: mutate(path).stages, details: detailStrings } });
  }, [call]);

  const submitPath = useCallback((id, { note }) => call(`/paths/${id}/submit`, { method: "POST", body: { note } }), [call]);

  const requestChanges = useCallback((id, { message }) =>
    call(`/paths/${id}/request-changes`, { method: "POST", body: { message } }), [call]);

  // Server tự chạy lại kiểm định trước khi phát hành; `checks` phía trình duyệt chỉ để hiển thị
  const approvePath = useCallback((id, { departments, roles, reason }) =>
    call(`/paths/${id}/approve`, { method: "POST", body: { departments, job_positions: roles, reason } }), [call]);

  const archivePath = useCallback((id, reason) => call(`/paths/${id}/archive`, { method: "POST", body: { reason } }), [call]);

  const deletePath = useCallback(async (id) => {
    await call(`/paths/${id}`, { method: "DELETE" });
    setPaths(prev => prev.filter(p => p.id !== id));
  }, [call]);

  const addComment = useCallback((id, { text, itemRef = null, replyTo = null }) => call(`/paths/${id}/comments`, {
    method: "POST",
    body: { text, item_ref: itemRef ? { id: itemRef.id, label: itemRef.label ?? null } : null, reply_to: replyTo },
  }), [call]);

  const resolveComment = useCallback((id, commentId, resolved = true) =>
    call(`/paths/${id}/comments/${commentId}/resolve`, { method: "POST", body: { resolved } }), [call]);

  return useMemo(() => ({
    paths,
    auditLog,
    createPath, regeneratePath, editPath, submitPath, requestChanges, approvePath, archivePath, deletePath, addComment, resolveComment,
  }), [paths, auditLog, createPath, regeneratePath, editPath, submitPath, requestChanges, approvePath, archivePath, deletePath, addComment, resolveComment]);
}

function newComment(actor, text, itemRef) {
  return { id: newId("CMT"), author: actor, at: new Date().toISOString(), text, item_ref: itemRef, reply_to: null, resolved: false, resolved_by: null };
}

export function usePaths() {
  const ctx = useContext(PathsContext);
  if (!ctx) throw new Error("usePaths must be used inside <PathsProvider>");
  return ctx;
}

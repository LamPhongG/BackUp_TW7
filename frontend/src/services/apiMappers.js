// Đổi dữ liệu backend (snake_case, tên theo DB) sang đúng dạng các trang đang dùng ở chế độ trình duyệt,
// để trang không phải biết dữ liệu đến từ đâu.

const PROCESSING = { ready: "done", failed: "failed", pending: "pending", processing: "pending" };

const initials = name => String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

export function mapUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: initials(u.name),
    userRole: u.user_role,
    role_id: u.job_position_id,
    role: u.title,
    department: u.department_code,
  };
}

export function mapDocument(d) {
  return {
    id: d.id,
    code: d.code,
    title: d.title,
    titleEn: d.title_en,
    family: d.family,
    category: d.category,
    department: d.department_code,
    version: d.version,
    effectiveDate: d.effective_date,
    expiryDate: d.expiry_date,
    fileName: d.file_name,
    ext: d.ext,
    mimeType: d.mime_type,
    size: d.size_bytes,
    hash: d.sha256,
    uploadedAt: d.uploaded_at,
    uploadedBy: d.uploaded_by_name,
    processing: PROCESSING[d.processing_status] || "pending",
    processingEngine: d.processing_engine,
    processedAt: d.processed_at,
    processingError: d.processing_error,
    chunkCount: d.chunk_count,
    pageCount: d.page_count,
    injectionFlagCount: d.flag_count,
  };
}

export function mapChunks(res) {
  return {
    engine: res.engine,
    chunks: res.chunks,
    injection_flags: res.injection_flags,
    page_count: res.page_count,
    char_count: res.char_count,
    processed_at: res.processed_at,
  };
}

export function mapPath(p) {
  return {
    id: p.id,
    title: p.title,
    titleEn: p.title_en,
    purpose: p.purpose,
    level: p.level,
    target: { role_id: p.target.job_position_id, department: p.target.department_code },
    sources: p.sources.map(s => ({ id: s.document_id, code: s.code, version: s.version, title: s.title, titleEn: s.title_en })),
    prompt: p.prompt,
    stages: p.stages,
    excluded_chunks: p.excluded_chunks,
    coverage: p.coverage,
    engine: p.engine,
    model: p.model,
    prompt_version: p.prompt_version,
    generation: p.generation,
    status: p.status,
    revision: p.revision,
    comments: p.comments,
    approval: p.approval,
    published_to: p.published_to ? { departments: p.published_to.departments, roles: p.published_to.job_positions } : null,
    created_by: p.created_by,
    created_at: p.created_at,
    updated_at: p.updated_at,
    submitted_at: p.submitted_at,
    published_at: p.published_at,
    archived_at: p.archived_at,
    allowed_actions: p.allowed_actions,
  };
}

export function mapAuditEntry(e) {
  return {
    id: e.id,
    timestamp: e.created_at,
    actor_id: e.actor_id,
    actor_name: e.actor_name,
    actor_role: e.actor_role,
    action: e.action,
    path_id: e.path_id,
    path_title: e.path_title,
    revision: e.revision,
    status_before: e.status_before,
    status_after: e.status_after,
    final_status: e.final_status,
    reason: e.reason,
    details: e.details,
  };
}

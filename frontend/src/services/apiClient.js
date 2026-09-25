// Kết nối backend FastAPI. Đặt VITE_API_URL trong frontend/.env.local (ví dụ http://localhost:8000/api)
// để bật; bỏ trống thì các service dùng chế độ xử lý trong trình duyệt.

const API_BASE = (import.meta.env?.VITE_API_URL || "").replace(/\/+$/, "");

export function backendEnabled() {
  return API_BASE !== "";
}

// Token đăng nhập do useAuth đặt; mọi request tự gắn vào header Authorization
let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token || null;
}

/** useAuth đăng ký hàm đăng xuất: token hết hạn hoặc tài khoản bị khoá thì quay về trang đăng nhập */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

class ApiError extends Error {
  /**
   * @param {string} message  câu tiếng Anh từ backend (`detail`)
   * @param {number} status
   * @param {string|null} code  khoá dịch của frontend (`err_...`) khi backend trả về
   * @param {object} vars       tham số cho khoá dịch
   */
  constructor(message, status, code = null, vars = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.vars = vars || {};
  }
}

// FastAPI trả lỗi dạng { detail: "...", code?, vars? } hoặc { detail: [{ msg }] } (lỗi validate Pydantic)
function toApiError(body, status) {
  const detail = body?.detail;
  let message = `HTTP ${status}`;
  if (typeof detail === "string") message = detail;
  else if (Array.isArray(detail)) message = detail.map(d => d.msg).join("; ");
  return new ApiError(message, status, body?.code || null, body?.vars);
}

function authHeaders(headers = {}) {
  return authToken ? { ...headers, Authorization: `Bearer ${authToken}` } : headers;
}

function handleUnauthorized(status) {
  // 401 khi đang có token nghĩa là phiên đã hết hạn; lỗi đăng nhập sai (chưa có token) để trang Login tự xử lý
  if (status === 401 && authToken) onUnauthorized?.();
}

export async function apiRequest(path, { method = "GET", body, headers = {}, query } = {}) {
  const isForm = body instanceof FormData;
  const qs = query ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v != null))}` : "";
  let res;
  try {
    res = await fetch(`${API_BASE}${path}${qs}`, {
      method,
      headers: authHeaders(isForm || body == null ? headers : { "Content-Type": "application/json", ...headers }),
      body: isForm || body == null ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Network error", 0, "err_network");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    handleUnauthorized(res.status);
    throw toApiError(data, res.status);
  }
  return data;
}

/** Tải file cần đăng nhập (không mở thẳng URL được vì trình duyệt không gửi header Authorization) */
export async function apiBlob(path) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  } catch {
    throw new ApiError("Network error", 0, "err_network");
  }
  if (!res.ok) {
    handleUnauthorized(res.status);
    throw toApiError(await res.json().catch(() => null), res.status);
  }
  return res.blob();
}

/**
 * Upload multipart có báo tiến độ (fetch chưa hỗ trợ upload progress nên dùng XHR).
 * @param {(ratio: number) => void} onProgress  0 → 1 theo số byte đã gửi
 */
export function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}${path}`);
    if (authToken) xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
      else {
        handleUnauthorized(xhr.status);
        reject(toApiError(xhr.response, xhr.status));
      }
    };
    xhr.onerror = () => reject(new ApiError("Network error", 0, "err_network"));
    xhr.send(formData);
  });
}

// ────────────────────────────────────────────────────────────
// Kho tài liệu phía trình duyệt (IndexedDB)
// Metadata và nội dung file lưu ở 2 object store riêng để việc liệt kê không phải đọc blob.
// Khi có backend, thay module này bằng các lời gọi API cùng chữ ký hàm.
// ────────────────────────────────────────────────────────────
const DB_NAME = "skillsprint-ai";
const DB_VERSION = 1;
const META_STORE = "documents";
const FILE_STORE = "files";

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  // Cho phép thử mở lại ở lần gọi sau nếu lần này lỗi
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
  });
}

export async function listDocuments() {
  const db = await openDb();
  const tx = db.transaction(META_STORE, "readonly");
  const request = tx.objectStore(META_STORE).getAll();
  await done(tx);
  return request.result || [];
}

// Lưu nhiều tài liệu trong một transaction: hoặc lưu hết, hoặc không lưu gì
export async function saveDocuments(entries) {
  const db = await openDb();
  const tx = db.transaction([META_STORE, FILE_STORE], "readwrite");
  for (const { meta, file } of entries) {
    tx.objectStore(META_STORE).put(meta);
    tx.objectStore(FILE_STORE).put({ id: meta.id, blob: file });
  }
  await done(tx);
}

export async function getDocumentFile(id) {
  const db = await openDb();
  const tx = db.transaction(FILE_STORE, "readonly");
  const request = tx.objectStore(FILE_STORE).get(id);
  await done(tx);
  return request.result?.blob ?? null;
}

export async function deleteDocument(id) {
  const db = await openDb();
  const tx = db.transaction([META_STORE, FILE_STORE], "readwrite");
  tx.objectStore(META_STORE).delete(id);
  tx.objectStore(FILE_STORE).delete(id);
  await done(tx);
}


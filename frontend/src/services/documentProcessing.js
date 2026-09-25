// Xử lý tài liệu ở chế độ trình duyệt (WBS Phase 2): trích xuất → chia chunk → sàng lọc prompt injection.
// Có backend thì server làm các bước này khi tải lên (POST /documents), nên module này không được dùng.
import { extractText } from "./textExtraction";
import { chunkBlocks, chunkCsv } from "../utils/chunker";
import { scanChunks } from "../utils/injectionScan";

/**
 * @param {object} doc   metadata tài liệu (id, code, version, ext, fileName)
 * @param {Blob}   blob  nội dung file
 * @param {(p: {percent: number, stage: string}) => void} onProgress
 * @returns {Promise<{engine, chunks, injection_flags, page_count, char_count, processed_at}>}
 */
export async function processDocument(doc, blob, onProgress = () => {}) {
  onProgress({ percent: 5, stage: "extract" });
  const { blocks, pageCount, raw } = await extractText(blob, doc.ext, ratio => onProgress({ percent: 5 + Math.round(ratio * 70), stage: "extract" }));
  onProgress({ percent: 80, stage: "chunk" });
  const chunks = doc.ext === "csv" ? chunkCsv(doc.code, raw) : chunkBlocks(doc.code, blocks);
  if (chunks.length === 0) {
    // PDF scan (chỉ có ảnh) không có lớp text — báo rõ thay vì trả về kho rỗng
    throw new Error(doc.ext === "pdf" ? "NO_TEXT_LAYER" : "NO_TEXT");
  }
  onProgress({ percent: 92, stage: "scan" });
  const flags = scanChunks(chunks);
  onProgress({ percent: 100, stage: "done" });
  return {
    engine: "browser",
    chunks,
    injection_flags: flags,
    page_count: pageCount,
    char_count: chunks.reduce((n, c) => n + c.content.length, 0),
    processed_at: new Date().toISOString(),
  };
}

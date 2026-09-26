// Sinh nội dung lộ trình ở chế độ trình duyệt (không có backend): bản nháp dựng từ cấu trúc tài liệu
// (utils/pathGenerator.js), engine = "local-draft".
// Có backend thì PathsContext gọi POST /paths và server sinh nội dung (Gemini + kiểm tra trích dẫn),
// nên module này không được dùng.
import { generatePathContent } from "../utils/pathGenerator";

export const PROMPT_VERSION = import.meta.env?.VITE_PROMPT_VERSION || "v1.1";

/**
 * @returns {Promise<{stages, excluded_chunks, coverage, engine, model, prompt_version}>}
 */
export async function generateContent({ id, level, purpose, durationDays, sourceDocs, processed }) {
  const chunksByDocId = Object.fromEntries(sourceDocs.map(d => [d.id, processed[d.id]?.chunks || []]));
  const flagsByDocId = Object.fromEntries(sourceDocs.map(d => [d.id, processed[d.id]?.injection_flags || []]));
  const content = generatePathContent({ id, level, purpose, durationDays, docs: sourceDocs, chunksByDocId, flagsByDocId });
  return { ...content, coverage: null, engine: "local-draft", model: null, prompt_version: PROMPT_VERSION };
}

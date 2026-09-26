"""Ma trận Yêu cầu theo Vai trò (Role Requirement Matrix) và Coverage Score (SRS Steps 10, 28-30).

Thuần Python, không dùng AI SDK. Xây tập tài liệu bắt buộc cho phòng ban của một job position, rồi
chấm điểm xem `stages` của lộ trình đã sinh ra trích dẫn được bao nhiêu phần trong đó — độc lập với
những gì Pipeline 1 (GenAI) hay client tự khai báo.
"""
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Document, ProcessingStatus
from app.rule_pipeline.matrix import ROLE_REQUIREMENT_MATRIX
from app.rule_pipeline.precedence import sort_by_precedence
from app.services.documents import compute_lifecycle

# Các category được coi là bắt buộc (ground-truth) cho hội nhập. Loại trừ "FAQ" (khuyến nghị, không
# bắt buộc theo SRS Step 11) và "Test Case" (tài liệu test đối kháng/mâu thuẫn, không phải nội dung
# đào tạo thật) — nhất quán với doc_tier() trong app/genai_pipeline/types.py, nơi cả hai loại này
# đều rơi vào tier "khác" (tier 4).
MANDATORY_CATEGORIES = {"Handbook", "Policy", "Compliance", "SOP", "Process Manual", "Role Description"}


def required_documents(db: Session, department_code: str, today: date | None = None) -> list[Document]:
    """Tài liệu đang hiệu lực (active), thuộc category bắt buộc, phạm vi phòng ban (kèm company-wide)."""
    today = today or date.today()
    # Tài liệu chưa xử lý xong (pending/failed) chưa có chunk để trích dẫn — không thể đưa vào
    # ma trận bắt buộc, nếu không lộ trình sẽ vĩnh viễn không thể đạt 100% coverage.
    rows = db.scalars(
        select(Document).where(
            Document.department_code.in_({"Company-wide", department_code}),
            Document.processing_status == ProcessingStatus.READY,
        )
    ).all()
    if not rows:
        return []
    # compute_lifecycle xác định phiên bản nào đang active theo family — tái dùng logic đã có ở
    # services/path_checks.py để tránh hai nơi tự tính lifecycle khác nhau.
    lifecycle = compute_lifecycle(list(rows), today)
    mandatory = [d for d in rows if lifecycle.get(d.id, (None, None))[0] == "active" and d.category in MANDATORY_CATEGORIES]
    # Sắp theo phân cấp ưu tiên (SRS Step 34): tài liệu có thẩm quyền cao hơn (Handbook/Policy >
    # SOP > FAQ) luôn đứng trước trong requiredDocs/topics trả về từ compute_coverage().
    return sort_by_precedence(mandatory)


def cited_codes(stages: list[dict]) -> set[str]:
    """Tập mã tài liệu (doc code) đã được trích dẫn ở bất kỳ đâu trong lessons/tasks/quiz của lộ trình."""
    codes: set[str] = set()
    for stage in stages:
        for module in stage.get("modules", []):
            for key in ("lessons", "tasks", "quiz"):
                for item in module.get(key, []):
                    ref = item.get("source_reference") or {}
                    code = ref.get("doc")
                    if code:
                        codes.add(code)
    return codes


def score_requirements(required: list[Document], cited: set[str]) -> dict:
    """Phần tính điểm thuần túy, tách khỏi truy vấn DB để dễ test độc lập với `required_documents`.

    Đây là hợp đồng dữ liệu dùng chung với `frontend/src/utils/pathChecks.js::backendCoverage`
    và `services/path_checks.py` — không được đổi hình dạng nếu không cập nhật cả hai nơi đó.
    """
    covered_flags = [d.code in cited for d in required]
    # Không có yêu cầu bắt buộc nào (chưa upload đủ tài liệu phòng ban) → coi như đã phủ 100%,
    # tránh việc lộ trình bị treo "chưa xác minh" chỉ vì thiếu dữ liệu nguồn, không phải lỗi nội dung.
    score = (sum(covered_flags) / len(required)) if required else 1.0

    return {
        "score": score,
        "requiredDocs": [{"code": d.code, "covered": covered}
                         for d, covered in zip(required, covered_flags, strict=True)],
        # Mặc định: mỗi tài liệu bắt buộc tương ứng đúng 1 topic, chưa có matchedKeyword thật.
        # compute_coverage() thay thế danh sách này bằng keyword_topics() khi role có trong
        # ROLE_REQUIREMENT_MATRIX — đây chỉ là phương án dự phòng cho role chưa được soạn (role mới/ẩn).
        "topics": [
            {"id": d.code, "label": d.title_en, "covered": covered, "matchedKeyword": None}
            for d, covered in zip(required, covered_flags, strict=True)
        ],
    }


def _text_corpus(stages: list[dict]) -> str:
    """Gộp toàn bộ chữ hiển thị được (tiêu đề module, bài học, nhiệm vụ, câu hỏi) thành 1 chuỗi thường
    hoá, dùng để dò từ khóa chủ đề — không đọc source_reference vì đó là việc của cited_codes()."""
    fragments: list[str] = []
    for stage in stages:
        for module in stage.get("modules", []):
            fragments.append(str(module.get("title", "")))
            fragments.append(str(module.get("description", "")))
            for lesson in module.get("lessons", []):
                fragments.append(str(lesson.get("title", "")))
            for task in module.get("tasks", []):
                fragments.append(str(task.get("title", "")))
            for quiz in module.get("quiz", []):
                fragments.append(str(quiz.get("question", "")))
    return " ".join(fragments).lower()


def keyword_topics(role_id: str | None, corpus: str) -> list[dict] | None:
    """Chủ đề năng lực đã soạn sẵn theo job position (ROLE_REQUIREMENT_MATRIX ở matrix.py), có
    matchedKeyword thực sự tìm được trong nội dung sinh ra — không còn luôn là None như bản mặc định.

    Trả None khi role_id không có trong ma trận (role mới do evaluator thêm vào — SRS "Hidden Role"),
    để compute_coverage() tự rơi về danh sách theo tài liệu bắt buộc thay vì báo sai lệch coverage.
    """
    entry = ROLE_REQUIREMENT_MATRIX.get(role_id) if role_id else None
    if not entry:
        return None

    topics: list[dict] = []
    for topic in entry.get("topics", []):
        matched = next((kw for kw in topic["keywords"] if kw.lower() in corpus), None)
        topics.append({
            "id": topic["id"],
            "label": topic["label"],
            "covered": matched is not None,
            "matchedKeyword": matched,
        })
    return topics


def compute_coverage(db: Session, stages: list[dict], department_code: str, role_id: str | None = None) -> dict:
    """Coverage Score theo Role Requirement Matrix: trả về `{score, requiredDocs, topics}`.

    `score`/`requiredDocs` luôn tính động từ tài liệu đang có trong DB (required_documents), không
    phụ thuộc `role_id` — để không "mù" trước role mới trong bài kiểm tra ẩn (Hidden Role). `role_id`
    chỉ dùng để làm giàu `topics` bằng dữ liệu từ khóa đã soạn sẵn, khi có.
    """
    required = required_documents(db, department_code)
    cited = cited_codes(stages)
    result = score_requirements(required, cited)

    enriched_topics = keyword_topics(role_id, _text_corpus(stages))
    if enriched_topics is not None:
        result["topics"] = enriched_topics
    return result

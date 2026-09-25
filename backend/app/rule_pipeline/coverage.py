"""Ma trận Yêu cầu theo Vai trò (Role Requirement Matrix) và Coverage Score (SRS Steps 10, 28-30).

Thuần Python, không dùng AI SDK. Xây tập tài liệu bắt buộc cho phòng ban của một job position, rồi
chấm điểm xem `stages` của lộ trình đã sinh ra trích dẫn được bao nhiêu phần trong đó — độc lập với
những gì Pipeline 1 (GenAI) hay client tự khai báo.
"""
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Document, ProcessingStatus
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
    return [d for d in rows if lifecycle.get(d.id, (None, None))[0] == "active" and d.category in MANDATORY_CATEGORIES]


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
        # Hiện mỗi tài liệu bắt buộc tương ứng đúng 1 topic (chưa có đặc tả tách từ khóa chi tiết hơn).
        "topics": [
            {"id": d.code, "label": d.title_en, "covered": covered, "matchedKeyword": None}
            for d, covered in zip(required, covered_flags, strict=True)
        ],
    }


def compute_coverage(db: Session, stages: list[dict], department_code: str) -> dict:
    """Coverage Score theo Role Requirement Matrix: trả về `{score, requiredDocs, topics}`."""
    required = required_documents(db, department_code)
    cited = cited_codes(stages)
    return score_requirements(required, cited)

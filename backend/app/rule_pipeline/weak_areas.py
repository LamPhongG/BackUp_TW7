"""Phát hiện điểm yếu học tập từ kết quả quiz (Weak-Area Detection, SRS Step 55-56).

Thuần Python, không dùng AI SDK. Gộp `quiz_attempts` theo module, tính tỷ lệ trả lời đúng; module
dưới ngưỡng được xem là điểm yếu và kích hoạt cờ cần quản lý xem lại. Chưa có endpoint nộp bài quiz
nào gọi tới hàm này (Enrollment/QuizAttempt hiện chỉ là model DB) — hàm này thuần tuý phân tích dữ
liệu, sẵn sàng cho endpoint đó khi được xây.
"""
from typing import Protocol

WEAK_AREA_THRESHOLD = 0.7


class QuizAttemptLike(Protocol):
    module_id: str
    score: int
    total: int


def _module_titles(stages: list[dict]) -> dict[str, str]:
    return {
        module.get("id"): module.get("title", module.get("id"))
        for stage in stages
        for module in stage.get("modules", [])
    }


def analyze_weak_areas(
    attempts: list[QuizAttemptLike], stages: list[dict], threshold: float = WEAK_AREA_THRESHOLD
) -> dict:
    """Trả về `{weak_areas: [{module_id, topic, accuracy}], manager_review_required: bool}`.

    `topic` lấy từ tiêu đề module (không có field topic riêng trong stages, cùng cách tiếp cận với
    `coverage.py`). Module không có lần nộp bài nào bị bỏ qua (không đủ dữ liệu để đánh giá).
    """
    totals: dict[str, list[int]] = {}
    for attempt in attempts:
        bucket = totals.setdefault(attempt.module_id, [0, 0])
        bucket[0] += attempt.score
        bucket[1] += attempt.total

    module_titles = _module_titles(stages)
    weak_areas = []
    for module_id, (score, total) in totals.items():
        if total == 0:
            continue
        accuracy = score / total
        if accuracy < threshold:
            weak_areas.append({
                "module_id": module_id,
                "topic": module_titles.get(module_id, module_id),
                "accuracy": round(accuracy, 3),
            })

    return {"weak_areas": weak_areas, "manager_review_required": bool(weak_areas)}

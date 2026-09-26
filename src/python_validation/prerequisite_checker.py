"""Pipeline 2 (thuần Python): kiểm tra thứ tự tiên quyết giữa các module (SRS Step 26-27).

Không import bất kỳ AI SDK nào.
"""
from src.genai_pipeline.response_schemas import OnboardingPlanSchema


def _rows_with_prerequisite(role: str, matrix_rows: list[dict]) -> list[dict]:
    return [
        r for r in matrix_rows
        if r["role"].strip().lower() == role.strip().lower() and r.get("prerequisite_of", "").strip()
    ]


def check_prerequisites(plan: OnboardingPlanSchema, matrix_rows: list[dict], role: str) -> list[str]:
    """Trả về danh sách lỗi thứ tự (rỗng nếu hợp lệ).

    Với mỗi cặp (topic tiên quyết, topic phụ thuộc) khai báo trong ma trận cho role này: tìm module
    chứa mỗi topic (theo title/description), rồi so `order_index`. Cặp nào chưa xuất hiện đủ trong
    plan thì bỏ qua — coverage_scorer đã báo thiếu ở chỗ khác, không lặp lại lỗi ở đây.
    """
    rows = _rows_with_prerequisite(role, matrix_rows)
    if not rows:
        return []

    module_order = {m.module_id: m.order_index for m in plan.modules}
    module_text = {m.module_id: f"{m.title} {m.description}".lower() for m in plan.modules}

    def _find_module(topic: str) -> str | None:
        needle = topic.strip().lower()
        return next((mid for mid, text in module_text.items() if needle in text), None)

    errors: list[str] = []
    for row in rows:
        prereq_module = _find_module(row["topic"])
        dependent_module = _find_module(row["prerequisite_of"])
        if prereq_module is None or dependent_module is None:
            continue
        if module_order[prereq_module] >= module_order[dependent_module]:
            errors.append(
                f"Module chứa '{row['topic']}' (order_index={module_order[prereq_module]}) phải học "
                f"trước module chứa '{row['prerequisite_of']}' (order_index={module_order[dependent_module]})"
            )
    return errors

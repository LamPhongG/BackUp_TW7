"""Pipeline 2 (thuần Python): đọc Role Requirement Matrix, tính Coverage Score (SRS Step 28-30).

Không import bất kỳ AI SDK nào — Coverage Score phải độc lập hoàn toàn với Pipeline 1 (GenAI).
"""
import csv
from pathlib import Path

from src.genai_pipeline.response_schemas import OnboardingPlanSchema

DEFAULT_MATRIX_PATH = Path(__file__).resolve().parent.parent / "role_matrix" / "role_matrix.csv"


def load_role_matrix(csv_path: Path | str = DEFAULT_MATRIX_PATH) -> list[dict]:
    """Đọc role_matrix.csv thành danh sách dict (1 dict = 1 dòng = 1 cặp role-topic)."""
    with open(csv_path, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def _rows_for_role(role: str, matrix_rows: list[dict]) -> list[dict]:
    return [r for r in matrix_rows if r["role"].strip().lower() == role.strip().lower()]


def build_rule_data(role: str, matrix_rows: list[dict]) -> dict:
    """Dựng `rule_data` cho ComparisonEngine.compare() từ ma trận thật, thay cho dict hard-code tay.

    Role không có trong ma trận (SRS "Hidden Role" — role mới do evaluator thêm) không được tự cho
    qua: `required_topics` rỗng và `is_new_role=True` để nơi gọi biết cần định tuyến review thủ công,
    thay vì âm thầm coi như không có yêu cầu nào.
    """
    role_rows = _rows_for_role(role, matrix_rows)
    if not role_rows:
        return {"role": role, "required_topics": [], "max_total_minutes": 480, "is_new_role": True}

    mandatory_topics = [r["topic"] for r in role_rows if r.get("mandatory", "Yes").strip().lower() == "yes"]
    max_minutes = int(role_rows[0].get("max_total_minutes") or 480)
    return {"role": role, "required_topics": mandatory_topics, "max_total_minutes": max_minutes, "is_new_role": False}


def _plan_corpus(plan: OnboardingPlanSchema) -> str:
    fragments = [plan.title, plan.summary]
    for module in plan.modules:
        fragments += [module.title, module.description]
        fragments += [t.title for t in module.tasks] + [t.description for t in module.tasks]
        fragments += [q.question_text for q in module.quizzes]
    return " ".join(fragments).lower()


def calculate_coverage_score(plan: OnboardingPlanSchema, matrix_rows: list[dict], role: str) -> float:
    """Coverage Score = số topic bắt buộc xuất hiện trong plan / tổng số topic bắt buộc (SRS Step 29).

    Không có topic bắt buộc nào (role chưa có trong ma trận) → 1.0: thiếu dữ liệu nguồn không phải
    lỗi nội dung của plan, tương tự quy ước ở backend/app/rule_pipeline/coverage.py.
    """
    required_topics = build_rule_data(role, matrix_rows)["required_topics"]
    if not required_topics:
        return 1.0

    corpus = _plan_corpus(plan)
    covered = sum(1 for topic in required_topics if topic.lower() in corpus)
    return round(covered / len(required_topics), 3)

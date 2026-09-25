"""Inputs of the generation pipeline. Plain data, so the pipeline never touches the database."""
from dataclasses import dataclass, field

STAGE_TEMPLATES = {
    "onboarding": ("day1", "week1", "week2", "day30", "day60", "day90"),
    "promotion": ("foundation", "deep", "practice", "assessment"),
}
QUIZ_PER_MODULE = {"Beginner": 3, "Intermediate": 4, "Advanced": 5}
TASKS_PER_MODULE = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}


@dataclass
class SourceDoc:
    id: str
    code: str
    version: str
    title: str
    title_en: str
    category: str
    department: str
    chunks: list[dict]
    flags: list[dict] = field(default_factory=list)


@dataclass
class GenerationRequest:
    path_id: str
    purpose: str
    level: str
    role_name: str
    role_name_en: str
    department: str
    prompt_version: str
    language: str = "vi"
    hr_prompt: str | None = None


def doc_tier(doc: SourceDoc) -> int:
    """Company foundations first, department practice later (frontend `docTier`)."""
    if doc.category == "Handbook":
        return 0
    if doc.category in ("Policy", "Compliance") and doc.department == "Company-wide":
        return 1
    if doc.category in ("Policy", "Compliance", "Role Description"):
        return 2
    if doc.category in ("SOP", "Process Manual"):
        return 3
    return 4

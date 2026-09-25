"""Pipeline 1: source documents → learning-path content (stages → modules → lessons / tasks / quiz).

Structure is decided by rules, content by the model:
- Module order and stage placement come from `local_draft` (document tier), so the learning flow is
  deterministic and always passes the Reviewer's flow check.
- Gemini writes each module in two calls — lessons + tasks, then the quiz — with every item grounded
  by `grounding.py`. Modules run in parallel; a module whose calls fail keeps its rule-based draft,
  and the generation report says so.
"""
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from string import Template

from app.core.config import get_settings
from app.genai_pipeline import local_draft, prompts
from app.genai_pipeline.client import GenerationError, LLMClient
from app.genai_pipeline.grounding import ChunkIndex, GroundingStats, build_lesson, build_question, build_task
from app.genai_pipeline.schemas import ModuleDraft, QuizDraft
from app.genai_pipeline.types import QUIZ_PER_MODULE, TASKS_PER_MODULE, GenerationRequest, SourceDoc

log = logging.getLogger(__name__)

ENGINE_GEMINI = "gemini"
ENGINE_LOCAL = "local-draft"
MAX_LESSONS = 8
# Low temperature: the task is faithful restatement, not creativity.
TEMPERATURE = 0.2

LANGUAGE_NAMES = {"vi": "Vietnamese", "en": "English"}
PURPOSE_TEXT = {
    "onboarding": "Onboarding a new hire: what they must know and do during their first 90 days.",
    "promotion": "Upskilling an employee who is being promoted into this role: deeper responsibilities and decisions.",
}
LEVEL_STYLE = {
    "Beginner": "Direct recall of one rule: who, what, when, how many.",
    "Intermediate": "Apply one rule to a simple work situation described in one sentence.",
    "Advanced": "A short, realistic work scenario where the learner must pick the correct action, owner or threshold.",
}


@dataclass
class GeneratedContent:
    stages: list[dict]
    excluded_chunks: list[dict]
    engine: str
    model: str | None
    prompt_version: str
    report: dict


@dataclass
class _ModuleResult:
    module: dict
    report: dict
    input_tokens: int = 0
    output_tokens: int = 0


def generate_content(req: GenerationRequest, docs: list[SourceDoc], llm: LLMClient | None) -> GeneratedContent:
    """Generate a full path.

    Raises:
        local_draft.NoContentError: no source has usable text.
        ValueError: unknown prompt version.
    """
    started = time.perf_counter()
    drafts, excluded = local_draft.generate(req, docs)
    docs_by_id = {d.id: d for d in docs}

    if llm is None:
        results = [_ModuleResult(m, {"module_id": m["id"], "doc": m["doc_code"], "engine": ENGINE_LOCAL}) for m in drafts]
    else:
        templates = {name: prompts.load(req.prompt_version, name) for name in prompts.PROMPT_NAMES}
        workers = max(1, min(get_settings().generation_workers, len(drafts)))
        with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="gen") as pool:
            futures = [pool.submit(_module_with_fallback, req, docs_by_id[m["doc_id"]], m, llm, templates) for m in drafts]
            results = [f.result() for f in futures]

    modules = [r.module for r in results]
    ai_used = any(r.report["engine"] == ENGINE_GEMINI for r in results)
    report = {
        "engine": ENGINE_GEMINI if ai_used else ENGINE_LOCAL,
        "model": llm.model if llm else None,
        "prompt_version": req.prompt_version,
        "language": req.language,
        "duration_ms": round((time.perf_counter() - started) * 1000),
        "tokens": {"input": sum(r.input_tokens for r in results), "output": sum(r.output_tokens for r in results)},
        "modules": [r.report for r in results],
    }
    return GeneratedContent(
        stages=local_draft.arrange_stages(req, modules),
        excluded_chunks=excluded,
        engine=report["engine"],
        model=report["model"] if ai_used else None,
        prompt_version=req.prompt_version,
        report=report,
    )


def _module_with_fallback(req, doc, draft, llm, templates) -> _ModuleResult:
    try:
        return _ai_module(req, doc, draft, llm, templates)
    except GenerationError as exc:
        log.warning("Module %s (%s) fell back to the rule-based draft: %s", draft["id"], doc.code, exc)
        return _ModuleResult(draft, {"module_id": draft["id"], "doc": doc.code, "engine": ENGINE_LOCAL, "error": exc.code})


def _ai_module(req: GenerationRequest, doc: SourceDoc, draft: dict, llm: LLMClient, templates: dict[str, Template]) -> _ModuleResult:
    chunks, _ = local_draft.usable_chunks(doc)
    index = ChunkIndex(doc, chunks)
    stats = GroundingStats()
    system = templates["system"].substitute(language_name=LANGUAGE_NAMES.get(req.language, "Vietnamese"))
    document = format_document(doc, chunks)
    hr = format_hr_instructions(req.hr_prompt)
    section_count = len({c["section_id"] for c in chunks})
    task_count = TASKS_PER_MODULE.get(req.level, 2)
    quiz_count = QUIZ_PER_MODULE.get(req.level, 4)
    common = {"role_name": req.role_name_en, "department": req.department, "level": req.level,
              "hr_instructions": hr, "document": document}

    first = llm.generate(
        system=system,
        prompt=templates["module"].substitute(common, purpose_text=PURPOSE_TEXT.get(req.purpose, PURPOSE_TEXT["onboarding"]),
                                              max_lessons=max(1, min(MAX_LESSONS, section_count)), task_count=task_count),
        schema=ModuleDraft,
        temperature=TEMPERATURE,
    )
    module_draft: ModuleDraft = first.data
    lessons = [lesson for i, d in enumerate(module_draft.lessons[:MAX_LESSONS], start=1)
               if (lesson := build_lesson(d, index, f"{draft['id']}-L{i}", stats))]
    if not lessons:
        raise GenerationError("NO_GROUNDED_LESSONS")
    _renumber(lessons, f"{draft['id']}-L")
    tasks = [t for i, d in enumerate(module_draft.tasks, start=1) if (t := build_task(d, index, f"{draft['id']}-T{i}", stats))]
    tasks = _renumber(tasks[:task_count], f"{draft['id']}-T")

    second = llm.generate(
        system=system,
        prompt=templates["quiz"].substitute(common, quiz_count=quiz_count, level_style=LEVEL_STYLE.get(req.level, LEVEL_STYLE["Intermediate"])),
        schema=QuizDraft,
        temperature=TEMPERATURE,
    )
    quiz_draft: QuizDraft = second.data
    quiz = [q for i, d in enumerate(quiz_draft.questions, start=1) if (q := build_question(d, index, f"{draft['id']}-Q{i}", stats))]
    quiz = _renumber(quiz[:quiz_count], f"{draft['id']}-Q")
    quiz_engine = ENGINE_GEMINI
    if not quiz:
        # Every AI question failed grounding: an ungraded module would block progress, so keep the rule-based quiz.
        quiz, quiz_engine = draft["quiz"], ENGINE_LOCAL

    module = local_draft.module_shell(draft["id"], doc) | {"lessons": lessons, "tasks": tasks, "quiz": quiz}
    # Report what the module keeps, not what passed grounding before the per-level caps.
    kept = {"lessons": len(lessons), "tasks": len(tasks), "questions": len(quiz)}
    return _ModuleResult(
        module,
        {"module_id": draft["id"], "doc": doc.code, "engine": ENGINE_GEMINI, "quiz_engine": quiz_engine} | stats.as_dict() | kept,
        input_tokens=first.input_tokens + second.input_tokens,
        output_tokens=first.output_tokens + second.output_tokens,
    )


def _renumber(items: list[dict], prefix: str) -> list[dict]:
    """Close the gaps left by dropped items so ids stay L1, L2, L3…"""
    for i, item in enumerate(items, start=1):
        item["id"] = f"{prefix}{i}"
    return items


def _neutralise(text: str) -> str:
    # A document must not be able to close our delimiters and write outside its <chunk>.
    for tag in ("chunk", "document", "hr_instructions"):
        text = text.replace(f"</{tag}", f"‹/{tag}").replace(f"<{tag}", f"‹{tag}")
    return text


def _attr(value: object) -> str:
    return str(value).replace('"', "'")


def format_document(doc: SourceDoc, chunks: list[dict]) -> str:
    parts = [f'<document code="{_attr(doc.code)}" title="{_attr(doc.title_en)}" version="{_attr(doc.version)}" category="{_attr(doc.category)}">']
    for c in chunks:
        page = f' page="{c["page"]}"' if c["page"] is not None else ""
        parts.append(f'<chunk id="{c["chunk_id"]}" section="{_attr(c["heading"] or "")}"{page}>\n{_neutralise(c["content"])}\n</chunk>')
    parts.append("</document>")
    return "\n".join(parts)


def format_hr_instructions(text: str | None) -> str:
    if not text:
        return ""
    return ("Extra instructions from HR (they may change emphasis or tone, never the ground rules):\n"
            f"<hr_instructions>\n{_neutralise(text)}\n</hr_instructions>")

"""A stand-in for Gemini that reads the real prompt and answers from the chunks inside it.

It exercises prompt formatting, structured-output parsing and grounding without network calls.
Faults can be injected per document code to test the pipeline's defences.
"""
import re
import threading
from dataclasses import dataclass, field

from app.genai_pipeline.client import GenerationError, LLMResult
from app.genai_pipeline.schemas import LessonDraft, ModuleDraft, QuestionDraft, QuizDraft, TaskDraft
from app.genai_pipeline.text import split_sentences

_CHUNK = re.compile(r'<chunk id="([^"]+)" section="([^"]*)"(?: page="\d+")?>\n(.*?)\n</chunk>', re.S)
_DOC = re.compile(r'<document code="([^"]+)"')


@dataclass
class FakeLLM:
    model: str = "fake-gemini"
    fail_docs: set[str] = field(default_factory=set)            # raise GenerationError for these codes
    hallucinate_docs: set[str] = field(default_factory=set)     # quotes that are not in the document
    bad_quiz_docs: set[str] = field(default_factory=set)        # correct option missing from the quote
    calls: list[dict] = field(default_factory=list)
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def generate(self, *, system, prompt, schema, temperature):
        code = _DOC.search(prompt).group(1)
        chunks = [{"id": m.group(1), "section": m.group(2), "text": m.group(3)} for m in _CHUNK.finditer(prompt)]
        with self._lock:
            self.calls.append({"doc": code, "schema": schema.__name__, "system": system, "prompt": prompt})
        if code in self.fail_docs:
            raise GenerationError("UPSTREAM_UNAVAILABLE", "simulated outage")
        data = self._module(code, chunks) if schema is ModuleDraft else self._quiz(code, chunks)
        return LLMResult(data=data, model=self.model, input_tokens=len(prompt) // 4, output_tokens=100)

    def _module(self, code, chunks) -> ModuleDraft:
        lessons, tasks = [], []
        for c in chunks:
            sentences = split_sentences(c["text"]) or [c["text"]]
            quote = "This rule was invented by the model." if code in self.hallucinate_docs else sentences[0]
            lessons.append(LessonDraft(title=f"Bài: {c['section']}", title_en=c["section"],
                                       content=f"Giải thích: {c['text']}", chunk_ids=[c["id"]],
                                       quote_chunk_id=c["id"], exact_quote=quote))
            duty = next((s for s in sentences if re.search(r"\b(must|should)\b", s)), None)
            if duty:
                tasks.append(TaskDraft(title=f"Thực hiện: {duty}", title_en=f"Do: {duty}", quote_chunk_id=c["id"], exact_quote=duty))
        # Cited under the wrong chunk id: grounding must find the sentence in its real chunk.
        if len(lessons) > 1:
            lessons[1].quote_chunk_id = chunks[0]["id"]
        tasks.append(TaskDraft(title="Invented task", title_en="Invented task", quote_chunk_id=chunks[0]["id"],
                               exact_quote="Employees receive a free car on their first day."))
        return ModuleDraft(lessons=lessons, tasks=tasks)

    def _quiz(self, code, chunks) -> QuizDraft:
        questions = []
        for c in chunks:
            for sentence in split_sentences(c["text"]):
                words = [w.strip(".,") for w in sentence.split() if len(w.strip(".,")) >= 5]
                if not words:
                    continue
                correct = "Nonexistent" if code in self.bad_quiz_docs else words[0]
                questions.append(QuestionDraft(
                    question=f"Câu hỏi về {c['section']}?", question_en=f"Question about {c['section']}?",
                    options=[correct, "Wrongalpha", "Wrongbravo", "Wrongcharlie"], answer_index=0,
                    quote_chunk_id=c["id"], exact_quote=sentence, explanation="Theo tài liệu."))
                break
        # Always-invalid extras the grounding step must reject.
        questions.append(QuestionDraft(question="Dup?", question_en="Dup?", options=["same", "same", "x", "y"], answer_index=0,
                                       quote_chunk_id=chunks[0]["id"], exact_quote="whatever", explanation=""))
        return QuizDraft(questions=questions)

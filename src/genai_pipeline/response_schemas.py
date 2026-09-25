from pydantic import BaseModel


class SourceCitation(BaseModel):
    doc_id: str
    source_file: str
    page_number: int
    section_heading: str
    exact_quote: str


class QuizQuestionSchema(BaseModel):
    question_id: str
    question_text: str
    options: list[str]
    correct_answer: str
    explanation: str
    source_citation: SourceCitation


class TaskSchema(BaseModel):
    task_id: str
    title: str
    description: str
    estimated_minutes: int
    source_citation: SourceCitation


class ModuleSchema(BaseModel):
    module_id: str
    title: str
    description: str
    order_index: int
    tasks: list[TaskSchema]
    quizzes: list[QuizQuestionSchema]
    source_citation: SourceCitation


class OnboardingPlanSchema(BaseModel):
    plan_id: str
    target_role: str
    title: str
    summary: str
    prompt_version: str
    modules: list[ModuleSchema]
    source_citation: SourceCitation

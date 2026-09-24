from pydantic import BaseModel, Field
from src.genai_pipeline.gemini_client import generate_content_with_retry
from src.genai_pipeline.response_schemas import QuizQuestionSchema
from src.prompt_templates.prompt_registry import render_prompt


class QuizListResponse(BaseModel):
    questions: list[QuizQuestionSchema] = Field(description="List of 3 to 5 generated quiz questions")


def generate_quiz(
    module_content: str,
    module_title: str = "Policy Training",
    target_role: str = "General Employee",
    prompt_version: str = "v1.0",
) -> list[QuizQuestionSchema]:
    """
    Generate 3 to 5 multiple-choice questions grounded in module content.

    Args:
        module_content: Text or policy excerpts covering the module topics
        module_title: Name of the module being assessed
        target_role: Job role context for questions
        prompt_version: Template version identifier, default 'v1.0'

    Returns:
        List of QuizQuestionSchema objects with citations

    Raises:
        ValueError: If module_content is empty
        GeminiAPIError: If the API call fails
    """
    if not module_content or not module_content.strip():
        raise ValueError("module_content cannot be empty.")

    prompt, _ = render_prompt(
        template_name="quiz_generation",
        version=prompt_version,
        target_role=target_role,
        module_title=module_title,
        module_content=module_content.strip(),
    )

    raw_json = generate_content_with_retry(
        prompt=prompt,
        response_schema=QuizListResponse,
    )

    parsed = QuizListResponse.model_validate_json(raw_json)
    return parsed.questions

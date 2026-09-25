"""Gemini client returning validated Pydantic objects (Rules section 4: no raw text from the LLM)."""
import logging
from dataclasses import dataclass
from typing import Protocol, TypeVar

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, ValidationError

from app.core.config import get_settings

log = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Transient statuses the SDK retries itself with exponential backoff (2s, 4s, …).
_RETRY_STATUSES = [408, 429, 500, 502, 503, 504]
# Finish reasons where the model stopped for policy reasons: retrying the same prompt will not help.
_BLOCKED = {"SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"}


class GenerationError(Exception):
    """LLM call failed. `code` ends up in the generation report the Reviewer sees."""

    def __init__(self, code: str, detail: str = ""):
        super().__init__(f"{code}: {detail}" if detail else code)
        self.code = code
        self.detail = detail


@dataclass
class LLMResult:
    data: BaseModel
    model: str
    input_tokens: int
    output_tokens: int


class LLMClient(Protocol):
    model: str

    def generate(self, *, system: str, prompt: str, schema: type[T], temperature: float) -> LLMResult: ...


class GeminiClient:
    def __init__(self, api_key: str, model: str, timeout_s: int):
        self.model = model
        self._client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=timeout_s * 1000,
                retry_options=types.HttpRetryOptions(attempts=3, initial_delay=2.0, exp_base=2.0,
                                                     http_status_codes=_RETRY_STATUSES),
            ),
        )

    def generate(self, *, system: str, prompt: str, schema: type[T], temperature: float) -> LLMResult:
        """Call Gemini with `schema` as the structured-output contract.

        One extra attempt is made when the model returns JSON that does not validate; transport errors
        are already retried by the SDK.

        Raises:
            GenerationError: UPSTREAM_REJECTED (4xx), UPSTREAM_UNAVAILABLE (5xx / timeout after retries),
                BLOCKED_<REASON>, INVALID_OUTPUT.
        """
        config = types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_schema=schema,
            temperature=temperature,
        )
        last_error = ""
        for _attempt in range(2):
            try:
                response = self._client.models.generate_content(model=self.model, contents=prompt, config=config)
            except genai_errors.ClientError as exc:
                raise GenerationError("UPSTREAM_REJECTED", f"{exc.code} {exc.message}") from None
            except genai_errors.ServerError as exc:
                raise GenerationError("UPSTREAM_UNAVAILABLE", f"{exc.code} {exc.message}") from None
            except httpx.TimeoutException:
                raise GenerationError("UPSTREAM_UNAVAILABLE", "timeout") from None

            blocked = _blocked_reason(response)
            if blocked:
                raise GenerationError(f"BLOCKED_{blocked}")
            try:
                data = response.parsed if isinstance(response.parsed, schema) else schema.model_validate_json(response.text or "")
            except ValidationError as exc:
                last_error = str(exc.errors()[:3])
                log.warning("Gemini output failed validation, retrying: %s", last_error)
                continue
            usage = response.usage_metadata
            return LLMResult(
                data=data,
                model=response.model_version or self.model,
                input_tokens=(usage.prompt_token_count or 0) if usage else 0,
                output_tokens=(usage.candidates_token_count or 0) if usage else 0,
            )
        raise GenerationError("INVALID_OUTPUT", last_error)


def _blocked_reason(response: types.GenerateContentResponse) -> str | None:
    feedback = response.prompt_feedback
    if feedback is not None and feedback.block_reason is not None:
        return str(feedback.block_reason.name)
    for candidate in response.candidates or []:
        reason = candidate.finish_reason.name if candidate.finish_reason else None
        if reason in _BLOCKED:
            return reason
    return None


def get_llm_client() -> LLMClient | None:
    """Gemini when GEMINI_API_KEY is set; None means the rule-based draft generator is used."""
    settings = get_settings()
    if not settings.gemini_api_key:
        return None
    return GeminiClient(settings.gemini_api_key, settings.gemini_model, settings.gemini_timeout_s)

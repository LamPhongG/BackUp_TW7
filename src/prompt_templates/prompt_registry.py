from pathlib import Path

TEMPLATES_DIR = Path(__file__).resolve().parent

SUPPORTED_PROMPTS = {
    "onboarding_plan": {
        "v1.0": "onboarding_plan_v1.txt",
    },
    "quiz_generation": {
        "v1.0": "quiz_generation_v1.txt",
    },
}


class TemplateNotFoundError(Exception):
    pass


def get_prompt_template(template_name: str, version: str = "v1.0") -> str:
    """
    Load a raw prompt template from disk by name and version.

    Args:
        template_name: Name of the template (e.g. 'onboarding_plan')
        version: Version string (e.g. 'v1.0')

    Returns:
        The prompt template string with placeholders.

    Raises:
        TemplateNotFoundError: if the template or version is not registered or file is missing.
    """
    versions = SUPPORTED_PROMPTS.get(template_name)
    if not versions or version not in versions:
        raise TemplateNotFoundError(
            f"Prompt template '{template_name}' version '{version}' not found. "
            f"Available: {list(SUPPORTED_PROMPTS.keys())}"
        )

    file_name = versions[version]
    template_path = TEMPLATES_DIR / file_name

    if not template_path.exists():
        raise TemplateNotFoundError(f"Template file '{file_name}' does not exist at {template_path}")

    return template_path.read_text(encoding="utf-8")


def render_prompt(template_name: str, version: str = "v1.0", **kwargs) -> tuple[str, str]:
    """
    Render a prompt template with the provided keyword arguments.

    Returns:
        tuple of (rendered_prompt, version)
    """
    template = get_prompt_template(template_name, version)
    rendered = template.format(**kwargs)
    return rendered, version

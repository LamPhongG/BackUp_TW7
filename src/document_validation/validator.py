"""
Document validation gate for SkillSprint AI ingestion pipeline.

All uploaded files pass through this module before any processing begins.
Catching structural issues here — rather than mid-pipeline — prevents
partial state writes and gives clear, actionable error messages to the API layer.
"""

from pathlib import Path

_SUPPORTED_EXTENSIONS = {".pdf", ".docx"}
_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB hard cap
_MIN_FILE_SIZE_BYTES = 512               # anything smaller is almost certainly empty


class UnsupportedFormatError(Exception):
    """Raised when the uploaded file is not a supported document format."""


class FileSizeError(Exception):
    """Raised when the file is too large to process or suspiciously small."""


def validate_document(file_path: Path) -> None:
    """
    Validates that a file is safe and structurally appropriate for ingestion.

    Runs three ordered checks: existence, format support, then size bounds.
    Order matters — checking size on a non-existent file would raise a less
    informative OS error rather than a clear domain exception.

    Args:
        file_path: Path to the file awaiting ingestion.

    Raises:
        FileNotFoundError: If the file does not exist at the given path.
        UnsupportedFormatError: If the file extension is not in the allowed set.
        FileSizeError: If the file is larger than 50 MB or smaller than 512 bytes.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if file_path.suffix.lower() not in _SUPPORTED_EXTENSIONS:
        supported = ", ".join(_SUPPORTED_EXTENSIONS)
        raise UnsupportedFormatError(
            f"'{file_path.suffix}' is not supported. Accepted formats: {supported}"
        )

    file_size = file_path.stat().st_size

    if file_size < _MIN_FILE_SIZE_BYTES:
        raise FileSizeError(
            f"'{file_path.name}' is {file_size} bytes — likely empty or corrupt."
        )

    if file_size > _MAX_FILE_SIZE_BYTES:
        size_mb = file_size / (1024 * 1024)
        raise FileSizeError(
            f"'{file_path.name}' is {size_mb:.1f} MB, exceeding the 50 MB limit."
        )

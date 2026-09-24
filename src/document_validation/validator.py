from pathlib import Path

ALLOWED_TYPES = {".pdf", ".docx"}
MAX_SIZE = 50 * 1024 * 1024  # 50MB
MIN_SIZE = 512


class UnsupportedFormatError(Exception):
    pass


class FileSizeError(Exception):
    pass


def validate_document(file_path: Path) -> None:
    """
    Validate a document file before processing.

    Args:
        file_path: path to the document file

    Raises:
        FileNotFoundError: file does not exist
        UnsupportedFormatError: file extension is not supported
        FileSizeError: file is too small (likely empty) or exceeds size limit
    """
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if file_path.suffix.lower() not in ALLOWED_TYPES:
        raise UnsupportedFormatError(
            f"Unsupported format '{file_path.suffix}'. Allowed formats: {', '.join(ALLOWED_TYPES)}"
        )

    size = file_path.stat().st_size

    if size < MIN_SIZE:
        raise FileSizeError(f"File '{file_path.name}' is too small ({size} bytes), may be empty or corrupted.")

    if size > MAX_SIZE:
        raise FileSizeError(f"File '{file_path.name}' exceeds 50MB limit ({size / 1024 / 1024:.1f}MB).")

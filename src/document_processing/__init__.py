"""
Document ingestion pipeline entry point for SkillSprint AI.

External callers (FastAPI endpoints, test suites, CLI scripts) should use
only `ingest_document()` from this module. The internal reader selection
logic is an implementation detail that may change as new formats are added.
"""

from pathlib import Path

from src.document_processing.chunker import DocumentChunk, split_into_chunks
from src.document_processing.docx_reader import read_docx
from src.document_processing.pdf_reader import read_pdf
from src.document_validation.validator import validate_document


def ingest_document(file_path: str | Path) -> list[DocumentChunk]:
    """
    Full ingestion pipeline: validates, reads, and chunks a policy document.

    This is the single entry point for both PDF and DOCX formats. Format
    detection is extension-based because MIME sniffing adds complexity
    without meaningful accuracy gains for known policy document uploads.

    Args:
        file_path: Path (str or Path) to the document to ingest.

    Returns:
        Ordered list of DocumentChunk objects ready for GenAI pipeline input.

    Raises:
        FileNotFoundError: File does not exist.
        UnsupportedFormatError: File type not supported.
        FileSizeError: File outside acceptable size bounds.
        PDFReadError: PDF is corrupt or unreadable.
        DOCXReadError: DOCX is corrupt or unreadable.
        ValueError: Document produced no extractable content after chunking.
    """
    doc_path = Path(file_path)
    validate_document(doc_path)

    ext = doc_path.suffix.lower()
    if ext == ".pdf":
        raw_pages = read_pdf(doc_path)
    else:
        raw_pages = read_docx(doc_path)

    chunks = split_into_chunks(raw_pages)

    if not chunks:
        raise ValueError(
            f"'{doc_path.name}' yielded no content chunks after processing. "
            "The document may contain only images or non-extractable content."
        )

    return chunks

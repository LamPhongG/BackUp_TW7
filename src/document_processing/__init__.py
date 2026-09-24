from pathlib import Path

from src.document_processing.chunker import DocumentChunk, split_into_chunks
from src.document_processing.docx_reader import read_docx
from src.document_processing.pdf_reader import read_pdf
from src.document_validation.validator import validate_document


def ingest_document(file_path: str | Path) -> list[DocumentChunk]:
    """
    Main entry point to read and process documents (PDF or DOCX).

    Executes 3 steps: validate -> read file -> split into chunks.

    Args:
        file_path: path to the document file

    Returns:
        list of DocumentChunk ready for GenAI pipeline

    Raises:
        FileNotFoundError, UnsupportedFormatError, FileSizeError,
        PDFReadError, DOCXReadError, ValueError
    """
    path = Path(file_path)
    validate_document(path)

    if path.suffix.lower() == ".pdf":
        raw_pages = read_pdf(path)
    else:
        raw_pages = read_docx(path)

    chunks = split_into_chunks(raw_pages)

    if not chunks:
        raise ValueError(
            f"No chunks extracted from '{path.name}'. "
            "The document might contain only images or have no readable text."
        )

    return chunks

"""
PDF document reader for SkillSprint AI ingestion pipeline.

Extracts text content page-by-page from PDF files while preserving
structural metadata needed for downstream chunking and citation tracking.
"""

import hashlib
from pathlib import Path
from typing import Generator

import fitz  # PyMuPDF


class PDFReadError(Exception):
    """Raised when a PDF file cannot be parsed or is structurally invalid."""


def generate_doc_id(file_path: Path) -> str:
    """
    Produces a stable document identifier from file content hash.

    Using content hash (not filename) so re-uploads of the same policy
    document are deduplicated correctly across ingestion runs.

    Args:
        file_path: Absolute path to the PDF file.

    Returns:
        12-character hex digest of the file's SHA-256 hash.
    """
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            sha.update(block)
    return sha.hexdigest()[:12]


def read_pdf(file_path: Path) -> list[dict]:
    """
    Extracts raw text from each page of a PDF, preserving page numbers.

    Each returned item maps directly to one physical page so chunkers
    can cite exact page references in structured outputs.

    Args:
        file_path: Path to a valid PDF file.

    Returns:
        List of page dicts with keys: doc_id, page_number, raw_text.

    Raises:
        FileNotFoundError: If the path does not point to an existing file.
        PDFReadError: If PyMuPDF cannot open or decode the document.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")

    doc_id = generate_doc_id(file_path)
    raw_pages: list[dict] = []

    try:
        pdf_doc = fitz.open(str(file_path))
    except fitz.FileDataError as exc:
        raise PDFReadError(f"Cannot open PDF '{file_path.name}': {exc}") from exc

    if pdf_doc.page_count == 0:
        pdf_doc.close()
        raise PDFReadError(f"PDF '{file_path.name}' contains no pages.")

    try:
        for page_index in range(pdf_doc.page_count):
            page = pdf_doc[page_index]
            page_text = page.get_text("text").strip()

            # Skip entirely blank pages — they carry no policy content
            if not page_text:
                continue

            raw_pages.append({
                "doc_id": doc_id,
                "page_number": page_index + 1,
                "raw_text": page_text,
                "source_file": file_path.name,
            })
    finally:
        pdf_doc.close()

    return raw_pages

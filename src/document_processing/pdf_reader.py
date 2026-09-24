import hashlib
from pathlib import Path

import fitz  # PyMuPDF


class PDFReadError(Exception):
    pass


def _get_doc_id(file_path: Path) -> str:
    """Generate doc_id from file content hash to avoid duplicate uploads."""
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while data := f.read(8192):
            sha.update(data)
    return sha.hexdigest()[:12]


def read_pdf(file_path: Path) -> list[dict]:
    """
    Read PDF file and return a list of pages with text and metadata.

    Args:
        file_path: path to the PDF file

    Returns:
        list of dicts containing: doc_id, page_number, raw_text, source_file

    Raises:
        FileNotFoundError: file does not exist
        PDFReadError: failed to open or parse PDF
    """
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    doc_id = _get_doc_id(file_path)
    pages = []

    try:
        pdf = fitz.open(str(file_path))
    except fitz.FileDataError as e:
        raise PDFReadError(f"Cannot read PDF '{file_path.name}': {e}") from e

    if pdf.page_count == 0:
        pdf.close()
        raise PDFReadError(f"File '{file_path.name}' has no pages.")

    try:
        for i in range(pdf.page_count):
            text = pdf[i].get_text("text").strip()
            if not text:
                continue
            pages.append({
                "doc_id": doc_id,
                "page_number": i + 1,
                "raw_text": text,
                "source_file": file_path.name,
            })
    finally:
        pdf.close()

    return pages

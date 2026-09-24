import hashlib
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


class DOCXReadError(Exception):
    pass


def _get_doc_id(file_path: Path) -> str:
    """Generate doc_id from file content hash."""
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while data := f.read(8192):
            sha.update(data)
    return sha.hexdigest()[:12]


def _has_page_break(para) -> bool:
    """Check if paragraph contains a page break."""
    return any(
        br.get(qn("w:type")) == "page"
        for run in para.runs
        for br in run._element.findall(qn("w:br"))
    )


def read_docx(file_path: Path) -> list[dict]:
    """
    Read DOCX file and return a list of pages with text and metadata.

    DOCX does not store explicit page numbers in XML,
    so we estimate pages by counting page breaks.

    Args:
        file_path: path to the .docx file

    Returns:
        list of dicts containing: doc_id, page_number, raw_text, source_file

    Raises:
        FileNotFoundError: file does not exist
        DOCXReadError: failed to open or parse DOCX
    """
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    doc_id = _get_doc_id(file_path)

    try:
        doc = Document(str(file_path))
    except ValueError as e:
        raise DOCXReadError(f"Cannot read DOCX '{file_path.name}': {e}") from e
    except OSError as e:
        raise DOCXReadError(f"Cannot open file '{file_path.name}': {e}") from e

    if not doc.paragraphs:
        raise DOCXReadError(f"File '{file_path.name}' has no content.")

    pages = []
    cur_page = 1
    cur_lines = []

    for para in doc.paragraphs:
        if _has_page_break(para) and cur_lines:
            pages.append({
                "doc_id": doc_id,
                "page_number": cur_page,
                "raw_text": "\n".join(cur_lines),
                "source_file": file_path.name,
            })
            cur_lines = []
            cur_page += 1

        text = para.text.strip()
        if not text:
            continue

        # Uppercase heading style to make it easier for chunker to detect
        style = para.style.name if para.style else ""
        if style.lower().startswith("heading"):
            cur_lines.append(text.upper())
        else:
            cur_lines.append(text)

    if cur_lines:
        pages.append({
            "doc_id": doc_id,
            "page_number": cur_page,
            "raw_text": "\n".join(cur_lines),
            "source_file": file_path.name,
        })

    return pages

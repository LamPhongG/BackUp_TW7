"""
DOCX document reader for SkillSprint AI ingestion pipeline.

Extracts text from Word documents paragraph-by-paragraph, preserving
heading-level information available in DOCX styles. DOCX files provide
richer structural signals than PDF, so heading detection here is style-based
rather than regex-based, giving the chunker higher-fidelity section boundaries.
"""

import hashlib
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


class DOCXReadError(Exception):
    """Raised when a DOCX file cannot be opened or its structure is invalid."""


def generate_doc_id(file_path: Path) -> str:
    """
    Produces a stable document identifier from file content hash.

    Mirrors the same hashing logic as pdf_reader so both formats produce
    comparable doc_ids for deduplication and cross-format tracking.

    Args:
        file_path: Absolute path to the DOCX file.

    Returns:
        12-character hex digest of the file's SHA-256 hash.
    """
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            sha.update(block)
    return sha.hexdigest()[:12]


def _style_is_heading(paragraph) -> bool:
    """
    Returns True if the paragraph uses a Word heading style (Heading 1–6).

    DOCX heading styles are the most reliable section boundary signal
    available — far more accurate than regex heuristics on rendered text.
    """
    style_name = paragraph.style.name if paragraph.style else ""
    return style_name.lower().startswith("heading")


def read_docx(file_path: Path) -> list[dict]:
    """
    Extracts raw text from a DOCX file, tagging each paragraph with its
    approximate page number and whether it is a heading.

    DOCX format does not embed explicit page numbers in its XML, so page
    numbers are estimated by counting manual page-break elements. This is
    accurate for most policy documents where breaks are explicit.

    Args:
        file_path: Path to a valid .docx file.

    Returns:
        List of page dicts compatible with chunker.split_into_chunks().
        Each dict: doc_id, page_number, raw_text, source_file.

    Raises:
        FileNotFoundError: If the file path does not exist.
        DOCXReadError: If python-docx cannot open or parse the file.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"DOCX not found: {file_path}")

    doc_id = generate_doc_id(file_path)

    try:
        doc = Document(str(file_path))
    except Exception as exc:
        raise DOCXReadError(f"Cannot open DOCX '{file_path.name}': {exc}") from exc

    if not doc.paragraphs:
        raise DOCXReadError(f"DOCX '{file_path.name}' contains no paragraphs.")

    raw_pages: list[dict] = []
    current_page = 1
    page_lines: list[str] = []

    for para in doc.paragraphs:
        # Detect explicit page break — signals start of a new logical page
        has_page_break = any(
            br.get(qn("w:type")) == "page"
            for run in para.runs
            for br in run._element.findall(qn("w:br"))
        )

        if has_page_break and page_lines:
            raw_pages.append({
                "doc_id": doc_id,
                "page_number": current_page,
                "raw_text": "\n".join(page_lines),
                "source_file": file_path.name,
            })
            page_lines = []
            current_page += 1

        text = para.text.strip()
        if not text:
            continue

        # Prefix heading paragraphs so the chunker's heading patterns fire correctly
        if _style_is_heading(para):
            page_lines.append(text.upper())
        else:
            page_lines.append(text)

    # Flush remaining content after the last explicit page break (or entire doc)
    if page_lines:
        raw_pages.append({
            "doc_id": doc_id,
            "page_number": current_page,
            "raw_text": "\n".join(page_lines),
            "source_file": file_path.name,
        })

    return raw_pages

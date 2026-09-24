import re
import uuid
from typing import NamedTuple


# Regex patterns for detecting section headings in policy documents
HEADING_PATTERNS = [
    re.compile(r"^(CHAPTER|SECTION|PART)\s+[\dIVXA-Z]+[\.:\s]", re.IGNORECASE),
    re.compile(r"^\d+(\.\d+)*\s+[A-Z]"),       # e.g., "1.2 Policy Name"
    re.compile(r"^[A-Z][A-Z\s]{4,}$"),          # ALL CAPS like "LEAVE ENTITLEMENT"
    re.compile(r"^[A-Z][^.!?]{5,50}:$"),        # e.g., "Eligibility Criteria:"
]

MIN_CHUNK = 80
MAX_CHUNK = 2000


class DocumentChunk(NamedTuple):
    doc_id: str
    chunk_id: str
    section_id: int
    heading: str
    page_number: int
    content: str
    source_file: str


def _is_heading(line: str) -> bool:
    return any(p.match(line.strip()) for p in HEADING_PATTERNS)


def _make_chunk(doc_id, section_id, heading, page_number, lines, source_file):
    text = " ".join(lines).strip()
    if len(text) < MIN_CHUNK:
        return None
    if len(text) > MAX_CHUNK:
        text = text[:MAX_CHUNK]
    return DocumentChunk(
        doc_id=doc_id,
        chunk_id=str(uuid.uuid4()),
        section_id=section_id,
        heading=heading,
        page_number=page_number,
        content=text,
        source_file=source_file,
    )


def split_into_chunks(raw_pages: list[dict]) -> list[DocumentChunk]:
    """
    Split raw pages into structured chunks based on section headings.

    Args:
        raw_pages: output from read_pdf() or read_docx(),
                   each dict must contain: doc_id, page_number, raw_text, source_file

    Returns:
        list of DocumentChunk ordered by appearance in document

    Raises:
        ValueError: if raw_pages is empty or missing required keys
    """
    if not raw_pages:
        raise ValueError("raw_pages cannot be empty.")

    required = {"doc_id", "page_number", "raw_text", "source_file"}
    for i, page in enumerate(raw_pages):
        missing = required - page.keys()
        if missing:
            raise ValueError(f"Page {i} is missing required keys: {missing}")

    doc_id = raw_pages[0]["doc_id"]
    source_file = raw_pages[0]["source_file"]

    result = []
    cur_heading = "Introduction"
    cur_page = raw_pages[0]["page_number"]
    cur_lines = []
    section_id = 0

    for page in raw_pages:
        for line in page["raw_text"].splitlines():
            line = line.strip()
            if not line:
                continue

            if _is_heading(line):
                # Save previous chunk before moving to new section
                chunk = _make_chunk(doc_id, section_id, cur_heading, cur_page, cur_lines, source_file)
                if chunk:
                    result.append(chunk)
                section_id += 1
                cur_heading = line
                cur_page = page["page_number"]
                cur_lines = []
            else:
                cur_lines.append(line)

    # Flush remaining text of final section
    last = _make_chunk(doc_id, section_id, cur_heading, cur_page, cur_lines, source_file)
    if last:
        result.append(last)

    return result

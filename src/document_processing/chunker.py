"""
Text chunking engine for SkillSprint AI document ingestion.

Splits raw page text into semantically bounded chunks based on headings
and section boundaries. Each chunk carries full citation metadata so
the GenAI pipeline can attach verifiable source references to every
extracted claim.
"""

import re
import uuid
from typing import NamedTuple


# Patterns that signal the start of a new policy section.
# Ordered from most-specific to least-specific to avoid early mis-matches.
_HEADING_PATTERNS = [
    re.compile(r"^(CHAPTER|SECTION|PART)\s+[\dIVXA-Z]+[\.:\s]", re.IGNORECASE),
    re.compile(r"^\d+(\.\d+)*\s+[A-Z]"),          # numbered headings: "1.2 Policy Scope"
    re.compile(r"^[A-Z][A-Z\s]{4,}$"),             # ALL-CAPS phrases: "LEAVE ENTITLEMENT"
    re.compile(r"^[A-Z][^.!?]{5,50}:$"),           # title-case + colon: "Eligibility Criteria:"
]

_MIN_CHUNK_CHARS = 80    # shorter content is noise, not a meaningful policy chunk
_MAX_CHUNK_CHARS = 2000  # cap to stay within LLM context window safely


class DocumentChunk(NamedTuple):
    doc_id: str
    chunk_id: str
    section_id: int
    heading: str
    page_number: int
    content: str
    source_file: str


def _is_heading(line: str) -> bool:
    """Returns True if the line matches any recognised section-heading pattern."""
    stripped = line.strip()
    return any(pattern.match(stripped) for pattern in _HEADING_PATTERNS)


def _build_chunk(
    doc_id: str,
    section_id: int,
    heading: str,
    page_number: int,
    content_lines: list[str],
    source_file: str,
) -> DocumentChunk | None:
    """
    Assembles a DocumentChunk from accumulated lines, or None if content is too short.

    Filtering out undersized chunks prevents feeding empty section headers
    or pagination artifacts into the LLM as if they were policy content.
    """
    content = " ".join(content_lines).strip()
    if len(content) < _MIN_CHUNK_CHARS:
        return None

    # Truncate oversized chunks rather than dropping them — policy content
    # at the boundary is still valid, just needs to be capped for LLM safety.
    if len(content) > _MAX_CHUNK_CHARS:
        content = content[:_MAX_CHUNK_CHARS]

    return DocumentChunk(
        doc_id=doc_id,
        chunk_id=str(uuid.uuid4()),
        section_id=section_id,
        heading=heading,
        page_number=page_number,
        content=content,
        source_file=source_file,
    )


def split_into_chunks(raw_pages: list[dict]) -> list[DocumentChunk]:
    """
    Converts a list of raw page dicts into structured DocumentChunks.

    Heading detection drives the boundary logic: each time a heading line
    is encountered, the previous chunk is finalised and a new one begins.
    Page number is inherited from whichever page the heading appeared on.

    Args:
        raw_pages: Output from pdf_reader.read_pdf() or docx_reader.read_docx().
                   Each dict must contain: doc_id, page_number, raw_text, source_file.

    Returns:
        List of DocumentChunk named tuples, ordered by appearance in the document.

    Raises:
        ValueError: If raw_pages is empty or contains items missing required keys.
    """
    if not raw_pages:
        raise ValueError("raw_pages must not be empty — nothing to chunk.")

    required_keys = {"doc_id", "page_number", "raw_text", "source_file"}
    for idx, page in enumerate(raw_pages):
        missing = required_keys - page.keys()
        if missing:
            raise ValueError(f"Page entry {idx} is missing keys: {missing}")

    doc_id = raw_pages[0]["doc_id"]
    source_file = raw_pages[0]["source_file"]

    chunks: list[DocumentChunk] = []
    current_heading = "Introduction"
    current_page = raw_pages[0]["page_number"]
    current_lines: list[str] = []
    section_id = 0

    for page_meta in raw_pages:
        for line in page_meta["raw_text"].splitlines():
            line = line.strip()
            if not line:
                continue

            if _is_heading(line):
                # Finalise the in-progress chunk before starting a new section
                chunk = _build_chunk(
                    doc_id, section_id, current_heading,
                    current_page, current_lines, source_file
                )
                if chunk:
                    chunks.append(chunk)

                section_id += 1
                current_heading = line
                current_page = page_meta["page_number"]
                current_lines = []
            else:
                current_lines.append(line)

    # Flush the final section that never triggered a subsequent heading
    last_chunk = _build_chunk(
        doc_id, section_id, current_heading,
        current_page, current_lines, source_file
    )
    if last_chunk:
        chunks.append(last_chunk)

    return chunks

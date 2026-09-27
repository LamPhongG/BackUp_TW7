"""Coverage Score (SRS Steps 10, 28-30), computed from the team's real Role Requirement Matrix
(role_matrix/role_matrix.csv, imported into the RoleRequirement table by app.services.role_matrix).

Independent of what Pipeline 1 (GenAI) or the client claims — see compute_coverage()'s own docstring.

Uses its own JobPosition + RoleRequirement rows (see tests/test_path_requirements.py::position/_require)
rather than the real seeded CSV data, so these tests don't depend on (or risk polluting, in the
shared session-scoped test database) the actual role_matrix/role_matrix.csv content or codes.
"""
import uuid

from app.models import JobPosition, Priority, RoleRequirement
from app.services.role_matrix import cited_codes, compute_coverage
from tests.factories import unique_code, upload_ready_pdf


def _position(db) -> JobPosition:
    pos = JobPosition(id=f"qa-{uuid.uuid4().hex[:8]}", name="Kiểm thử viên", name_en="QA Tester", department_code="Engineering")
    db.add(pos)
    db.commit()
    return pos


def _require(db, position: JobPosition, code: str, *, mandatory: bool = True) -> str:
    req_id = f"R9{uuid.uuid4().int % 10**6:06d}"
    db.add(RoleRequirement(id=req_id, job_position_id=position.id, process_requirement=f"Follow {code}",
                           mandatory=mandatory, priority=Priority.HIGH, source_doc_code=code, source_section="2",
                           source_version="1.0", role_specific=True))
    db.commit()
    return req_id


def _stages(*doc_codes: str) -> list[dict]:
    lessons = [{"id": f"L{i}", "source_reference": {"doc": code}} for i, code in enumerate(doc_codes)]
    return [{"key": "day1", "modules": [{"id": "M1", "lessons": lessons, "tasks": [], "quiz": []}]}]


def test_cited_codes_reads_every_source_reference_doc():
    assert cited_codes(_stages("DOC-01", "DOC-02")) == {"DOC-01", "DOC-02"}


def test_cited_codes_ignores_items_without_a_reference():
    stages = [{"key": "day1", "modules": [{"id": "M1", "lessons": [{"id": "L1"}], "tasks": [], "quiz": []}]}]
    assert cited_codes(stages) == set()


def test_compute_coverage_position_with_no_mandatory_requirements_is_fully_covered(db):
    pos = _position(db)

    assert compute_coverage(db, [], pos.id) == {"score": 1.0, "requiredDocs": [], "topics": []}


def test_compute_coverage_reflects_citation_of_a_mandatory_requirement(client, hr_headers, db):
    pos = _position(db)
    code = unique_code()
    req_id = _require(db, pos, code)
    doc = upload_ready_pdf(client, hr_headers, code=code, category="SOP", department_code=pos.department_code)

    covered = compute_coverage(db, _stages(doc["code"]), pos.id)
    not_covered = compute_coverage(db, [], pos.id)

    assert covered["requiredDocs"] == [{"code": code, "covered": True}]
    assert not_covered["requiredDocs"] == [{"code": code, "covered": False}]
    assert covered["score"] == 1.0 and not_covered["score"] == 0.0

    topic = next(t for t in covered["topics"] if t["id"] == req_id)
    assert topic["covered"] is True
    assert topic["label"] == f"Follow {code}"


def test_compute_coverage_ignores_optional_requirements(db):
    pos = _position(db)
    _require(db, pos, unique_code(), mandatory=False)

    assert compute_coverage(db, [], pos.id) == {"score": 1.0, "requiredDocs": [], "topics": []}


def test_compute_coverage_partial_score_with_multiple_mandatory_requirements(client, hr_headers, db):
    pos = _position(db)
    covered_code, missing_code = unique_code(), unique_code()
    _require(db, pos, covered_code)
    _require(db, pos, missing_code)
    doc = upload_ready_pdf(client, hr_headers, code=covered_code, category="SOP", department_code=pos.department_code)

    result = compute_coverage(db, _stages(doc["code"]), pos.id)

    assert result["score"] == 0.5
    by_code = {d["code"]: d["covered"] for d in result["requiredDocs"]}
    assert by_code == {covered_code: True, missing_code: False}

"""Pipeline 2 (rule engine, thuần Python): Role Requirement Matrix và Coverage Score.

SRS Steps 10, 28-30 — không dùng AI SDK, không phụ thuộc kết quả GenAI.

`score_requirements()` được test bằng object giả (SimpleNamespace), không qua DB: DB dùng chung
cho cả phiên chạy test (xem tests/conftest.py), nên một khi có tài liệu "Company-wide" bắt buộc
được tạo ra (kể cả bởi chính test khác trong file này), nó sẽ mãi mãi xuất hiện trong
required_documents() của MỌI phòng ban chạy sau — làm điểm số tuyệt đối không còn tất định.
Vì vậy các test số/điểm dùng hàm thuần túy, còn các test đụng DB (required_documents,
compute_coverage) chỉ so khớp theo tập mã tài liệu (membership), không so khớp tuyệt đối.
"""
from types import SimpleNamespace

from app.rule_pipeline.coverage import compute_coverage, required_documents, score_requirements
from tests.factories import make_pdf, make_scanned_pdf, policy_text, unique_code, upload


def _fake_doc(code: str, title_en: str = "") -> SimpleNamespace:
    return SimpleNamespace(code=code, title_en=title_en or code)


def _doc(client, headers, department_code: str, category: str = "Policy", **meta) -> dict:
    res = upload(client, headers, make_pdf(policy_text()), "doc.pdf",
                 category=category, department_code=department_code, **meta)
    assert res.status_code == 201, res.text
    return res.json()


def _stages(*doc_codes: str) -> list[dict]:
    """Cây stages tối giản: mỗi doc_code trở thành một lesson trích dẫn nó."""
    lessons = [{"id": f"L{i}", "source_reference": {"doc": code}} for i, code in enumerate(doc_codes)]
    return [{"key": "day1", "modules": [{"id": "M1", "lessons": lessons, "tasks": [], "quiz": []}]}]


# --- score_requirements(): hàm thuần túy, không đụng DB -------------------------------------

def test_score_requirements_no_requirements_is_fully_covered():
    result = score_requirements([], set())

    assert result == {"score": 1.0, "requiredDocs": [], "topics": []}


def test_score_requirements_partial_coverage():
    covered, missing = _fake_doc("DOC-A", "Handbook A"), _fake_doc("DOC-B", "SOP B")

    result = score_requirements([covered, missing], {"DOC-A"})

    assert result["score"] == 0.5
    assert result["requiredDocs"] == [{"code": "DOC-A", "covered": True}, {"code": "DOC-B", "covered": False}]
    assert result["topics"] == [
        {"id": "DOC-A", "label": "Handbook A", "covered": True, "matchedKeyword": None},
        {"id": "DOC-B", "label": "SOP B", "covered": False, "matchedKeyword": None},
    ]


def test_score_requirements_full_coverage():
    docs = [_fake_doc("DOC-A"), _fake_doc("DOC-B"), _fake_doc("DOC-C")]

    result = score_requirements(docs, {"DOC-A", "DOC-B", "DOC-C"})

    assert result["score"] == 1.0
    assert all(d["covered"] for d in result["requiredDocs"])


# --- required_documents() / compute_coverage(): tích hợp với DB thật qua API upload ---------

def test_required_documents_scopes_by_department_and_mandatory_category(client, hr_headers, db):
    handbook = _doc(client, hr_headers, "Company-wide", category="Handbook")
    sop = _doc(client, hr_headers, "Marketing", category="SOP")
    faq = _doc(client, hr_headers, "Marketing", category="FAQ")
    test_case = _doc(client, hr_headers, "Marketing", category="Test Case")
    other_dept = _doc(client, hr_headers, "Sales", category="Policy")

    codes = {d.code for d in required_documents(db, "Marketing")}

    # Bắt buộc: company-wide + đúng phòng ban, thuộc category bắt buộc.
    assert handbook["code"] in codes
    assert sop["code"] in codes
    # Không bắt buộc: FAQ (khuyến nghị) và Test Case (tài liệu test đối kháng) dù cùng phòng ban.
    assert faq["code"] not in codes
    assert test_case["code"] not in codes
    # Không bắt buộc: tài liệu của phòng ban khác, không phải company-wide.
    assert other_dept["code"] not in codes


def test_required_documents_keeps_only_active_version(client, hr_headers, db):
    code, title = unique_code(), "Marketing Playbook"
    _doc(client, hr_headers, "Marketing", category="SOP", code=code, title_en=title)
    _doc(client, hr_headers, "Marketing", category="SOP", code=code, title_en=title, version="2.0")

    matches = [d for d in required_documents(db, "Marketing") if d.code == code]

    assert len(matches) == 1
    assert matches[0].version == "2.0"


def test_required_documents_excludes_unprocessed_documents(client, hr_headers, db):
    # PDF chỉ toàn hình (không có lớp văn bản) → xử lý thất bại, không có chunk để trích dẫn —
    # không được tính là yêu cầu bắt buộc (nếu không lộ trình sẽ vĩnh viễn không đạt 100%).
    res = upload(client, hr_headers, make_scanned_pdf(), "scan.pdf", category="Policy", department_code="Marketing")
    assert res.status_code == 201
    assert res.json()["processing_status"] == "failed"

    codes = {d.code for d in required_documents(db, "Marketing")}
    assert res.json()["code"] not in codes


def test_compute_coverage_reflects_what_the_stages_cite(client, hr_headers, db):
    covered = _doc(client, hr_headers, "Marketing", category="Handbook")
    missing = _doc(client, hr_headers, "Marketing", category="SOP")

    result = compute_coverage(db, _stages(covered["code"]), "Marketing")
    by_code = {d["code"]: d["covered"] for d in result["requiredDocs"]}

    assert result["score"] < 1.0
    assert by_code[covered["code"]] is True
    assert by_code[missing["code"]] is False

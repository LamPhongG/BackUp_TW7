"""Unit test for Dual-Pipeline Comparison Engine & API (SRS Step 46, 47 & Table 1)."""
from sqlalchemy import select
from app.comparator.engine import compare_path_with_ground_truth
from app.models import LearningPath, PathLevel, PathPurpose, PathStatus, Priority, RoleRequirement, User


def test_dual_pipeline_comparison(db, client, hr_headers):
    hr_user = db.scalar(select(User).where(User.email == "hr@fourangrybirds.vn"))
    assert hr_user is not None

    # Setup sample path
    path = LearningPath(
        id="LP-TEST-COMPARE",
        title="Test Comparison Onboarding",
        title_en="Test Comparison Onboarding",
        purpose=PathPurpose.ONBOARDING,
        level=PathLevel.INTERMEDIATE,
        status=PathStatus.IN_REVIEW,
        created_by_id=hr_user.id,
        target_job_position_id="cs-exec",
        target_department_code="Customer Support",
        engine="gemini",
        prompt_version="v1.0",
        stages=[
            {
                "name": "Week 1",
                "modules": [
                    {
                        "id": "M01",
                        "title": "Incident Escalation",
                        "doc_code": "DOC-14",
                        "lessons": [
                            {
                                "title": "Escalation Process",
                                "requirement_ids": ["R-CS-001"],
                                "source_reference": {"doc": "DOC-14", "section": "4.2"}
                            }
                        ]
                    }
                ]
            }
        ]
    )
    db.add(path)

    # Setup sample requirement in Python ground-truth
    req = RoleRequirement(
        id="R-CS-001",
        job_position_id="cs-exec",
        source_doc_code="DOC-14",
        source_section="4.2",
        mandatory=True,
        priority=Priority.HIGH,
        policy_requirement="Tier 2 customer incident escalation procedure"
    )
    db.add(req)
    db.commit()

    report = compare_path_with_ground_truth(db, path)
    assert report["path_id"] == "LP-TEST-COMPARE"
    assert report["role_id"] == "cs-exec"
    assert len(report["rows"]) >= 1

    # Verify Table 1 row structure
    first_row = report["rows"][0]
    assert first_row["requirement_id"] == "R-CS-001"
    assert "field_comparisons" in first_row
    assert any(fc["field"] == "Requirement ID" and fc["match"] for fc in first_row["field_comparisons"])
    assert report["coverage_score"] > 0

    # Test API endpoint
    res = client.get("/api/paths/LP-TEST-COMPARE/comparison", headers=hr_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["path_id"] == "LP-TEST-COMPARE"
    assert "rows" in data
    assert "summary" in data
    assert data["summary"]["matches"] >= 1

# SkillSprint AI — Reports & Deliverables

This directory contains evaluation reports and audit artifacts required for the TechWiz 7 competition deliverables:

## 1. Dual-Pipeline Ground-Truth Comparison Report
- **File**: [`genai_python_comparison.csv`](genai_python_comparison.csv)
- **Specification**: SRS Step 46–47, Table 1 & Deliverable 6.
- **Description**: Requirement-by-requirement comparison between Pipeline 1 (GenAI output) and Pipeline 2 (Python Ground-Truth validation engine). Evaluates coverage status, source traceability, version compliance, and reasons for any discrepancy.
- **Export Endpoint**: Accessible live via `GET /api/reports/comparison.csv` in the Reports Center.

## 2. Test Execution & Coverage Reports
- **Vitest (Frontend)**: 108 / 108 tests passing (100%).
- **Pytest (Backend)**: 390 / 390 tests passing (100%).
- **Pytest (Root Algorithm)**: 88 / 88 tests passing (100%).
- **Prompt Injection Defense**: 10 / 10 adversarial attacks intercepted (`tests/test_adversarial.py`).
- **Hidden Test Readiness**: Unseen document evaluation test passing (`hidden_test_ready/run_hidden_test.py`).

## 3. Project Documentation & Architecture
- **Detailed Project Report Outline**: [`documentation/PROJECT_REPORT_OUTLINE.md`](../documentation/PROJECT_REPORT_OUTLINE.md)
- **Team Work Breakdown Structure (WBS)**: [`documentation/TEAM_WORK_BREAKDOWN.md`](../documentation/TEAM_WORK_BREAKDOWN.md)
- **Presentation Deck**: [`documentation/SkillSprint_AI_Prototype_Deck.pdf`](../documentation/SkillSprint_AI_Prototype_Deck.pdf)
- **Master Presentation & Video Script**: [`documentation/MASTER_PRESENTATION_AND_VIDEO_SCRIPT.md`](../documentation/MASTER_PRESENTATION_AND_VIDEO_SCRIPT.md)
- **Student Defense Guide**: [`documentation/STUDENT_PRESENTATION_GUIDE.md`](../documentation/STUDENT_PRESENTATION_GUIDE.md)

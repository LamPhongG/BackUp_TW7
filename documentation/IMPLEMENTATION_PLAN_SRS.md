# Implementation Plan & SRS Compliance Roadmap
**Project:** SkillSprint AI – Dual-Pipeline AI Document Verification System  
**Track:** TechWiz 7 – Generative AI Powerplay Track  
**Author:** Pham Tan Tai (AI-assisted, see `AI_USAGE.md`)  
**Reference Document:** `SkillSprint AI-Generative AI PowerPlay_SRS.pdf` (52-page Official Specification)  

---

## 0. Developer Guidance & Ground Rules

This document outlines implementation tasks prioritized from P0 through P3. Each task specifies: SRS rationale, baseline status, implementation details, affected files, and acceptance criteria.

### 0.1 Mandatory Development Rules
1. **Never fabricate or hard-code data:** SRS Section 1.8 #12 strictly prohibits synthetic validation scores, hard-coded comparison outputs, or canned quiz responses. When genuine data is unavailable, render an informative empty state with the technical reason.
2. **Follow Natural Coding Standards:** Adhere to `Rules/Rules` (Sections 1–6). Comments must explain *why* an architectural choice was made, not restate syntax. Prohibit emojis, Title Case headings, and hyperbolic marketing fluff.
3. **Pure Python Integrity:** Modules within `rule_pipeline/` and `comparator/` **must not import AI SDKs**, directly or transitively (SRS Pipeline 2, Rules Section 3).
4. **Database Migration Discipline:** Never drop or re-seed the operational database. All schema changes must be applied via forward-only Alembic migrations tested against database copies first.
5. **No Network Calls in Test Suites:** Tests must execute in isolation without invoking external Gemini endpoints. Automated test suites use `tests/fake_llm.py`.
6. **Bilingual Dictionary Parity:** Keys in `en.js` and `vi.js` must achieve 100% mutual parity. User-facing strings must be retrieved dynamically via `t(key, vars)`.
7. **AI Usage Declaration:** Every completed task must be logged in `AI_USAGE.md` with verified metrics.

---

## 1. SRS Compliance Gap Analysis & Task Matrix

Legend: **Complete** · **Partial** · **Missing**

| SRS Reference | Core Requirement | Status | Resolution Task |
| :--- | :--- | :---: | :--- |
| **1.8 #12** | Eliminate fabricated metrics, mock comparison results, and synthetic pass rates | **Complete** | Task 1: Replaced mock UI figures with live backend API endpoints (`/reports/*`). |
| **Step 29** | Coverage Score calculation based on individual Role Matrix requirements | **Complete** | Task 3: Deterministic requirement-level coverage computed in `rule_pipeline/coverage.py`. |
| **Step 46** | Dual-Pipeline field-by-field cross-validation matrix | **Complete** | Task 5: Comparator Engine diffs independent fields (taught, tested, source version, claims). |
| **Step 51** | System Administrator portal with read-only operational oversight and account management | **Complete** | Task 6: Admin portal with complete read-only visibility across paths, documents, and audit logs. |
| **Step 9** | Employee account provisioning from uploaded CVs | **Complete** | Task 7: CV parser extracting candidate profile data and generating accounts with temporary credentials. |
| **Deliverable 6**| Dual-pipeline comparison audit dataset exportable to CSV | **Complete** | Task 8: CSV export endpoint (`/reports/comparison.csv`) and static deliverable generated. |
| **Deliverable 11**| Multi-stage production containerization and deployment configuration | **Complete** | Task 9: Production Dockerfile, Nginx reverse proxy configuration, and `docker-compose.yml`. |

---

## 2. Completed Phase Deliverables Summary

### Task 1: Live Reporting & Dynamic Metric Endpoints
- Removed mock statistics from `Reports.jsx` and `PlanComparisonModal.jsx`.
- Implemented `/reports/summary`, `/reports/compliance`, `/reports/learners`, `/reports/attribution`, and `/reports/alerts`.
- All operational numbers are derived dynamically from database records and verification audits.

### Task 2: Codebase Refactoring & Cleanup
- Pruned obsolete migration scripts, temporary database fix scripts, and unreferenced assets.
- Cleaned up redundant AI artifacts and standardized exception handling.

### Task 3: Deterministic Coverage Calculation (SRS Step 29)
- Implemented `rule_pipeline/coverage.py` calculating requirement-level coverage against `role_matrix.csv`.
- Paths require 100% mandatory requirement coverage to achieve `Verified` status.
- Added `python -m app.db.recompute_coverage` utility to update existing database records.

### Task 4: Dual-Pipeline Comparator Engine (SRS Step 46)
- Implemented field-by-field diff comparison in `backend/app/comparator/engine.py`.
- Compares taught items, tested items, source document versions, and verbatim quote traceability.
- Exported comparative audit dataset to `reports/genai_python_comparison.csv`.

### Task 5: Administrator Experience & Oversight (SRS Step 51)
- Provisioned administrative user account `admin@fourangrybirds.vn`.
- Created read-only administrative views for learning paths, verification audits, documents, and learners.
- Enforced strict RBAC preventing non-administrative account privilege escalation.

### Task 6: Automated CV Ingestion & Onboarding (SRS Step 9)
- Implemented `cv_parser.py` parsing PDF, DOCX, TXT, and MD resumes.
- Extracts candidate name, email, experience duration, and technical competencies without storing raw PII.
- Automatically generates user account, sets temporary password, and assigns role onboarding path.

### Task 7: Production Packaging & Docker Deployment (SRS Deliverable #11)
- Built multi-stage `backend/Dockerfile` with automated database migration and seeding entrypoint.
- Built multi-stage `frontend/Dockerfile` compiling React assets and serving via Nginx Alpine.
- Configured `frontend/nginx.conf` handling client-side SPA routing and `/api/` reverse proxying.
- Authored root `docker-compose.yml` orchestrating PostgreSQL 16, backend, and frontend containers.

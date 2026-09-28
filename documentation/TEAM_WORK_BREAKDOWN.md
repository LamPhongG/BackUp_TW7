# SkillSprint AI — Work Breakdown Structure (WBS)
**Project:** SkillSprint AI – Dual-Pipeline AI Document Verification System  
**Competition:** TechWiz 7 – Generative AI Powerplay Track  
**Team Roster:** 4 members | **Timeline:** 5 Phases × 10 hours/day  

---

## I. Responsibility Assignment Matrix (RACI)

| Team Member | Functional Role | Git Feature Branch | Primary Code Ownership |
| :--- | :--- | :--- | :--- |
| **Chau Quoc Lam Phong** | **AI & Ingestion Engineer** | `feat/genai-pipeline` | `src/document_processing/`, `src/document_validation/`, `src/genai_pipeline/`, `src/prompt_templates/` |
| **Doan Thi Quynh Nhi** | **Backend & Rule Engine Engineer** | `feat/python-rule-engine` | `src/python_validation/`, `src/role_matrix/`, `src/comparison_engine/`, `src/hallucination_checks/`, `src/contradiction_checks/` |
| **Pham Tan Tai** | **Fullstack & Database Developer** | `feat/frontend-dashboard` | `src/database/`, `backend/`, `frontend/`, `src/schemas/` |
| **Le Thi Kieu Duyen** | **QA, Security, Data & Docs Lead** | `docs/test-and-reports` | `tests/`, `sample_documents/`, `hidden_test_ready/`, `documentation/`, `reports/` |

---

## II. Detailed Implementation Schedule Across 5 Phases

---

### Phase 1: Environment Setup, Baseline Data & Database Architecture
**Goal:** Operational database, base project infrastructure, and document parsing engine.

#### Chau Quoc Lam Phong — AI & Ingestion Engineer
- Setup virtual environment and dependencies.
- Build PyMuPDF extractor with page number indexing.
- Implement section-based chunking with contract `{doc_id, chunk_id, section_id, heading, page, content}`.
- Implement format validation and magic-byte checks.
- Deliver automated tests for document parsing and validation.

#### Doan Thi Quynh Nhi — Backend & Rule Engine Engineer
- Initialize FastAPI skeleton, CORS middleware, and health check endpoints.
- Define core Pydantic schemas: `OnboardingPlan`, `Module`, `Task`, `Quiz`, `DocumentChunk`.
- Build file upload endpoints and chunk extraction service.
- Verify Swagger UI documentation across all endpoints.

#### Pham Tan Tai — Fullstack & Database Developer
- Configure SQLAlchemy database connections (SQLite and PostgreSQL).
- Implement ORM models and initial schema migrations (11 baseline tables).
- Create database seeding script for corporate departments, roles, and demo users.
- Initialize React Vite frontend application frame.

#### Le Thi Kieu Duyen — QA, Security, Data & Docs Lead
- Compile initial corporate documents (DOC-01..10) across diverse departments.
- Standardize metadata, section tags (`[MANDATORY]`, `[OPTIONAL]`), and cross-references.
- Create initial Role Requirement Matrix spanning 10 key positions.
- Initialize `AI_USAGE.md` and automated pytest testing harness.

---

### Phase 2: Dual-Pipeline Implementation (GenAI vs Python Rule Engine)
**Goal:** Parallel pipeline implementation for curriculum synthesis and deterministic rule validation.

#### Chau Quoc Lam Phong — AI & Ingestion Engineer
- Implement Gemini API client with 3-attempt exponential backoff.
- Engineer versioned Prompt Templates (`prompts/v1.0/`, `v1.1/`) enforcing structured output.
- Build hierarchical curriculum generation: Stages → Modules → Tasks → Quizzes.
- Implement exact-quote grounding verification (`grounding.py`).

#### Doan Thi Quynh Nhi — Backend & Rule Engine Engineer
- Build deterministic Role Matrix parser and requirement extractor.
- Implement deterministic Coverage Score and Traceability Score algorithms.
- Enforce prerequisite DAG sequencing (foundations before advanced topics).
- Validate that Pipeline 2 operates with zero AI SDK dependencies.

#### Pham Tan Tai — Fullstack & Database Developer
- Develop role-based layouts (Admin, HR, Reviewer, Employee) with route guards.
- Implement document management dashboard with real-time extraction progress.
- Build interactive Learning Path viewer with hierarchical stage navigation.
- Implement custom reactive internationalization dictionary (`LanguageContext`).

#### Le Thi Kieu Duyen — QA, Security, Data & Docs Lead
- Expand sample documents with Phase 2 collection (DOC-11..20), including test fixtures.
- Author adversarial attack document DOC-18 and expired compliance policy DOC-19.
- Implement unit tests covering parsing, chunking, and requirement mapping.

---

### Phase 3: Comparison Engine, Adversarial Defense & Review Workflow
**Goal:** Cross-validation comparison engine, security shields, and reviewer workflow.

#### Chau Quoc Lam Phong — AI & Ingestion Engineer
- Build generation consistency evaluator measuring structural stability across runs.
- Develop selective module regeneration for impacted paths upon policy updates.
- Implement relevance filtering omitting irrelevant cross-departmental sections.

#### Doan Thi Quynh Nhi — Backend & Rule Engine Engineer
- Implement Dual-Pipeline Comparator Engine (`comparison_engine/`).
- Build field-by-field diff comparison between GenAI claims and Python ground truth.
- Implement Hallucination Detector and Contradiction Checker with policy precedence hierarchy.
- Classify path status: `Verified`, `Verified with Warning`, `Manual Review Required`.

#### Pham Tan Tai — Fullstack & Database Developer
- Build Dual-Pipeline Comparison Table modal with field diff highlights.
- Implement Reviewer workspace: Approve, Request Changes, Override with audit logging.
- Implement append-only audit trail logging every administrative action.
- Build server-side employee learning progress tracking and interactive quizzes.

#### Le Thi Kieu Duyen — QA, Security, Data & Docs Lead
- Implement dual-language prompt injection filter (English and Vietnamese).
- Execute adversarial testing against DOC-18 jailbreak attack vectors.
- Validate security logging and verify zero credential leaks in version history.

---

### Phase 4: Autonomous Hidden Test Execution & Video Demo
**Goal:** Autonomous test readiness for unseen evaluation documents and video recording.

#### Chau Quoc Lam Phong — AI & Ingestion Engineer
- Build standalone automated evaluation harness `hidden_test_ready/run_hidden_test.py`.
- Verify autonomous end-to-end execution on unseen policy files without manual tuning.
- Generate structured verification audit report `hidden_test_report.json`.

#### Doan Thi Quynh Nhi — Backend & Rule Engine Engineer
- Conduct comprehensive integration testing across all comparison dimensions.
- Verify 100% agreement between Python rules and grounded LLM outputs.
- Export dual-pipeline comparison audit dataset to CSV (`reports/genai_python_comparison.csv`).

#### Pham Tan Tai — Fullstack & Database Developer
- Build employee certificate modal upon 100% path completion.
- Implement real-time generation progress monitor with 6-stage telemetry.
- Optimize frontend bundle performance and eliminate layout reflows.

#### Le Thi Kieu Duyen — QA, Security, Data & Docs Lead
- Author comprehensive 5-minute video demonstration script (`demo_script.md`).
- Screen capture application workflows across all 4 user roles.
- Compile security testing report and audit logs.

---

### Phase 5: Production Deployment, Documentation & Submission Audit
**Goal:** Production packaging, comprehensive project report (≥ 20 pages), and 100% passing tests.

#### Chau Quoc Lam Phong — AI & Ingestion Engineer
- Perform code refactoring, remove redundant AI signatures and obsolete scripts.
- Audit prompt templates and verify structured output resilience.
- Review technical blog post and documentation.

#### Doan Thi Quynh Nhi — Backend & Rule Engine Engineer
- Finalize requirement coverage reports across all 10 corporate positions.
- Verify that all core algorithm packages pass automated tests in isolation.
- Complete technical architecture sections of the project report.

#### Pham Tan Tai — Fullstack & Database Developer
- Build multi-stage production `Dockerfile` for backend and frontend.
- Configure `docker-compose.yml` for unified local and production orchestration.
- Configure Nginx reverse proxy with SPA fallback routing and Gzip compression.
- Conduct smoke tests on containerized environments.

#### Le Thi Kieu Duyen — QA, Security, Data & Docs Lead
- Compile complete 20+ page Project Report (`reports/Project_Report.pdf`).
- Verify that all 586 automated tests pass with 100% success rate.
- Conduct final audit against 18 SRS submission criteria.
- Package final repository artifacts for submission.
# Student Defense & Project Presentation Guide — SkillSprint AI

Target Audience: Undergraduate engineering students and interns presenting before the evaluation board and faculty committee.  
Competition / Track: SkillSprint AI — Generative AI Powerplay (TechWiz 7).  
Team: Four Angry Birds.  

---

## 1. System Overview and Source Code Architecture

### 1.1. Problem Statement & Motivation
In modern corporate environments, internal governance documents (policies, SOPs, job descriptions, employee handbooks) are dense and extensive. Relying purely on black-box LLMs (such as raw ChatGPT or ungrounded generative models) to build automated employee onboarding curricula introduces three major failure modes:
1. **Hallucination:** AI invents benefits, leave policies, or technical parameters not present in company source documents.
2. **Contradictions:** Outdated policy versions conflict with active ones, or departmental SOPs contradict global corporate regulations.
3. **Adversarial Prompt Injections:** Untrusted documents or prompts contain jailbreak directives designed to manipulate review workflows.

**The SkillSprint AI Solution:** A Dual-Pipeline Verification System:
- **Pipeline 1 (Generative AI Pipeline):** Uses Google Gemini with Pydantic Structured Outputs and exact-quote grounding to synthesize modular learning paths.
- **Pipeline 2 (Deterministic Python Rule Engine):** 100% independent of AI; uses pure Python algorithms to evaluate the Role Requirement Matrix, compute Coverage Scores, validate prerequisite DAGs, and verify source chunk hashes.
- **Comparator Engine:** Performs field-by-field cross-validation between Pipeline 1 and Pipeline 2. If the AI output hallucinates or misses mandatory requirements, the system flags the discrepancies and prevents unauthorized publication.

### 1.2. Repository Structure

```text
TechWiz7-FourAngryBirds-SkillSprint-AI/
├── backend/                       # Web API Backend (FastAPI, SQLite/PostgreSQL, SQLAlchemy)
│   ├── app/
│   │   ├── api/routes/            # Endpoints: auth, documents, paths, users, invite, catalog, reports
│   │   ├── comparator/            # Step 46: Dual-Pipeline Comparator Engine
│   │   ├── core/                  # Configuration, JWT security, regex injection filter
│   │   ├── db/                    # Session management, migrations, seed data (10 roles, 28 docs)
│   │   ├── genai_pipeline/        # Pipeline 1: Gemini client, prompt templates, grounding verification
│   │   ├── ingestion/             # Document extraction (PDF/DOCX), section-based chunking
│   │   ├── models/                # SQLAlchemy ORM models (Users, Paths, Documents, Chunks, Enrollments)
│   │   ├── rule_pipeline/         # Pipeline 2: Deterministic Python Rule Engine, Coverage, Matrix
│   │   ├── schemas/               # Pydantic validation schemas
│   │   └── services/              # Domain services: path checks, progress, enrollments, reports
│   └── tests/                     # 390 automated unit and integration tests (100% Passed)
│
├── frontend/                      # Web Single Page Application (React, Vite, CSS)
│   ├── src/
│   │   ├── components/path/       # UI components: DualComparisonTable, GenerationProgress, Certificate
│   │   ├── contexts/              # Global state contexts: Paths, Documents, Enrollments, Language
│   │   ├── locales/               # Bilingual localization dictionaries (en.js, vi.js)
│   │   ├── pages/                 # Role-based views: Admin, HR, Employee, Reviewer
│   │   └── utils/                 # Path generator fallback, verification checks, export utilities
│   └── tests/                     # 108 Vitest component and logic tests (100% Passed)
│
├── src/                           # Standalone core algorithm package (Python)
│   ├── comparison_engine/         # Cross-pipeline diff and classification logic
│   ├── contradiction_checks/      # Policy contradiction detection and precedence rules
│   ├── document_processing/       # PyMuPDF and python-docx document parsers
│   ├── hallucination_checks/      # Source quote grounding verification against raw chunks
│   └── security/                  # Dual-layer prompt injection defense (EN and VI)
│
├── tests/                         # 88 automated unit tests for standalone core package (100% Passed)
├── sample_documents/              # 28 authentic enterprise documents (PDF, DOCX, TXT, MD, CSV)
├── role_matrix/                   # Role Requirement Matrix (203 standardized requirements)
└── documentation/                 # Architectural specifications, demo scripts, ERD, and guides
```

---

## 2. SRS 63-Step Compliance Mapping

| SRS Step | Feature Name | Source Code Location | Technical Implementation Summary |
| :--- | :--- | :--- | :--- |
| Step 1 | Company Document Dataset Creation | `sample_documents/` | 28 internal governance documents (DOC-01..28) spanning 10 corporate departments |
| Step 2 | Multiple Job Roles | `backend/app/models/organization.py` | 10 standardized job positions across Engineering, HR, Finance, CS, Sales, etc. |
| Step 3 | Document Variation | `sample_documents/` | Diverse document formats: PDF (PyMuPDF), DOCX (python-docx), TXT, MD, CSV |
| Step 4 | Document Upload | `backend/app/api/routes/documents.py` | Multipart upload API with progress feedback and secure server storage |
| Step 5 | Document Validation | `backend/app/ingestion/validation.py` | Magic-byte format verification, SHA-256 deduplication hashing, size limits |
| Step 6 | Document Parsing | `backend/app/ingestion/` | Preserves structural headings, tables, pages, and section identifiers |
| Step 7 | Content Chunking | `backend/app/ingestion/chunker.py` | Heading-aware chunking with contract `{doc_id, chunk_id, section_id, heading, page}` |
| Step 8 | Document Version Control | `backend/app/services/documents.py` | Policy lifecycle management: `active`, `superseded`, `expired`, `upcoming` |
| Step 9 | Employee Profile Creation | `backend/app/api/routes/users.py` | Profiles with department, position, and experience tier assignment |
| Step 10 | Role Requirement Matrix | `role_matrix/role_matrix.csv` | 203 standardized competence and regulatory requirements across 10 roles |
| Step 11 | Requirement Extraction | `backend/app/rule_pipeline/requirements.py` | Mandatory vs optional requirement categorization per job position |
| Step 12 | Personalized Onboarding Plan Generation | `backend/app/genai_pipeline/generator.py` | Customized curriculum synthesized according to role and department |
| Step 13 | Multi-Stage Onboarding Plan | `backend/app/genai_pipeline/types.py` | Multi-stage timeline: Day 1 (Orientation), Week 1 (Core), Month 1 (Autonomy) |
| Step 14 | Learning Module Generation | `backend/app/genai_pipeline/generator.py` | Complete modules containing objectives, reading content, tasks, and summaries |
| Step 15 | Source-Grounded Generation | `backend/app/genai_pipeline/grounding.py` | Exact-quote grounding enforcing verbatim citations (`exact_quote`) |
| Step 16 | Role-Specific Learning | `backend/app/genai_pipeline/relevance.py` | Relevance filtering omitting irrelevant departmental rules |
| Step 17 | Checklist Generation | `backend/app/genai_pipeline/generator.py` | Day-one operational onboarding checklists |
| Step 18 | Role-Specific Task Generation | `backend/app/genai_pipeline/generator.py` | Practical tasks aligned with job duties |
| Step 19 | Scenario-Based Task Generation | `backend/app/genai_pipeline/generator.py` | Realistic operational scenarios with explicit completion criteria |
| Step 20 | Quiz Generation | `backend/app/genai_pipeline/generator.py` | 4-option multiple-choice quizzes with distractor analysis |
| Step 21 | Quiz Traceability | `backend/app/services/path_checks.py` | Correct answers strictly grounded in source chunk quotes |
| Step 22 | Distractor Validation | `backend/app/genai_pipeline/prompts/` | Realistic distractors verified to avoid factual contradictions |
| Step 23 | Assessment Generation | `backend/app/genai_pipeline/generator.py` | End-of-stage cumulative evaluation assessments |
| Step 24 | Assessment Rubric | `backend/app/genai_pipeline/schemas.py` | Structured evaluation rubrics across competency dimensions |
| Step 25 | Difficulty Levels | `backend/app/genai_pipeline/types.py` | Beginner, Intermediate, and Advanced differentiation |
| Step 26 | Prerequisite Management | `backend/app/services/path_checks.py` | Prerequisite DAG ensuring foundational concepts precede advanced topics |
| Step 27 | Learning Sequence Validation | `backend/app/services/path_checks.py` | Instructional sequence verification (instruction must precede assessment) |
| Step 28 | Python Requirement Validation Engine | `backend/app/rule_pipeline/coverage.py` | Pure deterministic Python validation independent of AI APIs |
| Step 29 | Coverage Score | `backend/app/rule_pipeline/coverage.py` | Percentage of mandatory Role Matrix requirements covered |
| Step 30 | Traceability Score | `backend/app/comparator/engine.py` | Percentage of curriculum verifiable down to chunk IDs and pages |
| Step 31 | Hallucination Detection | `backend/app/comparator/engine.py` | Flags unauthorized claims or figures unsupported by source chunks |
| Step 32 | Unsupported Content Detection | `backend/app/comparator/engine.py` | Marks ungrounded content as unsupported |
| Step 33 | Contradiction Detection | `backend/app/services/path_checks.py` | Identifies conflicting policy statements across documents |
| Step 34 | Policy Precedence Rules | `backend/app/services/path_checks.py` | Enforces policy hierarchy (Active > Superseded, SOP > General FAQ) |
| Step 35 | Duplicate Learning Detection | `backend/app/services/path_checks.py` | SequenceMatcher (threshold 0.85) identifying redundant modules |
| Step 36 | Role Relevance Validation | `backend/app/genai_pipeline/relevance.py` | Ensures 100% of curriculum content maps to the target position |
| Step 37 | GenAI Structured Output | `backend/app/genai_pipeline/schemas.py` | Enforces Pydantic schema validation for all LLM responses |
| Step 38 | Schema Validation | `backend/app/genai_pipeline/client.py` | JSON extraction and schema correction stripping markdown wrappers |
| Step 39 | GenAI Retry and Recovery | `backend/app/genai_pipeline/client.py` | Exponential backoff (3 attempts) and fallback model routing |
| Step 40 | Prompt Template Management | `backend/app/genai_pipeline/prompts/` | Modular versioned markdown prompt files |
| Step 41 | Prompt Version Tracking | `backend/app/models/learning_path.py` | Records prompt version (`v1.0`, `v1.1`) in path metadata |
| Step 42 | Prompt Injection Defense | `backend/app/core/injection_filter.py` | Dual-tier regex and keyword sanitizer (English and Vietnamese) |
| Step 43 | Adversarial Document Testing | `tests/test_adversarial.py` | Automated testing with adversarial document DOC-18 |
| Step 44 | GenAI Consistency Check | `src/comparison_engine/consistency.py` | Structural consistency evaluation across multiple generations |
| Step 45 | Generation Consistency Score | `src/genai_pipeline/consistency_checker.py` | Quantitative structural consistency scoring |
| Step 46 | Python and GenAI Result Comparison | `backend/app/comparator/engine.py` | Field-by-field cross-validation matrix between GenAI and Python |
| Step 47 | Final Verification Status | `backend/app/comparator/engine.py` | Verified, Verified with Warning, Incomplete, Unsupported, Flagged |
| Step 48 | Human Review Workflow | `frontend/src/pages/reviewer/` | Reviewer workspace for approval, modification requests, and comments |
| Step 49 | Reviewer Override | `backend/app/api/routes/paths.py` | Reviewer override with mandatory justification logged to audit trail |
| Step 50 | Employee Learning Dashboard | `frontend/src/pages/employee/` | Learner portal: module viewing, quiz execution, certificate modal |
| Step 51 | Administrator Dashboard | `frontend/src/pages/admin/` | Account provisioning, role distribution, audit monitoring |
| Step 52 | Role Dashboard | `frontend/src/pages/admin/` | Analytics on paths and completions distributed across departments |
| Step 53 | Progress Tracking | `backend/app/services/progress.py` | Server-side progress tracking and quiz scoring |
| Step 54 | Progress Assessment | `backend/app/models/enums.py` | State progression: `not_started`, `in_progress`, `completed` |
| Step 55 | Adaptive Recommendation | `frontend/src/pages/employee/Explore.jsx` | Recommendations based on department and performance gaps |
| Step 56 | Weak-Area Identification | `backend/tests/test_weak_areas.py` | Incorrect quiz analysis identifying conceptual gaps |
| Step 57 | Policy Update Detection | `backend/app/services/documents.py` | Automatic detection of uploaded superseding policy versions |
| Step 58 | Impact Analysis | `backend/app/services/paths.py` | Identification of published paths referencing outdated policies |
| Step 59 | Selective Regeneration | `src/genai_pipeline/selective_regenerator.py` | Targeted regeneration of affected modules while preserving unaffected content |
| Step 60 | Training Plan Comparison | `frontend/src/components/path/PlanComparisonModal.jsx` | Side-by-side diff comparing curriculum before and after policy updates |
| Step 61 | Search and Filtering | `frontend/src/pages/shared/PathList.jsx` | Multi-criteria search and filtering by role, status, difficulty |
| Step 62 | Reports | `frontend/src/pages/hr/Reports.jsx` | Operational compliance, verification status, and progress metrics |
| Step 63 | Export | `frontend/src/utils/exportHelpers.js` | Curriculum and audit export to PDF, JSON, and CSV formats |

---

## 3. Defense Presentation Q&A Reference

### Question 1: Why did the team implement a Dual-Pipeline architecture instead of using Gemini directly?
**Answer:**  
Directly relying on an LLM creates an ungrounded black box vulnerable to hallucinations and prompt injections. SkillSprint AI incorporates Pipeline 2 as a pure deterministic Python rule engine independent of AI SDKs. Pipeline 2 computes coverage against the Role Requirement Matrix and verifies chunk integrity. The Comparator Engine cross-references both outputs, ensuring paths are marked `Verified` only when fully grounded and compliant.

### Question 2: How does the system prevent hallucinations?
**Answer:**  
Hallucination prevention operates at two levels:  
- **Level 1 (Ingestion & Prompt):** Context windows receive only relevant, verified chunks for the target position. Pydantic schemas enforce that every module, task, and quiz includes a `source_reference` with a verbatim `exact_quote`.  
- **Level 2 (Python Grounding & Comparator):** Python validation checks every `exact_quote` against raw database chunks. Missing or fabricated quotes trigger immediate hallucination flags and block automatic publication.

### Question 3: How does the system handle policy updates (e.g., DOC-02 v1.1 superseding v1.0)?
**Answer:**  
Through Document Version Control (SRS Steps 8, 57–59):  
1. When a new version is uploaded with `supersedes: v1.0`, the previous version transitions to `superseded` or `obsolete`.  
2. Impact Analysis identifies all published paths referencing the outdated document.  
3. Selective Regeneration regenerates only the affected modules, preserving unaffected sections and saving API tokens.

### Question 4: How has the system been tested to verify software quality?
**Answer:**  
The entire solution is validated by **586 automated tests** with a 100% pass rate:  
- **390 Pytest backend tests:** Full API coverage, JWT security, RBAC authorization, path lifecycle, injection filters, and comparator logic.  
- **88 Pytest core algorithm tests:** Extraction, coverage score calculation, and adversarial attack defense.  
- **108 Vitest frontend tests:** UI components, state management, client-side chunking, and dual-pipeline modal rendering.

---

## 4. Live Demonstration Script for Faculty Committee

1. **Step 1: Sign in as HR Manager**  
   - Email: `hr@fourangrybirds.vn` | Password: `password123`  
   - Open Document Repository: Demonstrate the 28 pre-loaded enterprise documents categorized with active/obsolete lifecycle statuses.
2. **Step 2: Generate an Automated Learning Path**  
   - Navigate to Create Learning Path. Select Department: `Engineering`, Position: `Software Engineer`.  
   - Point out that mandatory policy documents are automatically locked and selected based on the Role Requirement Matrix.  
   - Click Generate with AI: Observe the real-time 6-step progress monitor (Analysis → Planning → Modules → Quizzes → Coverage → Assembly).
3. **Step 3: Audit with Dual-Pipeline Comparison**  
   - Open the generated path detail view. Navigate to the Verification & Audit tab.  
   - Open the Dual-Pipeline Comparison Table: Show the field-by-field verification comparing Pipeline 1 (GenAI) against Pipeline 2 (Python Ground Truth), with Traceability Score, Coverage Score, and final Verified badge.
4. **Step 4: Learner Experience & Assessment**  
   - Sign in as Employee: `alex.morgan@fourangrybirds.vn` | Password: `password123`  
   - Open My Paths: The assigned path is immediately available. Open Module 1, review source citations, complete the interactive quiz, and view real-time progress tracking.

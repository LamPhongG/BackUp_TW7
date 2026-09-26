# SkillSprint AI — Dual-Pipeline AI Document Verification System

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Test Suite](https://img.shields.io/badge/tests-64%2F64%20passed-success.svg)](tests/)
[![Architecture](https://img.shields.io/badge/architecture-Dual--Pipeline-indigo.svg)](#core-architecture-dual-pipeline)
[![Track](https://img.shields.io/badge/TechWiz%207-Generative%20AI%20Powerplay-orange.svg)](https://techwiz.fpt.edu.vn/)

> **Team:** Four Angry Birds  
> **Competition:** TechWiz 7 — Generative AI Powerplay Track  
> **Core Mission:** Eliminate enterprise onboarding overhead while providing a 100% mathematically verifiable shield against AI hallucinations and malicious prompt injections.

---

## 📌 Executive Summary

Enterprise employee onboarding is historically slow, fragmented, and resource-intensive. While generative AI (LLMs) can automate personalized curriculum generation, deploying raw LLM outputs in corporate and legal environments introduces catastrophic risks:

1. **AI Hallucinations:** Large language models routinely fabricate non-existent employee perks, alter leave entitlement figures, or generate invalid compliance instructions.
2. **Adversarial Injections:** Malicious inputs inside uploaded documents (`SYSTEM OVERRIDE`, jailbreak prompts) can hijack the LLM to auto-approve unverified content.
3. **Internal Policy Contradictions:** Multi-page corporate handbooks often contain conflicting clauses written at different times (e.g., password expiry in 90 days vs. 30 days).

**SkillSprint AI** resolves these fundamental challenges through a **Dual-Pipeline Architecture**: pairing an advanced Generative AI generation pipeline with an independent, pure-Python deterministic Rule Engine that validates every claim against ground-truth source chunks.

---

## 🏛️ Core Architecture: Dual-Pipeline

```mermaid
flowchart TD
    Doc[("Corporate Policy Document\n(PDF / DOCX)")] --> Ingest["Phase 1: Ingestion & Validation\n(PyMuPDF & python-docx)"]
    Ingest --> Chunker["Structured Section Chunking\n(Heading & Page Mapping)"]

    %% Pipeline 1
    Chunker -->|"Ground-Truth Chunks"| GenAI["Pipeline 1: GenAI Pipeline\n(Gemini Pro + Structured Outputs)"]
    GenAI --> Plan["Onboarding Plan & Grounded Quizzes\n(Mandatory source_citation on each item)"]

    %% Pipeline 2
    Chunker -->|"Ground-Truth Chunks"| RuleEng["Pipeline 2: Rule Engine\n(Pure Python, Zero AI Dependency)"]
    RuleEng --> Rules["Deterministic Policy Constraints\n(Role Matrix & Coverage Checks)"]

    %% Comparison & Verification
    Plan --> Comp["Dual-Pipeline Comparison Engine\n(comparator & classifier)"]
    Rules --> Comp
    Chunker --> Comp

    Comp --> SecScan["1. Security Scanner\n(Prompt Injection Defense)"]
    Comp --> HallucScan["2. Hallucination Detector\n(Exact-Quote & Number Check)"]
    Comp --> ContraScan["3. Contradiction Checker\n(Internal Policy Collisions)"]

    SecScan --> Decision{"Verification Decision"}
    HallucScan --> Decision
    ContraScan --> Decision

    Decision -->|"Zero Threats & Match >= 95%"| Verified["VERIFIED\n(Instant Auto-Approval)"]
    Decision -->|"Minor Mismatches & Match >= 85%"| Warning["VERIFIED WITH WARNING\n(Non-Critical Notices)"]
    Decision -->|"Threats, Hallucinations or Lệch số"| Review["MANUAL REVIEW REQUIRED\n(Blocked for HR Inspection)"]
```

---

## 🚀 Key Engineering Innovations

| Feature | Technical Implementation | Benefit |
| :--- | :--- | :--- |
| **Pure Python Rule Engine** | Standard library + regex only (zero AI SDKs). | 100% deterministic ground-truth unaffected by LLM drift or API downtime. |
| **Strict Citation Enforcement** | Pydantic v2 schemas requiring `exact_quote` and `page_number` for every task and quiz. | Eliminates unsubstantiated claims; makes every output traceable to source pages. |
| **Number Tampering Defense** | RegEx extraction `\b\d+\b` comparing claimed numbers against source text. | Catches altered metrics (e.g., 15 leave days altered to 30) even when sentence structure matches. |
| **Prompt Injection Neutralization** | Pattern-based scanner intercepting `SYSTEM OVERRIDE`, `DAN`, `Ignore prior instructions`. | Shields the enterprise from prompt-leakage and jailbreak attacks before processing. |
| **Contradiction Collision Engine** | Cross-clause regex matcher extracting numerical constraints per policy topic. | Automatically flags internal handbook collisions (e.g., password expiration mismatch). |
| **Autonomous Hidden Test Ready** | Fully automated runner (`hidden_test_ready/run_hidden_test.py`). | Ingests and verifies completely unseen documents without manual intervention. |

---

## 🛠️ Tech Stack & Requirements

- **Runtime:** Python 3.10+ (Tested on Python 3.10, 3.11, 3.12, 3.13, 3.14)
- **Document Ingestion:** PyMuPDF (`fitz`), `python-docx`
- **Generative AI:** Google Gemini Pro (`gemini-flash-lite-latest` / `gemini-pro`)
- **Data Validation & Schemas:** Pydantic v2, Pydantic-Settings
- **Rule Engine (Pipeline 2):** `src/python_validation/` — CSV-driven Role Requirement Matrix,
  Coverage Scorer, Prerequisite Checker (pure Python, zero AI SDK imports)
- **Security & Integrity:** Regex-based Injection Filter, SHA-256 Document Hashing
- **Testing & QA:** Pytest + Coverage (64 automated tests, 100% pass rate, 90% line coverage)

---

## ⚙️ Step-by-Step Installation & Setup

### 1. Clone Repository & Setup Virtual Environment
```bash
# Clone the repository
git clone https://github.com/LamPhongG/TechWiz7-FourAngryBirds-SkillSprint-AI.git
cd TechWiz7-FourAngryBirds-SkillSprint-AI

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Gemini API Key:
```bash
# Windows:
copy .env.example .env
# Linux / macOS:
cp .env.example .env
```
Inside `.env`:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-lite-latest
DATABASE_URL=sqlite:///./skillsprint.db
PROMPT_VERSION=v1.0
APP_PORT=8000
```

---

## 🧪 Running the Verification Test Suites

### 1. Run Complete Automated Test Suite (64 Tests)
```bash
pytest tests/ -v
```
Output:
```text
======================== 64 passed, 5 warnings in 0.80s ========================
- Ingestion & Chunker Pipeline: 14 passed
- Hardened Reader Edge Cases: 4 passed
- GenAI & Prompt Schemas: 13 passed
- Comparison Engine: 11 passed
- Adversarial & Security Traps: 11 passed
- Role Requirement Matrix & Coverage Scorer (Pipeline 2): 10 passed
- Autonomous Hidden Test: 1 passed
```

### 1b. Run With Coverage (≥ 90% required)
```bash
pytest tests/ --cov=src --cov-report=term-missing
```

### 2. Run Adversarial & Security Trap Tests
Tests all 4 dangerous attack vectors (AI hallucinations, leave tampering, policy contradiction, prompt injection):
```bash
pytest tests/test_adversarial.py -v
```

### 3. Run Autonomous Hidden Test Runner
Executes end-to-end verification on a completely unseen policy document without manual intervention:
```bash
python hidden_test_ready/run_hidden_test.py
```
Output artifact generated at `hidden_test_ready/hidden_test_report.json`:
```json
{
  "document_name": "sample_unseen_policy.pdf",
  "chunks_extracted": 5,
  "target_role": "DevOps Engineer",
  "status": "VERIFIED",
  "match_score": 1.0,
  "hallucinations_detected": 0,
  "security_threats_detected": 0,
  "summary": "Fully verified across both pipelines. Match score is 100.0%."
}
```

---

## 📁 Repository Directory Structure

```text
TechWiz7-FourAngryBirds-SkillSprint-AI/
├── documentation/
│   ├── TEAM_WORK_BREAKDOWN.md       # Detailed WBS with hour-by-hour breakdown
│   ├── demo_script.md               # 5-minute video demo script with checklists
│   └── PROJECT_REPORT_OUTLINE.md    # Architecture & SRS report outline
├── hidden_test_ready/
│   ├── sample_unseen_policy.pdf     # Unseen document for competition hidden test
│   ├── generator.py                 # Generator for unseen test policies
│   ├── run_hidden_test.py           # Autonomous end-to-end test runner
│   └── hidden_test_report.json      # Structured test verification output
├── src/
│   ├── document_processing/         # Phase 1: PDF/DOCX readers & heading chunker
│   │   ├── pdf_reader.py            # PyMuPDF reader with scanned/encryption hardening
│   │   ├── docx_reader.py           # python-docx reader with table extraction
│   │   └── chunker.py               # Section-based semantic chunker
│   ├── document_validation/         # File size and MIME type validator
│   ├── genai_pipeline/              # Phase 2: Gemini client, prompts, plan generator
│   │   ├── gemini_client.py         # Resilient retry wrapper with backoff
│   │   ├── plan_generator.py        # Structured plan generator
│   │   ├── quiz_generator.py        # Grounded quiz generator
│   │   └── response_schemas.py      # Strict Pydantic contracts with SourceCitation
│   ├── prompt_templates/            # Versioned prompt template registry
│   ├── comparison_engine/           # Phase 3: Dual comparison engine & classifier
│   │   ├── engine.py                # Field-by-field diff matcher
│   │   └── classifier.py            # Automated verdict classifier
│   ├── hallucination_checks/        # Anti-hallucination & number discrepancy detector
│   ├── contradiction_checks/        # Cross-clause policy contradiction detector
│   ├── security/                    # Prompt injection regex scanner
│   │   └── injection_filter.py      # Shields against SYSTEM OVERRIDE / jailbreaks
│   ├── python_validation/           # Phase 2: Pipeline 2 rule engine (pure Python, no AI SDK)
│   │   ├── coverage_scorer.py       # Reads role_matrix.csv, computes Coverage Score
│   │   └── prerequisite_checker.py  # Module-order-vs-prerequisite validator
│   ├── role_matrix/
│   │   └── role_matrix.csv          # Role Requirement Matrix: role, topic, mandatory, priority,
│   │                                 #   max_total_minutes, prerequisite_of
│   └── schemas/                     # Shared data contracts (ComparisonReport)
├── tests/                           # Complete test suite (64 test cases)
│   ├── test_document_processing.py  # Ingestion & edge case unit tests
│   ├── test_genai_pipeline.py       # LLM schema & prompt registry tests
│   ├── test_comparison_engine.py    # Comparison & verdict classifier tests
│   ├── test_adversarial.py          # 11 security & trap tests
│   ├── test_rule_engine.py          # Coverage Scorer & Prerequisite Checker tests
│   └── test_hidden_pipeline.py      # Autonomous hidden test pipeline test
├── AI_USAGE.md                      # AI transparency log across all phases
├── requirements.txt                 # Pinned dependencies
├── .env.example                     # Safe configuration template
└── README.md                        # Project documentation (this file)
```

---

## 🌐 Web Application Architecture (4 Distinct Portals)

The pipeline is delivered as a robust enterprise web application separated into **4 independent portals** according to the SRS specification:

| Portal | URL Route | Core Responsibilities |
| :--- | :--- | :--- |
| **1. Admin** | `/admin/*` | **Account Management & Governance:** Full CRUD on user accounts, **Soft Delete** mechanism (`is_active = False` retaining 100% database and audit history), role allocation across 4 roles, and system-wide audit logs. |
| **2. HR** | `/hr/*` | **Document & Curriculum Ingestion:** Upload corporate policies (PDF/DOCX), prompt injection scanning, AI onboarding plan generation requests, draft editing, and submission for review. |
| **3. Reviewer** | `/reviewer/*` | **Quality Control & Dual-Pipeline Verification:** Inspection queue, side-by-side comparison view (GenAI vs Python Ground Truth), citation check, Approve / Request Changes / Override, and department publishing. |
| **4. Employee** | `/employee/*` | **Learning & Competency Assessment:** Personalized onboarding path by role and department, reading lessons with direct "View Original Source" buttons navigating to exact PDF pages, practical tasks, and auto-graded quizzes. |

```powershell
# Backend (FastAPI + PostgreSQL / SQLite)  →  http://localhost:8000/api/docs
cd backend
python -m venv .venv; .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env          # set JWT_SECRET (and GEMINI_API_KEY to use Gemini)
alembic upgrade head; python -m app.db.seed
uvicorn app.main:app --reload

# Frontend (React + Vite)  →  http://localhost:3000
cd frontend
npm install
echo VITE_API_URL=http://localhost:8000/api > .env.local
npm run dev
```

---

## 🎯 Evaluator Instructions (For Competition Judges)

### 1. Evaluator Demo Accounts (Pre-seeded)
All accounts use the universal password: **`Demo@123`** *(You can click on the pre-filled chips on the login screen for instant sign-in)*.

| Role | Email | Password | Intended Evaluation Flow |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fourangrybirds.vn` | `Demo@123` | Inspect role distributions, test User CRUD, test **Soft Delete** and **Restore**. |
| **HR** | `hr@fourangrybirds.vn` | `Demo@123` | View corporate documents, test Prompt Injection detection, generate AI learning path. |
| **Reviewer** | `reviewer@fourangrybirds.vn` | `Demo@123` | Open Review Queue, inspect Dual Comparison View, test exact citation checks, Approve / Request Changes. |
| **Employee** | `sales.emp@fourangrybirds.vn` | `Demo@123` | Access assigned onboarding path, click "Open Source Document" at exact page, complete tasks and quiz. |

### 2. Quick 5-Step Evaluation Walkthrough
1. **Step 1 — Admin & Security:** Log in as `admin@fourangrybirds.vn`. Navigate to **User Accounts** (`/admin/users`). Create a new user, then perform a **Soft Delete** by clicking the deactivate icon. Verify the user transitions to "Deactivated" while remaining permanently intact in the database. Test reactivating the user.
2. **Step 2 — Document Ingestion & Injection Defense:** Log in as `hr@fourangrybirds.vn`. Go to **Documents** (`/hr/documents`). Inspect the 20 corporate policies. Notice how `DOC-18` (Adversarial Prompt Injection) was detected and flagged, preventing malicious commands from contaminating the LLM.
3. **Step 3 — Dual-Pipeline Reviewer Control:** Log in as `reviewer@fourangrybirds.vn`. Open **Review Queue** (`/reviewer/queue`). Select an in-review path. Inspect the **Dual Comparison View** comparing GenAI Output vs. Python Ground Truth. Test clicking on citations to verify exact quote grounding. Click **Approve** with mandatory audit justification.
4. **Step 4 — Employee Grounded Learning:** Log in as `sales.emp@fourangrybirds.vn`. Open the assigned 90-day learning path. Read a lesson and click **"Open Original Source"** — notice the system opens the approved PDF directly to the referenced page. Complete practical tasks and take the grounded quiz.
5. **Step 5 — Automated Test Verification:** Execute the entire test suite via terminal (268 automated tests, 100% pass):
   ```bash
   pytest tests/ -v           # Root test suite (64 tests)
   cd backend && pytest -v    # Backend test suite (125 tests, 95% coverage)
   cd frontend && npm test    # Frontend test suite (79 tests)
   ```

---

## 📌 Project Assumptions

1. **Document Integrity:** Uploaded organizational documents are assumed to be official corporate policies, SOPs, or handbooks in valid PDF (text-layer) or DOCX format. Scanned PDFs containing only bitmap images are automatically identified by the ingestion engine and flagged as requiring OCR.
2. **Deterministic Ground-Truth:** Corporate compliance cannot rely solely on probabilistic LLM responses. Therefore, the Python Rule Engine serves as the non-negotiable source of truth.
3. **Audit Trail & Soft Deletion:** To satisfy enterprise regulatory compliance (GDPR/SOX/ISO), user accounts and historical onboarding records are never hard-deleted with SQL `DELETE`. Instead, accounts undergo **Soft Deletion** (`is_active = False`) to preserve historical audit logs and certificate validity.
4. **Connectivity & Resilient Fallback:** The application assumes external internet connectivity to the Google Gemini API. When connectivity is interrupted or API quotas are exceeded, the resilient fallback engine automatically engages the rule-based local draft generator, ensuring zero downtime.

---

## ⚠️ Limitations & Future Enhancements

1. **Optical Character Recognition (OCR):** The current PyMuPDF reader identifies image-only scanned PDFs and safely halts processing with an actionable error. Future iterations will embed an on-premise Tesseract OCR pipeline for scanned legacy documents.
2. **Multi-Language Document Parsing:** Currently optimized for bilingual English and Vietnamese policy documents. Support for complex East Asian scripts (CJK) and right-to-left languages (Arabic) is planned for Phase 6.
3. **Multi-Modal Retrieval-Augmented Generation:** Future versions will support diagram and flowchart parsing from technical SOPs to generate interactive video tutorials.

---

## 🚀 Production Deployment Instructions

### 1. Docker Production Deployment
```bash
# Build and launch all services via Docker Compose
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations and seed data
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.db.seed
```

### 2. Bare-Metal / Virtual Private Server (VPS)
- **Backend:** Managed with Gunicorn/Uvicorn process manager with 4 worker processes:
  ```bash
  gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
  ```
- **Frontend:** Pre-compiled static bundle (`npm run build`) served via Nginx with HTTP/2 and Brotli compression.
- **SSL / Security:** Reverse proxy termination via Nginx with automated Let's Encrypt SSL certificates and secure HTTP security headers (HSTS, CSP, X-Frame-Options).

---

## 📝 Technical Blog & 🎥 Demonstration Video Links

- **Technical Architecture Blog:** [SkillSprint AI — Solving Hallucination in Enterprise Onboarding (Dev.to / Medium)](https://dev.to/fourangrybirds/skillsprint-ai-dual-pipeline-onboarding-2026) *(Full markdown draft available at [`documentation/BLOG_DRAFT.md`](documentation/BLOG_DRAFT.md))*.
- **Demonstration Video (.mp4):** [YouTube / Google Drive Demo Video (05:00)](https://youtu.be/skillsprint-ai-demo-2026) *(Recorded video demo with detailed scene-by-scene script at [`documentation/demo_script.md`](documentation/demo_script.md))*.
- **Hidden Evaluation Document Runner:** Automated script ready for unseen competition documents:
  ```bash
  python hidden_test_ready/run_hidden_test.py
  ```

---

## 👥 Team & Work Breakdown (Four Angry Birds)

| Member | Role | Primary Responsibility | Branch |
| :--- | :--- | :--- | :--- |
| **Châu Quốc Lâm Phong** | **AI & Ingestion Engineer** | GenAI Pipeline, Document Ingestion, Hidden Test Runner, Demo Pipeline | `feat/genai-pipeline` |
| **Đoàn Thị Quỳnh Nhi** | **Backend & Rule Engine Engineer** | Pure Python Rule Engine, Prerequisite Checker, Security Filter | `feat/python-rule-engine` |
| **Phạm Tấn Tài** | **Fullstack & Database Developer** | PostgreSQL Schema, FastAPI REST API, Dashboard & UI | `feat/frontend-dashboard` |
| **Lê Thị Kiều Duyên** | **QA, Security & Docs Lead** | Adversarial Test Cases, Technical Blog, Project Report & Submission | `docs/test-and-reports` |

---

## 📜 Compliance & AI Transparency

In accordance with TechWiz 7 rules on ethical AI development, all AI usage, prompt iterations, and human verifications are comprehensively logged in [AI_USAGE.md](AI_USAGE.md). Every module has undergone strict human review, variable context refactoring, and deterministic rule validation.

---

## 📄 License & Attribution

Developed for **TechWiz 7 (2026)** by team **Four Angry Birds**.  
All rights reserved under the MIT License.


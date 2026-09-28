# Project Report Outline — SkillSprint AI
**Project:** SkillSprint AI – Dual-Pipeline AI Document Verification System  
**Competition:** TechWiz 7 – Generative AI Powerplay Track  
**Length Requirement:** ≥ 20 pages (Phase 5 Submission Deliverable)  
**Format:** PDF (`reports/Project_Report.pdf`)  
**Lead Coordinator:** Le Thi Kieu Duyen (QA, Security, Data & Documentation Lead)  

> This outline aligns strictly with the mandatory report structure specified in SRS Section 1.10 (Deliverable #1 – Project Report), emphasizing four key evaluation areas: **Architecture, SRS Mapping, Test Results, Deployment**.

---

## 0. Title Page & Table of Contents
- Project Title, Team Name (Four Angry Birds), TechWiz 7, submission date.
- Automated table of contents organized by hierarchical heading levels.
- **Lead:** Le Thi Kieu Duyen

---

## 1. Executive Summary
- 1 page: Problem definition, proposed solution, quantitative highlights (Coverage Score, Traceability Score), core differentiator (independent dual-pipeline architecture without hard-coded outputs).
- **Lead:** Le Thi Kieu Duyen

---

## 2. Introduction & Background
- 2.1 Problem context and business need (SRS §1.1) — challenges of manual corporate onboarding.
- 2.2 Proposed solution (SRS §1.2) — overview of the dual-pipeline architecture.
- 2.3 Purpose of the document (SRS §1.3).
- 2.4 Project scope (SRS §1.4) — in-scope vs out-of-scope boundaries.
- 2.5 Assumptions and technical constraints (SRS §1.5).
- **Lead:** Le Thi Kieu Duyen

---

## 3. System Requirements (Functional & Non-Functional)
- 3.1 Comprehensive summary of 66 Functional Requirements (SRS §1.6, items i–lxvi) grouped by functional domain: Auth/RBAC, Document Repository, Requirement Matrix, GenAI Pipeline, Python Validation, Comparison/Verification, Security, Dashboard, Search/Report.
- 3.2 Non-Functional Requirements (SRS §1.7): Performance (<30s end-to-end), Scalability (1,000 profiles / 100 roles / 1,000 documents), Usability, Accuracy & Grounding (100% mandatory coverage), High Availability (≥99% uptime).
- 3.3 Traceability matrix mapping each FR/NFR to implementation modules and completion status.
- **Leads:** Doan Thi Quynh Nhi & Chau Quoc Lam Phong

---

## 4. System Architecture
### 4.1 Overall Architecture
- 8-block architectural diagram conforming to the SRS Sample Architecture: Company Knowledge Sources → Document Upload & Processing → Role & Requirement Setup → Pipeline 1 (GenAI) / Pipeline 2 (Python Validation) → Result Comparison → Verification Decision → Final Onboarding Plan → Dashboard & Reports.
- Technology stack summary across all components.

### 4.2 Architectural Diagrams
- Data Flow Diagrams (DFD Level 0 and Level 1).
- Use Case Diagrams (Admin, HR, Reviewer, Employee).
- Activity Diagrams (Upload → Chunk → Generate → Validate → Compare → Review → Publish).
- Sequence Diagrams (End-to-end generation and verification transaction).

### 4.3 Document Processing Architecture
- Document ingestion, format validation, section chunking, version lifecycle control.

### 4.4 Backend & Database Architecture
- Entity Relationship Diagram (ERD): users, roles, departments, documents, chunks, paths, enrollments, audit logs.
- REST API contracts and Swagger documentation.

### 4.5 Frontend Architecture
- Role-based screen flows and state machines across Admin, HR, Reviewer, and Employee portals.
- **Leads:** Pham Tan Tai, Chau Quoc Lam Phong, Doan Thi Quynh Nhi

---

## 5. Pipeline 1 — Generative AI Pipeline
- 5.1 Model selection (Google Gemini), prompt engineering, exponential backoff retries (SRS Step 39).
- 5.2 Prompt template management and version tracking (`prompts/v1.0`, `v1.1`).
- 5.3 Pydantic structured output schemas (SRS Step 37).
- 5.4 Hierarchical generation flow: Plan → Module → Task → Quiz → Assessment, with mandatory source citations.
- 5.5 Generation consistency checks (SRS Steps 44–45).
- **Lead:** Chau Quoc Lam Phong

---

## 6. Pipeline 2 — Python Ground-Truth Validation Pipeline
- 6.1 Role Requirement Matrix: schema and structure from `role_matrix/role_matrix.csv` (203 items, 10 roles).
- 6.2 Deterministic algorithms: Coverage Score, Traceability Score, Requirement Consistency Score.
- 6.3 Hallucination detection and unsupported content analysis.
- 6.4 Contradiction detection and policy precedence hierarchy (Policy v2 > v1, SOP > General FAQ).
- 6.5 Duplicate learning detection, prerequisite DAG enforcement, role relevance validation.
- 6.6 Formal certification: Pipeline 2 contains zero AI SDK imports.
- **Lead:** Doan Thi Quynh Nhi

---

## 7. Comparison Engine & Verification Workflow
- 7.1 Cross-pipeline comparison data contract.
- 7.2 Field-by-field comparison matrix (Requirement ID, Role, Source, Python vs GenAI, Match/Mismatch).
- 7.3 Verification state classification: Verified, Verified with Warning, Incomplete, Unsupported, Flagged.
- 7.4 Human review workflow: Approve, Request Changes, Direct Edit, Reviewer Override, Audit Trail.
- **Leads:** Doan Thi Quynh Nhi & Pham Tan Tai

---

## 8. SRS Requirements Compliance Mapping
- 8.1 Complete traceability table: FR (i–lxvi) and NFR (1–5) mapped to code locations, test coverage, and status.
- 8.2 Development step compliance across all 63 steps.
- 8.3 Anti-shortcut verification (SRS §1.8, 16 items): audit trails, git commit history, AI_USAGE.md.
- 8.4 Submission checklist audit (18 criteria).
- **Lead:** Le Thi Kieu Duyen

---

## 9. Security & Adversarial Defense
- 9.1 Prompt injection defense: dual-layer regex and semantic filters (English and Vietnamese).
- 9.2 Adversarial testing with DOC-18 test suite.
- 9.3 Environment variables, secrets management, and zero credential leakage.
- 9.4 Role-Based Access Control (RBAC) security enforcement.
- **Leads:** Le Thi Kieu Duyen & Doan Thi Quynh Nhi

---

## 10. Testing & Test Results
- 10.1 Test strategy covering 18 functional and technical dimensions.
- 10.2 Quantitative results: 586 automated tests passed (100% pass rate).
- 10.3 GenAI vs Python comparison report (≥ 100 requirement-level comparative results, Deliverable #6).
- 10.4 Automated hidden test execution results on unseen documents.
- **Leads:** Le Thi Kieu Duyen, Chau Quoc Lam Phong, Doan Thi Quynh Nhi

---

## 11. Deployment & Infrastructure
- 11.1 Containerization: production `Dockerfile`, `docker-compose.yml` (backend, frontend, PostgreSQL).
- 11.2 Cloud deployment environment setup and database initialization.
- 11.3 Public URL endpoints, evaluator demo credentials, and smoke test verification.
- **Lead:** Pham Tan Tai

---

## 12. Limitations & Future Roadmap
- Analysis of current operational boundaries and architectural scaling pathways (semantic vector search, enterprise HRMS integration).
- **Lead:** Le Thi Kieu Duyen

---

## 13. Conclusion
- Synthesis of project achievements and individual team contributions.
- **Lead:** Le Thi Kieu Duyen

---

## 14. Appendices
- A. Corporate Knowledge Document Catalog (28 documents).
- B. Role Requirement Matrix (203 standardized requirements).
- C. Complete AI Usage Declaration Log (`AI_USAGE.md`).
- D. Key User Interface Screenshots.
- E. Demo Video (.mp4) and Technical Blog Post links.
- F. Team Contribution Records.
- **Lead:** Le Thi Kieu Duyen

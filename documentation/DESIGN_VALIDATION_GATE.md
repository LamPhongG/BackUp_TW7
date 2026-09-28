# System Design Specification: Validation Gate Architecture
**Project:** SkillSprint AI – Dual-Pipeline AI Document Verification System  
**Track:** TechWiz 7 – Generative AI Powerplay Track  
**Author:** Pham Tan Tai (AI-assisted, see `AI_USAGE.md`)  

---

## 1. System Objectives

The Validation Gate is an independent, pure Python verification barrier that executes automatically whenever an HR Specialist submits a learning path for review. The gate treats both AI-synthesized content and uploaded documents as unverified until proven otherwise.

All detected anomalies are categorized by severity. Content Reviewers inspect these findings to decide whether to publish the curriculum or return it to HR for remediation. The cycle repeats until the curriculum satisfies all compliance gates.

The Validation Gate **does not invoke LLM APIs and imports zero AI SDKs** (Rules Section 3). Results are not derived from self-reported claims of Pipeline 1; instead, the gate recomputes all checks deterministically from the final path JSON content and raw database chunks.

---

## 2. Core Verification Modules

The Validation Gate operates across four specialized checking domains (`services/path_checks.py`):

| Domain | Method | Verification Scope | Status Classification |
| :--- | :--- | :--- | :--- |
| **Knowledge Grounding** | `check_knowledge` | Verifies that `exact_quote` exists verbatim within source chunks; validates that correct quiz answers are contained within quoted text. | `hallucination`, `contradiction`, `source_missing`, `outdated_source` |
| **Instructional Flow** | `check_flow` | Validates stage sequencing, mandatory task completion criteria, and the pedagogical rule that instruction must precede evaluation. | 13 specific `flow_*` codes (`error` or `warning`) |
| **Adversarial Safety** | `check_injection` | Scans user-facing content for adversarial command patterns and jailbreak artifacts. | `injection_flagged` |
| **Content Deduplication**| `check_duplicates`| Employs `SequenceMatcher` (threshold 0.85) to flag redundant lesson content across modules. | `duplicate_content` |

---

## 3. Severity Tiers & Publication Rules

1. **Blocking Errors (`error`):**
   - Hallucinated quotes, missing mandatory role requirements, untaught quiz items, or prompt injection payloads.
   - **Resolution:** Publication is strictly blocked. The Reviewer must request revisions or directly edit the offending item.
2. **Review Warnings (`warning`):**
   - Minor formatting ambiguities, missing optional recommendations, or non-blocking policy version notices.
   - **Resolution:** Reviewers may approve the curriculum via an explicit override requiring a mandatory justification (≥ 10 characters) recorded in the audit trail.
3. **Verified Pass (`verified`):**
   - 100% mandatory requirement coverage, 100% verbatim source grounding, and zero flow or injection defects.
   - **Resolution:** Immediate one-click publication.

---

## 4. Execution Performance

Deterministic benchmarks across the pre-loaded database:
- Path with 111 learning items: ~430 ms execution time.
- Path with 254 learning items: ~1.8 seconds execution time.

Because the Validation Gate completes in under 2 seconds, it executes synchronously during the review submission transaction, providing instantaneous feedback without requiring background task queues.

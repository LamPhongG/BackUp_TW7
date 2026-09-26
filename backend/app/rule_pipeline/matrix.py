"""Pipeline 2 — Role Requirement Matrix & Ground Truth Validator.

Independent Python Rule Engine verifying GenAI output against corporate job role standards.
Complies with SRS Section 1.2 (Pipeline 2), Page 6-9.
"""

from typing import Any

# Standard Role Requirement Matrix for 10 corporate positions (SRS Step 2 & 7)
ROLE_REQUIREMENT_MATRIX: dict[str, dict[str, Any]] = {
    "sales-exec": {
        "required_docs": ["DOC-12", "DOC-13"],
        "topics": [
            {"id": "sales-pipeline", "label": "Sales Pipeline Management", "keywords": ["pipeline", "lead", "deal", "phễu", "bán hàng", "kinh doanh"]},
            {"id": "crm-workflow", "label": "CRM & Customer Engagement", "keywords": ["crm", "customer", "khách hàng", "chăm sóc"]},
            {"id": "conduct", "label": "Corporate Code of Conduct", "keywords": ["conduct", "ứng xử", "chính sách", "quy định"]},
        ],
    },
    "cs-exec": {
        "required_docs": ["DOC-12", "DOC-14"],
        "topics": [
            {"id": "ticket-escalation", "label": "Incident & Ticket Escalation", "keywords": ["escalation", "khiếu nại", "sự cố", "ticket", "tiếp nhận"]},
            {"id": "sla-compliance", "label": "SLA & Response Time", "keywords": ["sla", "thời gian", "phản hồi", "hỗ trợ"]},
            {"id": "workplace-conduct", "label": "Workplace Communication", "keywords": ["conduct", "giao tiếp", "ứng xử", "chăm sóc"]},
        ],
    },
    "hr-exec": {
        "required_docs": ["DOC-11", "DOC-15"],
        "topics": [
            {"id": "onboarding-sop", "label": "Employee Onboarding SOP", "keywords": ["onboarding", "hội nhập", "nhân sự", "thử việc", "tiếp nhận"]},
            {"id": "leave-policy", "label": "Leave & Benefits Policy", "keywords": ["leave", "nghỉ phép", "bảo hiểm", "phúc lợi", "chế độ"]},
            {"id": "talent-records", "label": "Personnel Records & Compliance", "keywords": ["hồ sơ", "records", "tuân thủ", "lưu trữ"]},
        ],
    },
    "finance-associate": {
        "required_docs": ["DOC-11", "DOC-15"],
        "topics": [
            {"id": "reimbursement", "label": "Expense & Reimbursement SOP", "keywords": ["reimbursement", "hoàn tiền", "chi phí", "hóa đơn", "thanh toán"]},
            {"id": "financial-audit", "label": "Financial Compliance & Audit", "keywords": ["kiểm toán", "audit", "tài chính", "kế toán"]},
            {"id": "company-regulations", "label": "Company Regulations", "keywords": ["nội quy", "regulations", "quy định"]},
        ],
    },
    "ops-coordinator": {
        "required_docs": ["DOC-11", "DOC-12"],
        "topics": [
            {"id": "data-privacy", "label": "Data Privacy & Protection", "keywords": ["privacy", "dữ liệu", "bảo mật", "thông tin"]},
            {"id": "info-security", "label": "Information Security & Access", "keywords": ["security", "mật khẩu", "an toàn", "hệ thống"]},
            {"id": "system-operations", "label": "Operations Workflow", "keywords": ["vận hành", "operations", "quy trình", "chi nhánh"]},
        ],
    },
    "marketing-exec": {
        "required_docs": ["DOC-11", "DOC-13"],
        "topics": [
            {"id": "brand-guidelines", "label": "Brand & Digital Marketing", "keywords": ["marketing", "tiếp thị", "thương hiệu", "quảng cáo"]},
            {"id": "campaign-planning", "label": "Campaign Strategy", "keywords": ["chiến dịch", "campaign", "lead", "truyền thông"]},
            {"id": "conduct", "label": "Workplace Standards", "keywords": ["chuẩn mực", "conduct", "quy định"]},
        ],
    },
    "support-engineer": {
        "required_docs": ["DOC-11", "DOC-14"],
        "topics": [
            {"id": "deployment-sop", "label": "Software Deployment Workflow", "keywords": ["deployment", "triển khai", "bàn giao", "phần mềm"]},
            {"id": "info-sec", "label": "Information Security Guidelines", "keywords": ["security", "mật khẩu", "an toàn thông tin", "mạng"]},
            {"id": "technical-support", "label": "Technical Issue Troubleshooting", "keywords": ["support", "hỗ trợ", "kỹ thuật", "sửa lỗi", "sự cố"]},
        ],
    },
    "branch-manager": {
        "required_docs": ["DOC-11", "DOC-12"],
        "topics": [
            {"id": "branch-operations", "label": "Branch Operations Manual", "keywords": ["chi nhánh", "branch", "vận hành", "cơ sở"]},
            {"id": "staff-management", "label": "Staff Leadership & Workplace Conduct", "keywords": ["lãnh đạo", "nhân sự", "ứng xử", "quản lý"]},
            {"id": "facility-compliance", "label": "Facility & Asset Protection", "keywords": ["tài sản", "tuân thủ", "an ninh", "bảo vệ"]},
        ],
    },
    "data-analyst": {
        "required_docs": ["DOC-11", "DOC-14"],
        "topics": [
            {"id": "data-governance", "label": "Data Governance & Privacy", "keywords": ["data", "dữ liệu", "quyền riêng tư", "phân tích"]},
            {"id": "analytics-reporting", "label": "BI & Operational Reporting", "keywords": ["báo cáo", "analytics", "chỉ số", "thống kê"]},
            {"id": "security-basics", "label": "System Security & Ethics", "keywords": ["đạo đức", "bảo mật", "an toàn"]},
        ],
    },
    "team-leader": {
        "required_docs": ["DOC-11", "DOC-14"],
        "topics": [
            {"id": "tech-leadership", "label": "Engineering Leadership & Agile", "keywords": ["lead", "sprint", "quản lý", "tiến độ", "trưởng nhóm"]},
            {"id": "deployment-standards", "label": "Release & Deployment Standards", "keywords": ["deployment", "bàn giao", "chất lượng", "quy chuẩn"]},
            {"id": "team-culture", "label": "Team Culture & Conflict Resolution", "keywords": ["văn hóa", "ứng xử", "giải quyết xung đột", "đội ngũ"]},
        ],
    },
}


def calculate_role_coverage(
    role_id: str,
    stages: list[dict],
    source_codes: list[str],
) -> dict[str, Any]:
    """Calculate Mandatory Requirement Coverage Score (Pipeline 2).

    Autonomous Python Ground Truth validation:
    - 40% weight on Mandatory Document Prerequisites
    - 60% weight on Core Role Topics Covered in Learning Modules
    - Passing threshold: 85%
    """
    matrix = ROLE_REQUIREMENT_MATRIX.get(role_id)
    if not matrix:
        return {
            "score": 1.0,
            "requiredDocs": [],
            "topics": [{"id": "general", "label": "General Knowledge", "covered": True, "matchedKeyword": "general"}],
            "missingRequirementsCount": 0,
            "prerequisitesMet": True,
            "ruleEngine": "Pipeline 2 (Python Ground Truth)",
        }

    # 1. Check Required Documents Coverage
    required_docs_status = []
    covered_docs_count = 0
    upper_sources = {c.upper().strip() for c in source_codes}
    for doc_code in matrix["required_docs"]:
        is_cov = (doc_code.upper() in upper_sources)
        if is_cov:
            covered_docs_count += 1
        required_docs_status.append({"code": doc_code, "covered": is_cov})

    docs_ratio = (covered_docs_count / len(matrix["required_docs"])) if matrix["required_docs"] else 1.0

    # 2. Check Topic Coverage across all stages/modules/tasks
    all_text_fragments: list[str] = []
    for stage in stages:
        if isinstance(stage, dict):
            for mod in stage.get("modules", []):
                all_text_fragments.append(str(mod.get("title", "")).lower())
                all_text_fragments.append(str(mod.get("description", "")).lower())
                for task in mod.get("tasks", []):
                    all_text_fragments.append(str(task.get("title", "")).lower())
                for q in mod.get("quiz", []):
                    all_text_fragments.append(str(q.get("question", "")).lower())
                for lesson in mod.get("lessons", []):
                    all_text_fragments.append(str(lesson.get("title", "")).lower())

    corpus = " ".join(all_text_fragments)

    topics_status = []
    covered_topics_count = 0
    for topic_item in matrix["topics"]:
        matched_kw = None
        for kw in topic_item["keywords"]:
            if kw.lower() in corpus:
                matched_kw = kw
                break

        is_covered = (matched_kw is not None)
        if is_covered:
            covered_topics_count += 1

        topics_status.append({
            "id": topic_item["id"],
            "label": topic_item["label"],
            "covered": is_covered,
            "matchedKeyword": matched_kw,
        })

    topics_ratio = (covered_topics_count / len(matrix["topics"])) if matrix["topics"] else 1.0

    # Calculate final score: 40% document coverage + 60% topic coverage
    raw_score = 0.4 * docs_ratio + 0.6 * topics_ratio
    final_score = round(raw_score, 2) if all_text_fragments else 0.0

    missing_docs = len(matrix["required_docs"]) - covered_docs_count
    missing_topics = len(matrix["topics"]) - covered_topics_count

    return {
        "score": final_score,
        "requiredDocs": required_docs_status,
        "topics": topics_status,
        "missingRequirementsCount": max(0, missing_docs + missing_topics),
        "prerequisitesMet": missing_docs == 0,
        "ruleEngine": "Pipeline 2 (Python Ground Truth)",
    }

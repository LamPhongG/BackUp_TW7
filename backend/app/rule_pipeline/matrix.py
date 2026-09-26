"""Dữ liệu Role Requirement Matrix soạn tay: chủ đề năng lực + từ khóa cho 10 job position (SRS
Step 2 & 7). Đây chỉ là DỮ LIỆU THAM CHIẾU — được `coverage.py::keyword_topics()` dùng để làm giàu
trường `matchedKeyword` khi role đã biết. Coverage Score thật (`score`, `requiredDocs`) vẫn tính
động từ tài liệu đang có trong DB (`coverage.py::required_documents()`), không dựa vào dict tĩnh ở
đây, để không "mù" trước role mới (SRS "Hidden Role") — dict này không bao giờ bao phủ hết mọi role
evaluator có thể thêm vào.
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

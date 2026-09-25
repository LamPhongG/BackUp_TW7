"""The company's expected document list (frontend `data/company.js` DOCUMENT_CATALOG).

Used to derive a document's `family` (versions of the same document share it) and its Vietnamese title.
"""
import re
import unicodedata
from dataclasses import dataclass

CATEGORIES = ("Handbook", "Policy", "SOP", "Process Manual", "Role Description", "FAQ", "Compliance", "Test Case")


@dataclass(frozen=True)
class CatalogEntry:
    code: str
    family: str
    title: str
    title_en: str
    category: str
    department: str


CATALOG = {e.code: e for e in [
    CatalogEntry("DOC-01", "employee-handbook", "Sổ tay nhân viên", "Employee Handbook", "Handbook", "Company-wide"),
    CatalogEntry("DOC-02", "employee-handbook", "Sổ tay nhân viên (bản cũ)", "Employee Handbook (obsolete)", "Handbook", "Company-wide"),
    CatalogEntry("DOC-03", "hr-leave-policy", "Chính sách nghỉ phép, nghỉ ốm, thai sản", "HR Leave Policy", "Policy", "Human Resources"),
    CatalogEntry("DOC-04", "workplace-conduct-policy", "Quy tắc ứng xử công sở", "Workplace Conduct Policy", "Policy", "Company-wide"),
    CatalogEntry("DOC-05", "data-privacy-policy", "Chính sách bảo mật dữ liệu cá nhân", "Data Privacy Policy", "Policy", "Company-wide"),
    CatalogEntry("DOC-06", "information-security-policy", "Chính sách an toàn thông tin & mật khẩu", "Information Security Policy", "Policy", "Company-wide"),
    CatalogEntry("DOC-07", "sop-customer-escalation", "Quy trình xử lý khiếu nại & leo thang sự cố", "SOP – Customer Escalation Process", "SOP", "Customer Support"),
    CatalogEntry("DOC-08", "sop-sales-pipeline", "Quy trình quản lý phễu bán hàng", "SOP – Sales Pipeline Management", "SOP", "Sales"),
    CatalogEntry("DOC-09", "sop-financial-reimbursement", "Quy trình hoàn tiền, thanh toán chi phí", "SOP – Financial Reimbursement", "SOP", "Finance"),
    CatalogEntry("DOC-10", "sop-software-deployment", "Quy trình bàn giao phần mềm cho khách hàng", "SOP – Software Deployment Workflow", "SOP", "Engineering"),
    CatalogEntry("DOC-11", "sop-employee-onboarding", "Quy trình hội nhập nhân sự chuẩn", "SOP – Employee Onboarding Process", "SOP", "Human Resources"),
    CatalogEntry("DOC-12", "branch-operations-manual", "Sổ tay vận hành chi nhánh", "Branch Management Operations Manual", "Process Manual", "Branch Management"),
    CatalogEntry("DOC-13", "jd-sales-marketing", "Mô tả công việc khối Kinh doanh & Marketing", "Job Descriptions – Sales & Marketing", "Role Description", "Sales"),
    CatalogEntry("DOC-14", "jd-engineering-support", "Mô tả công việc khối Kỹ thuật & Hỗ trợ", "Job Descriptions – Engineering & Support", "Role Description", "Engineering"),
    CatalogEntry("DOC-15", "jd-hr-finance", "Mô tả công việc khối Nhân sự & Tài chính", "HR & Finance Role Descriptions", "Role Description", "Human Resources"),
    CatalogEntry("DOC-16", "general-faqs", "Câu hỏi thường gặp về phúc lợi", "General Company FAQs", "FAQ", "Company-wide"),
    CatalogEntry("DOC-17", "conflicting-policy-sample", "Mẫu quy định xung đột (test Contradiction)", "Conflicting Policy Sample", "Test Case", "Company-wide"),
    CatalogEntry("DOC-18", "adversarial-prompt-injection", "Tài liệu tấn công Prompt Injection (test)", "Adversarial Prompt Injection Test", "Test Case", "Company-wide"),
    CatalogEntry("DOC-19", "outdated-compliance-rules", "Quy định tuân thủ cũ (đã bị thay thế)", "Outdated Compliance Rules", "Compliance", "Company-wide"),
    CatalogEntry("DOC-20", "department-exceptions", "Ngoại lệ đặc thù theo phòng ban", "Department-Specific Exceptions", "Policy", "Company-wide"),
]}


def _slugify(text: str) -> str:
    text = re.sub(r"\bobsolete\b", "", text.lower())
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def family_of(code: str, title_en: str) -> str:
    """Catalog family when the code is known, otherwise a slug of the English title."""
    entry = CATALOG.get(code)
    return entry.family if entry else _slugify(title_en)


def vietnamese_title(code: str, title_en: str) -> str:
    entry = CATALOG.get(code)
    if entry is None:
        return title_en
    # The "(bản cũ)" marker belongs to the catalog listing, not to the document itself.
    return re.sub(r"\s*\(bản cũ\)$", "", entry.title)

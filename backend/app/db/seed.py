"""Reference data and demo accounts. Idempotent: re-running updates rows instead of duplicating them.

Run from `backend/`:  python -m app.db.seed
Values mirror frontend/src/data/company.js and the demo logins in frontend/src/hooks/useAuth.js.
"""
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import BACKEND_DIR
from app.core.security import hash_password
from app.db.base import new_id
from app.db.session import SessionLocal
from app.models import Department, JobPosition, PathLevel, TrainingStatus, User, UserRole
from app.services.role_matrix import ImportReport, import_csv

DEPARTMENTS = [
    ("Company-wide", "Toàn công ty"),
    ("Sales", "Kinh doanh"),
    ("Customer Support", "Chăm sóc khách hàng"),
    ("Human Resources", "Nhân sự"),
    ("Finance", "Tài chính - Kế toán"),
    ("Operations", "Vận hành"),
    ("Marketing", "Marketing"),
    ("Engineering", "Kỹ thuật"),
    ("Branch Management", "Quản lý chi nhánh"),
    ("Data", "Dữ liệu"),
]

JOB_POSITIONS = [
    ("sales-exec", "Nhân viên Kinh doanh phần mềm B2B", "Sales Executive", "Sales"),
    ("cs-exec", "Nhân viên Chăm sóc khách hàng", "Customer Support Executive", "Customer Support"),
    ("hr-exec", "Nhân viên Nhân sự / Tuyển dụng & Onboarding", "HR Executive", "Human Resources"),
    ("finance-associate", "Chuyên viên Tài chính - Kế toán", "Finance Associate", "Finance"),
    ("ops-coordinator", "Điều phối viên Vận hành hệ thống", "Operations Coordinator", "Operations"),
    ("marketing-exec", "Nhân viên Tiếp thị kỹ thuật số", "Marketing Executive", "Marketing"),
    ("support-engineer", "Kỹ sư Hỗ trợ Kỹ thuật phần mềm", "Software Support Engineer", "Engineering"),
    ("branch-manager", "Giám quản Chi nhánh", "Branch Manager", "Branch Management"),
    ("data-analyst", "Chuyên viên Phân tích dữ liệu doanh nghiệp", "Data Analyst", "Data"),
    ("team-leader", "Trưởng nhóm Kỹ thuật / Phát triển sản phẩm", "Team Leader / Tech Lead", "Engineering"),
]

# Demo password is public in the frontend source, so these accounts are for local/demo databases only.
DEMO_PASSWORD = "Demo@123"
DEMO_USERS = [
    {"email": "hr@fourangrybirds.vn", "name": "Jordan Lee", "user_role": UserRole.HR,
     "job_title": "HR Executive", "department_code": "Human Resources", "job_position_id": None},
    {"email": "reviewer@fourangrybirds.vn", "name": "Sarah Chen", "user_role": UserRole.REVIEWER,
     "job_title": "Onboarding Reviewer", "department_code": "Human Resources", "job_position_id": None},
    # Listed before Alex because she is his reporting manager.
    {"email": "minh.nguyen@fourangrybirds.vn", "name": "Minh Nguyen", "user_role": UserRole.EMPLOYEE,
     "job_title": None, "department_code": "Engineering", "job_position_id": "team-leader",
     "employee_code": "EMP-0007", "experience_level": PathLevel.ADVANCED, "location": "Ho Chi Minh City",
     "joining_date": date(2023, 3, 1), "competencies": ["Deployment sign-off", "Tier 2 escalation ownership"],
     "previous_experience": "6 years as backend engineer", "training_status": TrainingStatus.COMPLETED},
    {"email": "alex.morgan@fourangrybirds.vn", "name": "Alex Morgan", "user_role": UserRole.EMPLOYEE,
     "job_title": None, "department_code": "Engineering", "job_position_id": "support-engineer",
     "employee_code": "EMP-0142", "experience_level": PathLevel.INTERMEDIATE, "location": "Ho Chi Minh City",
     "joining_date": date(2026, 9, 21), "manager_email": "minh.nguyen@fourangrybirds.vn",
     "competencies": ["Pre-deployment checklist", "Customer handover"],
     "previous_experience": "2 years of IT helpdesk", "training_status": TrainingStatus.NOT_STARTED},
    # A new hire in Customer Support, so the SRS worked example (R001, DOC-07 §4.2) can be followed as an employee.
    {"email": "linh.tran@fourangrybirds.vn", "name": "Linh Tran", "user_role": UserRole.EMPLOYEE,
     "job_title": None, "department_code": "Customer Support", "job_position_id": "cs-exec",
     "employee_code": "EMP-0158", "experience_level": PathLevel.BEGINNER, "location": "Ho Chi Minh City",
     "joining_date": date(2026, 9, 28), "competencies": ["Tier 1 response", "Escalation judgment"],
     "previous_experience": "1 year in retail customer service", "training_status": TrainingStatus.NOT_STARTED},
]

ROLE_MATRIX_CSV = BACKEND_DIR.parent / "role_matrix" / "role_matrix.csv"


def seed_reference_data(db: Session) -> None:
    for code, name in DEPARTMENTS:
        db.merge(Department(code=code, name=name, name_en=code))
    db.flush()
    for pos_id, name, name_en, dept in JOB_POSITIONS:
        db.merge(JobPosition(id=pos_id, name=name, name_en=name_en, department_code=dept))
    db.flush()


def seed_demo_users(db: Session) -> None:
    password_hash = hash_password(DEMO_PASSWORD)
    for entry in DEMO_USERS:
        account = {k: v for k, v in entry.items() if k != "manager_email"}
        if entry.get("manager_email"):
            account["manager_id"] = db.scalar(select(User.id).where(User.email == entry["manager_email"]))
        user = db.scalar(select(User).where(User.email == account["email"]))
        if user is None:
            db.add(User(id=new_id("USR"), password_hash=password_hash, **account))
            db.flush()
            continue
        # Existing rows keep their id (audit logs point at it) but get the canonical profile back.
        for field, value in account.items():
            setattr(user, field, value)
        user.password_hash = password_hash
        user.is_active = True


def seed_role_matrix(db: Session) -> ImportReport | None:
    """Load the team's Role Requirement Matrix; rows already in the DB are updated, not duplicated."""
    if not ROLE_MATRIX_CSV.is_file():
        return None
    return import_csv(db, ROLE_MATRIX_CSV.read_text(encoding="utf-8"))


def run(db: Session) -> ImportReport | None:
    seed_reference_data(db)
    seed_demo_users(db)
    report = seed_role_matrix(db)
    db.commit()
    return report


if __name__ == "__main__":
    with SessionLocal() as session:
        matrix = run(session)
    print(f"Seeded {len(DEPARTMENTS)} departments, {len(JOB_POSITIONS)} job positions, {len(DEMO_USERS)} demo users.")
    if matrix:
        print(f"Role matrix: {matrix.created} created, {matrix.updated} updated, {len(matrix.errors)} errors")
        for error in matrix.errors:
            print("  ", error)

"""Reference data and demo accounts. Idempotent: re-running updates rows instead of duplicating them.

Run from `backend/`:  python -m app.db.seed
Values mirror frontend/src/data/company.js and the demo logins in frontend/src/hooks/useAuth.js.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import new_id
from app.db.session import SessionLocal
from app.models import Department, JobPosition, User, UserRole

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
    # Staff accounts
    {"email": "admin@fourangrybirds.vn", "name": "Alexandre Admin", "user_role": UserRole.ADMIN,
     "job_title": "System Administrator", "department_code": "Company-wide", "job_position_id": None},
    {"email": "hr@fourangrybirds.vn", "name": "Jordan Lee", "user_role": UserRole.HR,
     "job_title": "HR Executive", "department_code": "Human Resources", "job_position_id": None},
    {"email": "reviewer@fourangrybirds.vn", "name": "Sarah Chen", "user_role": UserRole.REVIEWER,
     "job_title": "Onboarding Reviewer", "department_code": "Human Resources", "job_position_id": None},

    # 10 Employee accounts covering all 10 Job Roles (SRS Step 2 & 7)
    {"email": "sales.emp@fourangrybirds.vn", "name": "David Nguyen", "user_role": UserRole.EMPLOYEE,
     "job_title": "Sales Executive", "department_code": "Sales", "job_position_id": "sales-exec"},
    {"email": "cs.emp@fourangrybirds.vn", "name": "Emily Tran", "user_role": UserRole.EMPLOYEE,
     "job_title": "Customer Support Executive", "department_code": "Customer Support", "job_position_id": "cs-exec"},
    {"email": "hr.emp@fourangrybirds.vn", "name": "Jessica Le", "user_role": UserRole.EMPLOYEE,
     "job_title": "HR Specialist", "department_code": "Human Resources", "job_position_id": "hr-exec"},
    {"email": "finance.emp@fourangrybirds.vn", "name": "Michael Pham", "user_role": UserRole.EMPLOYEE,
     "job_title": "Finance Associate", "department_code": "Finance", "job_position_id": "finance-associate"},
    {"email": "ops.emp@fourangrybirds.vn", "name": "Lucas Vo", "user_role": UserRole.EMPLOYEE,
     "job_title": "Operations Coordinator", "department_code": "Operations", "job_position_id": "ops-coordinator"},
    {"email": "marketing.emp@fourangrybirds.vn", "name": "Chloe Dang", "user_role": UserRole.EMPLOYEE,
     "job_title": "Marketing Executive", "department_code": "Marketing", "job_position_id": "marketing-exec"},
    {"email": "alex.morgan@fourangrybirds.vn", "name": "Alex Morgan", "user_role": UserRole.EMPLOYEE,
     "job_title": "Software Support Engineer", "department_code": "Engineering", "job_position_id": "support-engineer"},
    {"email": "branch.mgr@fourangrybirds.vn", "name": "Daniel Hoang", "user_role": UserRole.EMPLOYEE,
     "job_title": "Branch Manager", "department_code": "Branch Management", "job_position_id": "branch-manager"},
    {"email": "data.analyst@fourangrybirds.vn", "name": "Sophia Vu", "user_role": UserRole.EMPLOYEE,
     "job_title": "Data Analyst", "department_code": "Data", "job_position_id": "data-analyst"},
    {"email": "team.lead@fourangrybirds.vn", "name": "Marcus Le", "user_role": UserRole.EMPLOYEE,
     "job_title": "Team Leader / Tech Lead", "department_code": "Engineering", "job_position_id": "team-leader"},
]


def seed_reference_data(db: Session) -> None:
    for code, name in DEPARTMENTS:
        db.merge(Department(code=code, name=name, name_en=code))
    db.flush()
    for pos_id, name, name_en, dept in JOB_POSITIONS:
        db.merge(JobPosition(id=pos_id, name=name, name_en=name_en, department_code=dept))
    db.flush()


def seed_demo_users(db: Session) -> None:
    password_hash = hash_password(DEMO_PASSWORD)
    for account in DEMO_USERS:
        user = db.scalar(select(User).where(User.email == account["email"]))
        if user is None:
            db.add(User(id=new_id("USR"), password_hash=password_hash, **account))
            continue
        # Existing rows keep their id (audit logs point at it) but get the canonical profile back.
        for field, value in account.items():
            setattr(user, field, value)
        user.password_hash = password_hash
        user.is_active = True


def run(db: Session) -> None:
    seed_reference_data(db)
    seed_demo_users(db)
    db.commit()


if __name__ == "__main__":
    with SessionLocal() as session:
        run(session)
    print(f"Seeded {len(DEPARTMENTS)} departments, {len(JOB_POSITIONS)} job positions, {len(DEMO_USERS)} demo users.")

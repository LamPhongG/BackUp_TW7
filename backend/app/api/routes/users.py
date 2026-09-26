"""User management endpoints for Admin (SRS Section 1.6 & Step 51).

Supports full CRUD:
- Create new user accounts
- View users with role/department filtering and search
- Update user metadata
- Soft delete: deactivates account (is_active=False) preserving audit trail and database records
- Reactivate deactivated users
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession, require_roles
from app.core.security import hash_password
from app.db.base import new_id
from app.models import Department, JobPosition, User, UserRole
from app.schemas.auth import UserOut
from app.schemas.users import UserCreate, UserStatusResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["user management"])

AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.HR))]


@router.get("", response_model=list[UserOut])
def list_users(
    db: DbSession,
    user: CurrentUser,
    search: str | None = None,
    role: UserRole | None = None,
    department_code: str | None = None,
    is_active: bool | None = None,
):
    """List all user accounts with search and role/department filtering."""
    stmt = select(User).options(selectinload(User.job_position)).order_by(User.created_at.desc())

    if search:
        pattern = f"%{search.strip().lower()}%"
        stmt = stmt.where(or_(User.email.ilike(pattern), User.name.ilike(pattern)))
    if role:
        stmt = stmt.where(User.user_role == role)
    if department_code:
        stmt = stmt.where(User.department_code == department_code)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)

    users = db.scalars(stmt).all()
    return [UserOut.from_user(u) for u in users]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: DbSession,
    actor: AdminUser,
):
    """Create a new user account (Admin only)."""
    # Check if email exists
    existing = db.scalar(select(User).where(User.email == body.email.lower().strip()))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{body.email}' is already registered in the system.",
        )

    # Validate department if provided
    if body.department_code:
        dept = db.get(Department, body.department_code)
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Department code '{body.department_code}' does not exist.",
            )

    # Validate job position if provided
    if body.job_position_id:
        pos = db.get(JobPosition, body.job_position_id)
        if not pos:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Job position '{body.job_position_id}' does not exist.",
            )

    user = User(
        id=new_id("USR"),
        email=body.email.lower().strip(),
        name=body.name.strip(),
        password_hash=hash_password(body.password),
        user_role=body.user_role,
        job_title=body.job_title.strip() if body.job_title else None,
        department_code=body.department_code,
        job_position_id=body.job_position_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.from_user(user)


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: DbSession,
    user: CurrentUser,
):
    """Get single user profile by id."""
    target = db.scalar(
        select(User).options(selectinload(User.job_position)).where(User.id == user_id)
    )
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserOut.from_user(target)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    body: UserUpdate,
    db: DbSession,
    actor: AdminUser,
):
    """Update user information (Admin only)."""
    target = db.scalar(
        select(User).options(selectinload(User.job_position)).where(User.id == user_id)
    )
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if body.name is not None:
        target.name = body.name.strip()
    if body.user_role is not None:
        target.user_role = body.user_role
    if body.job_title is not None:
        target.job_title = body.job_title.strip() or None
    if body.department_code is not None:
        target.department_code = body.department_code or None
    if body.job_position_id is not None:
        target.job_position_id = body.job_position_id or None
    if body.password:
        target.password_hash = hash_password(body.password)

    db.commit()
    db.refresh(target)
    return UserOut.from_user(target)


@router.delete("/{user_id}", response_model=UserStatusResponse)
def soft_delete_user(
    user_id: str,
    db: DbSession,
    actor: AdminUser,
):
    """Soft delete user: deactivates account (is_active=False) preserving database records and audit history."""
    if actor.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    target = db.scalar(
        select(User).options(selectinload(User.job_position)).where(User.id == user_id)
    )
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target.is_active = False
    db.commit()
    db.refresh(target)
    return UserStatusResponse(
        success=True,
        message=f"Tài khoản {target.name} ({target.email}) đã được vô hiệu hóa an toàn trong database.",
        user=UserOut.from_user(target),
    )


@router.post("/{user_id}/restore", response_model=UserStatusResponse)
def restore_user(
    user_id: str,
    db: DbSession,
    actor: AdminUser,
):
    """Reactivate a previously deactivated user account."""
    target = db.scalar(
        select(User).options(selectinload(User.job_position)).where(User.id == user_id)
    )
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target.is_active = True
    db.commit()
    db.refresh(target)
    return UserStatusResponse(
        success=True,
        message=f"Tài khoản {target.name} ({target.email}) đã được kích hoạt lại thành công.",
        user=UserOut.from_user(target),
    )

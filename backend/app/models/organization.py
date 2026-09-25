"""Company structure and accounts: departments, job positions, users."""
from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, str_enum, utcnow
from app.models.enums import UserRole


class Department(Base):
    __tablename__ = "departments"

    # English name doubles as the key because the frontend already stores it that way ("Engineering").
    code: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    name_en: Mapped[str] = mapped_column(String(128))


class JobPosition(Base):
    __tablename__ = "job_positions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    name_en: Mapped[str] = mapped_column(String(160))
    department_code: Mapped[str] = mapped_column(ForeignKey("departments.code"))

    department: Mapped[Department] = relationship()


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    name: Mapped[str] = mapped_column(String(128))
    user_role: Mapped[UserRole] = mapped_column(str_enum(UserRole, "user_role"))
    # Display title for HR/Reviewer accounts; employees show their job position instead.
    job_title: Mapped[str | None] = mapped_column(String(128))
    department_code: Mapped[str | None] = mapped_column(ForeignKey("departments.code"))
    job_position_id: Mapped[str | None] = mapped_column(ForeignKey("job_positions.id"))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    job_position: Mapped[JobPosition | None] = relationship()

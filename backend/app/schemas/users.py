"""Schemas for User Management CRUD (Admin / System)."""
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole
from app.schemas.auth import UserOut


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=128)
    password: str = Field(default="Demo@123", min_length=6, max_length=128)
    user_role: UserRole = UserRole.EMPLOYEE
    job_title: str | None = None
    department_code: str | None = None
    job_position_id: str | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=128)
    user_role: UserRole | None = None
    job_title: str | None = None
    department_code: str | None = None
    job_position_id: str | None = None
    password: str | None = Field(default=None, min_length=6, max_length=128)


class UserStatusResponse(BaseModel):
    success: bool
    message: str
    user: UserOut

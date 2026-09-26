"""Login request/response and the current-user profile."""
from datetime import date

from pydantic import BaseModel, EmailStr, Field

from app.models import PathLevel, TrainingStatus, User, UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    user_role: UserRole
    # Job position name for employees, job title for HR / Reviewer (the frontend shows it under the name).
    title: str | None
    department_code: str | None
    job_position_id: str | None
    # Employee profile (SRS Step 9); empty for HR / Reviewer accounts.
    employee_code: str | None = None
    experience_level: PathLevel | None = None
    location: str | None = None
    joining_date: date | None = None
    manager_id: str | None = None
    manager_name: str | None = None
    competencies: list[str] = []
    previous_experience: str | None = None
    training_status: TrainingStatus | None = None
    is_active: bool = True

    @classmethod
    def from_user(cls, user: User) -> "UserOut":
        title = user.job_position.name_en if user.job_position else user.job_title
        return cls(
            id=user.id,
            email=user.email,
            name=user.name,
            user_role=user.user_role,
            title=title,
            department_code=user.department_code,
            job_position_id=user.job_position_id,
            employee_code=user.employee_code,
            experience_level=user.experience_level,
            location=user.location,
            joining_date=user.joining_date,
            manager_id=user.manager_id,
            manager_name=user.manager.name if user.manager else None,
            competencies=list(user.competencies or []),
            previous_experience=user.previous_experience,
            training_status=user.training_status,
            is_active=user.is_active,
        )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


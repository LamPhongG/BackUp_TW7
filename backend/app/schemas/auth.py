"""Login request/response and the current-user profile."""
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import User, UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    user_role: UserRole
    # Job position name for employees, job title for HR / Reviewer (the frontend shows it under the name).
    title: str | None
    department_code: str | None
    job_position_id: str | None

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
        )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut

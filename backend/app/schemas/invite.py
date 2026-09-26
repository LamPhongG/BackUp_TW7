"""Invitation links and employee self-registration."""
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import PathLevel
from app.models.invitation import InvitationToken


class InviteCreate(BaseModel):
    # Optional: without it HR copies the link and sends it themselves.
    invited_email: EmailStr | None = None
    job_position_id: str
    department_code: str
    expires_in_days: int = Field(default=7, ge=1, le=30)
    note: str | None = Field(default=None, max_length=500)


class InvitePublicOut(BaseModel):
    """What the registration page shows; the token itself is in the URL."""

    job_position_id: str
    job_position_name: str
    job_position_name_en: str
    department_code: str
    department_name: str
    department_name_en: str
    invited_email: str | None
    expires_at: datetime

    @classmethod
    def from_token(cls, inv: InvitationToken) -> "InvitePublicOut":
        return cls(
            job_position_id=inv.job_position_id,
            job_position_name=inv.job_position.name,
            job_position_name_en=inv.job_position.name_en,
            department_code=inv.department_code,
            department_name=inv.department.name,
            department_name_en=inv.department.name_en,
            invited_email=inv.invited_email,
            expires_at=inv.expires_at,
        )


class InviteOut(InvitePublicOut):
    token: str
    register_url: str
    used_at: datetime | None
    is_valid: bool
    note: str | None
    # False when HR gave an email but SMTP is not configured or rejected it; HR then sends the link by hand.
    email_sent: bool = False

    @classmethod
    def from_token(cls, inv: InvitationToken, frontend_url: str, email_sent: bool = False) -> "InviteOut":
        return cls(
            **InvitePublicOut.from_token(inv).model_dump(),
            token=inv.token,
            register_url=f"{frontend_url}/register/{inv.token}",
            used_at=inv.used_at,
            is_valid=inv.is_valid,
            note=inv.note,
            email_sent=email_sent,
        )


class SelfRegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    experience_level: PathLevel = PathLevel.BEGINNER
    previous_experience: str | None = Field(default=None, max_length=2000)
    location: str | None = Field(default=None, max_length=64)
    joining_date: date | None = None

    @field_validator("password")
    @classmethod
    def fits_bcrypt(cls, value: str) -> str:
        # The limit is 72 bytes, not characters: 72 Vietnamese letters can be twice that in UTF-8.
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return value


class SelfRegisterResponse(BaseModel):
    email: str
    name: str

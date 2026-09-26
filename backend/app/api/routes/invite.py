"""Invitation links: HR creates and revokes them; a new employee opens one and registers."""
import secrets
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select

from app.api.deps import DbSession, require_roles
from app.core import email
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.security import hash_password
from app.db.base import new_id, utcnow
from app.models import Department, JobPosition, User, UserRole
from app.models.invitation import InvitationToken
from app.schemas.invite import InviteCreate, InviteOut, InvitePublicOut, SelfRegisterRequest, SelfRegisterResponse
from app.services import enrollments

router = APIRouter(prefix="/invite", tags=["invite"])

HrUser = Annotated[User, Depends(require_roles(UserRole.HR))]


def _get_invite(db: DbSession, token: str) -> InvitationToken:
    invite = db.get(InvitationToken, token)
    if invite is None:
        raise AppError(404, "err_invite_not_found", "Invitation not found")
    return invite


def _get_valid_invite(db: DbSession, token: str) -> InvitationToken:
    invite = _get_invite(db, token)
    if not invite.is_valid:
        raise AppError(410, "err_invite_expired", "Invitation has expired or was already used")
    return invite


@router.post("", response_model=InviteOut, status_code=status.HTTP_201_CREATED)
def create_invite(body: InviteCreate, db: DbSession, hr: HrUser) -> InviteOut:
    position = db.get(JobPosition, body.job_position_id)
    if position is None:
        raise AppError(404, "err_job_position", "Unknown job position")
    if db.get(Department, body.department_code) is None:
        raise AppError(404, "err_department", "Unknown department")

    invite = InvitationToken(
        token=secrets.token_urlsafe(32),
        invited_email=body.invited_email,
        job_position_id=position.id,
        department_code=body.department_code,
        created_by=hr.id,
        expires_at=utcnow() + timedelta(days=body.expires_in_days),
        note=body.note,
    )
    db.add(invite)
    db.commit()

    frontend_url = get_settings().frontend_url
    sent = False
    if body.invited_email:
        sent = email.send_invitation(
            to_email=body.invited_email,
            register_url=f"{frontend_url}/register/{invite.token}",
            position_name=invite.job_position.name,
            department_name=invite.department.name,
            invited_by_name=hr.name,
            expires_days=body.expires_in_days,
        )
    return InviteOut.from_token(invite, frontend_url, email_sent=sent)


@router.get("", response_model=list[InviteOut])
def list_invites(db: DbSession, hr: HrUser) -> list[InviteOut]:
    frontend_url = get_settings().frontend_url
    rows = db.scalars(
        select(InvitationToken).where(InvitationToken.created_by == hr.id).order_by(InvitationToken.created_at.desc())
    )
    return [InviteOut.from_token(row, frontend_url) for row in rows]


@router.delete("/{token}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invite(token: str, db: DbSession, hr: HrUser) -> None:
    invite = _get_invite(db, token)
    if invite.created_by != hr.id:
        raise AppError(403, "err_forbidden", "Only the HR user who created the invitation can revoke it")
    if invite.used_at is None:
        invite.expires_at = utcnow()
        db.commit()


@router.get("/{token}", response_model=InvitePublicOut)
def get_invite(token: str, db: DbSession) -> InvitePublicOut:
    return InvitePublicOut.from_token(_get_valid_invite(db, token))


@router.post("/{token}/register", response_model=SelfRegisterResponse, status_code=status.HTTP_201_CREATED)
def register(token: str, body: SelfRegisterRequest, db: DbSession) -> SelfRegisterResponse:
    invite = _get_valid_invite(db, token)
    user_email = body.email.lower()
    if db.scalar(select(User.id).where(User.email == user_email)) is not None:
        raise AppError(409, "err_email_taken", "An account with this email already exists")

    user = User(
        id=new_id("USR"),
        email=user_email,
        password_hash=hash_password(body.password),
        name=body.name,
        user_role=UserRole.EMPLOYEE,
        job_position_id=invite.job_position_id,
        department_code=invite.department_code,
        experience_level=body.experience_level,
        previous_experience=body.previous_experience,
        location=body.location,
        joining_date=body.joining_date,
    )
    db.add(user)
    invite.used_at = utcnow()
    invite.registered_user_id = user.id
    db.flush()
    enrollments.assign_onboarding_to(db, user)
    db.commit()

    email.send_welcome(
        to_email=user_email,
        name=user.name,
        login_url=f"{get_settings().frontend_url}/login",
        position_name=invite.job_position.name,
    )
    return SelfRegisterResponse(email=user_email, name=user.name)

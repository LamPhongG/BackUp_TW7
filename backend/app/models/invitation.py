"""Invitation links: HR creates one, a new employee opens it and registers their own account."""
from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow
from app.models.organization import Department, JobPosition, User


class InvitationToken(Base):
    """One row per invitation; the token works once (`used_at` is set on registration)."""

    __tablename__ = "invitation_tokens"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    # Where HR sent the link; the employee may still register with another address.
    invited_email: Mapped[str | None] = mapped_column(String(254))
    job_position_id: Mapped[str] = mapped_column(ForeignKey("job_positions.id"))
    department_code: Mapped[str] = mapped_column(ForeignKey("departments.code"))
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    expires_at: Mapped[datetime]
    used_at: Mapped[datetime | None] = mapped_column(default=None)
    registered_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), default=None)
    note: Mapped[str | None] = mapped_column(String(500), default=None)

    job_position: Mapped[JobPosition] = relationship()
    department: Mapped[Department] = relationship()
    created_by_user: Mapped[User] = relationship(foreign_keys=[created_by])
    registered_user: Mapped[User | None] = relationship(foreign_keys=[registered_user_id])

    @property
    def is_valid(self) -> bool:
        return self.used_at is None and utcnow() < self.expires_at

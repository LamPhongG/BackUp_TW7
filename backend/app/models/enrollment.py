"""Employee progress on published learning paths."""
from datetime import datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow


class Enrollment(Base):
    """Progress of one employee on one path.

    Lesson and task ids point into `LearningPath.stages`; published paths are read-only, so those ids
    stay stable for as long as anyone can study the path.
    """

    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "path_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    path_id: Mapped[str] = mapped_column(ForeignKey("learning_paths.id", ondelete="CASCADE"), index=True)
    lessons_read: Mapped[list] = mapped_column(default=list)
    tasks_done: Mapped[list] = mapped_column(default=list)
    started_at: Mapped[datetime] = mapped_column(default=utcnow)
    completed_at: Mapped[datetime | None]

    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True, order_by="QuizAttempt.submitted_at"
    )


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    enrollment_id: Mapped[int] = mapped_column(ForeignKey("enrollments.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[str] = mapped_column(String(64))
    # {question_id: chosen option index}
    answers: Mapped[dict]
    score: Mapped[int]
    total: Mapped[int]
    submitted_at: Mapped[datetime] = mapped_column(default=utcnow)

"""ORM models. Importing this package registers every table on `Base.metadata` (Alembic relies on it)."""
from app.models.audit import AuditLog
from app.models.document import Document, DocumentChunk, InjectionFlag
from app.models.enrollment import Enrollment, QuizAttempt
from app.models.enums import FinalStatus, PathLevel, PathPurpose, PathStatus, ProcessingStatus, UserRole
from app.models.learning_path import LearningPath, PathAssignment, PathComment, PathSource
from app.models.organization import Department, JobPosition, User

__all__ = [
    "AuditLog",
    "Department",
    "Document",
    "DocumentChunk",
    "Enrollment",
    "FinalStatus",
    "InjectionFlag",
    "JobPosition",
    "LearningPath",
    "PathAssignment",
    "PathComment",
    "PathLevel",
    "PathPurpose",
    "PathSource",
    "PathStatus",
    "ProcessingStatus",
    "QuizAttempt",
    "User",
    "UserRole",
]

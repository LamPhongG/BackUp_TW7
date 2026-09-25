"""Enum values shared by the ORM, the API schemas and the frontend (keep the strings in sync)."""
from enum import StrEnum


class UserRole(StrEnum):
    HR = "hr"
    REVIEWER = "reviewer"
    EMPLOYEE = "employee"


class ProcessingStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class PathStatus(StrEnum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    CHANGES_REQUESTED = "changes_requested"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class PathPurpose(StrEnum):
    ONBOARDING = "onboarding"
    PROMOTION = "promotion"


class PathLevel(StrEnum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class FinalStatus(StrEnum):
    """Verification verdict (`final_status` in frontend `utils/pathChecks.js`)."""

    VERIFIED = "verified"
    VERIFIED_WARNING = "verified_warning"
    MANUAL_REVIEW = "manual_review"

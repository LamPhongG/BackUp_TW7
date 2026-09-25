"""Learning-path lifecycle and who may do what (server copy of frontend `utils/pathWorkflow.js`).

    HR creates ─► draft ─(HR submits)─► in_review ─(Reviewer approves)─► published ─► archived
                    ▲                        │
                    └── changes_requested ◄──┘ (Reviewer requests changes with a comment)

HR edits content in draft / changes_requested; Reviewers edit directly while in_review.
Published content is read-only: to change it, archive and create a new path.
"""
from app.core.errors import AppError
from app.models import LearningPath, PathPurpose, PathStatus, User, UserRole

_S = PathStatus
ACTIONS: dict[UserRole, dict[str, tuple[PathStatus, ...]]] = {
    UserRole.HR: {
        "edit": (_S.DRAFT, _S.CHANGES_REQUESTED),
        "regenerate": (_S.DRAFT, _S.CHANGES_REQUESTED),
        "submit": (_S.DRAFT, _S.CHANGES_REQUESTED),
        "delete": (_S.DRAFT,),
        "archive": (_S.PUBLISHED,),
        "comment": (_S.DRAFT, _S.IN_REVIEW, _S.CHANGES_REQUESTED, _S.PUBLISHED),
    },
    UserRole.REVIEWER: {
        "edit": (_S.IN_REVIEW,),
        "request_changes": (_S.IN_REVIEW,),
        "approve": (_S.IN_REVIEW,),
        "archive": (_S.PUBLISHED,),
        "comment": (_S.IN_REVIEW, _S.CHANGES_REQUESTED, _S.PUBLISHED),
    },
}

STAGE_KEYS: dict[PathPurpose, tuple[str, ...]] = {
    PathPurpose.ONBOARDING: ("day1", "week1", "week2", "day30", "day60", "day90"),
    PathPurpose.PROMOTION: ("foundation", "deep", "practice", "assessment"),
}


def allowed_actions(user: User, path: LearningPath) -> list[str]:
    return [action for action, statuses in ACTIONS.get(user.user_role, {}).items() if path.status in statuses]


def ensure_allowed(user: User, action: str, path: LearningPath) -> None:
    """Raises 403 when the role never has this action, 409 when only the current status forbids it."""
    statuses = ACTIONS.get(user.user_role, {}).get(action)
    if statuses is None:
        raise AppError(403, "err_action_not_allowed", f"Role {user.user_role.value} cannot {action} learning paths")
    if path.status not in statuses:
        raise AppError(409, "err_action_not_allowed", f"Cannot {action} a path in status {path.status.value}",
                       action=action, status=path.status.value)


def check_stage_keys(purpose: PathPurpose, stage_keys: list[str]) -> None:
    allowed = STAGE_KEYS[purpose]
    unknown = [k for k in stage_keys if k not in allowed]
    if unknown:
        raise AppError(422, "err_stage_key", f"Unknown stage for {purpose.value}: {', '.join(unknown)}",
                       allowed=", ".join(allowed))

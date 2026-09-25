"""Who can see which learning paths and documents. One place, so list and detail endpoints agree."""
from sqlalchemy import ColumnElement, and_, exists, false, or_, select, true

from app.models import Document, LearningPath, PathAssignment, PathSource, PathStatus, User, UserRole

COMPANY_WIDE = "Company-wide"
# Test documents (injection / contradiction samples) exist for QA, not for employees to read.
HIDDEN_FROM_EMPLOYEES = ("Test Case",)


def path_filter(user: User) -> ColumnElement[bool]:
    """HR sees every path, Reviewers everything past draft, employees only paths published to them."""
    if user.user_role is UserRole.HR:
        return true()
    if user.user_role is UserRole.REVIEWER:
        return LearningPath.status != PathStatus.DRAFT
    if user.user_role is UserRole.EMPLOYEE:
        targets = [PathAssignment.department_code.in_([COMPANY_WIDE, user.department_code])]
        if user.job_position_id:
            targets.append(PathAssignment.job_position_id == user.job_position_id)
        assigned = exists().where(PathAssignment.path_id == LearningPath.id, or_(*targets))
        return and_(LearningPath.status == PathStatus.PUBLISHED, assigned)
    return false()


def document_filter(user: User) -> ColumnElement[bool]:
    """Employees see company-wide documents, their department's, and sources of paths assigned to them."""
    if user.user_role in (UserRole.HR, UserRole.REVIEWER):
        return true()
    if user.user_role is UserRole.EMPLOYEE:
        sources_of_my_paths = (
            select(PathSource.document_id)
            .join(LearningPath, LearningPath.id == PathSource.path_id)
            .where(path_filter(user), PathSource.document_id.is_not(None))
        )
        return and_(
            Document.category.not_in(HIDDEN_FROM_EMPLOYEES),
            or_(Document.department_code.in_([COMPANY_WIDE, user.department_code]), Document.id.in_(sources_of_my_paths)),
        )
    return false()

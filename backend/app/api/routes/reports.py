from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from app.api.deps import get_current_user
from app.models import User, UserRole
from app.services import reports as reports_service
from app.db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()

def require_reporting_access(user: User = Depends(get_current_user)):
    if user.user_role not in (UserRole.HR, UserRole.REVIEWER, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

@router.get("/role-coverage")
def get_role_coverage(db: Session = Depends(get_db), _: User = Depends(require_reporting_access)) -> Any:
    return reports_service.get_role_coverage(db)

@router.get("/quiz-analytics")
def get_quiz_analytics(db: Session = Depends(get_db), _: User = Depends(require_reporting_access)) -> Any:
    return reports_service.get_quiz_analytics(db)

@router.get("/documents")
def get_documents_report(db: Session = Depends(get_db), _: User = Depends(require_reporting_access)) -> Any:
    return reports_service.get_documents_report(db)

@router.get("/alerts")
def get_alerts_report(db: Session = Depends(get_db), _: User = Depends(require_reporting_access)) -> Any:
    return reports_service.get_alerts_report(db)

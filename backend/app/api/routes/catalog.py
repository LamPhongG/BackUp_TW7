from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import Department, JobPosition
from app.schemas.catalog import DepartmentOut, JobPositionOut

router = APIRouter(tags=["catalog"])


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: DbSession, _user: CurrentUser):
    return db.scalars(select(Department).order_by(Department.code)).all()


@router.get("/job-positions", response_model=list[JobPositionOut])
def list_job_positions(db: DbSession, _user: CurrentUser):
    return db.scalars(select(JobPosition).order_by(JobPosition.department_code, JobPosition.id)).all()

"""Schema-level guarantees: migrations match the models, constraints hold, seeding is repeatable."""
import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, StatementError

from app.db import seed
from app.db.base import Base, new_id
from app.db.session import engine
from app.models import AuditLog, Department, JobPosition, LearningPath, PathAssignment, PathStatus, User


def test_migrations_match_models():
    """Fails when a model changes without a new Alembic revision."""
    with engine.connect() as conn:
        ctx = MigrationContext.configure(conn, opts={"compare_type": True, "render_as_batch": True})
        diff = compare_metadata(ctx, Base.metadata)
    assert diff == []


def test_seed_is_idempotent(db):
    user_ids = set(db.scalars(select(User.id)))

    seed.run(db)

    assert db.scalar(select(func.count()).select_from(Department)) == len(seed.DEPARTMENTS)
    assert db.scalar(select(func.count()).select_from(JobPosition)) == len(seed.JOB_POSITIONS)
    assert set(db.scalars(select(User.id))) == user_ids


def test_passwords_are_hashed(db):
    for user in db.scalars(select(User)):
        assert user.password_hash.startswith("$2")
        assert seed.DEMO_PASSWORD not in user.password_hash


def _hr_user(db) -> User:
    return db.scalar(select(User).where(User.email == "hr@fourangrybirds.vn"))


def _path(db, **overrides) -> LearningPath:
    values = {
        "id": new_id("LP"),
        "title": "Hội nhập — Kỹ sư Hỗ trợ",
        "title_en": "Onboarding — Software Support Engineer",
        "purpose": "onboarding",
        "level": "Intermediate",
        "target_job_position_id": "support-engineer",
        "target_department_code": "Engineering",
        "prompt_version": "v1.0",
        "engine": "local-draft",
        "created_by_id": _hr_user(db).id,
    } | overrides
    return LearningPath(**values)


def test_learning_path_defaults_and_json_roundtrip(db):
    stages = [{"key": "day1", "modules": [{"id": "M1", "lessons": [{"id": "L1", "title": "Chào mừng"}]}]}]
    path = _path(db, stages=stages)
    db.add(path)
    db.commit()
    db.expire_all()

    stored = db.get(LearningPath, path.id)
    assert stored.status is PathStatus.DRAFT
    assert stored.revision == 1
    assert stored.stages == stages
    assert stored.excluded_chunks == []
    db.delete(stored)
    db.commit()


def test_unknown_enum_value_is_rejected(db):
    db.add(_path(db, status="deleted"))
    with pytest.raises((StatementError, LookupError)):
        db.flush()
    db.rollback()


def test_assignment_needs_a_target(db):
    path = _path(db)
    db.add(path)
    db.flush()
    db.add(PathAssignment(path_id=path.id))
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()


def test_foreign_keys_are_enforced_on_sqlite(db):
    db.add(_path(db, target_job_position_id="no-such-position"))
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()


def test_audit_log_survives_path_deletion(db):
    user = _hr_user(db)
    path = _path(db)
    db.add(path)
    db.flush()
    log = AuditLog(
        id=new_id("LOG"), actor_id=user.id, actor_name=user.name, actor_role=user.user_role,
        action="delete", path_id=path.id, path_title=path.title_en, status_before=PathStatus.DRAFT,
    )
    db.add(log)
    db.delete(path)
    db.commit()

    assert db.get(AuditLog, log.id).path_id == path.id

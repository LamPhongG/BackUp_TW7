"""Departments, job positions and the Role Requirement Matrix."""
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import Priority


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    name_en: str


class DepartmentCreate(BaseModel):
    code: str = Field(min_length=2, max_length=64)
    name: str = Field(min_length=1, max_length=128)
    name_en: str = Field(min_length=1, max_length=128)


class JobPositionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    name_en: str
    department_code: str
    requirement_count: int = 0
    mandatory_count: int = 0


class JobPositionCreate(BaseModel):
    # Optional: derived from name_en ("DevOps Engineer" → "devops-engineer") when omitted.
    id: str | None = Field(default=None, max_length=64)
    name: str = Field(min_length=1, max_length=160)
    name_en: str = Field(min_length=1, max_length=160)
    department_code: str

    @field_validator("id")
    @classmethod
    def slug(cls, value: str | None) -> str | None:
        if value is not None and not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", value):
            raise ValueError("id must be lowercase words joined by '-', e.g. devops-engineer")
        return value


class JobPositionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    name_en: str | None = Field(default=None, min_length=1, max_length=160)
    department_code: str | None = None


class RequirementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_position_id: str
    policy_requirement: str | None
    process_requirement: str | None
    competency: str | None
    mandatory: bool
    priority: Priority
    source_doc_code: str | None
    source_section: str | None
    assessment_requirement: str | None


class RequirementIn(BaseModel):
    job_position_id: str
    policy_requirement: str | None = Field(default=None, max_length=2000)
    process_requirement: str | None = Field(default=None, max_length=2000)
    competency: str | None = Field(default=None, max_length=255)
    mandatory: bool = True
    priority: Priority = Priority.MEDIUM
    source_doc_code: str | None = Field(default=None, pattern=r"^DOC-\d{2,}$")
    source_section: str | None = Field(default=None, pattern=r"^\d+(\.\d+)*$")
    assessment_requirement: str | None = Field(default=None, max_length=2000)


class RequirementCreate(RequirementIn):
    # Optional: next free R### when omitted.
    id: str | None = Field(default=None, pattern=r"^R\d{3,}$")


class MatrixImportOut(BaseModel):
    created: int
    updated: int
    errors: list[str]


class SourceDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    version: str
    title: str
    title_en: str
    processing_status: str


class RequiredSourceOut(BaseModel):
    """A document the Role Requirement Matrix cites for a position (SRS Step 10 and 28).

    `mandatory` documents must be among the sources of the position's learning path.
    """

    code: str
    mandatory: bool
    # ready: the version in force is processed and selectable; not_ready: it is still processing or failed;
    # missing: no version of the document is in force in the repository.
    status: Literal["ready", "not_ready", "missing"]
    document: SourceDocumentOut | None
    requirement_ids: list[str]
    mandatory_requirement_ids: list[str]
    # Rows written against an older version than the one in force; their wording must be re-checked.
    outdated_requirement_ids: list[str]

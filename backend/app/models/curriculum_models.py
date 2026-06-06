from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Course(SQLModel, table=True):
    __tablename__ = "curriculum_courses"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    workload: int
    modality: str
    status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CurriculumUnit(SQLModel, table=True):
    __tablename__ = "curriculum_units"
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="curriculum_courses.id")
    name: str
    description: str
    workload: int
    semester: int
    status: str

class Competency(SQLModel, table=True):
    __tablename__ = "curriculum_competencies"
    id: Optional[int] = Field(default=None, primary_key=True)
    unit_id: int = Field(foreign_key="curriculum_units.id")
    code: str
    description: str
    category: str
    weight: float

class Skill(SQLModel, table=True):
    __tablename__ = "curriculum_skills"
    id: Optional[int] = Field(default=None, primary_key=True)
    competency_id: int = Field(foreign_key="curriculum_competencies.id")
    description: str
    level: str

class LearningObjective(SQLModel, table=True):
    __tablename__ = "curriculum_learning_objectives"
    id: Optional[int] = Field(default=None, primary_key=True)
    competency_id: int = Field(foreign_key="curriculum_competencies.id")
    description: str

class EvaluationCriterion(SQLModel, table=True):
    __tablename__ = "curriculum_evaluation_criteria"
    id: Optional[int] = Field(default=None, primary_key=True)
    competency_id: int = Field(foreign_key="curriculum_competencies.id")
    description: str
    weight: float

class TeachingPlan(SQLModel, table=True):
    __tablename__ = "curriculum_teaching_plans"
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="curriculum_courses.id")
    unit_id: int = Field(foreign_key="curriculum_units.id")
    title: str
    status: str

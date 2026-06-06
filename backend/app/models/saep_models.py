from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class CompetencyMatrix(SQLModel, table=True):
    __tablename__ = "competency_matrices"
    id: Optional[int] = Field(default=None, primary_key=True)
    course_name: str
    unit_name: str
    competency_code: str
    competency_description: str
    weight: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LearningEvidence(SQLModel, table=True):
    __tablename__ = "learning_evidences"
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id")
    activity_id: int = Field(foreign_key="activities.id")
    competency_id: int = Field(foreign_key="competency_matrices.id")
    score: float
    evidence_type: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SAEPIndicator(SQLModel, table=True):
    __tablename__ = "saep_indicators"
    id: Optional[int] = Field(default=None, primary_key=True)
    competency_id: int = Field(foreign_key="competency_matrices.id")
    class_id: int = Field(foreign_key="classrooms.id")
    indicator_value: float
    status: str # VERDE, AMARELO, VERMELHO
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ActionPlan(SQLModel, table=True):
    __tablename__ = "action_plans"
    id: Optional[int] = Field(default=None, primary_key=True)
    class_id: int = Field(foreign_key="classrooms.id")
    competency_id: int = Field(foreign_key="competency_matrices.id")
    title: str
    description: str
    priority: str
    status: str

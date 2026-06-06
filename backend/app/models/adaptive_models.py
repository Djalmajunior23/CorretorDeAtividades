from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class LearningPath(SQLModel, table=True):
    __tablename__ = "learning_paths"
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id")
    title: str
    status: str = "ACTIVE" # ACTIVE, COMPLETED, CANCELLED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LearningPathStep(SQLModel, table=True):
    __tablename__ = "learning_path_steps"
    id: Optional[int] = Field(default=None, primary_key=True)
    path_id: int = Field(foreign_key="learning_paths.id")
    competency_id: int # Assuming an external or simple competency ID for now
    step_order: int
    title: str
    difficulty: str
    completed: bool = False

class RecoveryCycle(SQLModel, table=True):
    __tablename__ = "recovery_cycles"
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id")
    competency_id: int
    initial_score: float
    current_score: float
    improvement_percentage: float
    status: str # IN_PROGRESS, RECOVERY_SUCCESS, RECOVERY_ALERT, LEARNING_STAGNATION

class CompetencyEvolution(SQLModel, table=True):
    __tablename__ = "competency_evolutions"
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id")
    competency_id: int
    assessment_id: int # Link to submission or activity
    score: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LearningRecommendation(SQLModel, table=True):
    __tablename__ = "learning_recommendations"
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id")
    recommendation_type: str
    title: str
    description: str
    priority: str # LOW, MEDIUM, HIGH

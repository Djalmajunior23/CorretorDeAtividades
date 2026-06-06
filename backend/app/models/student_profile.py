from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class StudentLearningProfile(SQLModel, table=True):
    __tablename__ = "student_profiles"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id", unique=True)
    strong_points: str = "[]" # JSON list
    weak_points: str = "[]" # JSON list
    most_common_errors: str = "[]" # JSON list
    preferred_language: str = "python"
    last_updated: datetime = Field(default_factory=datetime.utcnow)

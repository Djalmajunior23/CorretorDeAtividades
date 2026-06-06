from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Activity(SQLModel, table=True):
    __tablename__ = "activities"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    expected_language: str
    rubric_id: Optional[int] = Field(default=None, foreign_key="rubrics.id")
    max_attempts: int = 3
    grading_policy: str = "BEST_ATTEMPT"
    allow_late_submission: bool = False
    status: str = "PUBLISHED"
    created_at: datetime = Field(default_factory=datetime.utcnow)

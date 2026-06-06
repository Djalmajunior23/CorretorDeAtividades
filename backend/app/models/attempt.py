from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Attempt(SQLModel, table=True):
    __tablename__ = "attempts"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id")
    activity_id: int = Field(foreign_key="activities.id")
    question_id: Optional[int] = Field(default=None, foreign_key="questions.id")
    submission_id: int = Field(foreign_key="submissions.id")
    correction_result_id: Optional[int] = Field(default=None, foreign_key="correction_results.id")
    attempt_number: int
    score: int
    status: str = "PENDING"
    created_at: datetime = Field(default_factory=datetime.utcnow)

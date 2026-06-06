from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class CorrectionResult(SQLModel, table=True):
    __tablename__ = "correction_results"

    id: Optional[int] = Field(default=None, primary_key=True)
    submission_id: Optional[int] = Field(default=None, foreign_key="submissions.id")
    syntax_score: int
    test_score: int
    quality_score: int
    final_score: int
    feedback: str # JSON string for complex feedback
    stdout: str
    stderr: str
    execution_time: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

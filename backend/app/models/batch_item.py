from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class BatchCorrectionItem(SQLModel, table=True):
    __tablename__ = "batch_correction_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="batch_correction_jobs.id")
    student_name: str
    student_email: str
    file_name: str
    file_type: str
    status: str = "PENDING"
    score: int = 0
    feedback: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

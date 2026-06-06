from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class BatchCorrectionJob(SQLModel, table=True):
    __tablename__ = "batch_correction_jobs"

    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="users.id")
    title: str
    status: str = "PENDING" # PENDING, PROCESSING, COMPLETED, FAILED
    total_files: int = 0
    processed_files: int = 0
    successful_corrections: int = 0
    failed_corrections: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None

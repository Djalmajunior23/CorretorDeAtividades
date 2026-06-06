from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class BatchCorrectionResult(SQLModel, table=True):
    __tablename__ = "batch_correction_results"

    id: Optional[int] = Field(default=None, primary_key=True)
    item_id: int = Field(foreign_key="batch_correction_items.id", unique=True)
    syntax_score: int = 0
    logic_score: int = 0
    quality_score: int = 0
    final_score: int = 0
    feedback: str = "{}" # JSON string
    execution_time: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

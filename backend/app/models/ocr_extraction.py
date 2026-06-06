from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class OCRExtraction(SQLModel, table=True):
    __tablename__ = "ocr_extractions"

    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: Optional[int] = Field(default=None, foreign_key="users.id")
    file_name: str = ""
    file_path: str = ""
    extracted_text: str = ""
    edited_text: Optional[str] = None
    status: str = "EXTRACTED" # EXTRACTED, CONFIRMED, FAILED
    created_at: datetime = Field(default_factory=datetime.utcnow)

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Classroom(SQLModel, table=True):
    __tablename__ = "classrooms"

    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="users.id")
    name: str
    description: str
    google_classroom_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

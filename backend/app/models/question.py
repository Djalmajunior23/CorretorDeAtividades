from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Question(SQLModel, table=True):
    __tablename__ = "questions"

    id: Optional[int] = Field(default=None, primary_key=True)
    activity_id: int = Field(foreign_key="activities.id")
    title: str
    description: str
    language: str
    difficulty: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Submission(SQLModel, table=True):
    __tablename__ = "submissions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    activity_id: int = Field(foreign_key="activities.id")
    question_id: Optional[int] = Field(default=None, foreign_key="questions.id")
    code_content: str
    language: str
    status: str = "PENDING"
    is_image: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

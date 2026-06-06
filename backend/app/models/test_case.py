from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class TestCase(SQLModel, table=True):
    __tablename__ = "test_cases"

    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="questions.id")
    input_data: str
    expected_output: str
    is_hidden: bool = False
    weight: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)

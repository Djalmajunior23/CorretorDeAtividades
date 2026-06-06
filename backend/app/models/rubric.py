from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Rubric(SQLModel, table=True):
    __tablename__ = "rubrics"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    syntax_weight: int
    tests_weight: int
    logic_weight: int
    quality_weight: int
    organization_weight: int
    comments_weight: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

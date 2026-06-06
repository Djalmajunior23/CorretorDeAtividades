from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class SimilarityReport(SQLModel, table=True):
    __tablename__ = "similarity_reports"
    id: Optional[int] = Field(default=None, primary_key=True)
    submission_a_id: int = Field(foreign_key="submissions.id")
    submission_b_id: int = Field(foreign_key="submissions.id")
    similarity_percentage: float
    risk_level: str # BAIXO, MEDIO, ALTO, CRITICO
    analysis_type: str # TEXT, AST, STRUCTURAL
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SimilaritySegment(SQLModel, table=True):
    __tablename__ = "similarity_segments"
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="similarity_reports.id")
    start_line_a: int
    end_line_a: int
    start_line_b: int
    end_line_b: int
    similarity_score: float

class PlagiarismCase(SQLModel, table=True):
    __tablename__ = "plagiarism_cases"
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="similarity_reports.id")
    status: str = "OPEN" # OPEN, UNDER_REVIEW, CONFIRMED, DISMISSED
    teacher_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class SimilarityReport(SQLModel, table=True):
    __tablename__ = "similarity_reports"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int
    activity_name: str
    analyzed_submissions: int = 0
    high_risk_cases: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SimilarityPair(SQLModel, table=True):
    __tablename__ = "similarity_pairs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="similarity_reports.id")
    student_a_name: str
    student_b_name: str
    similarity_score: float # 0 to 100
    risk_level: str # LOW, MEDIUM, ALTO, CRÍTICO
    status: str = "PENDING_REVIEW" # PENDING_REVIEW, FALSE_POSITIVE, CONFIRMED
    
class AcademicIntegrityCase(SQLModel, table=True):
    __tablename__ = "academic_integrity_cases"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    pair_id: int = Field(foreign_key="similarity_pairs.id")
    teacher_notes: str = ""
    resolution: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

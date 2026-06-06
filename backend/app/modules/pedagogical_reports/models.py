from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class PedagogicalReport(SQLModel, table=True):
    __tablename__ = "pedagogical_reports"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int
    class_name: str
    title: str
    average_score: float = 0.0
    critical_competencies: str = "" 
    recommendations: str = "" 
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    items: List["PedagogicalReportItem"] = Relationship(back_populates="report")
    insights: List["ClassLearningInsight"] = Relationship(back_populates="report")

class PedagogicalReportItem(SQLModel, table=True):
    __tablename__ = "pedagogical_report_items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="pedagogical_reports.id")
    student_name: str
    score: float
    risk_level: str # LOW, MEDIUM, HIGH
    common_errors: str = "" 
    
    report: Optional[PedagogicalReport] = Relationship(back_populates="items")

class ClassLearningInsight(SQLModel, table=True):
    __tablename__ = "class_learning_insights"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="pedagogical_reports.id")
    type: str # STRENGTH, WEAKNESS, SUGGESTION
    description: str
    
    report: Optional[PedagogicalReport] = Relationship(back_populates="insights")

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class LearningAnalyticsReport(SQLModel, table=True):
    __tablename__ = "learning_analytics_reports"
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int
    class_id: str
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClassPerformanceMetric(SQLModel, table=True):
    __tablename__ = "class_performance_metrics"
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="learning_analytics_reports.id")
    average_score: float = 0.0
    highest_score: float = 0.0
    lowest_score: float = 0.0
    completion_rate: float = 0.0

class StudentPerformanceMetric(SQLModel, table=True):
    __tablename__ = "student_performance_metrics"
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="learning_analytics_reports.id")
    student_name: str
    score: float
    is_at_risk: bool = False

class LearningInsight(SQLModel, table=True):
    __tablename__ = "learning_insights"
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="learning_analytics_reports.id")
    category: str # COMMON_ERROR, CRITICAL_COMPETENCY
    description: str

class TeacherRecommendation(SQLModel, table=True):
    __tablename__ = "teacher_recommendations"
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="learning_analytics_reports.id")
    description: str

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Institution(SQLModel, table=True):
    __tablename__ = "institutions"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    type: str # PUBLIC, PRIVATE
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Campus(SQLModel, table=True):
    __tablename__ = "campuses"
    id: Optional[int] = Field(default=None, primary_key=True)
    institution_id: int = Field(foreign_key="institutions.id")
    name: str
    city: str
    state: str

class AcademicIndicator(SQLModel, table=True):
    __tablename__ = "academic_indicators"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: str
    value: float
    period: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RiskStudent(SQLModel, table=True):
    __tablename__ = "risk_students"
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id")
    risk_level: str # LOW, MEDIUM, HIGH, CRITICAL
    reason: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClassPerformance(SQLModel, table=True):
    __tablename__ = "class_performances"
    id: Optional[int] = Field(default=None, primary_key=True)
    class_id: int = Field(foreign_key="classrooms.id")
    average_score: float
    completion_rate: float
    failure_rate: float

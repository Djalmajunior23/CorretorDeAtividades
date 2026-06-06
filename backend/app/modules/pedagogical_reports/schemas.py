from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GenerateReportRequest(BaseModel):
    teacher_id: int
    class_name: str
    title: str
    # IDs of jobs or assignments to include
    source_ids: List[int] = []

class PedagogicalReportSchema(BaseModel):
    id: int
    teacher_id: int
    class_name: str
    title: str
    average_score: float
    critical_competencies: str
    recommendations: str
    created_at: datetime

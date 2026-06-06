from pydantic import BaseModel
from typing import List, Optional

class AnalyzeActivityRequest(BaseModel):
    teacher_id: int
    activity_name: str
    submission_ids: List[int] = []

class ReviewCaseRequest(BaseModel):
    status: str # FALSE_POSITIVE, CONFIRMED
    notes: str = ""

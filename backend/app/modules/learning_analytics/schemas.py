from pydantic import BaseModel
from typing import List, Optional

class GenerateRecommendationRequest(BaseModel):
    teacher_id: int
    class_id: str

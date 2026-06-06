from pydantic import BaseModel
from typing import List

class FeedbackSchema(BaseModel):
    summary: str
    strengths: List[str]
    improvements: List[str]
    concepts_to_review: List[str]
    next_steps: List[str]

class AnalysisResponseSchema(BaseModel):
    final_score: int
    syntax_score: int
    test_score: int
    quality_score: int
    complexity_level: str
    logic_issues: List[str]
    quality_issues: List[str]
    feedback: FeedbackSchema

from sqlmodel import Field, SQLModel, create_engine, Session, select
from typing import Optional, List
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    email: str
    role: str # 'student', 'teacher', 'admin'

class Rubric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    syntax_weight: int
    tests_weight: int
    quality_weight: int

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    language: str
    difficulty: str
    test_cases: str # JSON string
    rubric_id: Optional[int] = Field(default=None, foreign_key="rubric.id")

class Activity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    expected_language: str
    test_cases: str # JSON string
    rubric_id: Optional[int] = Field(default=None, foreign_key="rubric.id")
    max_attempts: int = 3
    grading_policy: str = "BEST_ATTEMPT"
    allow_late_submission: bool = False
    show_feedback_immediately: bool = True
    status: str = "PUBLISHED"

class Attempt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int
    activity_id: int
    question_id: int
    submission_id: int
    correction_result_id: Optional[int] = None
    attempt_number: int
    score: int
    status: str = "PENDING"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Submission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    activity_id: int
    code_content: str
    status: str = "PENDING" # PENDING, RUNNING, CORRECTED, ERROR
    is_image: bool = False

class CorrectionResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    submission_id: int
    syntax_score: int
    test_score: int
    quality_score: int
    final_score: int
    feedback: str
    stdout: str
    stderr: str
    execution_time: float


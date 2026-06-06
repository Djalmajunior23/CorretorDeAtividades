from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Assessment(SQLModel, table=True):
    __tablename__ = "assessments"
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="users.id")
    title: str
    description: str
    assessment_type: str # TRADITIONAL, PRACTICAL, SAEP
    difficulty: str
    status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AssessmentQuestion(SQLModel, table=True):
    __tablename__ = "assessment_questions"
    id: Optional[int] = Field(default=None, primary_key=True)
    assessment_id: int = Field(foreign_key="assessments.id")
    question_type: str
    statement: str
    difficulty: str
    competency_id: Optional[int] = None # Linking to Competency model id
    bloom_level: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Alternative(SQLModel, table=True):
    __tablename__ = "assessment_alternatives"
    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="assessment_questions.id")
    description: str
    is_correct: bool = False

class AssessmentRubric(SQLModel, table=True):
    __tablename__ = "assessment_rubrics"
    id: Optional[int] = Field(default=None, primary_key=True)
    assessment_id: int = Field(foreign_key="assessments.id")
    title: str
    description: str

class AnswerKey(SQLModel, table=True):
    __tablename__ = "assessment_answer_keys"
    id: Optional[int] = Field(default=None, primary_key=True)
    assessment_id: int = Field(foreign_key="assessments.id")
    question_id: int = Field(foreign_key="assessment_questions.id")
    correct_answer: str
    explanation: str

class AssessmentTemplate(SQLModel, table=True):
    __tablename__ = "assessment_templates"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: str
    structure: str # JSON

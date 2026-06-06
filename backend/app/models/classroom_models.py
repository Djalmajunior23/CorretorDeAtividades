from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class ClassroomConnection(SQLModel, table=True):
    __tablename__ = "classroom_connections"
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="users.id")
    google_user_id: str
    email: str
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClassroomCourse(SQLModel, table=True):
    __tablename__ = "classroom_courses"
    id: Optional[int] = Field(default=None, primary_key=True)
    google_course_id: str = Field(unique=True)
    teacher_id: int = Field(foreign_key="users.id")
    name: str
    section: Optional[str] = None
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClassroomCourseWork(SQLModel, table=True):
    __tablename__ = "classroom_courseworks"
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="classroom_courses.id")
    google_coursework_id: str = Field(unique=True)
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClassroomSubmission(SQLModel, table=True):
    __tablename__ = "classroom_submissions"
    id: Optional[int] = Field(default=None, primary_key=True)
    coursework_id: int = Field(foreign_key="classroom_courseworks.id")
    student_name: str
    student_email: str
    submission_state: str
    submitted_at: Optional[datetime] = None
    grade: Optional[float] = None
    processed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClassroomSyncLog(SQLModel, table=True):
    __tablename__ = "classroom_sync_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="users.id")
    sync_type: str
    status: str
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

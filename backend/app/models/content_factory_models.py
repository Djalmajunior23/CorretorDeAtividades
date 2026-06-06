from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class ContentProject(SQLModel, table=True):
    __tablename__ = "content_projects"
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="users.id")
    title: str
    content_type: str # BOOKLET, SLIDE_DECK, INFOGRAPHIC, LAB, PROJECT, STUDY_GUIDE
    status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GeneratedContent(SQLModel, table=True):
    __tablename__ = "generated_contents"
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="content_projects.id")
    title: str
    content: str
    format: str # PDF, DOCX, PPTX, HTML, MD
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContentTemplate(SQLModel, table=True):
    __tablename__ = "content_templates"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: str
    description: str

class ContentLibrary(SQLModel, table=True):
    __tablename__ = "content_libraries"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    category: str
    tags: str
    author_id: int = Field(foreign_key="users.id")

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class AIConversation(SQLModel, table=True):
    __tablename__ = "ai_conversations"
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="users.id")
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AIMessage(SQLModel, table=True):
    __tablename__ = "ai_messages"
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="ai_conversations.id")
    role: str # user, assistant, system
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GeneratedArtifact(SQLModel, table=True):
    __tablename__ = "generated_artifacts"
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="users.id")
    artifact_type: str # ACTIVITY, ASSESSMENT, RUBRIC, RECOVERY
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PromptTemplate(SQLModel, table=True):
    __tablename__ = "prompt_templates"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: str
    prompt_text: str

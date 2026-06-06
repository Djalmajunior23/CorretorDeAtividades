from sqlmodel import create_engine, Session, SQLModel
import os
from contextlib import contextmanager
from app.models import * # Load all models

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./codecheck.db")

engine = create_engine(
    DATABASE_URL, 
    echo=True, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

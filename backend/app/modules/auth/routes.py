from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.database.session import get_session
from app.models.user import User
from sqlmodel import Session, select
import jwt
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

JWT_SECRET = os.environ.get("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"

class AuthLogin(BaseModel):
    email: str
    password: str

class AuthRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "PROFESSOR"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=1440)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

@router.post("/register")
def register(data: AuthRegister, session: Session = Depends(get_session)):
    stmt = select(User).where(User.email == data.email)
    existing_user = session.exec(stmt).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=data.password,  # No passlib for emergency
        role=data.role
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"status": "User created", "user": new_user}

@router.post("/login")
def login(data: AuthLogin, session: Session = Depends(get_session)):
    stmt = select(User).where(User.email == data.email)
    user = session.exec(stmt).first()
    if not user or user.password_hash != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/me")
def me(session: Session = Depends(get_session)):
    # Fallback to a single user for safety in emergency, since no middleware is enforced here yet.
    return {"id": 1, "name": "Teacher", "email": "me@example.com", "role": "PROFESSOR"}

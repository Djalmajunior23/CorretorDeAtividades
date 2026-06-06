from fastapi import APIRouter, Depends, HTTPException, status, Header
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
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/me")
def me(authorization: str = Header(None), session: Session = Depends(get_session)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        stmt = select(User).where(User.id == int(user_id))
        user = session.exec(stmt).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
            
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

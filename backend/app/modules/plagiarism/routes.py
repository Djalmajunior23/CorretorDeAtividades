from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database.session import get_session
import uuid

router = APIRouter(prefix="/plagiarism", tags=["Plagiarism Detection"])

@router.get("/reports")
def get_reports(session: Session = Depends(get_session)):
    # Mock return list of open reports
    return [
       {
           "id": 1,
           "submission_a": "João - Arquivo.py",
           "submission_b": "Maria - Arquivo.py",
           "similarity_percentage": 94,
           "risk_level": "CRITICO",
           "date": "2026-06-05"
       },
       {
           "id": 2,
           "submission_a": "Pedro - Loop.cpp",
           "submission_b": "Ana - Loop.cpp",
           "similarity_percentage": 65,
           "risk_level": "ALTO",
           "date": "2026-06-04"
       }
    ]

@router.get("/reports/{report_id}")
def get_report_detail(report_id: int, session: Session = Depends(get_session)):
    return {
       "report_id": report_id,
       "submission_a": "def soma(a,b):\n  return a+b",
       "submission_b": "def soma_nova(x,y):\n  return x+y",
       "similarity_percentage": 94,
       "segments": [
           {"start_a": 1, "end_a": 2, "start_b": 1, "end_b": 2, "score": 98.0}
       ]
    }

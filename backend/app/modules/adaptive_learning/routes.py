from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database.session import get_session

router = APIRouter(prefix="/adaptive-learning", tags=["Adaptive Learning"])

@router.get("/student/{student_id}/path")
def get_learning_path(student_id: int, session: Session = Depends(get_session)):
    return {
        "student_id": student_id,
        "path_title": "Trilha de Recuperação: Controle de Fluxo",
        "steps": [
            {"order": 1, "title": "For Loops Básicos", "completed": True},
            {"order": 2, "title": "While e Condições de Parada", "completed": False},
            {"order": 3, "title": "Loops Aninhados", "completed": False}
        ]
    }

@router.get("/teacher/analytics")
def get_teacher_analytics(session: Session = Depends(get_session)):
    return {
        "turma_media": 72.5,
        "competencias_dominadas": ["Variáveis", "IF/ELSE"],
        "competencias_criticas": ["Funções", "Vetores"],
        "alunos_em_risco": 4
    }

@router.get("/student/{student_id}/evolution")
def get_evolution(student_id: int, session: Session = Depends(get_session)):
    return {
        "history": [
            {"assessment": "Quiz 1", "score": 40},
            {"assessment": "Lista Vetores", "score": 45},
            {"assessment": "Trilha Recuperação", "score": 85}
        ],
        "alert": "RECOVERY_SUCCESS",
        "message": "Aluno evoluiu mais de 20% após a intervenção!"
    }

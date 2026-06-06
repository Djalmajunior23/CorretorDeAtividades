from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database.session import get_session
from app.modules.learning_analytics.service import LearningAnalyticsService

router = APIRouter(prefix="/analytics", tags=["Learning Analytics"])

@router.get("/teacher/dashboard")
def get_dashboard(teacher_id: int = 1, session: Session = Depends(get_session)):
    # Standard overview, mock data
    return {"status": "success", "overview": "Active Dashboard"}

@router.get("/classes/{class_id}/summary")
def get_class_summary(class_id: str, teacher_id: int = 1, session: Session = Depends(get_session)):
    data = LearningAnalyticsService.get_or_generate_analytics(teacher_id, class_id, session)
    return {
        "report_id": data["report"].id,
        "class_metric": data["class_metric"]
    }

@router.get("/classes/{class_id}/students-risk")
def get_students_risk(class_id: str, teacher_id: int = 1, session: Session = Depends(get_session)):
    data = LearningAnalyticsService.get_or_generate_analytics(teacher_id, class_id, session)
    return [s for s in data["student_metrics"] if s.is_at_risk]

@router.get("/classes/{class_id}/common-errors")
def get_common_errors(class_id: str, teacher_id: int = 1, session: Session = Depends(get_session)):
    data = LearningAnalyticsService.get_or_generate_analytics(teacher_id, class_id, session)
    return [i for i in data["insights"] if i.category == "COMMON_ERROR"]

@router.get("/classes/{class_id}/competencies")
def get_competencies(class_id: str, teacher_id: int = 1, session: Session = Depends(get_session)):
    data = LearningAnalyticsService.get_or_generate_analytics(teacher_id, class_id, session)
    return [i for i in data["insights"] if i.category == "CRITICAL_COMPETENCY"]

@router.post("/recommendations/generate")
def generate_recommendations(class_id: str, teacher_id: int = 1, session: Session = Depends(get_session)):
    data = LearningAnalyticsService.get_or_generate_analytics(teacher_id, class_id, session)
    return data["recommendations"]

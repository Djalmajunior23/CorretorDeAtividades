from fastapi import APIRouter

router = APIRouter(prefix="/assessment-studio", tags=["AI Assessment Studio"])

@router.get("/dashboard")
def get_dashboard():
    return {
        "assessments_created": 8,
        "questions_in_bank": 256,
        "recent_assessments": [
            {"id": "as1", "title": "Simulado SAEP 2026", "type": "SAEP", "questions": 40}
        ]
    }

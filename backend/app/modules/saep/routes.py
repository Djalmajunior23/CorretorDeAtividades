from fastapi import APIRouter

router = APIRouter(prefix="/saep", tags=["SAEP Intelligence Center"])

@router.get("/dashboard")
def get_dashboard():
    return {
        "competencies_developed": 12,
        "critical_competencies": 3,
        "evidences_generated": 240,
        "indicators": [
            {"code": "C1", "status": "VERDE", "value": 85},
            {"code": "C2", "status": "AMARELO", "value": 60},
            {"code": "C3", "status": "VERMELHO", "value": 40}
        ],
        "action_plans": [
            {"competency": "C3", "title": "Plano de Recuperação C3", "status": "PENDING"}
        ]
    }

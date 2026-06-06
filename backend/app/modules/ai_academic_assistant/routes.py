from fastapi import APIRouter

router = APIRouter(prefix="/ai-academic-assistant", tags=["AI Academic Assistant"])

@router.get("/dashboard")
def get_dashboard():
    return {
        "conversations": 15,
        "artifacts_generated": 42,
        "recent_artifacts": [
            {"id": "a1", "title": "Plano de Aula: React Hooks", "type": "LESSON_PLAN"}
        ]
    }

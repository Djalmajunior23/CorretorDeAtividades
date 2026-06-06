from fastapi import APIRouter

router = APIRouter(prefix="/curriculum", tags=["Curriculum Intelligence Engine"])

@router.get("/dashboard")
def get_dashboard():
    return {
        "courses_count": 5,
        "units_count": 24,
        "competencies_count": 120,
        "recent_plans": [
            {"course": "Técnico em Desenvolvimento de Sistemas", "unit": "Desenvolvimento Web", "status": "ACTIVE"}
        ]
    }

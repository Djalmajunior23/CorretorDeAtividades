from fastapi import APIRouter

router = APIRouter(prefix="/academic-command-center", tags=["Academic Command Center"])

@router.get("/dashboard")
def get_dashboard():
    return {
        "institution": {"name": "SENAI SP", "type": "PRIVATE"},
        "kpis": {
            "approval_rate": 85.5,
            "failure_rate": 14.5,
            "average_score": 7.8,
            "attendance": 92.0
        },
        "risk_students": 45,
        "classes_performance": [
            {"name": "DS01", "average": 8.2, "completion": 95},
            {"name": "DS02", "average": 6.8, "completion": 78}
        ]
    }

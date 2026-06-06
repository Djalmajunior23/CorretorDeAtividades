from fastapi import APIRouter

router = APIRouter(prefix="/content-factory", tags=["AI Content Factory"])

@router.get("/dashboard")
def get_dashboard():
    return {
        "projects_count": 12,
        "contents_generated": 54,
        "recent_contents": [
            {"id": "cf1", "title": "Apostila Python Básica", "type": "BOOKLET", "format": "PDF"}
        ]
    }

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database.session import get_session
from app.modules.academic_integrity.schemas import AnalyzeActivityRequest, ReviewCaseRequest
from app.modules.academic_integrity.repository import AcademicIntegrityRepository
from app.modules.academic_integrity.service import AcademicIntegrityService
from app.modules.academic_integrity.models import AcademicIntegrityCase

router = APIRouter(prefix="/academic-integrity", tags=["Academic Integrity"])

@router.post("/analyze")
def analyze_activity(data: AnalyzeActivityRequest, session: Session = Depends(get_session)):
    repo = AcademicIntegrityRepository(session)
    mock_data = AcademicIntegrityService.generate_mock_analysis(data.activity_name)
    
    report = repo.create_report(mock_data["report"])
    
    for pair in mock_data["pairs"]:
        pair.report_id = report.id
        repo.create_pair(pair)
        
    return {"status": "success", "report_id": report.id}

@router.get("/reports")
def list_reports(session: Session = Depends(get_session)):
    repo = AcademicIntegrityRepository(session)
    return repo.get_reports_by_teacher(1) # fallback

@router.get("/reports/{id}")
def get_report(id: int, session: Session = Depends(get_session)):
    repo = AcademicIntegrityRepository(session)
    report = repo.get_report(id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    pairs = repo.get_pairs_by_report(id)
    
    return {
        "report": report,
        "pairs": pairs
    }

@router.put("/cases/{id}/review")
def review_case(id: int, data: ReviewCaseRequest, session: Session = Depends(get_session)):
    repo = AcademicIntegrityRepository(session)
    pair = repo.get_pair(id)
    if not pair:
        raise HTTPException(status_code=404, detail="Similarity pair not found")
        
    pair.status = data.status
    session.commit()
    
    case = AcademicIntegrityCase(
        pair_id=pair.id,
        teacher_notes=data.notes,
        resolution=data.status
    )
    repo.create_case(case)
    
    return {"status": "success"}

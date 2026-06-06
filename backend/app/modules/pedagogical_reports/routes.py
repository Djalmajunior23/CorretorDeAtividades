from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database.session import get_session
from app.modules.pedagogical_reports.schemas import GenerateReportRequest
from app.modules.pedagogical_reports.repository import PedagogicalReportRepository
from app.modules.pedagogical_reports.service import PedagogicalReportService
from fastapi.responses import StreamingResponse
import io

router = APIRouter(prefix="/pedagogical-reports", tags=["Pedagogical Reports"])

@router.post("/generate")
def generate_report(data: GenerateReportRequest, session: Session = Depends(get_session)):
    repo = PedagogicalReportRepository(session)
    mock_data = PedagogicalReportService.generate_mock_report(data.teacher_id, data.class_name, data.title)
    
    report = repo.create_report(mock_data["report"])
    
    for item in mock_data["items"]:
        item.report_id = report.id
    repo.create_items(mock_data["items"])
    
    for ins in mock_data["insights"]:
        ins.report_id = report.id
    repo.create_insights(mock_data["insights"])
    
    return {"status": "success", "report_id": report.id}

@router.get("")
def list_reports(session: Session = Depends(get_session)):
    repo = PedagogicalReportRepository(session)
    return repo.get_reports_by_teacher(1) # fallback

@router.get("/{id}")
def get_report(id: int, session: Session = Depends(get_session)):
    repo = PedagogicalReportRepository(session)
    report = repo.get_report(id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    items = repo.get_items_for_report(id)
    insights = repo.get_insights_for_report(id)
    
    return {
        "report": report,
        "items": items,
        "insights": insights
    }

@router.get("/{id}/export-pdf")
def export_pdf(id: int, session: Session = Depends(get_session)):
    # Mock PDF generation
    pdf_content = b"%PDF-1.4\n%...\n(Mock PDF Report)"
    return StreamingResponse(io.BytesIO(pdf_content), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=report_{id}.pdf"})

@router.get("/{id}/export-csv")
def export_csv(id: int, session: Session = Depends(get_session)):
    # Mock CSV generation
    csv_content = b"student_name,score,risk_level\nAna Souza,90,LOW\nCarlos Silva,65,MEDIUM\nPedro Santos,45,HIGH"
    return StreamingResponse(io.BytesIO(csv_content), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=report_{id}.csv"})

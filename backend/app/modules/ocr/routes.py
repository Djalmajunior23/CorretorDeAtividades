from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session
from app.database.session import get_session
from app.modules.ocr.schemas import OCRConfirmRequest
from app.modules.ocr.repository import OCRRepository
from app.modules.ocr.service import OCRService
from app.models.ocr_extraction import OCRExtraction
from app.modules.teacher.teacher_service import TeacherService
import os

router = APIRouter(prefix="/ocr", tags=["ocr"])

@router.post("/extract")
def extract_image(file: UploadFile = File(...), session: Session = Depends(get_session)):
    # Validate file extension and size
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["png", "jpg", "jpeg", "webp"]:
        raise HTTPException(status_code=400, detail="Formato de imagem não suportado. Use PNG, JPG, JPEG ou WEBP.")
    
    # Save Image
    try:
        file_path = OCRService.save_image(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Extract Text
    try:
        text = OCRService.extract_text(file_path)
    except Exception as e:
        # Save failed extraction state
        repo = OCRRepository(session)
        ocr = OCRExtraction(
            teacher_id=1, # Fallback to 1 for MVP (Professor)
            file_name=file.filename,
            file_path=file_path,
            extracted_text="",
            status="FAILED"
        )
        repo.create(ocr)
        raise HTTPException(status_code=503, detail=str(e))
        
    # Save successful extraction state
    repo = OCRRepository(session)
    ocr = OCRExtraction(
        teacher_id=1, # Fallback
        file_name=file.filename,
        file_path=file_path,
        extracted_text=text,
        status="EXTRACTED"
    )
    repo.create(ocr)
    
    return {
        "ocr_id": ocr.id,
        "extracted_text": ocr.extracted_text,
        "status": ocr.status
    }

@router.post("/confirm")
def confirm_and_correct(data: OCRConfirmRequest, session: Session = Depends(get_session)):
    repo = OCRRepository(session)
    ocr = repo.get_by_id(data.ocr_id)
    
    if not ocr:
        raise HTTPException(status_code=404, detail="OCR request not found")
        
    # Update OCR record
    ocr.edited_text = data.edited_text
    ocr.status = "CONFIRMED"
    repo.update(ocr)
    
    # Transform testcases
    test_cases = [{"input": tc.input, "expected_output": tc.expected_output} for tc in data.test_cases]
    
    # Run Correction
    result = TeacherService.run_quick_correction(data.edited_text, data.language, test_cases, session)
    
    return result

@router.get("/history")
def get_history(session: Session = Depends(get_session)):
    repo = OCRRepository(session)
    return repo.get_all_by_teacher(1) # Fallback to teacher_id = 1

@router.get("/{id}")
def get_ocr(id: int, session: Session = Depends(get_session)):
    repo = OCRRepository(session)
    ocr = repo.get_by_id(id)
    if not ocr:
        raise HTTPException(status_code=404, detail="OCR not found")
    return ocr

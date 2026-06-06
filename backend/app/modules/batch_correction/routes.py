import os
import zipfile
import tempfile
import json
import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from sqlmodel import Session
from app.database.session import get_session
from app.repositories.batch_repository import BatchCorrectionRepository
from app.models.batch_job import BatchCorrectionJob
from app.models.batch_item import BatchCorrectionItem
from app.models.batch_result import BatchCorrectionResult
from app.modules.teacher.teacher_service import TeacherService

router = APIRouter(prefix="/batch-correction", tags=["Batch Correction"])

def process_batch_background(job_id: int, zip_file_path: str, db: Session):
    repo = BatchCorrectionRepository(db)
    job = repo.get_job(job_id)
    if not job:
        return
        
    job.status = "PROCESSING"
    repo.update_job(job)
    
    # We will extract the zip file
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            if zipfile.is_zipfile(zip_file_path):
                with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                    
            py_files = []
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    if file.endswith('.py'):
                        py_files.append(os.path.join(root, file))
            
            job.total_files = len(py_files)
            repo.update_job(job)
            
            for f in py_files:
                file_name = os.path.basename(f)
                try:
                    with open(f, 'r', encoding='utf-8') as file_obj:
                        code = file_obj.read()
                except Exception:
                    continue
                
                # Mock Test Cases for now (since UI doesn't send them yet)
                test_cases = [{"input": "2 3", "expected_output": "5"}]
                
                correction = TeacherService.run_quick_correction(code, "python", test_cases, db)
                
                # Parse Student Name roughly from filename
                student_name = file_name.replace(".py", "").replace("_", " ").title()
                
                item = BatchCorrectionItem(
                    job_id=job.id,
                    student_name=student_name,
                    student_email=f"{student_name.replace(' ', '').lower()}@escola.com",
                    file_name=file_name,
                    file_type="py",
                    status="COMPLETED",
                    score=correction.get("score", 0),
                    feedback=correction.get("feedback", "")
                )
                item = repo.create_item(item)
                
                result = BatchCorrectionResult(
                    item_id=item.id,
                    syntax_score=correction.get("analysis", {}).get("syntax_score", 0),
                    logic_score=correction.get("analysis", {}).get("quality_score", 0),
                    quality_score=correction.get("analysis", {}).get("quality_score", 0),
                    final_score=correction.get("score", 0),
                    feedback=json.dumps(correction.get("analysis", {})),
                    execution_time=0.0
                )
                repo.create_result(result)
                
                job.processed_files += 1
                job.successful_corrections += 1 if correction.get("score", 0) >= 50 else 0
                job.failed_corrections += 1 if correction.get("score", 0) < 50 else 0
                repo.update_job(job)
                
    except Exception as e:
        print("Error processing zip:", e)
    finally:
        if os.path.exists(zip_file_path):
            os.remove(zip_file_path)
            
    job.status = "COMPLETED"
    job.finished_at = datetime.utcnow()
    repo.update_job(job)

@router.post("/upload")
def upload_batch(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...), session: Session = Depends(get_session)):
    repo = BatchCorrectionRepository(session)
    teacher_id = 1 
    
    # Check if first file is a ZIP
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
        
    first_file = files[0]
    if not first_file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Please upload a .zip file containing the python scripts")
        
    # Save the uploaded file temporarily
    temp_dir = tempfile.gettempdir()
    zip_path = os.path.join(temp_dir, f"batch_{uuid.uuid4().hex}.zip")
    
    with open(zip_path, "wb") as buffer:
        import shutil
        shutil.copyfileobj(first_file.file, buffer)
    
    job = BatchCorrectionJob(
        teacher_id=teacher_id,
        title=f"Lote {first_file.filename} - {datetime.utcnow().strftime('%H:%M')}",
        total_files=0, # Will be updated dynamically
    )
    job = repo.create_job(job)
    
    background_tasks.add_task(process_batch_background, job.id, zip_path, session)
    
    return {"status": "Job started", "job_id": job.id}

@router.get("/jobs")
def get_jobs(session: Session = Depends(get_session)):
    repo = BatchCorrectionRepository(session)
    teacher_id = 1
    jobs = repo.get_jobs_by_teacher(teacher_id)
    return jobs

@router.get("/jobs/{job_id}")
def get_job_details(job_id: int, session: Session = Depends(get_session)):
    repo = BatchCorrectionRepository(session)
    job = repo.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    items = repo.get_items_by_job(job_id)
    return {"job": job, "items": items}

@router.get("/results/{item_id}")
def get_item_result(item_id: int, session: Session = Depends(get_session)):
    repo = BatchCorrectionRepository(session)
    result = repo.get_result_by_item(item_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result

@router.post("/export/{job_id}")
def export_batch(job_id: int, session: Session = Depends(get_session)):
    return {"status": "success", "download_url": f"/api/batch-correction/download/{job_id}/results.csv"}


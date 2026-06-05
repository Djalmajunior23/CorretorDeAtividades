from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from database.connection import create_db_and_tables, get_session
from database.models import User, Activity, Submission, CorrectionResult, Question, Rubric, Attempt
from modules.execution.code_execution_service import CodeExecutionService
from modules.student.student_service import StudentService
from modules.attempts.attempts_service import AttemptsService
from modules.progress.progress_service import ProgressService
from modules.teacher.teacher_service import TeacherService
import json

app = FastAPI(title="CodeCheck AI API")

# Define request model for teacher correction
from pydantic import BaseModel
class TeacherCorrectionRequest(BaseModel):
    code: str
    test_cases: List[dict]

@app.post("/teacher/corrections/code")
def teacher_correction(request: TeacherCorrectionRequest):
    return TeacherService.run_quick_correction(request.code, request.test_cases)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# ... (student routes)
@app.get("/student/dashboard")
def get_student_dashboard(student_id: int, session: Session = Depends(get_session)):
    return StudentService.get_dashboard_data(session, student_id)

@app.get("/student/attempts")
def get_student_attempts(student_id: int, session: Session = Depends(get_session)):
    return AttemptsService.get_attempts(session, student_id)

@app.get("/student/progress")
def get_student_progress(student_id: int, session: Session = Depends(get_session)):
    return ProgressService.get_progress_data(session, student_id)

# ... (keep other routes)

@app.post("/submissions/")
def submit_code(code_content: str, user_id: int, activity_id: int, session: Session = Depends(get_session)):
    submission = Submission(user_id=user_id, activity_id=activity_id, code_content=code_content, status="PENDING")
    session.add(submission)
    session.commit()
    session.refresh(submission)
    return {"submission_id": submission.id, "status": submission.status}

@app.post("/questions/")
def create_question(question: Question, session: Session = Depends(get_session)):
    session.add(question)
    session.commit()
    session.refresh(question)
    return question

@app.get("/questions/")
def get_questions(session: Session = Depends(get_session)):
    return session.exec(select(Question)).all()

@app.post("/corrections/{submission_id}/run")
def run_correction(submission_id: int, session: Session = Depends(get_session)):
    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    activity = session.get(Activity, submission.activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    submission.status = "RUNNING"
    session.commit()
    
    try:
        test_cases = json.loads(activity.test_cases)
    except:
        test_cases = []
    
    correction = CodeExecutionService.perform_correction(submission.code_content, test_cases)
    
    result = CorrectionResult(
        submission_id=submission.id,
        syntax_score=30 if correction["syntax_ok"] else 0,
        test_score=int(50 * (correction["tests_passed"] / correction["total_tests"])) if correction["total_tests"] > 0 else 0,
        quality_score=20 if correction["syntax_ok"] else 0,
        final_score=correction["score"],
        feedback=correction["feedback"],
        stdout=correction["stdout"],
        stderr=correction["stderr"],
        execution_time=0.0
    )
    
    submission.status = "CORRECTED"
    session.add(result)
    session.commit()
    return {"status": "CORRECTED", "score": correction["score"], "feedback": correction["feedback"]}

@app.post("/activities/")
def create_activity(activity: Activity, session: Session = Depends(get_session)):
    session.add(activity)
    session.commit()
    session.refresh(activity)
    return activity
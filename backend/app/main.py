from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from app.database.session import create_db_and_tables, get_session
from app.models import User, Activity, Submission, CorrectionResult, Question, Rubric, TestCase, StudentLearningProfile, Attempt, OCRExtraction
from app.modules.execution.code_execution_service import CodeExecutionService
from app.modules.student.student_service import StudentService
from app.modules.attempts.attempts_service import AttemptsService
from app.modules.progress.progress_service import ProgressService
from app.modules.teacher.teacher_service import TeacherService
import json
import os

app = FastAPI(title="CodeCheck AI API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://corretordeatividades.fly.dev",
    "https://corretor-de-atividades.vercel.app",
    "https://corretor-de-atividades-frontend.vercel.app",
    "https://corretordeatividades.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.run\.app|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "CodeCheck AI Backend"
    }

class RunCorrectionRequest(BaseModel):
    code: str
    language: str = "python"
    test_cases: List[dict] = []

@app.post("/corrections/run")
def simple_run_correction(request: RunCorrectionRequest, session: Session = Depends(get_session)):
    correction = TeacherService.run_quick_correction(request.code, request.language, request.test_cases, session)
    return {
        "final_score": correction.get("score", 0),
        "syntax_ok": correction.get("syntax_ok", False),
        "tests_passed": correction.get("tests_passed", 0),
        "total_tests": correction.get("total_tests", 0),
        "stdout": correction.get("stdout", ""),
        "stderr": correction.get("stderr", ""),
        "feedback": correction.get("feedback", "Código executado com sucesso."),
        "analysis": correction.get("analysis", {})
    }

# Define request model for teacher correction
class TeacherCorrectionRequest(BaseModel):
    code: str
    language: str = "python"
    test_cases: List[dict]

@app.post("/teacher/corrections/code")
def teacher_correction(request: TeacherCorrectionRequest, session: Session = Depends(get_session)):
    return TeacherService.run_quick_correction(request.code, request.language, request.test_cases, session)

from app.modules.auth.routes import router as auth_router
from app.modules.ocr.routes import router as ocr_router
from app.modules.batch_correction.routes import router as batch_router
from app.modules.pedagogical_reports.routes import router as pedagogical_router
from app.modules.learning_analytics.routes import router as learning_analytics_router
from app.modules.academic_integrity.routes import router as integrity_router

app.include_router(auth_router)
app.include_router(ocr_router)
app.include_router(batch_router)
app.include_router(pedagogical_router)
app.include_router(learning_analytics_router)
app.include_router(integrity_router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Seed professor user for testing
    with Session(app.dependency_overrides.get(get_session, get_session)().__next__()) as session:
        from app.models.user import User
        from sqlmodel import select
        stmt = select(User).where(User.email == "professor@codecheck.ai")
        existing_user = session.exec(stmt).first()
        if not existing_user:
            new_user = User(
                name="Professor Admin",
                email="professor@codecheck.ai",
                password_hash="123456",
                role="PROFESSOR"
            )
            session.add(new_user)
            session.commit()


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

from app.repositories.submission_repository import SubmissionRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.activity_repository import ActivityRepository
from app.modules.batch_correction import init_app as init_batch_correction
from app.modules.plagiarism import init_app as init_plagiarism
from app.modules.adaptive_learning import init_app as init_adaptive
from app.modules.academic_command_center import init_app as init_academic_command_center
from app.modules.saep import init_app as init_saep
from app.modules.curriculum import init_app as init_curriculum
from app.modules.ai_academic_assistant import init_app as init_ai_academic_assistant
from app.modules.assessment_studio import init_app as init_assessment_studio
from app.modules.content_factory import init_app as init_content_factory

init_batch_correction(app)
init_plagiarism(app)
init_adaptive(app)
init_academic_command_center(app)
init_saep(app)
init_curriculum(app)
init_ai_academic_assistant(app)
init_assessment_studio(app)
init_content_factory(app)

@app.post("/submissions/")
def submit_code(code_content: str, user_id: int, activity_id: int, language: str = "python", session: Session = Depends(get_session)):
    repo = SubmissionRepository(session)
    submission = Submission(user_id=user_id, activity_id=activity_id, code_content=code_content, language=language, status="PENDING")
    created = repo.create(submission)
    return {"submission_id": created.id, "status": created.status}

@app.post("/questions/")
def create_question(question: Question, session: Session = Depends(get_session)):
    repo = QuestionRepository(session)
    return repo.create(question)

@app.get("/questions/")
def get_questions(session: Session = Depends(get_session)):
    repo = QuestionRepository(session)
    return repo.get_all()


from app.repositories.correction_repository import CorrectionRepository
import json

@app.post("/corrections/{submission_id}/run")
def run_correction(submission_id: int, session: Session = Depends(get_session)):
    sub_repo = SubmissionRepository(session)
    act_repo = ActivityRepository(session)
    corr_repo = CorrectionRepository(session)
    
    submission = sub_repo.get_by_id(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    activity = act_repo.get_by_id(submission.activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    sub_repo.update_status(submission.id, "RUNNING")
    
    try:
        # Simplification: In a full model test_cases are separate, but here we fallback
        # In actual structure it might be tied to questions instead of activities directly
        test_cases = []
    except:
        test_cases = []
    
    # We call the service layer
    correction = CodeExecutionService.perform_correction(submission.code_content, submission.language, test_cases)
    
    result = CorrectionResult(
        submission_id=submission.id,
        syntax_score=correction.get("analysis", {}).get("syntax_score", 0),
        test_score=correction.get("test_score", 0),
        quality_score=correction.get("analysis", {}).get("quality_score", 0),
        final_score=correction["score"],
        feedback=str(correction["feedback"]), # Simplified stringification
        stdout=correction["stdout"],
        stderr=correction["stderr"],
        execution_time=0.0
    )
    
    corr_repo.create(result)
    sub_repo.update_status(submission.id, "CORRECTED")
    
    return {"status": "CORRECTED", "score": correction["score"], "feedback": correction["feedback"]}

@app.post("/activities/")
def create_activity(activity: Activity, session: Session = Depends(get_session)):
    repo = ActivityRepository(session)
    return repo.create(activity)
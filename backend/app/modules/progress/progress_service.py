from sqlmodel import Session, select
from database.models import Attempt, Activity, Submission, CorrectionResult
from sqlalchemy import func

class ProgressService:
    @staticmethod
    def get_progress_data(session: Session, student_id: int):
        # Dummy progress metrics logic for MVP
        attempts = session.exec(select(Attempt).where(Attempt.student_id == student_id)).all()
        
        # Calculate stats
        scores = [a.score for a in attempts]
        average = sum(scores) / len(scores) if scores else 0
        
        return {
            "average_score": average,
            "completed_activities": len(set([a.activity_id for a in attempts])), # Simplistic
            "pending_activities": 0,
            "total_attempts": len(attempts),
            "best_score": max(scores) if scores else 0,
            "weekly_progress": [
                {"week": "Semana 1", "average": 70},
                {"week": "Semana 2", "average": 85}
            ],
            "weaknesses": ["Estruturas condicionais", "Laços de repetição"]
        }

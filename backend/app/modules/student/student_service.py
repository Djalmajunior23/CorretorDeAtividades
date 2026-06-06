from sqlmodel import Session, select
from app.models import User, Activity

class StudentService:
    @staticmethod
    def get_dashboard_data(session: Session, student_id: int):
        # Fetch student and active activities
        activities = session.exec(select(Activity).where(Activity.status == "PUBLISHED")).all()
        return {
            "student_id": student_id,
            "activities": activities
        }

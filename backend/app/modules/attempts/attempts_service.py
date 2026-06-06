from sqlmodel import Session, select
from app.models import Attempt

class AttemptsService:
    @staticmethod
    def get_attempts(session: Session, student_id: int):
        return session.exec(select(Attempt).where(Attempt.student_id == student_id)).all()

    @staticmethod
    def create_attempt(session: Session, attempt_data: dict):
        new_attempt = Attempt(**attempt_data)
        session.add(new_attempt)
        session.commit()
        session.refresh(new_attempt)
        return new_attempt

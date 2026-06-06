from sqlmodel import Session
from app.models import CorrectionResult

class CorrectionRepository:
    def __init__(self, session: Session):
        self.session = session
        
    def create(self, result: CorrectionResult) -> CorrectionResult:
        self.session.add(result)
        self.session.commit()
        self.session.refresh(result)
        return result
        
    def get_by_submission_id(self, submission_id: int) -> CorrectionResult | None:
        statement = select(CorrectionResult).where(CorrectionResult.submission_id == submission_id)
        return self.session.exec(statement).first()

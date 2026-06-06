from sqlmodel import Session, select
from app.models import Submission

class SubmissionRepository:
    def __init__(self, session: Session):
        self.session = session
        
    def create(self, submission: Submission) -> Submission:
        self.session.add(submission)
        self.session.commit()
        self.session.refresh(submission)
        return submission
        
    def get_by_id(self, submission_id: int) -> Submission | None:
        return self.session.get(Submission, submission_id)
        
    def update_status(self, submission_id: int, status: str) -> Submission | None:
        submission = self.get_by_id(submission_id)
        if submission:
            submission.status = status
            self.session.commit()
            self.session.refresh(submission)
        return submission

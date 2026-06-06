from sqlmodel import Session, select
from app.models import Question

class QuestionRepository:
    def __init__(self, session: Session):
        self.session = session
        
    def create(self, question: Question) -> Question:
        self.session.add(question)
        self.session.commit()
        self.session.refresh(question)
        return question
        
    def get_by_id(self, question_id: int) -> Question | None:
        return self.session.get(Question, question_id)
        
    def get_all(self):
        return self.session.exec(select(Question)).all()

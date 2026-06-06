from sqlmodel import Session, select
from app.models import Activity

class ActivityRepository:
    def __init__(self, session: Session):
        self.session = session
        
    def create(self, activity: Activity) -> Activity:
        self.session.add(activity)
        self.session.commit()
        self.session.refresh(activity)
        return activity
        
    def get_by_id(self, activity_id: int) -> Activity | None:
        return self.session.get(Activity, activity_id)
        
    def get_all(self):
        return self.session.exec(select(Activity)).all()

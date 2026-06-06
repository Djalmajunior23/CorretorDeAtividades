from sqlmodel import Session, select
from app.models.batch_job import BatchCorrectionJob
from app.models.batch_item import BatchCorrectionItem
from app.models.batch_result import BatchCorrectionResult

class BatchCorrectionRepository:
    def __init__(self, session: Session):
        self.session = session
        
    def create_job(self, job: BatchCorrectionJob) -> BatchCorrectionJob:
        self.session.add(job)
        self.session.commit()
        self.session.refresh(job)
        return job

    def get_job(self, job_id: int) -> BatchCorrectionJob | None:
        return self.session.get(BatchCorrectionJob, job_id)
        
    def get_jobs_by_teacher(self, teacher_id: int):
        statement = select(BatchCorrectionJob).where(BatchCorrectionJob.teacher_id == teacher_id).order_by(BatchCorrectionJob.created_at.desc())
        return self.session.exec(statement).all()

    def update_job(self, job: BatchCorrectionJob) -> BatchCorrectionJob:
        self.session.add(job)
        self.session.commit()
        self.session.refresh(job)
        return job

    def create_item(self, item: BatchCorrectionItem) -> BatchCorrectionItem:
        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item
        
    def get_items_by_job(self, job_id: int):
        statement = select(BatchCorrectionItem).where(BatchCorrectionItem.job_id == job_id)
        return self.session.exec(statement).all()

    def create_result(self, result: BatchCorrectionResult) -> BatchCorrectionResult:
        self.session.add(result)
        self.session.commit()
        self.session.refresh(result)
        return result
        
    def get_result_by_item(self, item_id: int) -> BatchCorrectionResult | None:
        statement = select(BatchCorrectionResult).where(BatchCorrectionResult.item_id == item_id)
        return self.session.exec(statement).first()

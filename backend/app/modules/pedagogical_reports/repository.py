from sqlmodel import Session, select
from typing import List, Optional
from app.modules.pedagogical_reports.models import PedagogicalReport, PedagogicalReportItem, ClassLearningInsight

class PedagogicalReportRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_report(self, report: PedagogicalReport) -> PedagogicalReport:
        self.session.add(report)
        self.session.commit()
        self.session.refresh(report)
        return report

    def create_items(self, items: List[PedagogicalReportItem]):
        self.session.add_all(items)
        self.session.commit()

    def create_insights(self, insights: List[ClassLearningInsight]):
        self.session.add_all(insights)
        self.session.commit()

    def get_report(self, report_id: int) -> Optional[PedagogicalReport]:
        return self.session.get(PedagogicalReport, report_id)
        
    def get_items_for_report(self, report_id: int) -> List[PedagogicalReportItem]:
        stmt = select(PedagogicalReportItem).where(PedagogicalReportItem.report_id == report_id)
        return list(self.session.exec(stmt).all())

    def get_insights_for_report(self, report_id: int) -> List[ClassLearningInsight]:
        stmt = select(ClassLearningInsight).where(ClassLearningInsight.report_id == report_id)
        return list(self.session.exec(stmt).all())

    def get_reports_by_teacher(self, teacher_id: int) -> List[PedagogicalReport]:
        stmt = select(PedagogicalReport).where(PedagogicalReport.teacher_id == teacher_id).order_by(PedagogicalReport.created_at.desc())
        return list(self.session.exec(stmt).all())

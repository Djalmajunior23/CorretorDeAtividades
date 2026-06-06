from sqlmodel import Session, select
from typing import List, Optional
from app.modules.learning_analytics.models import LearningAnalyticsReport, ClassPerformanceMetric, StudentPerformanceMetric, LearningInsight, TeacherRecommendation

class LearningAnalyticsRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_report(self, report: LearningAnalyticsReport) -> LearningAnalyticsReport:
        self.session.add(report)
        self.session.commit()
        self.session.refresh(report)
        return report

    def create_class_metric(self, metric: ClassPerformanceMetric):
        self.session.add(metric)
        self.session.commit()
        
    def create_student_metrics(self, metrics: List[StudentPerformanceMetric]):
        self.session.add_all(metrics)
        self.session.commit()

    def create_insights(self, insights: List[LearningInsight]):
        self.session.add_all(insights)
        self.session.commit()

    def create_recommendations(self, recs: List[TeacherRecommendation]):
        self.session.add_all(recs)
        self.session.commit()

    def get_latest_report(self, class_id: str) -> Optional[LearningAnalyticsReport]:
        stmt = select(LearningAnalyticsReport).where(LearningAnalyticsReport.class_id == class_id).order_by(LearningAnalyticsReport.created_at.desc())
        return self.session.exec(stmt).first()

    def get_class_metric(self, report_id: int) -> Optional[ClassPerformanceMetric]:
        stmt = select(ClassPerformanceMetric).where(ClassPerformanceMetric.report_id == report_id)
        return self.session.exec(stmt).first()
        
    def get_student_metrics(self, report_id: int) -> List[StudentPerformanceMetric]:
        stmt = select(StudentPerformanceMetric).where(StudentPerformanceMetric.report_id == report_id)
        return list(self.session.exec(stmt).all())

    def get_insights(self, report_id: int) -> List[LearningInsight]:
        stmt = select(LearningInsight).where(LearningInsight.report_id == report_id)
        return list(self.session.exec(stmt).all())
        
    def get_recommendations(self, report_id: int) -> List[TeacherRecommendation]:
        stmt = select(TeacherRecommendation).where(TeacherRecommendation.report_id == report_id)
        return list(self.session.exec(stmt).all())

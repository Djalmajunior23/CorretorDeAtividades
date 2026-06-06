from sqlmodel import Session
from app.modules.learning_analytics.repository import LearningAnalyticsRepository
from app.modules.learning_analytics.analytics_engine import AnalyticsEngine

class LearningAnalyticsService:
    @staticmethod
    def get_or_generate_analytics(teacher_id: int, class_id: str, db: Session) -> dict:
        repo = LearningAnalyticsRepository(db)
        existing_report = repo.get_latest_report(class_id)
        
        if existing_report:
            return {
                "report": existing_report,
                "class_metric": repo.get_class_metric(existing_report.id),
                "student_metrics": repo.get_student_metrics(existing_report.id),
                "insights": repo.get_insights(existing_report.id),
                "recommendations": repo.get_recommendations(existing_report.id)
            }
            
        data = AnalyticsEngine.compute_mock_analytics(teacher_id, class_id)
        report = repo.create_report(data["report"])
        
        data["class_metric"].report_id = report.id
        repo.create_class_metric(data["class_metric"])
        
        for sm in data["student_metrics"]:
            sm.report_id = report.id
        repo.create_student_metrics(data["student_metrics"])
        
        for ins in data["insights"]:
            ins.report_id = report.id
        repo.create_insights(data["insights"])
        
        for rec in data["recommendations"]:
            rec.report_id = report.id
        repo.create_recommendations(data["recommendations"])
        
        return {
            "report": report,
            "class_metric": data["class_metric"],
            "student_metrics": data["student_metrics"],
            "insights": data["insights"],
            "recommendations": data["recommendations"]
        }

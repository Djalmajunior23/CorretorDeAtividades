from app.modules.learning_analytics.models import LearningAnalyticsReport, ClassPerformanceMetric, StudentPerformanceMetric, LearningInsight, TeacherRecommendation

class AnalyticsEngine:
    @staticmethod
    def compute_mock_analytics(teacher_id: int, class_id: str) -> dict:
        report = LearningAnalyticsReport(teacher_id=teacher_id, class_id=class_id, title=f"Análise Turma {class_id}")
        
        class_metric = ClassPerformanceMetric(
            average_score=72.0,
            highest_score=95.0,
            lowest_score=40.0,
            completion_rate=88.5
        )
        
        student_metrics = [
            StudentPerformanceMetric(student_name="Carlos Albuquerque", score=90.0, is_at_risk=False),
            StudentPerformanceMetric(student_name="Fernanda Lima", score=55.0, is_at_risk=True),
            StudentPerformanceMetric(student_name="Paulo Silva", score=45.0, is_at_risk=True),
            StudentPerformanceMetric(student_name="Marcela Santos", score=85.0, is_at_risk=False)
        ]
        
        insights = [
            LearningInsight(category="COMMON_ERROR", description="Erro de sintaxe em declaração de variáveis (45% das submissões)"),
            LearningInsight(category="COMMON_ERROR", description="Falta de indentação após a cláusula 'if' (30% das submissões)"),
            LearningInsight(category="CRITICAL_COMPETENCY", description="Lógica Condicional (If/Else)")
        ]
        
        recommendations = [
            TeacherRecommendation(description="A turma apresentou dificuldade em indentação e estruturas de controle. Sugere-se realizar uma revisão prática com exercícios progressivos de if/else focados estritamente na indentação do bloco principal.")
        ]
        
        return {
            "report": report,
            "class_metric": class_metric,
            "student_metrics": student_metrics,
            "insights": insights,
            "recommendations": recommendations
        }

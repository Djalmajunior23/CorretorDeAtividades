from app.modules.academic_integrity.models import SimilarityReport, SimilarityPair
from app.modules.academic_integrity.analyzers import CodeSimilarityAnalyzer

class AcademicIntegrityService:
    @staticmethod
    def generate_mock_analysis(activity_name: str) -> dict:
        # Generate mock report data for MVP since we don't have enough real code samples yet.
        report = SimilarityReport(
            teacher_id=1,
            activity_name=activity_name,
            analyzed_submissions=15,
            high_risk_cases=2
        )
        
        pairs = [
            SimilarityPair(
                student_a_name="Ana Souza",
                student_b_name="João Silva",
                similarity_score=95.5,
                risk_level="CRÍTICO"
            ),
            SimilarityPair(
                student_a_name="Carlos Mendes",
                student_b_name="Marcia Costa",
                similarity_score=75.0,
                risk_level="ALTO"
            ),
             SimilarityPair(
                student_a_name="Pedro Barros",
                student_b_name="Julia Lopes",
                similarity_score=40.0,
                risk_level="MÉDIO"
            )
        ]
        
        return {
            "report": report,
            "pairs": pairs
        }

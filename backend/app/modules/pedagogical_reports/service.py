import json
from app.modules.pedagogical_reports.models import PedagogicalReport, PedagogicalReportItem, ClassLearningInsight

class PedagogicalReportService:
    @staticmethod
    def generate_mock_report(teacher_id: int, class_name: str, title: str) -> dict:
        # Emulating data analysis over standard corrections
        report = PedagogicalReport(
            teacher_id=teacher_id,
            class_name=class_name,
            title=title,
            average_score=78.5,
            critical_competencies=json.dumps(["Uso de Estruturas de Repetição", "Manipulação de Strings"]),
            recommendations=json.dumps(["Revisar laços For e While", "Exercícios práticos de concatenação e split"])
        )
        
        items = [
            PedagogicalReportItem(student_name="Ana Souza", score=90.0, risk_level="LOW", common_errors=json.dumps([])),
            PedagogicalReportItem(student_name="Carlos Silva", score=65.0, risk_level="MEDIUM", common_errors=json.dumps(["Erro de sintaxe em loop", "Index out of bounds"])),
            PedagogicalReportItem(student_name="Pedro Santos", score=45.0, risk_level="HIGH", common_errors=json.dumps(["Falta de compreensão do problema", "Lógica invertida"]))
        ]
        
        insights = [
            ClassLearningInsight(type="STRENGTH", description="A maioria dos alunos compreende declaração de variáveis e condicionais."),
            ClassLearningInsight(type="WEAKNESS", description="Forte dificuldade em aplicar loops aninhados."),
            ClassLearningInsight(type="SUGGESTION", description="Aplicar quiz gamificado de repetição simples antes de passar para aninhada.")
        ]
        
        return {
            "report": report,
            "items": items,
            "insights": insights
        }

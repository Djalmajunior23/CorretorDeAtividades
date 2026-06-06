from .syntax_analyzer import SyntaxAnalyzer
from .structure_analyzer import StructureAnalyzer
from .logic_analyzer import LogicAnalyzer
from .complexity_analyzer import ComplexityAnalyzer
from .quality_analyzer import QualityAnalyzer
from .feedback_generator import FeedbackGenerator

class CodeAnalysisService:
    @staticmethod
    def analyze_code(code: str, language: str) -> dict:
        syntax = SyntaxAnalyzer.analyze(code, language)
        structure = StructureAnalyzer.analyze(code, language)
        logic = LogicAnalyzer.analyze(code, language)
        complexity = ComplexityAnalyzer.analyze(code, language)
        quality = QualityAnalyzer.analyze(code, language)
        
        feedback = FeedbackGenerator.generate(syntax, structure, logic, complexity, quality)
        
        return {
            "syntax_score": syntax.get("score", 0),
            "quality_score": quality.get("quality_score", 0),
            "complexity_level": complexity.get("complexity_level", "BAIXA"),
            "logic_issues": logic.get("logic_issues", []),
            "quality_issues": quality.get("issues", []),
            "analysis_feedback": feedback
        }

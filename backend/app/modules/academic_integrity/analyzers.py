import ast
from difflib import SequenceMatcher

class CodeSimilarityAnalyzer:
    @staticmethod
    def get_text_similarity(code_a: str, code_b: str) -> float:
        return SequenceMatcher(None, code_a, code_b).ratio() * 100

    @staticmethod
    def get_ast_similarity(code_a: str, code_b: str) -> float:
        try:
            tree_a = ast.parse(code_a)
            tree_b = ast.parse(code_b)
            # Naive AST dump comparison for structure
            dump_a = ast.dump(tree_a, annotate_fields=False)
            dump_b = ast.dump(tree_b, annotate_fields=False)
            return SequenceMatcher(None, dump_a, dump_b).ratio() * 100
        except:
            return 0.0

    @staticmethod
    def analyze_pair(code_a: str, code_b: str) -> float:
        text_sim = CodeSimilarityAnalyzer.get_text_similarity(code_a, code_b)
        ast_sim = CodeSimilarityAnalyzer.get_ast_similarity(code_a, code_b)
        
        # Weighted average
        return (text_sim * 0.4) + (ast_sim * 0.6)
    
    @staticmethod
    def classify_risk(score: float) -> str:
        if score <= 30: return "BAIXO"
        if score <= 60: return "MÉDIO"
        if score <= 80: return "ALTO"
        return "CRÍTICO"

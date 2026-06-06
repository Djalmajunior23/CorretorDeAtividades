import ast

class ComplexityAnalyzer:
    @staticmethod
    def analyze(code: str, language: str) -> dict:
        complexity_level = "BAIXA"
        nested_loops = 0
        warnings = []
        
        if language.lower() in ("python", "py"):
            try:
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    if isinstance(node, (ast.For, ast.While)):
                        # Look for nested loops
                        for child in ast.walk(node):
                            if child is not node and isinstance(child, (ast.For, ast.While)):
                                nested_loops += 1
                
                if nested_loops == 1:
                    complexity_level = "MEDIA"
                elif nested_loops > 1:
                    complexity_level = "ALTA"
                    warnings.append("Detectado aninhamento profundo de loops, o que aumenta muito a complexidade.")
                    
            except SyntaxError:
                pass
                
        return {
            "complexity_level": complexity_level,
            "nested_loops": nested_loops,
            "warnings": warnings
        }

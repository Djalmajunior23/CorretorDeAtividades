import ast

class QualityAnalyzer:
    @staticmethod
    def analyze(code: str, language: str) -> dict:
        quality_score = 100
        issues = []
        
        if language.lower() in ("python", "py"):
            try:
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    # Check for single-letter variables
                    if isinstance(node, ast.Name):
                        if len(node.id) == 1 and node.id not in ("i", "j", "k", "x", "y", "z", "_"):
                            issues.append(f"Variável '{node.id}' possui nome pouco descritivo.")
                            quality_score -= 2
                            
                # Check for comments
                if "#" not in code:
                    issues.append("Considere adicionar comentários para explicar a lógica do seu código.")
                    quality_score -= 5
                
            except SyntaxError:
                pass
                
        return {
            "quality_score": max(0, quality_score),
            "issues": list(set(issues)) # unique issues
        }

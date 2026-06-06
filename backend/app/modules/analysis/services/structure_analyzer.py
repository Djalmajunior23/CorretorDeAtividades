import ast

class StructureAnalyzer:
    @staticmethod
    def analyze(code: str, language: str) -> dict:
        results = {
            "functions": 0,
            "classes": 0,
            "conditionals": 0,
            "loops": 0,
            "modularity_score": 0
        }
        
        if language.lower() in ("python", "py"):
            try:
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        results["functions"] += 1
                    elif isinstance(node, ast.ClassDef):
                        results["classes"] += 1
                    elif isinstance(node, ast.If):
                        results["conditionals"] += 1
                    elif isinstance(node, (ast.For, ast.While)):
                        results["loops"] += 1
                
                # Basic logic for modularity score
                if results["functions"] > 0 or results["classes"] > 0:
                    results["modularity_score"] = min(10, (results["functions"] * 2) + (results["classes"] * 3))
                else:
                    results["modularity_score"] = 2 # Basic score for flat scripts
                    
            except SyntaxError:
                pass

        return results

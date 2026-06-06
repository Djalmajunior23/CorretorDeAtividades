import ast

class LogicAnalyzer:
    @staticmethod
    def analyze(code: str, language: str) -> dict:
        issues = []
        if language.lower() in ("python", "py"):
            try:
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    # Check for empty if blocks or pass
                    if isinstance(node, ast.If):
                        if all(isinstance(stmt, ast.Pass) for stmt in node.body):
                            issues.append("Encontrado um bloco condicional 'if' vazio ou contendo apenas 'pass'.")
                    
                    # Check while True without break (simple heuristic)
                    if isinstance(node, ast.While):
                        if isinstance(node.test, ast.Constant) and node.test.value is True:
                            has_break = any(isinstance(stmt, ast.Break) for child in ast.walk(node) for stmt in getattr(child, 'body', []))
                            if not has_break:
                                issues.append("Possível loop infinito ('while True') sem instrução de 'break'.")
                                
            except SyntaxError:
                pass
                
        return {
            "logic_issues": issues
        }

import ast

class SyntaxAnalyzer:
    @staticmethod
    def analyze(code: str, language: str) -> dict:
        if language.lower() in ("python", "py"):
            try:
                ast.parse(code)
                return {
                    "syntax_ok": True,
                    "errors": [],
                    "score": 100
                }
            except SyntaxError as e:
                return {
                    "syntax_ok": False,
                    "errors": [f"Line {e.lineno}: {e.msg}"],
                    "score": 0
                }
        else:
            # Fallback for other languages to not break existing flow
            return {
                "syntax_ok": True,
                "errors": [],
                "score": 100,
                "info": f"Detailed syntax logic for {language} pending"
            }

import ast
import subprocess
import sys
import json
import io
import contextlib

from modules.execution.docker_sandbox_executor import DockerSandboxExecutor

class CodeExecutionService:
    sandbox = DockerSandboxExecutor()

    @staticmethod
    def validate_syntax(code: str) -> bool:
        # (existing implementation)
        try:
            ast.parse(code)
            # Bloqueio simples de comandos perigosos na sintaxe
            forbidden_nodes = (ast.Import, ast.ImportFrom)
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, forbidden_nodes):
                    for alias in node.names:
                        if alias.name in ['os', 'subprocess', 'sys', 'socket']:
                            return False
            return True
        except SyntaxError:
            return False

    @classmethod
    def perform_correction(cls, code: str, test_cases: list[dict]) -> dict:
        """Realiza a correção completa via Docker Sandbox."""
        syntax_ok = cls.validate_syntax(code)
        
        if not syntax_ok:
            return {
                "syntax_ok": False,
                "security_ok": True, # Still safe
                "tests_passed": 0,
                "total_tests": len(test_cases),
                "score": 0,
                "feedback": "Erro de sintaxe detectado."
            }

        # Run tests in sandbox
        sandbox_result = cls.sandbox.run_python_tests(code, test_cases)
        
        # Calculate stats (simplified)
        tests_passed = sandbox_result["passed"]
        total_tests = sandbox_result["total"]
        
        score = 30 + (50 * (tests_passed / total_tests) if total_tests > 0 else 0) + 20
        feedback = "Código executado com sucesso. " + (f"{tests_passed} de {total_tests} testes passaram." if total_tests > 0 else "")
        
        return {
            "syntax_ok": True,
            "security_ok": True,
            "tests_passed": tests_passed,
            "total_tests": total_tests,
            "score": int(min(score, 100)),
            "feedback": feedback
        }


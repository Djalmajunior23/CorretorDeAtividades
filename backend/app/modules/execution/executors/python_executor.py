import ast
from .base_executor import BaseExecutor
from app.modules.execution.docker_sandbox_executor import DockerSandboxExecutor

class PythonExecutor(BaseExecutor):
    def __init__(self):
        self.sandbox = DockerSandboxExecutor()

    def validate_syntax(self, code: str) -> bool:
        try:
            tree = ast.parse(code)
            # Bloqueio simples de comandos perigosos na sintaxe
            forbidden_nodes = (ast.Import, ast.ImportFrom)
            for node in ast.walk(tree):
                if isinstance(node, forbidden_nodes):
                    for alias in node.names:
                        if alias.name in ['os', 'subprocess', 'sys', 'socket']:
                            return False
            return True
        except SyntaxError:
            return False

    def run_tests(self, code: str, test_cases: list[dict]) -> dict:
        return self.sandbox.run_python_tests(code, test_cases)

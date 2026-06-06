from .base_executor import BaseExecutor
from .python_executor import PythonExecutor

class ExecutorFactory:
    @staticmethod
    def get_executor(language: str) -> BaseExecutor:
        # Defaults to Python
        if language.lower() == 'python':
            return PythonExecutor()
        elif language.lower() in ('javascript', 'js'):
            # TODO: Implement JavascriptExecutor
            return PythonExecutor() # Mock fallback
        elif language.lower() == 'java':
            # TODO: Implement JavaExecutor
            return PythonExecutor() # Mock fallback
        else:
            return PythonExecutor()

from sqlmodel import Session
from modules.execution.code_execution_service import CodeExecutionService

class TeacherService:
    @staticmethod
    def run_quick_correction(code: str, test_cases: list[dict]):
        return CodeExecutionService.perform_correction(code, test_cases)

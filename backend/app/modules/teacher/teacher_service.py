from sqlmodel import Session
from app.modules.execution.code_execution_service import CodeExecutionService
from app.models.correction_result import CorrectionResult
import json

class TeacherService:
    @staticmethod
    def run_quick_correction(code: str, language: str, test_cases: list[dict], session: Session) -> dict:
        result = CodeExecutionService.perform_correction(code, language, test_cases)
        
        # Save to DB
        correction_record = CorrectionResult(
            syntax_score=result["analysis"].get("syntax_score", 0),
            test_score=int(result["tests_passed"] / max(result["total_tests"], 1) * 100),
            quality_score=result["analysis"].get("quality_score", 0),
            final_score=result["score"],
            feedback=json.dumps(result["feedback"]),
            stdout=result["stdout"],
            stderr=result["stderr"],
            execution_time=0.0
        )
        session.add(correction_record)
        session.commit()
        session.refresh(correction_record)
        
        result["id"] = correction_record.id
        return result

import ast
import subprocess
import sys
import json
import io
import contextlib

from app.modules.execution.executors.executor_factory import ExecutorFactory
from app.modules.analysis.services.code_analysis_service import CodeAnalysisService

class CodeExecutionService:
    @classmethod
    def perform_correction(cls, code: str, language: str, test_cases: list[dict]) -> dict:
        """Realiza a correção avançada (Execução + Análise Estática)."""
        dangerous_keywords = ["import os", "import subprocess", "import socket", "open(", "eval(", "exec(", "__import__"]
        for keyword in dangerous_keywords:
            if keyword in code:
                return {
                    "syntax_ok": True,
                    "security_ok": False,
                    "tests_passed": 0,
                    "total_tests": max(len(test_cases), 1),
                    "score": 0,
                    "feedback": "Código bloqueado por conter instruções não permitidas.",
                    "analysis": {},
                    "stdout": "",
                    "stderr": "Security violation"
                }

        executor = ExecutorFactory.get_executor(language)
        
        # 1. Análise inteligente 
        analysis_result = CodeAnalysisService.analyze_code(code, language)
        syntax_ok = executor.validate_syntax(code) and analysis_result.get("syntax_score", 0) > 0
        
        if not syntax_ok:
            return {
                "syntax_ok": False,
                "security_ok": True,
                "tests_passed": 0,
                "total_tests": len(test_cases),
                "score": 0,
                "feedback": "Erro de sintaxe detectado.",
                "analysis": analysis_result,
                "stdout": "",
                "stderr": "Syntax Error"
            }

        # 2. Run tests in sandbox
        sandbox_result = executor.run_tests(code, test_cases)
        
        # 3. Calculate stats
        tests_passed = sandbox_result.get("passed", 0)
        total_tests = sandbox_result.get("total", len(test_cases))
        
        final_score = 0
        if total_tests > 0:
            final_score = int(100 * (tests_passed / total_tests))
            
        # 4. Integrate Feedback
        pedagogical_feedback = analysis_result.get("analysis_feedback", {})
        
        details = sandbox_result.get("details", [])
        last_stdout = details[-1]["actual"] if details else sandbox_result.get("stdout", "")
        last_stderr = sandbox_result.get("stderr", "")
        
        # Atualizar resumo dependendo dos testes
        if final_score < 100:
            msg = f"Passou em {tests_passed} de {total_tests} testes."
            pedagogical_feedback["summary"] = pedagogical_feedback.get("summary", "") + msg
        else:
            pedagogical_feedback["summary"] = "Código executado com sucesso."
            
        return {
            "syntax_ok": True,
            "security_ok": True,
            "tests_passed": tests_passed,
            "total_tests": total_tests,
            "score": final_score,
            "feedback": pedagogical_feedback.get("summary", "Código executado com sucesso."),
            "analysis": analysis_result,
            "stdout": last_stdout,
            "stderr": last_stderr
        }


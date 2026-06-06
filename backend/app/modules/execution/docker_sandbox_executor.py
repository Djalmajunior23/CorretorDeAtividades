import docker
import tempfile
import os
import shutil

class DockerSandboxExecutor:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except Exception:
            self.client = None

    def _is_available(self):
        return self.client is not None

    def run_python_code(self, code: str, input_data: str = "") -> dict:
        if not self._is_available():
            import sys
            import io
            import contextlib
            try:
                output = io.StringIO()
                input_stream = io.StringIO(input_data)
                
                # We must redirect sys.stdin
                old_stdin = sys.stdin
                sys.stdin = input_stream
                
                with contextlib.redirect_stdout(output):
                    exec(code, {})
                    
                sys.stdin = old_stdin
                return {"stdout": output.getvalue(), "stderr": "", "exit_code": 0}
            except Exception as e:
                import traceback
                # Restore stdin if exception occurs
                if 'old_stdin' in locals():
                    sys.stdin = old_stdin
                return {"stdout": "", "stderr": traceback.format_exc(), "exit_code": 1}

        # Create temporary directory for code
        with tempfile.TemporaryDirectory() as tmpdir:
            with open(os.path.join(tmpdir, "main.py"), "w") as f:
                f.write(code)

            try:
                container = self.client.containers.run(
                    "codecheck-python-sandbox",
                    command="python main.py",
                    volumes={tmpdir: {'bind': '/sandbox', 'mode': 'ro'}},
                    detach=False,
                    network_mode="none",
                    mem_limit="128m",
                    nano_cpus=500000000,
                    pids_limit=64,
                    read_only=True,
                    cap_drop=["ALL"],
                    tty=False,
                    stdout=True,
                    stderr=True,
                    stdin_open=True,
                    user="runner"
                )
                
                return {
                    "stdout": container.decode('utf-8') if isinstance(container, bytes) else "",
                    "stderr": "",
                    "exit_code": 0
                }
            except docker.errors.ContainerError as e:
                return {"stdout": "", "stderr": e.stderr.decode('utf-8') if e.stderr else str(e), "exit_code": e.exit_status}
            except Exception as e:
                return {"error": f"Erro na execução: {str(e)}"}

    def run_python_tests(self, code: str, test_cases: list[dict]) -> dict:
        # Simplified test runner for sandbox
        results = []
        for case in test_cases:
            res = self.run_python_code(code, case["input"])
            results.append({
                "input": case["input"],
                "expected": case["expected_output"],
                "actual": res.get("stdout", "").strip(),
                "passed": res.get("stdout", "").strip() == case["expected_output"].strip()
            })
        
        passed_count = sum(1 for r in results if r["passed"])
        return {"passed": passed_count, "total": len(test_cases), "details": results}

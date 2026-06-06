from abc import ABC, abstractmethod

class BaseExecutor(ABC):
    @abstractmethod
    def validate_syntax(self, code: str) -> bool:
        pass

    @abstractmethod
    def run_tests(self, code: str, test_cases: list[dict]) -> dict:
        pass

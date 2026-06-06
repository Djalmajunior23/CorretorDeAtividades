from pydantic import BaseModel
from typing import List, Optional

class TestCaseSchema(BaseModel):
    input: str
    expected_output: str

class OCRConfirmRequest(BaseModel):
    ocr_id: int
    edited_text: str
    language: str = "python"
    test_cases: List[TestCaseSchema] = []

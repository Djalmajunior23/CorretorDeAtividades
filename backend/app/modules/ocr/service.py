import os
import shutil
import uuid
import re
from fastapi import UploadFile
from PIL import Image

class OCRService:
    @staticmethod
    def is_ocr_available() -> bool:
        try:
            import pytesseract
            # Test if tesseract executable is installed
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    @staticmethod
    def save_image(file: UploadFile) -> str:
        upload_dir = "uploads/ocr"
        os.makedirs(upload_dir, exist_ok=True)
        # Generate safe name
        ext = file.filename.split(".")[-1]
        safe_name = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(upload_dir, safe_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path

    @staticmethod
    def extract_text(file_path: str) -> str:
        if not OCRService.is_ocr_available():
            raise Exception("OCR indisponível. Verifique a instalação do Tesseract ou configure o serviço OCR.")
        
        import pytesseract
        try:
            img = Image.open(file_path)
            # Basic OCR extraction
            text = pytesseract.image_to_string(img)
            return OCRService.normalize_code_text(text)
        except Exception as e:
            raise Exception(f"Falha na extração de texto: {str(e)}")

    @staticmethod
    def normalize_code_text(text: str) -> str:
        # Basic normalization for common OCR code errors
        # Python specific
        
        # O/0 issues
        # Hard to safely automate without parsing context, but let's do minimal cleanups
        
        # Replace smart quotes with standard quotes
        text = text.replace("‘", "'").replace("’", "'")
        text = text.replace("“", '"').replace("”", '"')
        
        # Fix indentation lost or weird spaced (very basic)
        lines = text.split("\n")
        cleaned_lines = []
        for line in lines:
            line = line.rstrip() # remove trailing spaces
            cleaned_lines.append(line)
            
        return "\n".join(cleaned_lines)

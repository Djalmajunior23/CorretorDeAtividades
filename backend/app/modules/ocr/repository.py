from sqlmodel import Session, select
from app.models.ocr_extraction import OCRExtraction

class OCRRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, ocr: OCRExtraction) -> OCRExtraction:
        self.session.add(ocr)
        self.session.commit()
        self.session.refresh(ocr)
        return ocr

    def get_by_id(self, ocr_id: int) -> OCRExtraction | None:
        return self.session.get(OCRExtraction, ocr_id)
    
    def update(self, ocr: OCRExtraction) -> OCRExtraction:
        self.session.add(ocr)
        self.session.commit()
        self.session.refresh(ocr)
        return ocr

    def get_all_by_teacher(self, teacher_id: int) -> list[OCRExtraction]:
        stmt = select(OCRExtraction).where(OCRExtraction.teacher_id == teacher_id).order_by(OCRExtraction.created_at.desc())
        return self.session.exec(stmt).all()

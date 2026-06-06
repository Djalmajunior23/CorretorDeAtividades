from sqlmodel import Session, select
from typing import List, Optional
from app.modules.academic_integrity.models import SimilarityReport, SimilarityPair, AcademicIntegrityCase

class AcademicIntegrityRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_report(self, report: SimilarityReport) -> SimilarityReport:
        self.session.add(report)
        self.session.commit()
        self.session.refresh(report)
        return report

    def create_pair(self, pair: SimilarityPair) -> SimilarityPair:
        self.session.add(pair)
        self.session.commit()
        self.session.refresh(pair)
        return pair
        
    def get_report(self, report_id: int) -> Optional[SimilarityReport]:
        return self.session.get(SimilarityReport, report_id)
        
    def get_pairs_by_report(self, report_id: int) -> List[SimilarityPair]:
        stmt = select(SimilarityPair).where(SimilarityPair.report_id == report_id).order_by(SimilarityPair.similarity_score.desc())
        return list(self.session.exec(stmt).all())
        
    def get_reports_by_teacher(self, teacher_id: int) -> List[SimilarityReport]:
        stmt = select(SimilarityReport).where(SimilarityReport.teacher_id == teacher_id).order_by(SimilarityReport.created_at.desc())
        return list(self.session.exec(stmt).all())
        
    def get_pair(self, pair_id: int) -> Optional[SimilarityPair]:
        return self.session.get(SimilarityPair, pair_id)
        
    def create_case(self, case: AcademicIntegrityCase) -> AcademicIntegrityCase:
        self.session.add(case)
        self.session.commit()
        self.session.refresh(case)
        return case

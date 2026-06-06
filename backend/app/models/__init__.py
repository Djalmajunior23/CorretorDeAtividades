# Import all models here so Alembic can find them
from .user import User
from .activity import Activity
from .rubric import Rubric
from .question import Question
from .test_case import TestCase
from .submission import Submission
from .correction_result import CorrectionResult
from .student_profile import StudentLearningProfile

# The existing simple classroom model can be replaced or kept, we will keep it but now we have complete models
from .classroom import Classroom

from .attempt import Attempt
from .ocr_extraction import OCRExtraction

from .batch_job import BatchCorrectionJob
from .batch_item import BatchCorrectionItem
from .batch_result import BatchCorrectionResult

from .classroom_models import ClassroomConnection, ClassroomCourse, ClassroomCourseWork, ClassroomSubmission, ClassroomSyncLog
from .plagiarism_models import SimilarityReport, SimilaritySegment, PlagiarismCase
from .adaptive_models import LearningPath, LearningPathStep, RecoveryCycle, CompetencyEvolution, LearningRecommendation
from .academic_models import Institution, Campus, AcademicIndicator, RiskStudent, ClassPerformance
from .saep_models import CompetencyMatrix, LearningEvidence, SAEPIndicator, ActionPlan
from .curriculum_models import Course, CurriculumUnit, Competency, Skill, LearningObjective, EvaluationCriterion, TeachingPlan
from .ai_assistant_models import AIConversation, AIMessage, GeneratedArtifact, PromptTemplate
from .assessment_models import Assessment, AssessmentQuestion, Alternative, AssessmentRubric, AnswerKey, AssessmentTemplate
from .content_factory_models import ContentProject, GeneratedContent, ContentTemplate, ContentLibrary

__all__ = [
    "User",
    "Activity",
    "Rubric",
    "Question",
    "TestCase",
    "Submission",
    "CorrectionResult",
    "StudentLearningProfile",
    "Classroom",
    "Attempt",
    "OCRExtraction",
    "BatchCorrectionJob",
    "BatchCorrectionItem",
    "BatchCorrectionResult",
    "ClassroomConnection",
    "ClassroomCourse",
    "ClassroomCourseWork",
    "ClassroomSubmission",
    "ClassroomSyncLog",
    "SimilarityReport",
    "SimilaritySegment",
    "PlagiarismCase",
    "LearningPath",
    "LearningPathStep",
    "RecoveryCycle",
    "CompetencyEvolution",
    "LearningRecommendation",
    "Institution",
    "Campus",
    "AcademicIndicator",
    "RiskStudent",
    "ClassPerformance",
    "CompetencyMatrix",
    "LearningEvidence",
    "SAEPIndicator",
    "ActionPlan",
    "Course",
    "CurriculumUnit",
    "Competency",
    "Skill",
    "LearningObjective",
    "EvaluationCriterion",
    "TeachingPlan",
    "AIConversation",
    "AIMessage",
    "GeneratedArtifact",
    "PromptTemplate",
    "Assessment",
    "AssessmentQuestion",
    "Alternative",
    "AssessmentRubric",
    "AnswerKey",
    "AssessmentTemplate",
    "ContentProject",
    "GeneratedContent",
    "ContentTemplate",
    "ContentLibrary"
]

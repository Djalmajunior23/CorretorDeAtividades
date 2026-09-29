import { describe, it, expect } from "vitest";
import {
  TeacherClassroomExamStudioService,
  TeacherExamSuite,
  StudentOmrSubmission,
} from "../services/teacherClassroomExamStudioService";
import {
  TeacherInteractiveLessonKitService,
  TeacherLessonKit,
} from "../services/teacherInteractiveLessonKitService";

describe("Teacher Classroom Exam Studio & Interactive Lesson Kit Suite", () => {
  let examSuite: TeacherExamSuite;
  let lessonKit: TeacherLessonKit;

  // =========================================================================
  // 1. GERAÇÃO DE SUÍTE DE PROVAS MULTIVERSÃO COM GABARITOS CRUZADOS
  // =========================================================================
  describe("Gerador Hiper-Paramétrico de Provas Multiversão (A, B, C, D)", () => {
    it("deve gerar uma suíte de avaliação mestre com total de 100 pontos", async () => {
      examSuite = await TeacherClassroomExamStudioService.generateExamSuite({
        subject: "Banco de Dados & Big Data",
        topic: "Modelagem Relacional e Otimização de Índices",
        courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
        educationLevel: "SENAI_TECNICO",
        questionCount: 5,
        variantCount: 4,
        teacherName: "Prof. Roberto Djalma",
        academicPeriod: "2026/1",
      });

      expect(examSuite).toBeDefined();
      expect(examSuite.id).toMatch(/^EXAM-/);
      expect(examSuite.masterQuestions).toHaveLength(5);

      const totalPoints = examSuite.masterQuestions.reduce((acc, q) => acc + q.points, 0);
      expect(totalPoints).toBe(100);

      examSuite.masterQuestions.forEach((q) => {
        expect(q.statement).toBeTruthy();
        expect(q.bloomTaxonomyLevel).toBeDefined();
        expect(q.competencyCode).toBeTruthy();
        expect(q.options).toBeDefined();
        expect(q.options!.length).toBeGreaterThanOrEqual(4);
        expect(q.options!.some((o) => o.isCorrect)).toBe(true);
      });
    });

    it("deve gerar 4 variantes (A, B, C, D) com permutação e gabarito mapeado", async () => {
      expect(examSuite.variants).toHaveLength(4);

      const variantCodes = examSuite.variants.map((v) => v.variantCode);
      expect(variantCodes).toEqual(["A", "B", "C", "D"]);

      examSuite.variants.forEach((variant) => {
        expect(variant.questions).toHaveLength(5);
        expect(variant.antiCheatSeed).toBeTruthy();
        expect(variant.qrCodeSignature).toBeTruthy();

        // Verificar que cada questão possui resposta mapeada no answerKeyMap
        for (let i = 1; i <= 5; i++) {
          const expectedKey = variant.answerKeyMap[i];
          expect(["A", "B", "C", "D", "DISCURSIVA"]).toContain(expectedKey);
        }
      });
    });
  });

  // =========================================================================
  // 2. CORREÇÃO ÓPTICA EXPRESSA DE CARTÕES-RESPOSTA (OMR ENGINE)
  // =========================================================================
  describe("Avaliador Óptico Express de Cartão-Resposta (OMR Engine)", () => {
    it("deve avaliar com 100% de acerto um aluno que marcou o gabarito exato", () => {
      const variantA = examSuite.variants[0];
      const perfectSubmission: StudentOmrSubmission = {
        studentId: "ALUNO-PERFEITO-01",
        studentName: "Lucas Alcantara",
        variantCode: variantA.variantCode,
        markedAnswers: {
          1: variantA.answerKeyMap[1],
          2: variantA.answerKeyMap[2],
          3: variantA.answerKeyMap[3],
          4: variantA.answerKeyMap[4],
          5: variantA.answerKeyMap[5],
        },
      };

      const result = TeacherClassroomExamStudioService.gradeStudentSubmission(perfectSubmission, examSuite);

      expect(result.scorePercentage).toBe(100);
      expect(result.isApproved).toBe(true);
      expect(result.correctCount).toBe(5);
      expect(result.wrongCount).toBe(0);
      expect(result.blankCount).toBe(0);
      expect(result.pedagogicalFeedback).toContain("Excelente desempenho");
    });

    it("deve reprovar (isApproved = false) aluno com nota < 60% e gerar plano de reforço", () => {
      const variantB = examSuite.variants[1];
      const failingSubmission: StudentOmrSubmission = {
        studentId: "ALUNO-RECUPERACAO-02",
        studentName: "Mariana Costa",
        variantCode: variantB.variantCode,
        markedAnswers: {
          1: variantB.answerKeyMap[1], // 1 acerto (20 pts)
          2: "Z_ERRADA",
          3: "Z_ERRADA",
          4: "Z_ERRADA",
          5: "Z_ERRADA",
        },
      };

      const result = TeacherClassroomExamStudioService.gradeStudentSubmission(failingSubmission, examSuite);

      expect(result.scorePercentage).toBeLessThan(60);
      expect(result.isApproved).toBe(false);
      expect(result.correctCount).toBe(1);
      expect(result.wrongCount).toBe(4);
      expect(result.pedagogicalFeedback).toContain("Abaixo do critério de proficiência mínima");
    });

    it("deve processar lote de submissões da turma e gerar métricas e diagnósticos de distratores", () => {
      const variantA = examSuite.variants[0];
      const batchSubmissions: StudentOmrSubmission[] = [
        {
          studentId: "STU-01",
          studentName: "Aluno 1",
          variantCode: "A",
          markedAnswers: { 1: variantA.answerKeyMap[1], 2: variantA.answerKeyMap[2], 3: variantA.answerKeyMap[3], 4: variantA.answerKeyMap[4], 5: variantA.answerKeyMap[5] },
        },
        {
          studentId: "STU-02",
          studentName: "Aluno 2",
          variantCode: "A",
          markedAnswers: { 1: variantA.answerKeyMap[1], 2: "B", 3: "C", 4: variantA.answerKeyMap[4], 5: "D" },
        },
        {
          studentId: "STU-03",
          studentName: "Aluno 3",
          variantCode: "A",
          markedAnswers: { 1: "C", 2: "C", 3: "C", 4: "C", 5: "C" },
        },
      ];

      const report = TeacherClassroomExamStudioService.gradeBatchSubmissions(batchSubmissions, examSuite);

      expect(report.totalSubmissions).toBe(3);
      expect(report.classAverage).toBeGreaterThan(0);
      expect(report.highestScore).toBe(100);
      expect(report.recommendedInterventions.length).toBeGreaterThan(0);
      expect(report.studentResults).toHaveLength(3);
    });
  });

  // =========================================================================
  // 3. EXPORTADOR DE CADERNO DE PROVAS E CARTÕES OMR EM PDF
  // =========================================================================
  describe("Exportador Unificado de Caderno de Provas & Gabaritos em PDF", () => {
    it("deve gerar Buffer de PDF válido para impressão", async () => {
      const pdfBuffer = await TeacherClassroomExamStudioService.exportExamBundlePdf(examSuite, {
        includeVariants: ["A", "B"],
        includeTeacherMasterKey: true,
        includeOmrBubbleSheets: true,
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      // Validar assinatura do cabeçalho PDF (%PDF-)
      const headerStr = Buffer.from(pdfBuffer).subarray(0, 5).toString("utf-8");
      expect(headerStr).toContain("%PDF");
    });
  });

  // =========================================================================
  // 4. PLANO DE AULA DINÂMICO & LABORATÓRIOS PRÁTICOS (HANDS-ON)
  // =========================================================================
  describe("Teacher Interactive Lesson Kit & Hands-on Lab Studio", () => {
    it("deve gerar um kit de aula estruturado com cronograma minuto a minuto e desafios", async () => {
      lessonKit = await TeacherInteractiveLessonKitService.generateLessonKit({
        topic: "Clean Architecture & Cláusulas de Guarda",
        subject: "Desenvolvimento Orientado a Testes",
        courseName: "Técnico em Desenvolvimento de Sistemas",
        targetDurationMinutes: 100,
        methodology: "PBL",
        programmingLanguage: "TypeScript",
      });

      expect(lessonKit).toBeDefined();
      expect(lessonKit.id).toMatch(/^KIT-/);
      expect(lessonKit.lessonSchedule.length).toBeGreaterThanOrEqual(4);

      // Verificar as 5 fases pedagógicas
      const phases = lessonKit.lessonSchedule.map((s) => s.phase);
      expect(phases).toContain("AQUECIMENTO");
      expect(phases).toContain("PRATICA_HANDS_ON");

      // Verificar laboratório prático com auto-grading e dicas escalonadas
      const lab = lessonKit.practicalLab;
      expect(lab.starterCode.content).toBeTruthy();
      expect(lab.unitTests.length).toBeGreaterThan(0);
      expect(lab.tieredHints).toHaveLength(3);
      expect(lab.tieredHints.map((h) => h.tier)).toEqual([1, 2, 3]);
      expect(lab.saepRubric.length).toBeGreaterThan(0);

      // Verificar slides e exit ticket
      expect(lessonKit.interactiveSlides.length).toBeGreaterThan(0);
      expect(lessonKit.exitTicketQuestions.length).toBeGreaterThan(0);
    });

    it("deve exportar o Plano de Aula & Guia de Laboratório em PDF válido", async () => {
      const pdfBuffer = await TeacherInteractiveLessonKitService.exportLessonKitPdf(lessonKit, {
        includeTeacherSchedule: true,
        includeStudentLabGuide: true,
        includeSaepRubric: true,
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      const headerStr = Buffer.from(pdfBuffer).subarray(0, 5).toString("utf-8");
      expect(headerStr).toContain("%PDF");
    });
  });
});

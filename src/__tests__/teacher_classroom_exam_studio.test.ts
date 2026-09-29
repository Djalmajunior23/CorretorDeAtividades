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
  let examSuite5Q: TeacherExamSuite;
  let examSuite40Q: TeacherExamSuite;
  let lessonKit: TeacherLessonKit;

  // =========================================================================
  // 1. GERAÇÃO DE SUÍTE DE PROVAS MULTIVERSÃO COM GABARITOS CRUZADOS (5Q & 40Q)
  // =========================================================================
  describe("Gerador Hiper-Paramétrico de Provas Multiversão (A, B, C, D)", () => {
    it("deve gerar uma suíte de avaliação mestre básica com total de 100 pontos", async () => {
      examSuite5Q = await TeacherClassroomExamStudioService.generateExamSuite({
        subject: "Banco de Dados & Big Data",
        topic: "Modelagem Relacional e Otimização de Índices",
        courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
        educationLevel: "SENAI_TECNICO",
        questionCount: 5,
        variantCount: 4,
        teacherName: "Prof. Roberto Djalma",
        academicPeriod: "2026/1",
      });

      expect(examSuite5Q).toBeDefined();
      expect(examSuite5Q.id).toMatch(/^EXAM-/);
      expect(examSuite5Q.masterQuestions).toHaveLength(5);

      const totalPoints = examSuite5Q.masterQuestions.reduce((acc, q) => acc + q.points, 0);
      expect(Math.round(totalPoints)).toBe(100);

      examSuite5Q.masterQuestions.forEach((q) => {
        expect(q.statement).toBeTruthy();
        expect(q.bloomTaxonomyLevel).toBeDefined();
        expect(q.competencyCode).toBeTruthy();
        expect(q.options).toBeDefined();
        expect(q.options!.length).toBeGreaterThanOrEqual(4);
        expect(q.options!.some((o) => o.isCorrect)).toBe(true);
      });
    });

    it("deve gerar uma prova de NO MÍNIMO 40 QUESTÕES MULTIASSUNTO com breakdown de disciplinas", async () => {
      const multiSubjects = [
        "Algoritmos & Estruturas de Dados",
        "Banco de Dados Relacional & SQL",
        "Engenharia de Software & Clean Code",
        "Segurança da Informação, DevSecOps & LGPD"
      ];

      examSuite40Q = await TeacherClassroomExamStudioService.generateExamSuite({
        subject: "Desenvolvimento de Software",
        topic: "Simulado Integrador Geral Multiassunto",
        multiSubjects,
        courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
        educationLevel: "SENAI_TECNICO",
        questionCount: 40,
        variantCount: 4,
        teacherName: "Prof. Coordenador SENAI",
        academicPeriod: "2026/1",
      });

      expect(examSuite40Q).toBeDefined();
      expect(examSuite40Q.masterQuestions).toHaveLength(40);
      expect(examSuite40Q.durationMinutes).toBe(180);

      // Verificar total de 100 pontos distribuídos
      const totalPoints = examSuite40Q.masterQuestions.reduce((acc, q) => acc + q.points, 0);
      expect(Math.round(totalPoints)).toBe(100);

      // Verificar breakdown multiassunto
      expect(examSuite40Q.subjectBreakdown).toBeDefined();
      expect(examSuite40Q.subjectBreakdown!.length).toBeGreaterThanOrEqual(4);

      // Verificar que cada uma das 4 variantes tem exatamente 40 questões permutadas
      expect(examSuite40Q.variants).toHaveLength(4);
      examSuite40Q.variants.forEach((v) => {
        expect(v.questions).toHaveLength(40);
        expect(Object.keys(v.answerKeyMap)).toHaveLength(40);
      });
    });

    it("deve gerar 4 variantes (A, B, C, D) com permutação e gabarito mapeado", async () => {
      expect(examSuite5Q.variants).toHaveLength(4);

      const variantCodes = examSuite5Q.variants.map((v) => v.variantCode);
      expect(variantCodes).toEqual(["A", "B", "C", "D"]);

      examSuite5Q.variants.forEach((variant) => {
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
  // 2. CORREÇÃO ÓPTICA EXPRESSA DE CARTÕES-RESPOSTA (OMR ENGINE - 40Q)
  // =========================================================================
  describe("Avaliador Óptico Express de Cartão-Resposta (OMR Engine)", () => {
    it("deve avaliar com 100% de acerto um simulado de 40 questões com gabarito perfeito", () => {
      const variantA = examSuite40Q.variants[0];
      const markedAnswers: Record<number, string> = {};
      for (let i = 1; i <= 40; i++) {
        markedAnswers[i] = variantA.answerKeyMap[i];
      }

      const perfectSubmission: StudentOmrSubmission = {
        studentId: "ALUNO-40Q-PERFEITO",
        studentName: "Juliana Mendes Vasconcelos",
        variantCode: "A",
        markedAnswers,
      };

      const result = TeacherClassroomExamStudioService.gradeStudentSubmission(perfectSubmission, examSuite40Q);

      expect(result.scorePercentage).toBe(100);
      expect(result.isApproved).toBe(true);
      expect(result.correctCount).toBe(40);
      expect(result.wrongCount).toBe(0);
      expect(result.blankCount).toBe(0);
      expect(result.pedagogicalFeedback).toContain("Excelente desempenho multidisciplinar");
    });

    it("deve reprovar (isApproved = false) aluno com nota < 60% e gerar plano de reforço", () => {
      const variantB = examSuite5Q.variants[1];
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

      const result = TeacherClassroomExamStudioService.gradeStudentSubmission(failingSubmission, examSuite5Q);

      expect(result.scorePercentage).toBeLessThan(60);
      expect(result.isApproved).toBe(false);
      expect(result.correctCount).toBe(1);
      expect(result.wrongCount).toBe(4);
      expect(result.pedagogicalFeedback).toContain("Abaixo do critério de proficiência mínima");
    });

    it("deve processar lote de submissões de simulado 40Q e gerar métricas de turma", () => {
      const variantA = examSuite40Q.variants[0];
      const batchSubmissions: StudentOmrSubmission[] = [
        {
          studentId: "STU-40Q-01",
          studentName: "Aluno Nota 100",
          variantCode: "A",
          markedAnswers: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, variantA.answerKeyMap[i + 1]])),
        },
        {
          studentId: "STU-40Q-02",
          studentName: "Aluno Mediano",
          variantCode: "A",
          markedAnswers: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, (i % 2 === 0 ? variantA.answerKeyMap[i + 1] : "Z")])),
        },
        {
          studentId: "STU-40Q-03",
          studentName: "Aluno Crítico",
          variantCode: "A",
          markedAnswers: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, (i % 4 === 0 ? variantA.answerKeyMap[i + 1] : "Z")])),
        },
      ];

      const report = TeacherClassroomExamStudioService.gradeBatchSubmissions(batchSubmissions, examSuite40Q);

      expect(report.totalSubmissions).toBe(3);
      expect(report.classAverage).toBeGreaterThan(0);
      expect(report.highestScore).toBe(100);
      expect(report.recommendedInterventions.length).toBeGreaterThan(0);
      expect(report.studentResults).toHaveLength(3);
    });
  });

  // =========================================================================
  // 3. EXPORTADOR DE CADERNO DE PROVAS E CARTÕES OMR EM PDF (40+Q MULTIPÁGINA)
  // =========================================================================
  describe("Exportador Unificado de Caderno de Provas & Gabaritos em PDF (40Q)", () => {
    it("deve gerar Buffer de PDF válido com 2 colunas OMR para 40 questões", async () => {
      const pdfBuffer = await TeacherClassroomExamStudioService.exportExamBundlePdf(examSuite40Q, {
        includeVariants: ["A", "B"],
        includeTeacherMasterKey: true,
        includeOmrBubbleSheets: true,
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(5000);
      // Validar assinatura do cabeçalho PDF (%PDF-)
      const headerStr = Buffer.from(pdfBuffer).subarray(0, 5).toString("utf-8");
      expect(headerStr).toContain("%PDF");
    });

    it("deve gerar cadernos e cartões-resposta OMR personalizados com dados de alunos reais da turma", async () => {
      const realClassStudents = [
        { id: "2026DS001", name: "Ana Clara Souza", variantCode: "A", className: "Turma DS-2026/1" },
        { id: "2026DS002", name: "Bruno Henrique Costa", variantCode: "B", className: "Turma DS-2026/1" },
        { id: "2026DS003", name: "Camila Rodrigues Lima", variantCode: "C", className: "Turma DS-2026/1" },
        { id: "2026DS004", name: "Diego Fernandes", variantCode: "D", className: "Turma DS-2026/1" },
      ];

      const pdfBuffer = await TeacherClassroomExamStudioService.exportExamBundlePdf(examSuite40Q, {
        includeVariants: ["A", "B", "C", "D"],
        includeTeacherMasterKey: true,
        includeOmrBubbleSheets: true,
        studentList: realClassStudents,
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(8000);
      const headerStr = Buffer.from(pdfBuffer).subarray(0, 5).toString("utf-8");
      expect(headerStr).toContain("%PDF");
    });

    it("deve processar e calcular estatísticas reais de notas para a turma inteira", () => {
      const realClassStudents = [
        { id: "2026DS001", name: "Ana Clara Souza", variantCode: "A" },
        { id: "2026DS002", name: "Bruno Henrique Costa", variantCode: "B" },
        { id: "2026DS003", name: "Camila Rodrigues Lima", variantCode: "C" },
      ];

      const submissions: StudentOmrSubmission[] = realClassStudents.map((st, idx) => {
        const variant = examSuite40Q.variants[idx % examSuite40Q.variants.length];
        const marked: Record<number, string> = {};
        for (let i = 1; i <= 40; i++) {
          marked[i] = i % 2 === 0 ? variant.answerKeyMap[i] : "A";
        }
        return {
          studentId: st.id,
          studentName: st.name,
          variantCode: variant.variantCode,
          markedAnswers: marked,
        };
      });

      const batchReport = TeacherClassroomExamStudioService.gradeBatchSubmissions(submissions, examSuite40Q);

      expect(batchReport.totalSubmissions).toBe(3);
      expect(batchReport.studentResults).toHaveLength(3);
      expect(batchReport.studentResults[0].studentName).toBe("Ana Clara Souza");
      expect(batchReport.studentResults[1].studentName).toBe("Bruno Henrique Costa");
      expect(batchReport.classAverage).toBeGreaterThan(0);
      expect(batchReport.approvalRate).toBeGreaterThanOrEqual(0);
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

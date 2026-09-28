import { describe, it, expect } from "vitest";
import { TechMockInterviewService } from "../services/techMockInterviewService";
import { StylometricAuthenticityService } from "../services/stylometricAuthenticityService";
import { DigitalCredentialPortfolioService } from "../services/digitalCredentialPortfolioService";
import { TeacherVoiceFeedbackService } from "../services/teacherVoiceFeedbackService";
import { CodeArenaService } from "../services/codeArenaService";

describe("NextGen Platform Capabilities: Mock Interview, Credentials, Authenticity, Voice Feedback & Code Arena", () => {
  describe("TechMockInterviewService", () => {
    it("should generate a 4-stage mock interview session with employability scoring and verdict", async () => {
      const report = await TechMockInterviewService.generateInterviewSession({
        studentId: "st-99",
        studentName: "Lucas Mendes",
        className: "Turma 2B",
        targetRole: "Desenvolvedor Backend Python Júnior",
        studentCodeSample: "def calcular_media(valores):\n    return sum(valores)/len(valores) if valores else 0"
      });

      expect(report).toBeDefined();
      expect(report.studentName).toBe("Lucas Mendes");
      expect(report.employabilityScore).toBeGreaterThanOrEqual(0);
      expect(report.employabilityScore).toBeLessThanOrEqual(100);
      expect(report.exchanges).toHaveLength(4);
      expect(report.exchanges[0].stage).toBe("Abertura & Apresentação");
      expect(report.exchanges[1].stage).toBe("Deep Dive Técnico");
      expect(report.exchanges[2].stage).toBe("Arquitetura & Trade-offs");
      expect(report.exchanges[3].stage).toBe("Soft Skills & Resolução de Problemas");
      expect(report.keyStrengthsObserved.length).toBeGreaterThan(0);
      expect(report.recommendedMarketPreparation.length).toBeGreaterThan(0);
    });

    it("should export a valid SENAI technical mock interview PDF report", async () => {
      const report = await TechMockInterviewService.generateInterviewSession({
        studentId: "st-99",
        studentName: "Lucas Mendes"
      });

      const pdfBuffer = TechMockInterviewService.exportInterviewReportPdf(report);
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(500);
    });
  });

  describe("StylometricAuthenticityService", () => {
    it("should analyze code stylometry, token entropy, and generate Socratic defense questions", async () => {
      const audit = await StylometricAuthenticityService.auditCodeAuthenticity({
        studentName: "Mariana Costa",
        activityTitle: "Estruturas de Dados e Algoritmos",
        submittedCode: `def ordenar_elementos(lista):\n    # Implementacao de quicksort recursivo autoral\n    if len(lista) <= 1:\n        return lista\n    pivo = lista[0]\n    menores = [x for x in lista[1:] if x <= pivo]\n    maiores = [x for x in lista[1:] if x > pivo]\n    return ordenar_elementos(menores) + [pivo] + ordenar_elementos(maiores)`,
        language: "Python"
      });

      expect(audit).toBeDefined();
      expect(audit.studentName).toBe("Mariana Costa");
      expect(audit.authorshipConfidenceScore).toBeGreaterThanOrEqual(0);
      expect(audit.metrics).toBeDefined();
      expect(audit.metrics.tokenEntropy).toBeGreaterThan(0);
      expect(audit.metrics.commentToCodeRatio).toBeGreaterThanOrEqual(0);
      expect(audit.socraticDefenseQuestions.length).toBeGreaterThan(0);
      expect(audit.socraticDefenseQuestions[0].questionText).toBeDefined();
    });
  });

  describe("DigitalCredentialPortfolioService", () => {
    it("should issue a digital micro-credential with SHA-256 cryptographic verification", () => {
      const cred = DigitalCredentialPortfolioService.issueDigitalMicroCredential({
        studentId: "st-01",
        studentName: "Ana Beatriz Silva",
        enrollmentCode: "20260101",
        courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
        competencyTitle: "Modelagem Relacional (3FN) & Algoritmos Defensivos",
        gradeScore: 95,
        skillsAcquired: ["Python", "SQL 3FN", "Clean Code", "Defensive Programming"],
        workloadHours: 40
      });

      expect(cred).toBeDefined();
      expect(cred.studentName).toBe("Ana Beatriz Silva");
      expect(cred.honorsLevel).toBe("Com Louvor (Honors)");
      expect(cred.verificationHash).toHaveLength(64); // SHA-256 is 64 hex chars
      expect(cred.verificationUrl).toContain("/verify/");
    });

    it("should export an official landscape SENAI digital certificate PDF", () => {
      const cred = DigitalCredentialPortfolioService.issueDigitalMicroCredential({
        studentId: "st-01",
        studentName: "Ana Beatriz Silva",
        competencyTitle: "Desenvolvimento de APIs RESTful",
        gradeScore: 85
      });

      const pdfBuffer = DigitalCredentialPortfolioService.exportMicroCredentialPdf(cred);
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(500);
    });

    it("should generate a complete GitHub portfolio README.md with badges and architecture overview", () => {
      const portfolio = DigitalCredentialPortfolioService.generateGitHubPortfolio({
        studentName: "Ana Beatriz Silva",
        projectTitle: "Sistema de Triagem Industrial IoT",
        language: "Python",
        architectureSummary: "Pipeline de processamento assíncrono com tolerância a falhas.",
        keyFeatures: ["Detecção de anomalias", "Validação defensiva", "Integração MQTT"]
      });

      expect(portfolio).toBeDefined();
      expect(portfolio.readmeMarkdown).toContain("Sistema de Triagem Industrial IoT");
      expect(portfolio.readmeMarkdown).toContain("Ana Beatriz Silva");
      expect(portfolio.readmeMarkdown).toContain("SENAI");
      expect(portfolio.recommendedTags).toContain("python");
    });
  });

  describe("TeacherVoiceFeedbackService", () => {
    it("should polish raw informal teacher voice dictation into structured pedagogical feedback", async () => {
      const feedback = await TeacherVoiceFeedbackService.processTeacherDictation({
        studentName: "Gabriel Rocha",
        activityTitle: "Laboratório de Banco de Dados",
        rawSpeechText: "gabriel mandou super bem no ddl faltou so adicionar o cascade no drop table parabens pelo trabalho"
      });

      expect(feedback).toBeDefined();
      expect(feedback.studentName).toBe("Gabriel Rocha");
      expect(feedback.polishedPedagogicalFeedback).toBeDefined();
      expect(feedback.highlightedStrengths.length).toBeGreaterThan(0);
      expect(feedback.suggestedActionItems.length).toBeGreaterThan(0);
      expect(feedback.whatsappBriefing).toContain("Gabriel Rocha");
    });
  });

  describe("CodeArenaService", () => {
    it("should generate competitive programming challenges with test cases and starter code", async () => {
      const challenge = await CodeArenaService.generateChallenge({
        difficulty: "Intermediário",
        theme: "Filtros Industriais de Alta Performance"
      });

      expect(challenge).toBeDefined();
      expect(challenge.id).toBeDefined();
      expect(challenge.title).toBeDefined();
      expect(challenge.difficulty).toBe("Intermediário");
      expect(challenge.testCases.length).toBeGreaterThan(0);
      expect(challenge.starterCode["python"]).toBeDefined();
    });

    it("should create arena battle room, submit solution, evaluate tests, and update leaderboard", async () => {
      const room = await CodeArenaService.createRoom({
        roomName: "Desafio 1v1 Final de Semestre",
        mode: "1v1_duel",
        difficulty: "Intermediário",
        duelistA: { id: "duelist-alpha", name: "Lucas Silveira" },
        duelistB: { id: "duelist-beta", name: "Ana Rocha" }
      });

      expect(room).toBeDefined();
      expect(room.roomId).toBeDefined();
      expect(room.duelists).toHaveLength(2);

      const submission = CodeArenaService.submitSolution({
        roomId: room.roomId,
        duelistId: "duelist-alpha",
        code: "def solucao(dados):\n    # Implementacao completa e eficiente\n    return [d for d in dados if d > 0 and len(str(d)) > 0]",
        language: "python",
        timeElapsedSeconds: 35
      });

      expect(submission).toBeDefined();
      expect(submission.roomId).toBe(room.roomId);
      expect(submission.duelistId).toBe("duelist-alpha");
      expect(submission.testDetails.length).toBeGreaterThan(0);
      expect(submission.scoreGained).toBeGreaterThan(0);

      const leaderboard = CodeArenaService.getLeaderboard();
      expect(leaderboard.length).toBeGreaterThan(0);
      expect(leaderboard[0].eloRating).toBeGreaterThanOrEqual(leaderboard[leaderboard.length - 1].eloRating);
    });
  });
});

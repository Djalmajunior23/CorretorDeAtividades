import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  TeacherSuperpowersService,
  OmnikitLessonPlan,
  TurboBatchGradingResult,
  SmartFeedbackCampaign,
  PreventiveInterventionPlan,
  LiveFlashQuiz,
  SmartDiaryRecord
} from "../services/teacherSuperpowersService";

describe("TeacherSuperpowersService - Teacher Superpowers Cockpit Suite", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
      key: (index: number) => Object.keys(mockStorage)[index] || null,
      length: 0
    } as any;
    vi.clearAllMocks();
  });

  it("should get and save teacher productivity metrics accurately", () => {
    const defaultMetrics = TeacherSuperpowersService.getTeacherProductivityMetrics();
    expect(defaultMetrics).toBeDefined();
    expect(defaultMetrics.totalHoursSavedLifetime).toBeGreaterThan(0);
    expect(defaultMetrics.engagementHealthScore).toBeGreaterThanOrEqual(90);

    const updated = {
      ...defaultMetrics,
      totalHoursSavedLifetime: 60.5,
      lessonsGeneratedCount: 25
    };
    TeacherSuperpowersService.saveTeacherProductivityMetrics(updated);

    const reloaded = TeacherSuperpowersService.getTeacherProductivityMetrics();
    expect(reloaded.totalHoursSavedLifetime).toBe(60.5);
    expect(reloaded.lessonsGeneratedCount).toBe(25);
  });

  it("SUPERPOWER 1: should generate a complete Omnikit Lesson Plan with 3 tiers and bug hunt", async () => {
    const omnikit: OmnikitLessonPlan = await TeacherSuperpowersService.generateFullLessonOmnikit({
      topic: "Otimização de Consultas SQL e Normalização 3FN",
      targetAudience: "Técnico em Desenvolvimento de Sistemas",
      durationMinutes: 90,
      language: "sql"
    });

    expect(omnikit).toBeDefined();
    expect(omnikit.id).toMatch(/^omnikit-/);
    expect(omnikit.topic).toContain("Otimização de Consultas");
    expect(omnikit.directInstruction.slides.length).toBeGreaterThan(0);
    expect(omnikit.differentiatedChallenges.tier1_foundation).toBeDefined();
    expect(omnikit.differentiatedChallenges.tier2_application).toBeDefined();
    expect(omnikit.differentiatedChallenges.tier3_boss).toBeDefined();
    expect(omnikit.bugHuntChallenge.brokenCode).toBeDefined();
    expect(omnikit.saepRubricCriteria.length).toBeGreaterThan(0);
  });

  it("SUPERPOWER 2: should run turbo batch auto-grading on submissions and update metrics", async () => {
    const initialMetrics = TeacherSuperpowersService.getTeacherProductivityMetrics();
    const result: TurboBatchGradingResult = await TeacherSuperpowersService.gradeSubmissionsBatchTurbo({
      activityTitle: "Laboratório de APIs Express e REST"
    });

    expect(result).toBeDefined();
    expect(result.batchId).toMatch(/^batch-/);
    expect(result.totalSubmissions).toBe(4);
    expect(result.averageScore).toBeGreaterThan(0);
    expect(result.gradedSubmissions.length).toBe(4);
    expect(result.gradedSubmissions[0].pedagogicalFeedback).toBeDefined();
    expect(result.gradedSubmissions[0].rubricScores).toBeDefined();

    const afterMetrics = TeacherSuperpowersService.getTeacherProductivityMetrics();
    expect(afterMetrics.autoGradedCount).toBeGreaterThan(initialMetrics.autoGradedCount);
  });

  it("SUPERPOWER 3: should dispatch targeted feedbacks based on student performance", async () => {
    const batchResult = await TeacherSuperpowersService.gradeSubmissionsBatchTurbo({
      activityTitle: "Teste de Despacho"
    });

    const campaign: SmartFeedbackCampaign = await TeacherSuperpowersService.dispatchTargetedFeedbacks({
      gradedSubmissions: batchResult.gradedSubmissions
    });

    expect(campaign).toBeDefined();
    expect(campaign.campaignId).toMatch(/^campaign-/);
    expect(campaign.recipients.length).toBe(4);
    expect(["high_performer", "average", "struggling"]).toContain(campaign.recipients[0].category);
  });

  it("SUPERPOWER 4: should create a preventive intervention plan for at-risk students", async () => {
    const plan: PreventiveInterventionPlan = await TeacherSuperpowersService.generatePreventiveInterventionPlan({
      studentId: "st-03",
      studentName: "Mariana Oliveira Costa",
      recentScores: [50, 45, 40],
      weaknesses: ["Algoritmos Recursivos", "Normalização 3FN"]
    });

    expect(plan).toBeDefined();
    expect(plan.planId).toMatch(/^intervention-/);
    expect(plan.studentName).toBe("Mariana Oliveira Costa");
    expect(plan.riskScore).toBeGreaterThan(50);
    expect(plan.recommendedMicroTracks.length).toBeGreaterThan(0);
    expect(plan.peerMentorAssigned).toBeDefined();
  });

  it("SUPERPOWER 5: should create a gamified Live Flash Quiz", async () => {
    const quiz: LiveFlashQuiz = await TeacherSuperpowersService.createLiveFlashQuiz({
      topic: "Arquitetura REST e Status Codes",
      questionCount: 3
    });

    expect(quiz).toBeDefined();
    expect(quiz.quizId).toMatch(/^quiz-/);
    expect(quiz.pinCode.length).toBe(6);
    expect(quiz.questions.length).toBeGreaterThanOrEqual(1);
    expect(quiz.questions[0].options.length).toBe(4);
  });

  it("SUPERPOWER 6: should generate institutional Smart Class Diary auto-fill text", async () => {
    const diary: SmartDiaryRecord = await TeacherSuperpowersService.generateSmartClassDiaryRecord({
      className: "Turma 3C - Banco de Dados e Backend",
      lessonTopic: "Índices B-Tree e Otimização SQL",
      competencies: ["Modelar bancos relacionais", "Otimizar consultas de alto volume"]
    });

    expect(diary).toBeDefined();
    expect(diary.recordId).toMatch(/^diary-/);
    expect(diary.formalInstitutionalText).toContain("SENAI");
    expect(diary.attendanceSummary.present).toBeGreaterThan(0);
  });
});

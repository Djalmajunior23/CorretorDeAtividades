import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  TeacherLiveLabCompanionService,
  StudentDesk,
  StuckTicket,
  LabClosingSummary
} from "../services/teacherLiveLabCompanionService";

describe("TeacherLiveLabCompanionService - Live Lab & Desk Companion Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize realistic lab layout, student desks and stuck tickets", () => {
    const initialState = TeacherLiveLabCompanionService.getInitialLabState();

    expect(initialState).toBeDefined();
    expect(initialState.layout.rows).toBe(4);
    expect(initialState.layout.cols).toBe(6);
    expect(initialState.layout.totalDesks).toBe(24);
    expect(initialState.desks.length).toBe(24);
    expect(initialState.tickets.length).toBeGreaterThan(0);

    const stuckDesk = initialState.desks.find(d => d.status === "stuck");
    expect(stuckDesk).toBeDefined();
    expect(stuckDesk?.stuckReason).toBeDefined();
  });

  it("should generate a Socratic micro-hint for a stuck student", async () => {
    const hint = await TeacherLiveLabCompanionService.generateSocraticMicroHint({
      studentName: "Mariana Oliveira Costa",
      doubtSummary: "TypeError: Cannot destructure property 'itens' of req.body as it is undefined",
      codeSnippet: "app.post('/pedidos', (req, res) => { const { itens } = req.body; });"
    });

    expect(hint).toBeDefined();
    expect(hint.hintText).toBeDefined();
    expect(hint.promptReflection).toBeDefined();
    expect(hint.hintText.length).toBeGreaterThan(10);
  });

  it("should generate an automated lab closing debrief with highlights and next class recommendations", async () => {
    const initialState = TeacherLiveLabCompanionService.getInitialLabState();
    const debrief: LabClosingSummary = await TeacherLiveLabCompanionService.generateLabClosingDebrief({
      theme: "Construção de APIs REST com Express",
      desks: initialState.desks,
      ticketsResolvedCount: 5
    });

    expect(debrief).toBeDefined();
    expect(debrief.sessionId).toMatch(/^session-/);
    expect(debrief.totalStudentsPresent).toBeGreaterThan(0);
    expect(debrief.topRecurringDoubt).toBeDefined();
    expect(debrief.recommendedNextClassRecap).toBeDefined();
    expect(debrief.highlightStudents.length).toBeGreaterThan(0);
  });
});

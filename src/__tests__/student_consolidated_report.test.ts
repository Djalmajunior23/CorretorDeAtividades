import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStudentConsolidatedReport, collectStudentCorrections, generateStudentConsolidatedPdf } from "../services/studentConsolidatedReport";

const student = { id: "student-a", name: "Ana", enrollment_code: "MAT-A", class_name: "Turma A" };
afterEach(() => vi.unstubAllGlobals());

describe("Individual consolidated correction report", () => {
  it("combines profile and vault records without duplicates or other students", () => {
    const corrections = collectStudentCorrections(student, [
      { id: "code-1", student_id: "student-a", score: 80, feedback: "Use funções." },
      { id: "wrong-student", student_id: "student-b", score: 100 },
    ], [
      { id: "code-1", student_id: "student-a", activity_title: "Algoritmos" },
      { id: "diagram-1", student_key: "MAT-A", language: "sql", score: 60 },
    ]);
    expect(corrections.map(c => c.id)).toEqual(["code-1", "diagram-1"]);
    expect(corrections[0]).toMatchObject({ activity_title: "Algoritmos", feedback: "Use funções." });
  });

  it("includes all correction types and computes the mean from valid grades, including zero", () => {
    const report = buildStudentConsolidatedReport(student, [
      { id: "a", language: "python", score: "80", created_at: "2026-01-01" },
      { id: "b", language: "sql", score: 0, created_at: "2026-02-01" },
      { id: "c", score: null }, { id: "d", score: "" }, { id: "e", score: "invalid" },
    ]);
    expect(report.corrections).toHaveLength(5);
    expect(report.scoredCount).toBe(2);
    expect(report.average).toBe(40);
    expect(report.opinion).toContain("5 correção(ões)");
    expect(report.opinion).toContain("-80.0 pontos");
  });

  it("uses correction evidence in the opinion and preserves detailed feedback and rubric", () => {
    const report = buildStudentConsolidatedReport(student, [{
      id: "assessment", raw_correction: JSON.stringify({
        totalGrade: 90, strengths: ["Chaves primárias corretas"], modelingIssues: ["Revisar cardinalidade"],
        pedagogicalRecommendations: ["Refazer o relacionamento"],
        rubrics: [{ name: "Integridade", score: 18, maxScore: 20, feedback: "FK ausente" }],
      }), feedback: { summary: "Boa estrutura", improvements: ["Revisar cardinalidade"] },
    }]);
    expect(report.average).toBe(90);
    expect(report.improvements).toEqual(["Revisar cardinalidade"]);
    expect(report.opinion).toContain("Chaves primárias corretas");
    expect(report.opinion).toContain("Revisar cardinalidade");
    expect(report.recommendations).toEqual(["Refazer o relacionamento"]);
    expect(report.corrections[0].feedback).toBe("Boa estrutura");
    expect(report.corrections[0].criteria[0]).toContain("Integridade: 18/20. FK ausente");
  });

  it("normalizes different explicit grading scales before consolidating averages", () => {
    const report = buildStudentConsolidatedReport(student, [
      { id: "ten-point", score: 8, max_score: 10 },
      { id: "fifty-point", score: 40, max_score: 50 },
      { id: "zero", score: 0, max_score: 10 },
    ]);
    expect(report.corrections.map(c => c.score)).toEqual([80, 80, 0]);
    expect(report.average).toBeCloseTo(160 / 3);
  });

  it("does not invent grades or progress when no scored corrections exist", () => {
    const report = buildStudentConsolidatedReport(student, [{ id: "pending", status: "pending" }]);
    expect(report.average).toBeNull();
    expect(report.opinion).toContain("Ainda não há notas suficientes");
    expect(report.opinion).toContain("não permite comparar");
    expect(buildStudentConsolidatedReport(student, []).opinion).toContain("Não há correções disponíveis");
  });

  it("paginates long histories and exports an actual PDF without Node Buffer", () => {
    const report = buildStudentConsolidatedReport(student, Array.from({ length: 30 }, (_, i) => ({
      id: `c-${i}`, activity_title: `Atividade ${i}`, score: 75,
      feedback: "Revisar os casos de teste e a organização do algoritmo. ".repeat(30),
    })));
    vi.stubGlobal("Buffer", undefined);
    const bytes = generateStudentConsolidatedPdf(report);
    const pdf = new TextDecoder().decode(bytes);
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect((pdf.match(/\/Type \/Page\b/g) || []).length).toBeGreaterThan(2);
    expect(pdf).toContain("Atividade 29");
  });
});

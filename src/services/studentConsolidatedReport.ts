import { jsPDF } from "jspdf";
import { safeAutoTable, getAutoTableFinalY } from "../utils/pdfExport";

export interface ReportStudent {
  id: string;
  name: string;
  enrollment_code?: string;
  class_name?: string;
  email?: string;
}

type RecordData = Record<string, any>;

function object(value: unknown): RecordData {
  if (typeof value === "string") {
    try { return object(JSON.parse(value)); } catch { return {}; }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function texts(value: unknown): string[] {
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return texts(parsed); } catch { /* Plain feedback. */ }
    return [value.trim()];
  }
  return Array.isArray(value) ? value.flatMap(item => typeof item === "string" ? texts(item) : []) : [];
}

const unique = (values: string[]) => [...new Set(values)];

export function collectStudentCorrections(student: ReportStudent, ...sources: unknown[]) {
  const identities = new Set([student.id, student.enrollment_code].filter(Boolean).map(String));
  const records = new Map<string, RecordData>();
  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (const correction of source) {
      if (!correction || typeof correction !== "object") continue;
      const ids = [correction.student_id, correction.studentId, correction.student_key, correction.student_registration].filter(Boolean).map(String);
      if (ids.length && !ids.some(id => identities.has(id))) continue;
      const key = correction.id ? String(correction.id) : JSON.stringify(correction);
      records.set(key, { ...correction, ...records.get(key) });
    }
  }
  return [...records.values()];
}

export function buildStudentConsolidatedReport(student: ReportStudent, ...sources: unknown[]) {
  const corrections = collectStudentCorrections(student, ...sources).map((correction, index) => {
    const raw = object(correction.raw_correction);
    const feedback = object(correction.feedback);
    const value = correction.score ?? correction.final_score ?? raw.totalGrade;
    const numeric = typeof value === "number" || (typeof value === "string" && value.trim()) ? Number(value) : NaN;
    const maximum = Number(correction.max_score ?? 100);
    const normalized = Number.isFinite(maximum) && maximum > 0 ? numeric / maximum * 100 : NaN;
    const score = Number.isFinite(normalized) && normalized >= 0 && normalized <= 100 ? normalized : null;
    const date = new Date(correction.created_at || raw.evaluatedAt || "");
    const rubrics = correction.rubric_result || raw.rubrics;
    return {
      id: String(correction.id || `correction-${index}`),
      title: String(correction.question_title || correction.activity_title || "Atividade sem título"),
      language: String(correction.language || raw.modelCategory || "Não informada"),
      status: String(correction.status || raw.status || "Não informado"),
      timestamp: Number.isNaN(date.getTime()) ? null : date.getTime(),
      score,
      feedback: unique([
        ...texts(correction.summary), ...texts(feedback.summary),
        ...(Object.keys(feedback).length ? [] : texts(correction.feedback)),
        ...texts(raw.summary), ...texts(raw.diagnosis),
        ...texts(correction.ai_feedback), ...texts(correction.teacher_feedback),
      ]).join("\n\n"),
      strengths: unique([...texts(correction.strengths), ...texts(feedback.strengths), ...texts(raw.strengths)]),
      improvements: unique([...texts(correction.improvements), ...texts(feedback.improvements), ...texts(raw.modelingIssues), ...texts(correction.errors), ...texts(feedback.errors), ...texts(correction.concepts_to_review), ...texts(feedback.concepts_to_review)]),
      recommendations: unique([...texts(correction.next_steps), ...texts(feedback.next_steps), ...texts(raw.pedagogicalRecommendations), ...texts(raw.next_steps)]),
      criteria: Array.isArray(rubrics) ? rubrics.map((criterion: RecordData) =>
        `${criterion.name || criterion.criterion_name || "Critério"}: ${criterion.score ?? criterion.score_obtained ?? "não informado"}/${criterion.maxScore ?? criterion.weight ?? "não informado"}. ${criterion.feedback || criterion.observation || ""}`
      ) : [],
    };
  }).sort((a, b) => (a.timestamp ?? Infinity) - (b.timestamp ?? Infinity));
  const scored = corrections.filter(c => c.score !== null);
  const average = scored.length ? scored.reduce((sum, c) => sum + c.score!, 0) / scored.length : null;
  const strengths = unique(corrections.flatMap(c => c.strengths));
  const improvements = unique(corrections.flatMap(c => c.improvements));
  const recommendations = unique(corrections.flatMap(c => c.recommendations));
  const dated = scored.filter(c => c.timestamp !== null);
  const evolution = dated.length > 1 ? dated[dated.length - 1].score! - dated[0].score! : null;
  const opinion = corrections.length === 0
    ? `Não há correções disponíveis para emitir um parecer sobre ${student.name}.`
    : `${student.name} possui ${corrections.length} correção(ões) registrada(s), das quais ${scored.length} têm nota válida.` +
      (average === null ? " Ainda não há notas suficientes para calcular uma média." : ` A média simples das correções com nota é ${average.toFixed(1)}/100; tentativas repetidas também integram esse histórico.`) +
      (evolution === null ? " O histórico datado ainda não permite comparar a primeira e a última nota." : ` A variação entre a primeira e a última nota datada é de ${evolution > 0 ? "+" : ""}${evolution.toFixed(1)} pontos; atividades diferentes não constituem uma medida isolada de evolução.`) +
      (strengths.length ? ` Os registros destacam: ${strengths.join("; ")}.` : " Não há pontos fortes explicitamente descritos nos registros disponíveis.") +
      (improvements.length ? ` O acompanhamento deve priorizar: ${improvements.join("; ")}.` : " Recomenda-se revisar os feedbacks de cada atividade antes de definir novos objetivos de aprendizagem.");
  return { student, corrections, average, scoredCount: scored.length, strengths, improvements, recommendations, opinion };
}

export function generateStudentConsolidatedPdf(report: ReturnType<typeof buildStudentConsolidatedReport>): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 18;
  const text = (value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    const lines: string[] = doc.splitTextToSize(value, 180);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 18; }
      doc.text(line, 15, y);
      y += 5;
    }
    y += 3;
  };
  text("RELATÓRIO INDIVIDUAL CONSOLIDADO", true);
  text(`Aluno: ${report.student.name}`);
  text(`Matrícula: ${report.student.enrollment_code || "Não informada"} | Turma: ${report.student.class_name || "Não informada"}`);
  text(`Emissão: ${new Date().toLocaleString("pt-BR")} | Correções: ${report.corrections.length}`);
  text("Parecer pedagógico", true);
  text(report.opinion);
  text("Próximos passos sugeridos", true);
  text(report.recommendations.length ? report.recommendations.join("\n") : "Definir com o docente atividades de reforço e reavaliação a partir dos feedbacks abaixo.");
  text("Síntese das correções", true);
  safeAutoTable(doc, {
    startY: y,
    head: [["Atividade", "Data", "Linguagem / tipo", "Nota /100"]],
    body: report.corrections.map(c => [c.title, c.timestamp === null ? "Não informada" : new Date(c.timestamp).toLocaleDateString("pt-BR"), c.language, c.score === null ? "Sem nota" : c.score.toFixed(1)]),
    margin: { top: 18, bottom: 20, left: 15, right: 15 },
  });
  y = getAutoTableFinalY(doc, y) + 12;
  for (const [index, correction] of report.corrections.entries()) {
    text(`${index + 1}. ${correction.title}`, true);
    text(`Situação: ${correction.status} | Nota: ${correction.score === null ? "Sem nota" : `${correction.score.toFixed(1)}/100`}`);
    text(`Feedback: ${correction.feedback || "Não registrado."}`);
    if (correction.criteria.length) { text("Critérios avaliados", true); text(correction.criteria.join("\n")); }
    if (correction.strengths.length) text(`Pontos fortes: ${correction.strengths.join("; ")}`);
    if (correction.improvements.length) text(`Pontos de melhoria: ${correction.improvements.join("; ")}`);
    if (correction.recommendations.length) text(`Recomendações: ${correction.recommendations.join("; ")}`);
  }
  text("Parecer automático baseado exclusivamente nos registros disponíveis; sujeito à revisão e complementação do docente.");
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.text(`Relatório individual - ${report.student.name} | Página ${page} de ${pages}`, 15, 289);
  }
  return doc.output("arraybuffer");
}

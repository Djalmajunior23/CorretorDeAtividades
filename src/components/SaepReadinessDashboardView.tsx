import React, { useState } from "react";
import {
  GraduationCap,
  Award,
  BarChart3,
  FileDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Brain,
  HelpCircle,
  Layers,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import {
  CohortSaepReport,
  TriQuestionItem,
  SaepReadinessService
} from "../services/saepReadinessService";

export const SaepReadinessDashboardView: React.FC = () => {
  const [cohortId, setCohortId] = useState("TURMA-SENAI-DS-2026");
  const [cohortName, setCohortName] = useState("DS 2026.1 - Noite (SENAI)");
  const [courseName, setCourseName] = useState("Técnico em Desenvolvimento de Sistemas");
  const [activeTab, setActiveTab] = useState<"DIAGNOSIS" | "TRI_EXAM" | "ACTION_PLAN">("DIAGNOSIS");

  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CohortSaepReport | null>(null);
  const [triQuestions, setTriQuestions] = useState<TriQuestionItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleEvaluateCohort = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/saep-readiness/evaluate-cohort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortId, cohortName, courseName })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          setReport(data.report);
          toast.success("Diagnóstico da Turma consolidado com sucesso!");
          return;
        }
      }

      // Fallback
      const fallbackReport = await SaepReadinessService.evaluateCohort({
        cohortId,
        cohortName,
        courseName
      });
      setReport(fallbackReport);
      toast.success("Diagnóstico SAEP gerado via contingência local!");
    } catch (err: any) {
      console.warn("Cohort API error, using fallback:", err);
      const fallbackReport = await SaepReadinessService.evaluateCohort({
        cohortId,
        cohortName,
        courseName
      });
      setReport(fallbackReport);
      toast.success("Diagnóstico gerado com sucesso!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateExam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/saep-readiness/generate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseName, questionCount: 3 })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.questions) {
          setTriQuestions(data.questions);
          setActiveTab("TRI_EXAM");
          toast.success("Prova Calibrada TRI gerada com sucesso!");
          return;
        }
      }

      const questions = await SaepReadinessService.generateTriExam({ courseName });
      setTriQuestions(questions);
      setActiveTab("TRI_EXAM");
      toast.success("Questões TRI geradas!");
    } catch (err: any) {
      const questions = await SaepReadinessService.generateTriExam({ courseName });
      setTriQuestions(questions);
      setActiveTab("TRI_EXAM");
      toast.success("Questões TRI carregadas!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/saep-readiness/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report })
      });

      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        const pdfBuf = await SaepReadinessService.generateSaepDossierPdf(report);
        blob = new Blob([pdfBuf as any], { type: "application/pdf" });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_saep_${report.cohortId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Laudo Institucional SAEP baixado!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-blue-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-blue-400" /> SAEP / ENADE Readiness
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SENAI Matriz CHA & TRI
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Curricular Competency & SAEP/ENADE Simulator
          </h1>
          <p className="text-slate-400 text-sm">
            Mapeamento de competências (Conhecimentos, Habilidades e Atitudes), calibração por Teoria de Resposta ao Item e plano de ação institucional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {report && (
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition shadow-lg text-sm font-semibold disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              {isExportingPdf ? "Gerando Laudo..." : "Laudo Institucional (PDF)"}
            </button>
          )}

          <button
            onClick={handleEvaluateCohort}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:opacity-95 transition disabled:opacity-50"
          >
            <BarChart3 className="w-4 h-4" />
            {isLoading ? "Processando..." : "Diagnosticar Coorte"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("DIAGNOSIS")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "DIAGNOSIS"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Matriz de Competências & Heatmap
        </button>

        <button
          onClick={() => {
            if (triQuestions.length === 0) handleGenerateExam();
            else setActiveTab("TRI_EXAM");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "TRI_EXAM"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Simulado Calibrado TRI
        </button>

        <button
          onClick={() => setActiveTab("ACTION_PLAN")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "ACTION_PLAN"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Plano de Ação Pedagógica
        </button>
      </div>

      {/* Main Content */}
      {!report && !isLoading && (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
          <GraduationCap className="w-12 h-12 text-blue-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-200 mb-1">Nenhum Diagnóstico de Coorte Ativo</h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            Clique no botão acima para rodar a consolidação da matriz de proficiência TRI para a turma {cohortName}.
          </p>
          <button
            onClick={handleEvaluateCohort}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Executar Diagnóstico SAEP Agora
          </button>
        </div>
      )}

      {report && activeTab === "DIAGNOSIS" && (
        <div className="space-y-6">
          {/* Top Scorecard */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-slate-400">Score Médio TRI (SAEP)</span>
              <div className="text-3xl font-extrabold text-blue-400">{report.averageThetaScore} pts</div>
              <span className="text-[11px] text-slate-400">Escala de 200 a 450</span>
            </div>

            <div>
              <span className="text-xs text-slate-400">Estudantes Adequados/Avançados</span>
              <div className="text-3xl font-extrabold text-emerald-400">
                {report.cohortProficiencyDistribution.adequadoCount + report.cohortProficiencyDistribution.avancadoCount} / {report.totalStudents}
              </div>
              <span className="text-[11px] text-slate-400">
                {Math.round(((report.cohortProficiencyDistribution.adequadoCount + report.cohortProficiencyDistribution.avancadoCount) / report.totalStudents) * 100)}% de prontidão
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400">Estudantes em Risco / Básico</span>
              <div className="text-3xl font-extrabold text-rose-400">
                {report.cohortProficiencyDistribution.abaixoBasicoCount + report.cohortProficiencyDistribution.basicoCount}
              </div>
              <span className="text-[11px] text-slate-400">Requerem intervenção</span>
            </div>

            <div>
              <span className="text-xs text-slate-400">Plano de Ação</span>
              <div className="text-base font-bold text-amber-300 mt-1">
                {report.institutionalCoordinatorActionPlan.length} Medidas Prioritárias
              </div>
              <span className="text-[11px] text-slate-400">Coordenação Pedagógica</span>
            </div>
          </div>

          {/* Domain Heatmap */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Mapa de Calor por Domínio de Competência (CHA)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.domainHeatmap.map((d) => (
                <div key={d.domain} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{d.domain.replace(/_/g, " ")}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.riskLevel === "VERDE" ? "bg-emerald-500/15 text-emerald-300" : d.riskLevel === "AMARELO" ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300"}`}>
                      {d.riskLevel}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.riskLevel === "VERDE" ? "bg-emerald-500" : d.riskLevel === "AMARELO" ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${d.averageScorePercent}%` }}
                    />
                  </div>
                  <div className="text-right text-xs font-bold text-slate-400">{d.averageScorePercent}% proficiência</div>
                </div>
              ))}
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Diagnóstico Individualizado dos Estudantes
            </h3>
            <div className="divide-y divide-slate-800">
              {report.studentDiagnoses.map((std) => (
                <div key={std.studentId} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">{std.studentName}</div>
                    <div className="text-[10px] text-slate-500">Nível TRI: {std.proficiencyLevel}</div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs font-bold text-blue-400">{std.estimatedThetaScore} pts</div>
                      <div className="text-[10px] text-emerald-400">{std.predictedPassProbabilityPercent}% prob. aprovação</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRI Exam Tab */}
      {activeTab === "TRI_EXAM" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Questões Calibradas com Teoria de Resposta ao Item
            </h3>
            <button
              onClick={handleGenerateExam}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Gerar Novas Questões TRI
            </button>
          </div>

          <div className="space-y-4">
            {triQuestions.map((q, idx) => (
              <div key={q.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-400">Questão {idx + 1} • {q.competencyCode}</span>
                  <div className="flex gap-2 font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">
                    <span>a: {q.triParameters.discriminationA.toFixed(2)}</span>
                    <span>b: {q.triParameters.difficultyB.toFixed(2)}</span>
                    <span>Nível: {q.bloomLevel}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{q.prompt}</p>

                {q.codeContext && (
                  <pre className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-blue-300 overflow-x-auto whitespace-pre-wrap border border-slate-800">
                    {q.codeContext}
                  </pre>
                )}

                <div className="space-y-2 pt-2">
                  {q.options.map((opt) => {
                    const isSelected = selectedAnswers[q.id] === opt.letter;
                    return (
                      <button
                        key={opt.letter}
                        type="button"
                        onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: opt.letter })}
                        className={`w-full p-3 rounded-xl text-left border text-xs transition flex items-start gap-3 ${
                          isSelected
                            ? "bg-blue-500/15 border-blue-500/40 text-blue-200"
                            : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {opt.letter}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Plan Tab */}
      {report && activeTab === "ACTION_PLAN" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" /> Plano de Ação Pedagógica para Coordenação Institucional
          </h3>
          <div className="space-y-3">
            {report.institutionalCoordinatorActionPlan.map((plan, i) => (
              <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${plan.priority === "URGENTE" ? "bg-rose-500/15 text-rose-300 border border-rose-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"}`}>
                    PRIORIDADE {plan.priority}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{plan.targetDomain}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200">{plan.action}</h4>
                <p className="text-xs text-slate-400">{plan.suggestedPedagogicalRemediation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SaepReadinessDashboardView;

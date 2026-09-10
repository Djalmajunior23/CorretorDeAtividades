import React, { useState } from "react";
import {
  Briefcase,
  Sparkles,
  Send,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  Code2,
  MessageSquare,
  Network,
  Cpu,
  RefreshCw,
  Award,
  Clock,
  Target
} from "lucide-react";
import { toast } from "sonner";
import {
  TechInterviewAiService,
  TechRole,
  InterviewQuestion,
  CandidateAnswer,
  MarketReadinessReport
} from "../services/techInterviewAiService";

const ROLES: Array<{ id: TechRole; label: string; desc: string; icon: any }> = [
  { id: "junior_fullstack", label: "Fullstack Júnior", desc: "React, Node.js, REST APIs, SQL", icon: Code2 },
  { id: "junior_frontend", label: "Frontend Júnior", desc: "React, TypeScript, CSS, UI/UX", icon: Sparkles },
  { id: "junior_backend", label: "Backend Júnior", desc: "Node.js, Python, PostgreSQL, TDD", icon: Cpu },
  { id: "junior_devops", label: "DevOps & Cloud Júnior", desc: "Docker, CI/CD, Linux, AWS", icon: Network },
  { id: "junior_data_ai", label: "Dados & IA Júnior", desc: "Python, SQL, Pandas, LLM APIs", icon: Award },
  { id: "pleno_fullstack", label: "Fullstack Pleno", desc: "Clean Arch, Cache, Microservices", icon: Briefcase },
  { id: "senior_architect", label: "Arquiteto / Tech Lead", desc: "System Design, Event-Driven, SLAs", icon: Target }
];

export default function TechInterviewSimulatorView() {
  const [studentName, setStudentName] = useState("Gabriel Martins");
  const [studentRegistration, setStudentRegistration] = useState("2026-SENAI-7842");
  const [targetRole, setTargetRole] = useState<TechRole>("junior_fullstack");
  const [language, setLanguage] = useState("typescript");
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    roleTitle: string;
    questions: InterviewQuestion[];
  } | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState<MarketReadinessReport | null>(null);

  const handleStartSession = async () => {
    if (!studentName.trim()) {
      toast.error("Informe o nome do candidato(a).");
      return;
    }
    setIsLoadingSession(true);
    setReport(null);
    setAnswers({});
    setCurrentQuestionIndex(0);

    try {
      const res = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          studentRegistration,
          targetRole,
          language
        })
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setActiveSession({
          sessionId: data.sessionId,
          roleTitle: data.roleTitle,
          questions: data.questions
        });
        toast.success(`Entrevista técnica para "${data.roleTitle}" iniciada com sucesso!`);
      } else {
        throw new Error(data.error || "Falha ao iniciar entrevista.");
      }
    } catch (e: any) {
      console.warn("Using fallback local session generator:", e.message);
      const fallback = await TechInterviewAiService.startInterviewSession({
        studentName,
        studentRegistration,
        targetRole,
        language
      });
      setActiveSession({
        sessionId: fallback.sessionId,
        roleTitle: fallback.roleTitle,
        questions: fallback.questions
      });
      toast.info("Sessão de entrevista técnica preparada em modo autônomo.");
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleFinishAndEvaluate = async () => {
    if (!activeSession) return;
    setIsEvaluating(true);

    const formattedAnswers: CandidateAnswer[] = activeSession.questions.map((q) => ({
      questionId: q.id,
      responseType: q.type === "live_coding" ? "code" : "text",
      content: answers[q.id] || "Não respondido"
    }));

    try {
      const res = await fetch("/api/interviews/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.sessionId,
          studentName,
          studentRegistration,
          targetRole,
          questions: activeSession.questions,
          answers: formattedAnswers
        })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        toast.success("Avaliação concluída! Laudo de Empregabilidade gerado.");
      } else {
        throw new Error(data.error || "Falha na avaliação.");
      }
    } catch (e: any) {
      console.warn("Using local fallback evaluation:", e.message);
      const fallbackReport = await TechInterviewAiService.evaluateInterview({
        sessionId: activeSession.sessionId,
        studentName,
        studentRegistration,
        targetRole,
        questions: activeSession.questions,
        answers: formattedAnswers
      });
      setReport(fallbackReport);
      toast.info("Laudo de Empregabilidade gerado com sucesso via motor heurístico.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/interviews/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laudo_empregabilidade_${report.studentName.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("PDF do Laudo baixado com sucesso!");
      } else {
        throw new Error("Erro ao gerar PDF.");
      }
    } catch (e: any) {
      toast.error(`Erro ao exportar PDF: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const currentQ = activeSession?.questions[currentQuestionIndex];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#030712] text-slate-100">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Módulo de Empregabilidade SENAI 4.0
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-emerald-400" />
              Tech Mock Interview AI & Evaluator
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Simulador de bancas de contratação técnica real com método STAR comportamental, desafios de live coding com análise de complexidade Big-O e cálculo do <span className="text-emerald-400 font-semibold">Market Readiness Score</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {report && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                {isExportingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar Laudo Oficial PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Setup Config Panel if no session or to start new */}
      {!activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              Dados do Candidato
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Nome do Aluno(a)"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Matrícula / ID</label>
                <input
                  type="text"
                  value={studentRegistration}
                  onChange={(e) => setStudentRegistration(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="2026-SENAI-XXXX"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Linguagem do Live Coding</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                </select>
              </div>

              <button
                onClick={handleStartSession}
                disabled={isLoadingSession}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20"
              >
                {isLoadingSession ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Iniciar Simulado de Entrevista
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Selecione o Cargo / Vaga Alvo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = targetRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setTargetRole(role.id)}
                    className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${isSelected ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{role.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{role.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Interview Execution View */}
      {activeSession && !report && (
        <div className="space-y-6">
          {/* Stage Progress Bar */}
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                {currentQuestionIndex + 1}/{activeSession.questions.length}
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Vaga em Avaliação</div>
                <div className="text-sm font-bold text-white">{activeSession.roleTitle}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeSession.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    currentQuestionIndex === idx
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : answers[q.id]
                      ? "bg-slate-800 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  Etapa {idx + 1}: {q.type === "behavioral_star" ? "STAR" : q.type === "live_coding" ? "Live Coding" : "System Design"}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveSession(null)}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Cancelar Simulado
            </button>
          </div>

          {/* Current Question Workspace */}
          {currentQ && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Question Context & Prompt */}
              <div className="lg:col-span-5 bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  {currentQ.type === "behavioral_star" && <MessageSquare className="w-4 h-4" />}
                  {currentQ.type === "live_coding" && <Code2 className="w-4 h-4" />}
                  {currentQ.type === "system_design" && <Network className="w-4 h-4" />}
                  {currentQ.type === "behavioral_star" ? "Pergunta Comportamental (STAR)" : currentQ.type === "live_coding" ? "Desafio de Código ao Vivo" : "Arquitetura & System Design"}
                </div>

                <h3 className="text-lg font-bold text-white leading-snug">{currentQ.title}</h3>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-200">Cenário da Empresa / Squad:</div>
                  <div>{currentQ.contextScenario}</div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-sm text-slate-200 leading-relaxed">
                  {currentQ.prompt}
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-slate-400">Critérios de Avaliação do Comitê:</div>
                  <ul className="space-y-1">
                    {currentQ.evaluationCriteria.map((c, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Candidate Response Workspace */}
              <div className="lg:col-span-7 bg-[#090d1f] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {currentQ.type === "live_coding" ? "Editor de Código do Candidato" : "Sua Resposta Estruturada"}
                    </label>
                    <span className="text-xs text-slate-500 font-mono">
                      {answers[currentQ.id]?.length || 0} caracteres
                    </span>
                  </div>

                  <textarea
                    value={answers[currentQ.id] || (currentQ.starterCode && !answers[currentQ.id] ? currentQ.starterCode : "")}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    rows={16}
                    placeholder={
                      currentQ.type === "behavioral_star"
                        ? "Estruture sua resposta:\n[SITUAÇÃO] Descreva o contexto...\n[TAREFA] O que era exigido de você...\n[AÇÃO] Quais decisões e passos você tomou...\n[RESULTADO] Qual foi o impacto mensurável..."
                        : currentQ.type === "live_coding"
                        ? "// Implemente sua solução com tratamento de erros..."
                        : "Descreva a arquitetura, componentes, banco de dados, filas e estratégias de escalabilidade..."
                    }
                    className="w-full bg-[#040815] border border-slate-700/80 rounded-xl p-4 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold"
                  >
                    ← Anterior
                  </button>

                  {currentQuestionIndex < activeSession.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all"
                    >
                      Próxima Questão →
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishAndEvaluate}
                      disabled={isEvaluating}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                      {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Finalizar e Obter Laudo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Market Readiness Report Dashboard */}
      {report && (
        <div className="space-y-6">
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Laudo Técnico de Empregabilidade</div>
                <h2 className="text-2xl font-black text-white mt-1">{report.studentName}</h2>
                <div className="text-xs text-slate-400 mt-1">
                  Vaga: <span className="text-slate-200 font-semibold">{report.roleTitle}</span> • ID: {report.sessionId}
                </div>
              </div>

              {/* Score Circular Badge */}
              <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-700 p-4 rounded-2xl">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Market Readiness</div>
                  <div className="text-xs font-bold text-emerald-400">{report.hiringDecision}</div>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/30">
                  {report.marketReadinessScore}%
                </div>
              </div>
            </div>

            {/* Score Breakdown Radar Bars */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { label: "Código & Algoritmos", score: report.scoreBreakdown.codingProficiency },
                { label: "Visão Arquitetural", score: report.scoreBreakdown.architecturalThinking },
                { label: "Comunicação (STAR)", score: report.scoreBreakdown.communicationSoftSkills },
                { label: "Agilidade & Resolução", score: report.scoreBreakdown.problemSolvingSpeed },
                { label: "Boas Práticas & CI/CD", score: report.scoreBreakdown.industryBestPractices }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-400">{item.label}</div>
                  <div className="text-xl font-bold text-white">{item.score}/100</div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Executive Summary */}
            <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
              <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Parecer do Comitê de Avaliação Técnica
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed">{report.executiveSummary}</p>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Destaques e Pontos Fortes
                </h4>
                <ul className="space-y-1.5">
                  {report.keyStrengths.map((s, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Oportunidades de Mentoria e Upskilling
                </h4>
                <ul className="space-y-1.5">
                  {report.areasToImprove.map((a, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setReport(null);
                  setActiveSession(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                ← Nova Entrevista Simulado
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                {isExportingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Baixar Laudo Oficial PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

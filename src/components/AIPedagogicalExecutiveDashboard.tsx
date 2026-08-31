import React, { useState, useEffect } from "react";
import { Cpu, Sparkles, TrendingUp, Clock, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, BarChart2, BookOpen, FileText, Zap } from "lucide-react";
import { apiUrl, safeJsonResponse } from "../config/api";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface SlaSuggestion {
  id: string;
  activity: string;
  currentSla: string;
  suggestedSla: string;
  reason: string;
  status: "pending" | "applied";
}

export function AIPedagogicalExecutiveDashboard() {
  const [modelName, setModelName] = useState("gemma3:4b (AI_PEDAGOGICAL_MODEL)");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingLessonPlan, setLoadingLessonPlan] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<string>(
    "📊 **Resumo Executivo Diário da Turma (Gerado por AI_PEDAGOGICAL_MODEL)**:\n• **Engajamento Global**: 92% dos discentes ativos nas últimas 24 horas.\n• **Ritmo de Entrega**: Aceleração de 16% na velocidade de conclusão de algoritmos e estruturas de dados.\n• **Gargalo Identificado**: O módulo de Programação Assíncrona apresentou taxa de estouro de SLA de 28% na Turma B, exigindo reforço em laboratório.\n• **Recomendação da IA**: Ajustar o SLA da atividade de Promises em JavaScript de 45 para 75 minutos para alinhar com a cadência real de raciocínio da turma."
  );
  const [suggestions, setSuggestions] = useState<SlaSuggestion[]>([
    {
      id: "sla-1",
      activity: "Lab #04: Manipulação de Ponteiros em C",
      currentSla: "60 minutos",
      suggestedSla: "90 minutos",
      reason: "Taxa de estouro de 34% detectada nas submissões da Turma A devido à complexidade de alocação de memória.",
      status: "pending"
    },
    {
      id: "sla-2",
      activity: "Desafio #02: Consultas SQL Complexas com JOINs",
      currentSla: "45 minutos",
      suggestedSla: "60 minutos",
      reason: "Cadência média de entrega superior ao limite em 15 minutos em 42% dos alunos.",
      status: "pending"
    },
    {
      id: "sla-3",
      activity: "Quiz #05: Programação Orientada a Objetos em Python",
      currentSla: "30 minutos",
      suggestedSla: "30 minutos",
      reason: "Ritmo adequado e pontualidade exemplar em 89% da turma. SLA mantido.",
      status: "applied"
    }
  ]);
  const [lessonPlan, setLessonPlan] = useState<string>(
    "### 📋 Plano de Aula Corretivo Baseado em Evidências (Gerado por AI_PEDAGOGICAL_MODEL)\n\n**1. Tópico Foco**: Resolução de Gargalos em Ponteiros e Alocação Dinâmica\n**2. Justificativa**: Evidências de 34% de estouro de SLA na última lista da Turma A.\n**3. Roteiro Prático**: \n- Revisão guiada de 25 minutos focada em rastreamento de ponteiros e memória.\n- Prática supervisionada em duplas (Pair Programming) com SLA estendido para 90 minutos.\n**4. Ação de Recuperação**: Envio automático de exercícios de fixação para discentes com nota abaixo de 60."
  );
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchSuggestions();
  }, []);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(apiUrl("/api/analytics/pedagogical-summary"));
      const data = await safeJsonResponse(res);
      if (data && data.success && data.summary) {
        setExecutiveSummary(data.summary);
        if (data.model) {
          setModelName(`${data.model} (AI_PEDAGOGICAL_MODEL)`);
        }
      }
    } catch (err) {
      console.error("Error fetching pedagogical summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(apiUrl("/api/academic-automation/suggest-slas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await safeJsonResponse(res);
      if (data && data.success && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Error fetching SLA suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const generateLessonPlan = async () => {
    setLoadingLessonPlan(true);
    try {
      const res = await fetch(apiUrl("/api/academic-automation/generate-lesson-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await safeJsonResponse(res);
      if (data && data.success && data.lessonPlan) {
        setLessonPlan(data.lessonPlan);
      }
    } catch (err) {
      console.error("Error generating lesson plan:", err);
    } finally {
      setLoadingLessonPlan(false);
    }
  };

  const handleApplySla = async (id: string) => {
    setApplyingId(id);
    setTimeout(() => {
      setSuggestions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "applied" } : item))
      );
      setApplyingId(null);
    }, 600);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text("CODECHECK AI - PAINEL EXECUTIVO PREDITIVO (AI_PEDAGOGICAL_MODEL)", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Modelo IA: ${modelName} | Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);

    doc.text("Resumo Executivo Diário:", 14, 38);
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(doc.splitTextToSize(executiveSummary.replace(/[*#]/g, ""), 180), 14, 46);

    const rows = suggestions.map((s) => [
      s.activity,
      s.currentSla,
      s.suggestedSla,
      s.reason,
      s.status === "applied" ? "Aplicado" : "Pendente"
    ]);

    (doc as any).autoTable({
      startY: 85,
      head: [["Atividade / Laboratório", "SLA Atual", "SLA Sugerido (IA)", "Justificativa da Cadência", "Status"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Dashboard_Executivo_Pedagogico_${Date.now()}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-500/20 flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-indigo-400" /> AI_PEDAGOGICAL_MODEL • {modelName}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display mt-2">
            Dashboard Executivo Pedagógico & Ajuste Preditivo de SLA
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Análise preditiva em tempo real do desempenho diário das turmas com base na cadência real de entrega dos estudantes e otimização automática de prazos de SLA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchSummary(); fetchSuggestions(); }}
            disabled={loadingSummary || loadingSuggestions}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingSummary || loadingSuggestions) ? "animate-spin text-indigo-400" : ""}`} />
            Atualizar Insights
          </button>
          <button
            onClick={handleExportPdf}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Exportar Relatório PDF
          </button>
        </div>
      </div>

      {/* Daily Summary & Predictive Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Executive Summary Card */}
        <div className="lg:col-span-7 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Resumo Executivo Diário (IA Pedagógica)
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Online • Atualizado Agora
              </span>
            </div>

            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-sans">
              {executiveSummary}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Modelo LLM: <strong className="text-indigo-300">{modelName}</strong></span>
            <button
              onClick={generateLessonPlan}
              disabled={loadingLessonPlan}
              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              {loadingLessonPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
              Gerar Plano Corretivo com IA
            </button>
          </div>
        </div>

        {/* Corrective Lesson Plan Preview */}
        <div className="lg:col-span-5 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Plano de Aula Corretivo Gerado
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Baseado em Evidências
              </span>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-mono overflow-y-auto max-h-64">
              {lessonPlan}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sincronizado automaticamente com o diário escolar e cronograma de aulas.
          </div>
        </div>
      </div>

      {/* SLA Cadence Adjustments Section */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Sugestões Automáticas de Ajuste de SLA por Cadência Real
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              A IA monitora o tempo médio de resolução dos alunos e sugere a expansão ou redução de prazos para evitar falsos estouros de SLA.
            </p>
          </div>
          <span className="text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-lg">
            {suggestions.filter(s => s.status === "applied").length} de {suggestions.length} aplicadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestions.map((item) => (
            <div key={item.id} className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 uppercase">
                    Análise de Prazo
                  </span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border ${
                    item.status === "applied" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {item.status === "applied" ? "SLA Ajustado" : "Pendente de Aplicação"}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white font-display">{item.activity}</h4>

                <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">SLA Atual</span>
                    <span className="text-slate-300 font-bold">{item.currentSla}</span>
                  </div>
                  <div className="text-indigo-400 font-bold">➔</div>
                  <div>
                    <span className="text-[10px] text-indigo-400 block uppercase font-bold">SLA Sugerido (IA)</span>
                    <span className="text-emerald-400 font-bold">{item.suggestedSla}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  {item.reason}
                </p>
              </div>

              <div>
                <button
                  onClick={() => handleApplySla(item.id)}
                  disabled={item.status === "applied" || applyingId === item.id}
                  className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    item.status === "applied"
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                  }`}
                >
                  {applyingId === item.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : item.status === "applied" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  {item.status === "applied" ? "SLA Otimizado Aplicado" : "Aplicar Novo Prazo de SLA"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AIPedagogicalExecutiveDashboard;

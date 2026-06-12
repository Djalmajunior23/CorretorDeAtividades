import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, BookOpen, Clock, Award, AlertTriangle, Plus, Trash2, 
  Map, Sparkles, Download, RefreshCw, Layers, CheckCircle2, 
  Settings, ChevronRight, FileSpreadsheet, ArrowLeftRight
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PlanejamentoView() {
  const [course, setCourse] = useState("Técnico em Desenvolvimento de Sistemas");
  const [cohort, setCohort] = useState("Turma de Desenvolvimento Web 1A");
  const [uc, setUc] = useState("Lógica de Programação e Estrutura de Dados");
  const [totalHours, setTotalHours] = useState(80);
  const [lessonsCount, setLessonsCount] = useState(20);
  const [holidays, setHolidays] = useState<string[]>(["2026-09-07", "2026-10-12"]);
  const [newHoliday, setNewHoliday] = useState("");

  const [aiPrompt, setAiPrompt] = useState("Monte um planejamento de 80 horas para Lógica de Programação com 20 encontros.");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestedResult, setSuggestedResult] = useState<any[] | null>(null);

  // Core schedules matching Módulo 1 & 4 (Roadmap map style)
  const [schedules, setSchedules] = useState<any[]>([
    { id: 1, week: 1, title: "Introdução à Lógica & Variáveis", hrs: 4, competency: "Compreender variáveis e tipos de dados primitivos", date: "2026-08-03", status: "executed", canceled: false },
    { id: 2, week: 1, title: "Estruturas Condicionais Simples/Compostas", hrs: 4, competency: "Aplicar blocos de decisão para fluxo lógico", date: "2026-08-10", status: "executed", canceled: false },
    { id: 3, week: 2, title: "Operadores Lógicos e Aritméticos", hrs: 4, competency: "Aplicar lógica booleana complexa em expressões", date: "2026-08-17", status: "executed", canceled: false },
    { id: 4, week: 2, title: "Estruturas de Repetição (Para, Enquanto)", hrs: 4, competency: "Estruturar loops de varredura e iterações finitas", date: "2026-08-24", status: "scheduled", canceled: false },
    { id: 5, week: 3, title: "Vetores e Arrays Unidimensionais", hrs: 4, competency: "Manipular arranjos lineares e indexação linear", date: "2026-08-31", status: "scheduled", canceled: false },
    { id: 6, week: 3, title: "Feriado Estadual (Ajustado)", hrs: 0, competency: "Nenhum - Feriado", date: "2026-09-07", status: "scheduled", canceled: true },
    { id: 7, week: 4, title: "Matrizes e Arrays Multidimensionais", hrs: 4, competency: "Manipular arranjos bidimensionais e coordenadas XY", date: "2026-09-14", status: "scheduled", canceled: false },
    { id: 8, week: 4, title: "Subalgoritmos (Funções e Procedimentos)", hrs: 4, competency: "Abstrair sub-rotinas escaláveis e escopo de variáveis", date: "2026-09-21", status: "scheduled", canceled: false },
    { id: 9, week: 5, title: "Parâmetros por Valor e Referência", hrs: 4, competency: "Diferenciar ponteiros lógicos de envio na pilha", date: "2026-09-28", status: "scheduled", canceled: false },
    { id: 10, week: 5, title: "Avaliação Intermediária de Competências", hrs: 4, competency: "Avaliar o raciocínio sintático e estrutural por rubrica", date: "2026-10-05", status: "scheduled", canceled: false }
  ]);

  // Re-planning State (Módulo 2)
  const [replanSuggestion, setReplanSuggestion] = useState<any[] | null>(null);

  // Competency Matrix State (Módulo 3)
  const [competencies, setCompetencies] = useState([
    { code: "COMP-01", name: "Compreensão Lógica e Tipos de Dados", hrs: 12, status: "aligned", coverage: 100, classCount: 3, assessments: ["Lista 01: Variáveis", "Simulado Geral Lógica"] },
    { code: "COMP-02", name: "Estruturas de Fluxo e Iterações", hrs: 16, status: "aligned", coverage: 75, classCount: 4, assessments: ["Lista 02: Loops e Seleções"] },
    { code: "COMP-03", name: "Manipulação de Estruturas Bidimensionais", hrs: 20, status: "partial", coverage: 50, classCount: 2, assessments: [] },
    { code: "COMP-04", name: "Funções e Procedimentos Modulares", hrs: 16, status: "risk", coverage: 0, classCount: 0, assessments: [] },
    { code: "COMP-05", name: "Algoritmos de Ordenação e Pilhas", hrs: 16, status: "risk", coverage: 0, classCount: 0, assessments: [] }
  ]);

  // Triggering alarms (Módulo 7)
  const classAlerts = [
    { type: "danger", text: "Competência COMP-04 (Módulos) está agendada para semana 4 mas não possui avaliação vinculada.", fix: "Sugira criar uma avaliação na Central de Avaliações" },
    { type: "warning", text: "Registrado 1 feriado oficial em 2026-09-07 que cancelou uma aula teórica. Redistribuição recomendada.", fix: "Clique em Replanejar Cronograma para redistribuir horas" }
  ];

  // AI Planner handler (Módulo 8) calling Gemini API or Fallback
  const handleAIGeneratedPlanner = async () => {
    setAiGenerating(true);
    setSuggestedResult(null);
    try {
      const response = await fetch("/api/ai/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setSuggestedResult(data);
      } else {
        setSuggestedResult([
          { week: 1, title: "Lógica de Programação, Variáveis Primitivas e Comportas", hrs: 4, competency: "Iniciação lógica estruturada" },
          { week: 2, title: "Operadores Aritméticos, Relacionais e Decisórios", hrs: 4, competency: "Escrita de testes lógicos condicionais" },
          { week: 3, title: "Estruturas de Repetição Encadeadas (For/While)", hrs: 4, competency: "Otimização de laços iterativos" }
        ]);
      }
      setAiGenerating(false);
    } catch (err: any) {
      console.warn("Generating planner with placeholder details due to network layout:", err.message);
      setSuggestedResult([
        { week: 1, title: "Lógica de Programação, Variáveis Primitivas e Comportas", hrs: 4, competency: "Iniciação lógica estruturada" }
      ]);
      setAiGenerating(false);
    }
  };

  const handleSuggestedFieldChange = (index: number, field: string, value: any) => {
    if (!aiSuggestedResult) return;
    const newData = [...aiSuggestedResult];
    newData[index] = { ...newData[index], [field]: value };
    setSuggestedResult(newData);
  };

  const handleApproveSuggested = async () => {
    if (!aiSuggestedResult) return;
    
    // Validate fields
    const hasEmptyFields = aiSuggestedResult.some(
      res => !res.title?.toString().trim() || !res.competency?.toString().trim() || !res.week || !res.hrs
    );

    if (hasEmptyFields) {
      alert("Existem campos obrigatórios vazios ou inválidos no cronograma. Por favor, preencha todos os campos antes de salvar.");
      return;
    }

    const items = aiSuggestedResult.map((suggest, i) => ({
      id: Date.now() + i,
      week: suggest.week,
      title: suggest.title,
      hrs: suggest.hrs,
      competency: suggest.competency,
      date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "scheduled" as const,
      canceled: false
    }));

    try {
      // Send to backend
      await fetch("/api/codecheck/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: items })
      });
      
      setSchedules(items);
      setSuggestedResult(null);
    } catch (err) {
      console.error("Erro ao salvar cronograma:", err);
      alert("Ocorreu um erro ao salvar o cronograma.");
    }
  };

  // Re-scheduling suggestion engine (Módulo 2)
  const handleTriggerReplan = () => {
    // Shifts cancelled class loads into subsequent classes
    const updated = schedules.map(sched => {
      if (sched.canceled) {
        return { ...sched, hrs: 0, status: "scheduled" };
      }
      if (sched.id === 7 || sched.id === 8) {
        // Redistribute hours (add 2 hours to cover lag)
        return { ...sched, hrs: sched.hrs + 2, title: sched.title + " (Carga Ampliada)" };
      }
      return sched;
    });
    setReplanSuggestion(updated);
  };

  const handleAcceptReplan = () => {
    if (!replanSuggestion) return;
    setSchedules(replanSuggestion);
    setReplanSuggestion(null);
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday) return;
    setHolidays([...holidays, newHoliday]);
    // Set matching schedule to cancelled automatically
    setSchedules(prev => prev.map(s => s.date === newHoliday ? { ...s, canceled: true, hrs: 0, title: "Feriado Lançado/Aula Suspensa" } : s));
    setNewHoliday("");
  };

  // Export PDF (Módulo 9) using real jsPDF!
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129); // emerald color
    doc.text("CODECHECK PEDAGOGICO - PLANO DE CURSO", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Unidade Curricular: ${uc}`, 14, 28);
    doc.text(`Curso: ${course} | Turma: ${cohort}`, 14, 34);
    doc.text(`Carga Horaria Planejada: ${totalHours} horas`, 14, 40);

    // Grid tables
    const tableData = schedules.map(s => [
      `Semana ${s.week}`, s.date, s.title, `${s.hrs} hrs`, s.canceled ? "Cancelada/Feriado" : "Regular", s.competency
    ]);

    autoTable(doc, {
      startY: 48,
      head: [["Semana", "Data", "Tema da Aula", "Carga H.", "Status", "Competencia Estimada"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Planejamento_Semestral_${uc.replace(/\s+/g, '_')}.pdf`);
  };

  // Metric summaries (Módulo 6)
  const hrsExecuted = schedules.filter(s => s.status === "executed").reduce((acc, current) => acc + current.hrs, 0);
  const hrsScheduled = schedules.filter(s => s.status === "scheduled" && !s.canceled).reduce((acc, current) => acc + current.hrs, 0);
  const percentCompleted = Math.round((hrsExecuted / (hrsExecuted + hrsScheduled || 1)) * 100);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 text-slate-100 animate-fade-in">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10b981] uppercase">Fase 12: Ecossistema Pedagógico de Planejamento</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display mt-0.5">Planejamento Semestral de Ensino</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gere cronogramas automatizados com IA, monitore a cobertura do currículo do SENAI por competências e faça replanejamento dinâmico sem fricção.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExportPDF} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold hover:bg-slate-800 transition-all cursor-pointer text-slate-300"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Exportar PDF
          </button>
          
          <button 
            disabled 
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-500 opacity-60"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar XLS
          </button>
        </div>
      </div>

      {/* Module 6: Painel de Cobertura & Alertas (Module 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coverage percentages */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold uppercase">
              <span>Carga Horária</span>
              <Clock className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white">{hrsExecuted + hrsScheduled}h</span>
              <span className="text-xs text-slate-500 font-mono ml-1.5">de {totalHours}h previstas</span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, ((hrsExecuted + hrsScheduled) / totalHours) * 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold uppercase">
              <span>Aulas Concluídas</span>
              <CheckCircle2 className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white">{percentCompleted}%</span>
              <span className="text-xs text-slate-500 font-mono ml-1.5">conclusão do diário</span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${percentCompleted}%` }} />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold uppercase">
              <span>Competências Cobertas</span>
              <Award className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white">
                {competencies.filter(c => c.coverage >= 50).length} / {competencies.length}
              </span>
              <span className="text-xs text-slate-500 font-mono ml-1.5">acima de 50% de foco</span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-purple-400 h-full rounded-full" style={{ width: `${(competencies.filter(c => c.coverage >= 50).length / competencies.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Module 7: Alerts */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertas Pedagógicos Ativos
          </h3>
          <div className="flex flex-col gap-2">
            {classAlerts.map((alert, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-slate-300 text-[11px] leading-relaxed">
                <span className="font-semibold block mb-0.5 text-amber-400">● {alert.text}</span>
                <span className="text-slate-500 font-medium">Recomendado: {alert.fix}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Main configuration parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Setup, IA Planner & Road map */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Setup parameters & Holiday settings */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Configuração Técnica do Cronograma
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase">Unidade Curricular</label>
                <input 
                  type="text" 
                  value={uc} 
                  onChange={e => setUc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs hover:border-slate-800 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase">Carga Horária (UC)</label>
                <input 
                  type="number" 
                  value={totalHours} 
                  onChange={e => setTotalHours(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs hover:border-slate-800 focus:outline-none focus:border-emerald-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase">Dias de Feriado Ativos</label>
                <form onSubmit={handleAddHoliday} className="flex gap-2">
                  <input 
                    type="date" 
                    value={newHoliday} 
                    onChange={e => setNewHoliday(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-850 px-2 py-1 rounded-xl text-xs hover:border-slate-800 focus:outline-none focus:border-emerald-500 transition-all font-mono font-semibold"
                  />
                  <button type="submit" className="px-3 bg-emerald-500 hover:bg-emerald-600 font-bold font-mono text-xs text-[#030712] rounded-xl cursor-pointer">
                    +
                  </button>
                </form>
              </div>
            </div>

            {holidays.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase mt-1 shrink-0">Feriados Ativos:</span>
                {holidays.map((hol, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-2.5 py-1 rounded-lg flex items-center gap-1">
                    {hol}
                    <button type="button" onClick={() => setHolidays(holidays.filter(h => h !== hol))} className="text-rose-400 hover:text-rose-500 font-bold ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Module 8: Intelligent Copiloto IA Planning module */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#10b981]/10 text-emerald-400 border border-emerald-500/15">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Gerador de Cronograma com IA</h3>
                <p className="text-xs text-slate-400">Comando inteligente para estruturar toda a ementa de aulas baseada nas competências.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <input 
                id="gerador-cronograma-ia"
                type="text" 
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Ex. Monte um planejamento de 80 horas para Lógica de Programação..."
                className="flex-1 bg-slate-900 border border-slate-850 px-4 py-3 rounded-xl text-xs hover:border-slate-800 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
              <button 
                onClick={handleAIGeneratedPlanner}
                className="px-5 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-[#030712] font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {aiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Planejar com IA
              </button>
            </div>

            <AnimatePresence>
              {aiSuggestedResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-950 border border-emerald-500/20 p-4 rounded-xl mt-3 flex flex-col gap-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 font-mono">Sugestão de Cronograma Encontrada:</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                          <th className="py-2 px-3 font-bold">Semana</th>
                          <th className="py-2 px-3 font-bold">Tema / Conteúdo</th>
                          <th className="py-2 px-3 font-bold">Competência</th>
                          <th className="py-2 px-3 font-bold text-center">Carga (hs)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiSuggestedResult.map((res, i) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                            <td className="py-2 px-3 align-top">
                              <input 
                                className="bg-slate-950 border border-slate-800 px-2 py-1.5 rounded text-slate-200 font-bold w-14 text-center focus:outline-none focus:border-emerald-500" 
                                type="number"
                                value={res.week}
                                onChange={(e) => handleSuggestedFieldChange(i, 'week', parseInt(e.target.value))}
                              />
                            </td>
                            <td className="py-2 px-3 align-top">
                              <input 
                                className="bg-slate-950 border border-slate-800 px-2 py-1.5 rounded text-slate-200 font-semibold w-full focus:outline-none focus:border-emerald-500" 
                                type="text"
                                value={res.title}
                                onChange={(e) => handleSuggestedFieldChange(i, 'title', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-3 align-top">
                              <input 
                                className="bg-slate-950 border border-slate-800 px-2 py-1.5 rounded text-slate-400 font-mono italic w-full focus:outline-none focus:border-emerald-500" 
                                type="text"
                                value={res.competency}
                                onChange={(e) => handleSuggestedFieldChange(i, 'competency', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-3 align-top text-center w-20">
                              <input 
                                className="bg-slate-950 border border-slate-800 px-2 py-1.5 rounded text-slate-400 font-mono text-center w-full focus:outline-none focus:border-emerald-500" 
                                type="number"
                                value={res.hrs}
                                onChange={(e) => handleSuggestedFieldChange(i, 'hrs', parseInt(e.target.value))}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <button 
                      onClick={() => setSuggestedResult(null)} 
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded text-xs font-medium cursor-pointer"
                    >
                      Descartar
                    </button>
                    <button 
                      onClick={handleApproveSuggested} 
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-xs text-[#030712] font-bold rounded cursor-pointer"
                    >
                      Salvar Cronograma
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Module 4: Semester Map (Roadmap/Timeline) */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Map className="w-5 h-5 text-emerald-400" />
                  Mapa de Distribuição Semestral (Cronograma)
                </h3>
                <p className="text-xs text-slate-400">Visão cronológica linear e estrutural do semestre letivo.</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleTriggerReplan} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold border border-amber-500/15 text-xs font-mono rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Replanejar Aulas
                </button>
              </div>
            </div>

            {/* Replan notice */}
            <AnimatePresence>
              {replanSuggestion && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-slate-300 text-xs leading-normal flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Sugestão de Represamento e Redistribuição</span>
                    <button 
                      onClick={handleAcceptReplan}
                      className="px-3 py-1 bg-amber-500 text-slate-955 hover:bg-amber-600 font-bold text-[11px] rounded transition-all cursor-pointer"
                    >
                      Aprovar Redistribuição
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    A aula cancelada em <strong>2026-09-07</strong> causou déficit de 4h. Sugerimos compensar ampliando a carga horária das semanas 4 e 5 consecutivas (+2 horas cada encontro).
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-3.5 mt-2">
              {schedules.map((sched) => (
                <div 
                  key={sched.id} 
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    sched.canceled 
                      ? "bg-rose-500/5 border-rose-500/10 opacity-70" 
                      : sched.status === "executed" 
                      ? "bg-[#10b981]/5 border-emerald-500/20" 
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 font-mono text-xs font-bold text-slate-500">Sem {sched.week}</div>
                    
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${sched.canceled ? "line-through text-slate-400" : "text-white"}`}>{sched.title}</span>
                        {sched.canceled && (
                          <span className="text-[8px] bg-rose-500/20 text-rose-300 font-mono font-bold px-1.5 py-0.2 rounded uppercase">Cancelada</span>
                        )}
                        {sched.status === "executed" && (
                          <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.2 rounded uppercase">Lançado no Diário</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono italic">COMPETÊNCIA: {sched.competency}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] font-mono text-slate-500">{sched.date}</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{sched.hrs} horas</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSchedules(prev => prev.map(s => s.id === sched.id ? { ...s, canceled: !s.canceled, hrs: s.canceled ? 4 : 0 } : s))}
                        className={`p-1 px-2 text-[9px] font-mono font-bold uppercase rounded ${
                          sched.canceled ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-rose-500/15 text-rose-400 hover:bg-rose-500/20"
                        } cursor-pointer transition-all`}
                      >
                        {sched.canceled ? "Reativar" : "Cancelar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Matrix of competencies (Módulo 3) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Matriz de Competências
            </h3>
            <p className="text-xs text-slate-400 mb-4">Associação das pautas didáticas às competências requeridas pelo SENAI.</p>

            <div className="flex flex-col gap-4">
              {competencies.map((comp, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 leading-normal">{comp.code}</span>
                      <span className="text-xs font-bold text-slate-200 mt-0.5 leading-normal">{comp.name}</span>
                    </div>
                    
                    <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      comp.status === "aligned" 
                        ? "bg-emerald-500/10 text-emerald-300" 
                        : comp.status === "partial" 
                        ? "bg-amber-500/10 text-amber-300" 
                        : "bg-rose-500/10 text-rose-300"
                    }`}>
                      {comp.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono mt-1 border-t border-slate-900 pt-2">
                    <div>Encontros: <span className="font-medium text-slate-300">{comp.classCount}</span></div>
                    <div className="text-right">Carg H.: <span className="font-medium text-slate-300">{comp.hrs}h</span></div>
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>Cobertura Simulada</span>
                      <span>{comp.coverage}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${comp.coverage === 100 ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${comp.coverage}%` }} />
                    </div>
                  </div>

                  {comp.assessments.length > 0 ? (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">Avaliações Alinhadas:</span>
                      <div className="flex flex-wrap gap-1">
                        {comp.assessments.map((as, i) => (
                          <span key={i} className="text-[8px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-900 font-semibold">{as}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[8px] font-mono font-bold text-rose-400/80 bg-rose-500/5 px-2 py-1 rounded inline-block text-center mt-1 uppercase">
                      ⚠️ Sem avaliações de acompanhamento (Lacuna)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

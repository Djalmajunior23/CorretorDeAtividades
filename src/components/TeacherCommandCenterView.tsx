import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Map, 
  Zap, 
  FileText, 
  Target, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  AlertTriangle,
  PlayCircle,
  PlusCircle,
  Copy,
  Trash2,
  Sparkles,
  Users,
  CheckSquare,
  Square,
  TrendingUp,
  Award,
  Send,
  Sliders,
  Layers,
  Search
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const MOCK_OVERVIEW_DEFAULT = {
  analytics: {
    feedbacks_this_week: 14,
    average_correction_time_min: 8,
    interventions_active: 3,
    active_classes: 4,
    attention_needed_students: 2,
    completion_rate_percent: 88,
  },
  tasks: {
    high_priority: [
      { id: "hp_1", title: "Correção pendente: Lista 03 - Pilhas e Filas (Turma A)", impact: "24 alunos aguardando nota final" },
      { id: "hp_2", title: "Submissões em Atenção: Trilha de Complexidade Algorítmica", impact: "3 alunos com tempo limite excedido (Timeouts)" }
    ],
    medium_priority: [
      { id: "mp_1", title: "Enviar sugestões de recuperação para alunos de baixo rendimento", impact: "Apoio pedagógico com sugestões geradas por Copiloto IA" },
      { id: "mp_2", title: "Revisar logs de sandbox timeout e limites do interpretador", impact: "Ajuste fino de restrições de memória do Docker local" }
    ]
  }
};

export default function TeacherCommandCenterView({ featureFlags }: any) {
  const [overviewData, setOverviewData] = useState<any>(MOCK_OVERVIEW_DEFAULT);
  const [activeTab, setActiveTab] = useState("queue");

  // State for Queue Actions
  const [activeTaskModal, setActiveTaskModal] = useState<any>(null);
  const [modalFeedbackText, setModalFeedbackText] = useState("");
  const [modalGrade, setModalGrade] = useState("85");

  // State for Bulk Operations
  const [bulkSubmissions, setBulkSubmissions] = useState([
    { id: "sub_1", student: "Ana Rodrigues Silva", activity: "Lista 03: Pilhas e Filas", language: "python", status: "submitted", statusText: "Aguardando Correção", codePreview: "def push(stack, item):\n    stack.append(item)" },
    { id: "sub_2", student: "Carlos Henrique Souza", activity: "Lista 03: Pilhas e Filas", language: "python", status: "submitted", statusText: "Aguardando Correção", codePreview: "def pop(stack):\n    return stack.pop()" },
    { id: "sub_3", student: "Beatriz Oliveira Costa", activity: "Lista 03: Pilhas e Filas", language: "javascript", status: "submitted", statusText: "Aguardando Correção", codePreview: "function queue(arr, item) {\n  arr.push(item);\n}" },
    { id: "sub_4", student: "Daniel Santos Ramos", activity: "Lista 03: Pilhas e Filas", language: "python", status: "submitted", statusText: "Aguardando Correção", codePreview: "class Queue:\n    def __init__(self):\n        self.items = []" },
    { id: "sub_5", student: "Eduardo Marques Neto", activity: "Lista 03: Pilhas e Filas", language: "typescript", status: "submitted", statusText: "Aguardando Correção", codePreview: "const peek = <T>(q: T[]): T => q[0];" }
  ]);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [bulkGrade, setBulkGrade] = useState("90");
  const [bulkTemplateComment, setBulkTemplateComment] = useState("Parabéns! Estruturas implementadas corretamente respeitando os parâmetros de complexidade assintótica informados.");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // State for Templates
  const [templates, setTemplates] = useState([
    { id: 1, title: "Lógica Impecável", category: "Elogio", text: "Excelente raciocínio lógico no desenvolvimento da solução. Atendeu 100% aos requisitos e demonstrou excelente complexidade ciclomática.", count: 184 },
    { id: 2, title: "Cuidado com Complexidade", category: "Orientação", text: "Seu algoritmo funciona para conjuntos pequenos de dados, mas utiliza loops aninhados desnecessários. Busque refatorar utilizando dicionários/tabelas hash para otimizar para O(N).", count: 92 },
    { id: 3, title: "Indentação e Estilo", category: "Refatoração", text: "Código funcional, porém fora das diretrizes PEP8 (ou guia de estilos). Lembre-se que legibilidade é fundamental no mercado corporativo.", count: 64 },
    { id: 4, title: "Instrução de Recuperação", category: "Ação Pedagógica", text: "Identifiquei que você teve dificuldades com laços. Recomendo fortemente acessar a Trilha de Treinamento Paralelo em 'Recuperação' para repassar os fundamentos.", count: 47 }
  ]);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Orientação");
  const [newTemplateText, setNewTemplateText] = useState("");

  // State for Planner
  const [plannerEvents, setPlannerEvents] = useState([
    { id: 1, day: "Segunda-feira", time: "09:00", text: "Feedback em lote Lista 02 (Turma A)", done: true },
    { id: 2, day: "Terça-feira", time: "14:30", text: "Revisar logs de sandbox timeout e ajustar limites", done: false },
    { id: 3, day: "Quarta-feira", time: "10:00", text: "Disparar alertas automáticos para alunos de risco", done: false },
    { id: 4, day: "Quinta-feira", time: "15:00", text: "Geração IA de novas atividades de recursão", done: false },
    { id: 5, day: "Sexta-feira", time: "11:00", text: "Acompanhar trilhas de recuperação paralela ativa", done: false }
  ]);
  const [newEventDay, setNewEventDay] = useState("Segunda-feira");
  const [newEventTime, setNewEventTime] = useState("10:00");
  const [newEventText, setNewEventText] = useState("");

  // Target comparison config
  const [selectedCohortA, setSelectedCohortA] = useState("turma_1a");
  const [selectedCohortB, setSelectedCohortB] = useState("turma_1b");

  useEffect(() => {
    fetch("/api/codecheck/module08/overview")
      .then(res => res.json())
      .then(data => {
        if (!data.error) setOverviewData(data);
      })
      .catch(console.error);
  }, []);

  const handleToggleEvent = (id: number) => {
    setPlannerEvents(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventText.trim()) return;
    setPlannerEvents(prev => [...prev, {
      id: Date.now(),
      day: newEventDay,
      time: newEventTime,
      text: newEventText,
      done: false
    }]);
    setNewEventText("");
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim() || !newTemplateText.trim()) return;
    setTemplates(prev => [...prev, {
      id: Date.now(),
      title: newTemplateTitle,
      category: newTemplateCategory,
      text: newTemplateText,
      count: 0
    }]);
    setNewTemplateTitle("");
    setNewTemplateText("");
  };

  const handleSelectAllBulk = () => {
    if (selectedSubIds.length === bulkSubmissions.length) {
      setSelectedSubIds([]);
    } else {
      setSelectedSubIds(bulkSubmissions.map(s => s.id));
    }
  };

  const handleToggleSelectBulk = (id: string) => {
    setSelectedSubIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const triggerBulkCorrection = () => {
    if (selectedSubIds.length === 0) return;
    setBulkProcessing(true);
    setBulkProgress(5);

    const interval = setInterval(() => {
      setBulkProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Apply correction
            const updated = bulkSubmissions.map(sub => {
              if (selectedSubIds.includes(sub.id)) {
                return { ...sub, status: "corrected" as const, statusText: "Corrigida - Lote" };
              }
              return sub;
            });
            setBulkSubmissions(updated);
            setSelectedSubIds([]);
            setBulkProcessing(false);
            setBulkProgress(0);
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleSubmitModalFeedback = () => {
    if (!activeTaskModal) return;
    // Mock submit behavior
    setOverviewData((prev: any) => {
      // Remove resolved task or update state
      const highUpdated = prev.tasks.high_priority.filter((t: any) => t.id !== activeTaskModal.id);
      const medUpdated = prev.tasks.medium_priority.filter((t: any) => t.id !== activeTaskModal.id);
      return {
        ...prev,
        tasks: {
          high_priority: highUpdated,
          medium_priority: medUpdated
        },
        analytics: {
          ...prev.analytics,
          feedbacks_this_week: prev.analytics.feedbacks_this_week + 1
        }
      };
    });
    setActiveTaskModal(null);
    setModalFeedbackText("");
  };

  const handleCardCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple alert-free UI state trigger could be added, let's keep it clean
  };

  // Compare Data Mock based on selection
  const cohortAStats = selectedCohortA === "turma_1a" ? {
    name: "Turma 1-A (Algoritmos Avançados)",
    grade: 84.2,
    compilerRate: 92.5,
    timeouts: 1.2,
    criticals: 2,
    aiProbability: 14.2
  } : {
    name: "Turma 1-B (Introdução CLI)",
    grade: 71.5,
    compilerRate: 81.0,
    timeouts: 3.5,
    criticals: 5,
    aiProbability: 24.8
  };

  const cohortBStats = selectedCohortB === "turma_1c" ? {
    name: "Turma 1-C (Programação Estruturada)",
    grade: 63.8,
    compilerRate: 70.4,
    timeouts: 7.8,
    criticals: 9,
    aiProbability: 45.2
  } : {
    name: "Turma 1-B (Introdução CLI)",
    grade: 71.5,
    compilerRate: 81.0,
    timeouts: 3.5,
    criticals: 5,
    aiProbability: 24.8
  };

  const compareChartData = [
    { name: "Nota Média (x10)", CohortA: cohortAStats.grade, CohortB: cohortBStats.grade },
    { name: "Compilador (%)", CohortA: cohortAStats.compilerRate, CohortB: cohortBStats.compilerRate },
    { name: "Timeout Sandbox (x10)", CohortA: cohortAStats.timeouts * 10, CohortB: cohortBStats.timeouts * 10 },
    { name: "IA Suspeita (%)", CohortA: cohortAStats.aiProbability, CohortB: cohortBStats.aiProbability }
  ];

  return (
    <div className="flex gap-6 animate-fade-in h-[calc(100vh-80px)]">
      {/* SIDEBAR NAVIGATION */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
         <div className="p-4 bg-[#0f172a] border border-fuchsia-500/30 rounded-xl mb-2">
            <h2 className="font-bold font-mono text-white tracking-widest text-sm flex items-center gap-2 uppercase">
              <Zap className="w-4 h-4 text-fuchsia-400" />
              Operações
            </h2>
            <p className="text-xs text-slate-400 mt-1">Central do Professor (Fase 08)</p>
         </div>

         {[
            {id: "queue", label: "Fila Inteligente", icon: Target},
            {id: "bulk", label: "Correção em Lote", icon: CheckCircle2},
            {id: "planner", label: "Planejador Semanal", icon: Clock},
            {id: "library", label: "Bibl. Templates", icon: FileText},
            {id: "compare", label: "Comparar Turmas", icon: Map},
            {id: "analytics", label: "Produtividade", icon: BarChart3}
         ].map(tab => (
           <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 p-3 text-left rounded-xl border transition-all ${
                activeTab === tab.id 
                 ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300' 
                 : 'bg-[#0f172a]/50 border-transparent text-slate-400 hover:bg-[#0f172a] hover:text-slate-200'
              }`}
           >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-bold font-mono">{tab.label}</span>
           </button>
         ))}
      </div>

      {/* VIEWPORT CONTROLLER */}
      <div className="flex-1 bg-[#0f172a] border border-[#1e295b]/30 rounded-xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[#1e295b]/50 bg-[#030712]/50 flex items-center justify-between">
           <h3 className="font-bold text-white text-lg font-display">
              {activeTab === "queue" && "Fila Inteligente de Trabalho"}
              {activeTab === "bulk" && "Correção e Operações em Lote"}
              {activeTab === "planner" && "Planejador Semanal Docente"}
              {activeTab === "library" && "Biblioteca de Templates e Respostas"}
              {activeTab === "compare" && "Comparador Analítico de Turmas"}
              {activeTab === "analytics" && "Dashboard de Produtividade Docente"}
           </h3>
           <div className="px-3 py-1 bg-slate-800 rounded font-mono text-xs text-slate-300 border border-slate-700">
             Módulo 08 Ativo
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
           
           {/* TAB 1: WORK QUEUE */}
           {activeTab === "queue" && overviewData && (
             <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">Feedbacks Enviados</span>
                     <span className="text-2xl font-black text-slate-200">{overviewData.analytics.feedbacks_this_week}</span>
                  </div>
                  <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">Tempo Médio/Correção</span>
                     <span className="text-2xl font-black text-emerald-400">{overviewData.analytics.average_correction_time_min}m</span>
                  </div>
                  <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">Intervenções Ativas</span>
                     <span className="text-2xl font-black text-fuchsia-400">{overviewData.analytics.interventions_active}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold font-mono text-rose-400 uppercase tracking-widest flex items-center gap-2 border-b border-rose-500/10 pb-2">
                    <AlertTriangle className="w-4 h-4" /> Prioridade Máxima
                  </h4>
                  {overviewData.tasks.high_priority.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic">Sem pendências de alta prioridade.</p>
                  ) : (
                    overviewData.tasks.high_priority.map((task: any) => (
                       <div key={task.id} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between hover:border-rose-500/40 transition-colors">
                         <div className="flex flex-col gap-1">
                           <span className="text-sm font-bold text-slate-200">{task.title}</span>
                           <span className="text-xs text-slate-400">Impacto: {task.impact}</span>
                         </div>
                         <button 
                           onClick={() => setActiveTaskModal(task)}
                           className="flex items-center gap-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                         >
                           <PlayCircle className="w-4 h-4" /> Trabalhar
                         </button>
                       </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2 border-b border-amber-500/10 pb-2">
                    <Clock className="w-4 h-4" /> Prioridade Média
                  </h4>
                  {overviewData.tasks.medium_priority.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic">Sem pendências de prioridade média.</p>
                  ) : (
                    overviewData.tasks.medium_priority.map((task: any) => (
                       <div key={task.id} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between hover:border-amber-500/40 transition-colors">
                         <div className="flex flex-col gap-1">
                           <span className="text-sm font-bold text-slate-200">{task.title}</span>
                           <span className="text-xs text-slate-400">Impacto: {task.impact}</span>
                         </div>
                         <button 
                           onClick={() => setActiveTaskModal(task)}
                           className="flex items-center gap-2 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                         >
                           <PlayCircle className="w-4 h-4" /> Trabalhar
                         </button>
                       </div>
                    ))
                  )}
                </div>
             </div>
           )}

           {/* TAB 2: BULK GRADINGS */}
           {activeTab === "bulk" && (
             <div className="flex flex-col gap-6">
               <div className="bg-fuchsia-500/5 border border-fuchsia-500/10 p-4 rounded-xl text-xs text-slate-300 flex items-start gap-3">
                 <Sparkles className="w-5 h-5 text-fuchsia-400 shrink-0" />
                 <div>
                   <h5 className="font-bold text-slate-100">Como funciona a Correção em Lote?</h5>
                   <p className="mt-1 text-slate-400">
                     Selecione múltiplos alunos pendentes na Lista 03 abaixo, aplique uma nota rápida e um feedback padrão da biblioteca de templates. O CodeCheck processará o envio e as notificações simultaneamente.
                   </p>
                 </div>
               </div>

               {/* Bulk Tooling Bar */}
               <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                   <button 
                     onClick={handleSelectAllBulk}
                     className="flex items-center gap-2 text-slate-300 hover:text-white font-mono text-xs font-bold"
                   >
                     {selectedSubIds.length === bulkSubmissions.length ? (
                       <CheckSquare className="w-4 h-4 text-fuchsia-400" />
                     ) : (
                       <Square className="w-4 h-4" />
                     )}
                     Selecionar Todos ({selectedSubIds.length}/{bulkSubmissions.length})
                   </button>
                 </div>

                 <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-mono text-slate-400">Nota:</span>
                     <input 
                       type="number" 
                       min="0" 
                       max="100" 
                       value={bulkGrade}
                       onChange={(e) => setBulkGrade(e.target.value)}
                       className="bg-[#030712] border border-slate-700 text-xs font-mono rounded p-1.5 w-16 text-center text-white"
                     />
                   </div>

                   <div className="flex-1 md:flex-none min-w-[200px]">
                     <select 
                       value={bulkTemplateComment}
                       onChange={(e) => setBulkTemplateComment(e.target.value)}
                       className="bg-[#030712] border border-slate-700 text-xs font-mono rounded p-1.5 w-full text-slate-200"
                     >
                       <option value="Parabéns! Estruturas implementadas corretamente respeitando os parâmetros de complexidade assintótica informados.">Feedback: Excelente Lógica</option>
                       <option value="A solução resolve os testes primários, mas falha em testes de concorrência e robustez de limites. Revise as restrições e submeta novamente.">Feedback: Erros de Limite</option>
                       <option value="Atenção técnica com o correto fechamento de recursos de memória e tratamento de erros (Try/Catch).">Feedback: Boas Práticas</option>
                     </select>
                   </div>

                   <button 
                     onClick={triggerBulkCorrection}
                     disabled={selectedSubIds.length === 0 || bulkProcessing}
                     className="bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-mono font-bold px-4 py-2 rounded-lg flex items-center gap-2 shrink-0 transition-colors"
                   >
                     {bulkProcessing ? "Processando..." : "Corrigir Selecionados"}
                   </button>
                 </div>
               </div>

               {/* Bulk Progress Bar */}
               {bulkProcessing && (
                 <div className="w-full bg-[#030712] border border-slate-800 p-3 rounded-lg flex flex-col gap-1">
                   <div className="flex items-center justify-between text-[10px] font-mono font-bold text-fuchsia-400">
                     <span>CORRETOR MULTI-THREADING EM LOTE ATIVO</span>
                     <span>{bulkProgress}%</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                     <div style={{ width: `${bulkProgress}%` }} className="h-full bg-fuchsia-500 transition-all duration-200" />
                   </div>
                 </div>
               )}

               {/* Submissions List */}
               <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#030712]/40">
                 <table className="w-full text-left font-mono text-xs">
                   <thead className="bg-[#030712] border-b border-slate-800 text-slate-400">
                     <tr>
                       <th className="p-4 w-12 text-center">Sel</th>
                       <th className="p-4">Estudante</th>
                       <th className="p-4">Atividade</th>
                       <th className="p-4">Linguagem</th>
                       <th className="p-4">Preview do Código</th>
                       <th className="p-4 text-right">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800 text-slate-300">
                     {bulkSubmissions.map((sub) => (
                       <tr key={sub.id} className="hover:bg-slate-850/20">
                         <td className="p-4 text-center">
                           <button 
                             onClick={() => handleToggleSelectBulk(sub.id)}
                             disabled={sub.status === "corrected"}
                             className="text-slate-400 hover:text-white"
                           >
                             {selectedSubIds.includes(sub.id) ? (
                               <CheckSquare className="w-4 h-4 text-fuchsia-500" />
                             ) : sub.status === "corrected" ? (
                               <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                             ) : (
                               <Square className="w-4 h-4" />
                             )}
                           </button>
                         </td>
                         <td className="p-4 font-bold text-slate-100">{sub.student}</td>
                         <td className="p-4 text-slate-400">{sub.activity}</td>
                         <td className="p-4">
                           <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] uppercase font-bold">{sub.language}</span>
                         </td>
                         <td className="p-4 text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={sub.codePreview}>
                           <code>{sub.codePreview}</code>
                         </td>
                         <td className="p-4 text-right">
                           <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                             sub.status === 'corrected' 
                               ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                               : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                           }`}>
                             {sub.statusText}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {/* TAB 3: PLANNER */}
           {activeTab === "planner" && (
             <div className="flex flex-col gap-6">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 {/* Event Creator */}
                 <div className="bg-[#030712]/50 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
                   <h4 className="text-sm font-bold font-mono text-slate-200 border-b border-slate-800 pb-2 mb-2 uppercase tracking-wider flex items-center gap-2">
                     <PlusCircle className="w-4 h-4 text-fuchsia-400" /> Agendar Tarefa
                   </h4>
                   <form onSubmit={handleAddEvent} className="flex flex-col gap-4">
                     <div className="flex flex-col">
                       <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Dia da Semana</label>
                       <select 
                         value={newEventDay}
                         onChange={(e) => setNewEventDay(e.target.value)}
                         className="bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 p-2 focus:outline-none focus:border-fuchsia-500"
                       >
                         <option value="Segunda-feira">Segunda-feira</option>
                         <option value="Terça-feira">Terça-feira</option>
                         <option value="Quarta-feira">Quarta-feira</option>
                         <option value="Quinta-feira">Quinta-feira</option>
                         <option value="Sexta-feira">Sexta-feira</option>
                       </select>
                     </div>

                     <div className="flex flex-col">
                       <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Horário</label>
                       <input 
                         type="text" 
                         placeholder="Ex: 14:00"
                         value={newEventTime}
                         onChange={(e) => setNewEventTime(e.target.value)}
                         className="bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 p-2 focus:outline-none focus:border-fuchsia-500"
                       />
                     </div>

                     <div className="flex flex-col">
                       <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Descrição</label>
                       <textarea 
                         placeholder="Descreva a atividade..."
                         value={newEventText}
                         onChange={(e) => setNewEventText(e.target.value)}
                         rows={3}
                         className="bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 p-2 focus:outline-none focus:border-fuchsia-500"
                       />
                     </div>

                     <button 
                       type="submit"
                       className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-mono font-bold text-xs p-2.5 rounded-lg text-center transition-all"
                     >
                       Adicionar na Agenda
                     </button>
                   </form>
                 </div>

                 {/* Calendar Grid */}
                 <div className="lg:col-span-2 border border-slate-800 p-5 rounded-xl bg-[#030712]/20 flex flex-col gap-4">
                   <h4 className="text-sm font-bold font-mono text-slate-200 border-b border-slate-800 pb-2 uppercase tracking-wider flex items-center gap-2">
                     <Clock className="w-4 h-4 text-fuchsia-400" /> Agenda Semanal e Organização
                   </h4>

                   <div className="flex flex-col gap-3">
                     {plannerEvents.map(event => (
                       <div 
                         key={event.id}
                         className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                           event.done 
                             ? 'bg-slate-800/10 border-slate-800 text-slate-500 line-through' 
                             : 'bg-[#030712]/60 border-slate-700/50 text-slate-200'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={() => handleToggleEvent(event.id)}
                             className="text-slate-400 hover:text-white"
                           >
                             {event.done ? (
                               <CheckSquare className="w-4.5 h-4.5 text-fuchsia-500" />
                             ) : (
                               <Square className="w-4.5 h-4.5 text-slate-600" />
                             )}
                           </button>
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2 mb-0.5">
                               <span className="text-[10px] font-mono leading-none bg-fuchsia-500/10 border border-fuchsia-500/25 px-1.5 py-0.5 rounded text-fuchsia-300">
                                 {event.day}
                               </span>
                               <span className="text-[10px] font-mono text-slate-400">{event.time}</span>
                             </div>
                             <span className="text-xs font-mono">{event.text}</span>
                           </div>
                         </div>

                         <button 
                           onClick={() => setPlannerEvents(prev => prev.filter(e => e.id !== event.id))}
                           className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-800/30 transition-all"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>

               </div>
             </div>
           )}

           {/* TAB 4: TEMPLATES */}
           {activeTab === "library" && (
             <div className="flex flex-col gap-6">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 {/* Template creator */}
                 <div className="bg-[#030712]/50 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
                   <h4 className="text-sm font-bold font-mono text-slate-200 border-b border-slate-800 pb-2 uppercase tracking-wider flex items-center gap-2">
                     <PlusCircle className="w-4 h-4 text-fuchsia-400" /> Novo Modelo
                   </h4>
                   <form onSubmit={handleAddTemplate} className="flex flex-col gap-4">
                     <div className="flex flex-col">
                       <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Título Rápido</label>
                       <input 
                         type="text" 
                         placeholder="Ex: Refatorar Recursão"
                         value={newTemplateTitle}
                         onChange={(e) => setNewTemplateTitle(e.target.value)}
                         className="bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 p-2 focus:outline-none focus:border-fuchsia-500"
                       />
                     </div>

                     <div className="flex flex-col">
                       <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Categoria</label>
                       <select 
                         value={newTemplateCategory}
                         onChange={(e) => setNewTemplateCategory(e.target.value)}
                         className="bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 p-2 focus:outline-none focus:border-fuchsia-500"
                       >
                         <option value="Elogio">Elogio</option>
                         <option value="Orientação">Orientação</option>
                         <option value="Refatoração">Refatoração</option>
                         <option value="Ação Pedagógica">Ação Pedagógica</option>
                       </select>
                     </div>

                     <div className="flex flex-col">
                       <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Conteúdo do Feedback</label>
                       <textarea 
                         placeholder="Digite o texto padrão que será enviado..."
                         value={newTemplateText}
                         onChange={(e) => setNewTemplateText(e.target.value)}
                         rows={4}
                         className="bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 p-2 focus:outline-none focus:border-fuchsia-500"
                       />
                     </div>

                     <button 
                       type="submit"
                       className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-mono font-bold text-xs p-2.5 rounded-lg text-center transition-all"
                     >
                       Cadastrar Modelo
                     </button>
                   </form>
                 </div>

                 {/* Preset Templates Grid */}
                 <div className="lg:col-span-2 flex flex-col gap-4">
                   <h4 className="text-sm font-bold font-mono text-slate-200 border-b border-slate-800 pb-2 uppercase tracking-wider flex items-center gap-2">
                     <FileText className="w-4 h-4 text-fuchsia-400" /> Modelos Especiais Cadastrados
                   </h4>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {templates.map(tmp => (
                       <div key={tmp.id} className="p-4 bg-[#030712]/40 border border-slate-800 rounded-xl hover:border-slate-700 flex flex-col justify-between gap-3 group relative">
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-mono font-bold text-slate-200">{tmp.title}</span>
                             <span className="text-[9px] font-mono bg-fuchsia-500/10 text-fuchsia-400 px-1.5 py-0.5 rounded border border-fuchsia-500/25 uppercase">
                               {tmp.category}
                             </span>
                           </div>
                           <p className="text-[11px] font-mono text-slate-400 leading-relaxed min-h-[50px]">
                             {tmp.text}
                           </p>
                         </div>

                         <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] font-mono text-slate-500">
                           <span>Usado {tmp.count} vezes</span>
                           
                           <div className="flex items-center gap-2">
                             <button 
                               onClick={() => handleCardCopy(tmp.text)} 
                               className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                               title="Copiar texto"
                             >
                               <Copy className="w-3 h-3" /> Copiar
                             </button>
                             <button 
                               onClick={() => setTemplates(prev => prev.filter(t => t.id !== tmp.id))}
                               className="text-slate-500 hover:text-rose-400 p-1 transition-all"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

               </div>
             </div>
           )}

           {/* TAB 5: COMPARE COHORTS */}
           {activeTab === "compare" && (
             <div className="flex flex-col gap-6">
               
               {/* Controls top */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                 <div className="flex items-center gap-2 text-slate-200 font-mono text-xs font-bold">
                   <Users className="w-4 h-4 text-fuchsia-400" /> Comparar Turas e Painéis em Tempo Real
                 </div>

                 <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-mono text-slate-400 uppercase">Turma A:</span>
                     <select 
                       value={selectedCohortA} 
                       onChange={(e) => setSelectedCohortA(e.target.value)}
                       className="bg-[#030712] border border-slate-700 text-xs font-mono text-slate-200 p-1.5 rounded focus:outline-none"
                     >
                       <option value="turma_1a">1-A (Algoritmos)</option>
                       <option value="turma_1b">1-B (Intro CLI)</option>
                     </select>
                   </div>

                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-mono text-slate-400 uppercase">Turma B:</span>
                     <select 
                       value={selectedCohortB} 
                       onChange={(e) => setSelectedCohortB(e.target.value)}
                       className="bg-[#030712] border border-slate-700 text-xs font-mono text-slate-200 p-1.5 rounded focus:outline-none"
                     >
                       <option value="turma_1c">1-C (Programação)</option>
                       <option value="turma_1b">1-B (Intro CLI)</option>
                     </select>
                   </div>
                 </div>
               </div>

               {/* Comparison Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 
                 {/* Card Cohort A */}
                 <div className="bg-[#030712]/50 border border-slate-800/80 p-5 rounded-xl flex flex-col gap-4">
                   <div className="border-b border-slate-800 pb-2">
                     <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">Coorte A</span>
                     <h4 className="text-sm font-bold font-mono text-fuchsia-300 mt-1">{cohortAStats.name}</h4>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                       <span className="text-[9px] font-mono text-slate-400 uppercase">Média Geral</span>
                       <span className="text-base font-bold block text-slate-200 mt-1">{cohortAStats.grade}/100</span>
                     </div>
                     <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                       <span className="text-[9px] font-mono text-slate-400 uppercase">Erros de Compilador</span>
                       <span className="text-base font-bold block text-emerald-400 mt-1">{(100 - cohortAStats.compilerRate).toFixed(1)}%</span>
                     </div>
                     <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                       <span className="text-[9px] font-mono text-slate-400 uppercase">Timeouts Sandbox</span>
                       <span className="text-base font-bold block text-amber-400 mt-1">{cohortAStats.timeouts}%</span>
                     </div>
                     <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                       <span className="text-[9px] font-mono text-slate-400 uppercase">Incongruências IA</span>
                       <span className="text-base font-bold block text-rose-400 mt-1">{cohortAStats.aiProbability}%</span>
                     </div>
                   </div>

                   <div className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                     <span className="text-rose-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Alunos Críticos:</span>
                     <span className="text-slate-200 font-bold">{cohortAStats.criticals} Alunos em risco</span>
                   </div>
                 </div>

                 {/* Card Cohort B */}
                 <div className="bg-[#030712]/50 border border-slate-800/80 p-5 rounded-xl flex flex-col gap-4">
                   <div className="border-b border-slate-800 pb-2">
                     <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">Coorte B</span>
                     <h4 className="text-sm font-bold font-mono text-sky-300 mt-1">{cohortBStats.name}</h4>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                       <span className="text-[9px] font-mono text-slate-400 uppercase">Média Geral</span>
                       <span className="text-base font-bold block text-slate-200 mt-1">{cohortBStats.grade}/100</span>
                     </div>
                     <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                       <span className="text-[9px] font-mono text-slate-400 uppercase">Erros de Compilador</span>
                       <span className="text-base font-bold block text-emerald-400 mt-1">{(100 - cohortBStats.compilerRate).toFixed(1)}%</span>
                     </div>
                     <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                       <span className="text-[9px] font-mono text-slate-400 uppercase">Timeouts Sandbox</span>
                       <span className="text-base font-bold block text-amber-400 mt-1">{cohortBStats.timeouts}%</span>
                     </div>
                     <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                       <span className="text-[9px] font-mono text-slate-400 uppercase">Incongruências IA</span>
                       <span className="text-base font-bold block text-rose-400 mt-1">{cohortBStats.aiProbability}%</span>
                     </div>
                   </div>

                   <div className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                     <span className="text-rose-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Alunos Críticos:</span>
                     <span className="text-slate-200 font-bold">{cohortBStats.criticals} Alunos em risco</span>
                   </div>
                 </div>

               </div>

               {/* Comparison BarChart */}
               <div className="border border-slate-800 p-5 rounded-xl bg-[#030712]/40">
                 <h4 className="text-xs font-bold font-mono text-slate-400 uppercase mb-4 tracking-wider">Dispersão Side-by-Side: Coorte A (Fúcsia) vs Coorte B (Sky)</h4>
                 <div className="w-full h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={compareChartData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                       <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                       <YAxis stroke="#94a3b8" fontSize={11} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                       <Bar dataKey="CohortA" fill="#d946ef" radius={[4, 4, 0, 0]} name="Coorte A" />
                       <Bar dataKey="CohortB" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Coorte B" />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>

             </div>
           )}

           {/* TAB 6: ANALYTICS & PRODUCTIVITY */}
           {activeTab === "analytics" && (
             <div className="flex flex-col gap-6">
                
                {/* Micro KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">Horas de Trabalho Salvas</span>
                    <span className="text-2xl font-black text-emerald-400">18.4 Horas</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">Neste mês de aula</span>
                  </div>
                  <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">Eficácia Corretor IA</span>
                    <span className="text-2xl font-black text-fuchsia-400">92.4%</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">Aceitação sem refações</span>
                  </div>
                  <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">Alertas Auto Trigo</span>
                    <span className="text-2xl font-black text-amber-400">112 Alertas</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">Disparados auto-pedagógico</span>
                  </div>
                  <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">Evolução Alunos</span>
                    <span className="text-2xl font-black text-sky-400">+18%</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">Melhora média nota final</span>
                  </div>
                </div>

                {/* Workload Reductions Curve */}
                <div className="border border-slate-800 p-5 rounded-xl bg-[#030712]/50 flex flex-col gap-4">
                  <div>
                    <h4 className="text-sm font-bold font-mono text-slate-200">Curva de Redução de Sobrecarga Administrativa Docente (Em horas/semana)</h4>
                    <p className="text-xs text-slate-400 mt-1">Como a central reduziu o tempo gasto com tarefas de correção de listas manuais</p>
                  </div>
                  <div className="w-full h-64 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { week: "Semana 1 (Manual)", totalHours: 16.5, autograding: 0.5 },
                        { week: "Semana 2 (Autograding)", totalHours: 11.2, autograding: 5.4 },
                        { week: "Semana 3 (Lotes/Templates)", totalHours: 6.8, autograding: 9.8 },
                        { week: "Semana 4 (Auto-Alertas)", totalHours: 2.1, autograding: 14.2 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                        <Legend />
                        <Line type="monotone" dataKey="totalHours" stroke="#f43f5e" strokeWidth={3} name="Tempo Gasto com Grading (H)" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="autograding" stroke="#10b981" strokeWidth={3} name="Tempo Poupado SecOps (H)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
             </div>
           )}

        </div>
      </div>

      {/* TASK EXECUTION DRAWER / MODAL */}
      {activeTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-[#0f172a] border border-[#1e295b]/60 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-[#1e295b]/50 bg-[#030712]/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                <span className="text-sm font-bold font-mono text-slate-200">Trabalho Ativo: {activeTaskModal.title}</span>
              </div>
              <button 
                onClick={() => setActiveTaskModal(null)}
                className="text-slate-400 hover:text-white font-bold text-xs font-mono bg-slate-800 hover:bg-slate-700 p-1 px-2.5 rounded-md"
              >
                Voltar
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Impacto Indicado</span>
                <span className="text-xs font-bold text-slate-200">{activeTaskModal.impact}</span>
                <p className="text-xs text-slate-400 mt-2">
                  Esta ação pedagógica foi recomendada pelo motor inteligente do CodeCheck para ajustar desvios estatísticos de aproveitamento.
                </p>
              </div>

              {activeTaskModal.type === "correction" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col w-24">
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Nota Sugerida</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100"
                        value={modalGrade} 
                        onChange={(e) => setModalGrade(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono p-2 rounded focus:outline-none focus:border-fuchsia-500 text-center"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Atalho de Template de Resposta</label>
                      <select 
                        onChange={(e) => setModalFeedbackText(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono p-2 rounded focus:outline-none focus:border-fuchsia-500"
                      >
                        <option value="">Selecione um Comentário Rápido...</option>
                        <option value="Perfeito! Código limpo, correto e estruturalmente impecável. Enviaremos as congratulações automatizadas.">Congratular Lógica</option>
                        <option value="Atenção! Notei comportamentos de sandbox timeout no seu código pela complexidade do laço nested. Revise o algoritmo.">Avisar Timeout Sandbox</option>
                        <option value="Atividade não entregue dentro das diretrizes ou corrompida. Favor verificar extensão da submissão.">Recusar Atividade</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Mensagem de Feedback Final</label>
                    <textarea 
                      value={modalFeedbackText}
                      onChange={(e) => setModalFeedbackText(e.target.value)}
                      placeholder="Redija uma diretriz de aprendizagem..."
                      rows={3}
                      className="bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono p-2 rounded focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-slate-300 font-mono">
                    Ação Pedagógica: Disparar comunicação integrada para recuperar {activeTaskModal.impact} que apresentam engajamento crítico.
                  </span>
                  
                  <div className="flex flex-col">
                    <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Lançar Mensagem de Alerta Acadêmico</label>
                    <textarea 
                      value={modalFeedbackText}
                      onChange={(e) => setModalFeedbackText(e.target.value)}
                      placeholder="Prezados alunos, identificamos discrepâncias nos testes de loops desta semana. Recomendamos aceder imediatamente a aba de Recuperação do CodeCheck..."
                      rows={4}
                      className="bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono p-2 rounded focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mt-2">
                <button 
                  onClick={handleSubmitModalFeedback}
                  className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-mono font-bold text-xs p-3 rounded-xl transition-all"
                >
                  Concluir e Despachar Notificação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

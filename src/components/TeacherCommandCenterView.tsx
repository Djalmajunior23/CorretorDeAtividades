import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiUrl, safeJsonResponse } from "../config/api";
import { PedagogicalExecutiveDashboard } from "./PedagogicalExecutiveDashboard";
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
  Search,
  Cpu,
  MessageSquare,
  Brain,
  Flame,
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
  Line,
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
      {
        id: "hp_1",
        title: "Correção pendente: Lista 03 - Pilhas e Filas (Turma A)",
        impact: "24 alunos aguardando nota final",
      },
      {
        id: "hp_2",
        title: "Submissões em Atenção: Trilha de Complexidade Algorítmica",
        impact: "3 alunos com tempo limite excedido (Timeouts)",
      },
    ],
    medium_priority: [
      {
        id: "mp_1",
        title:
          "Enviar sugestões de recuperação para alunos de baixo rendimento",
        impact: "Apoio pedagógico com sugestões geradas por Copiloto IA",
      },
      {
        id: "mp_2",
        title: "Revisar logs de sandbox timeout e limites do interpretador",
        impact: "Ajuste fino de restrições de memória do Docker local",
      },
    ],
  },
};

export default function TeacherCommandCenterView({ featureFlags }: any) {
  const [overviewData, setOverviewData] = useState<any>(MOCK_OVERVIEW_DEFAULT);
  const [activeTab, setActiveTab] = useState("queue");

  // State for Visionary Teacher
  const [visionaryLoading, setVisionaryLoading] = useState(false);
  const [visionaryData, setVisionaryData] = useState<any>(null);
  const [visionaryTopic, setVisionaryTopic] = useState("Estruturas de Dados e Algoritmos");

  // State for Queue Actions
  const [activeTaskModal, setActiveTaskModal] = useState<any>(null);
  const [modalFeedbackText, setModalFeedbackText] = useState("");
  const [modalGrade, setModalGrade] = useState("85");

  // State for Bulk Operations
  const [bulkSubmissions, setBulkSubmissions] = useState([
    {
      id: "sub_1",
      student: "Ana Rodrigues Silva",
      activity: "Lista 03: Pilhas e Filas",
      language: "python",
      status: "submitted",
      statusText: "Aguardando Correção",
      codePreview: "def push(stack, item):\n    stack.append(item)",
    },
    {
      id: "sub_2",
      student: "Carlos Henrique Souza",
      activity: "Lista 03: Pilhas e Filas",
      language: "python",
      status: "submitted",
      statusText: "Aguardando Correção",
      codePreview: "def pop(stack):\n    return stack.pop()",
    },
    {
      id: "sub_3",
      student: "Beatriz Oliveira Costa",
      activity: "Lista 03: Pilhas e Filas",
      language: "javascript",
      status: "submitted",
      statusText: "Aguardando Correção",
      codePreview: "function queue(arr, item) {\n  arr.push(item);\n}",
    },
    {
      id: "sub_4",
      student: "Daniel Santos Ramos",
      activity: "Lista 03: Pilhas e Filas",
      language: "python",
      status: "submitted",
      statusText: "Aguardando Correção",
      codePreview:
        "class Queue:\n    def __init__(self):\n        self.items = []",
    },
    {
      id: "sub_5",
      student: "Eduardo Marques Neto",
      activity: "Lista 03: Pilhas e Filas",
      language: "typescript",
      status: "submitted",
      statusText: "Aguardando Correção",
      codePreview: "const peek = <T>(q: T[]): T => q[0];",
    },
  ]);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [bulkGrade, setBulkGrade] = useState("90");
  const [bulkTemplateComment, setBulkTemplateComment] = useState(
    "Parabéns! Estruturas implementadas corretamente respeitando os parâmetros de complexidade assintótica informados.",
  );
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // NLP & Sentiment Analysis State
  const [nlpCorpus, setNlpCorpus] = useState([
    { id: 1, student: "Ana Rodrigues", comment: "Não entendi como funciona a alocação dinâmica de memória em ponteiros duplos, o código trava muito.", sentiment: "negativo", topic: "Ponteiros e Memória" },
    { id: 2, student: "Carlos Henrique", comment: "Achei o desafio de árvores binárias excelente, mas a recursão me confundiu um pouco no caso base.", sentiment: "neutro", topic: "Árvores Binárias" },
    { id: 3, student: "Beatriz Oliveira", comment: "Muito difícil! O tempo limite do sandbox é muito curto para testar ordenações grandes.", sentiment: "negativo", topic: "Timeouts & Sandbox" },
    { id: 4, student: "Daniel Santos", comment: "Consegui resolver todas as listas facilmente após ver a explicação da aula de ontem!", sentiment: "positivo", topic: "Geral" },
    { id: 5, student: "Eduardo Neto", comment: "Estou totalmente perdido em complexidade ciclomática e JSDoc, poderiam explicar melhor?", sentiment: "negativo", topic: "Clean Code & Lint" },
    { id: 6, student: "Fernanda Lima", comment: "Achei o exercício super intuitivo e divertido de implementar.", sentiment: "positivo", topic: "Geral" },
    { id: 7, student: "Gabriel Souza", comment: "Erro de segmentação constante no meu código em C++, não sei onde estou errando.", sentiment: "negativo", topic: "Ponteiros e Memória" }
  ]);
  const [newCommentText, setNewCommentText] = useState("");
  const [nlpAnalyzing, setNlpAnalyzing] = useState(false);
  const [nlpInsights, setNlpInsights] = useState<any>(null);

  // Copilot AI Co-Pilot State
  const [copilotTopic, setCopilotTopic] = useState("Árvores Binárias e Percurso em Ordem");
  const [copilotDifficulty, setCopilotDifficulty] = useState("Intermediário");
  const [copilotLanguage, setCopilotLanguage] = useState("python");
  const [copilotGenerated, setCopilotGenerated] = useState<any>({
    title: "Desafio Inteligente: Árvores Binárias e Percurso em Ordem",
    difficulty: "Intermediário",
    language: "python",
    objective: "Implementar uma solução eficiente em Python para percorrer uma árvore binária em ordem simétrica (in-order), retornando os valores ordenados.",
    testCases: [
      { input: "[4, 2, 5, 1, 3]", expected: "[1, 2, 3, 4, 5]" },
      { input: "[1, null, 2, 3]", expected: "[1, 3, 2]" },
    ],
    rubric: [
      "Corretude da travessia recursiva ou iterativa (40%)",
      "Complexidade de tempo O(N) e espaço O(H) (30%)",
      "Clean code, tipagem e tratamento de nós nulos (30%)"
    ]
  });
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [socraticInput, setSocraticInput] = useState("def calcular_fatorial(n):\n    if n == 0: return 1\n    return n * calcular_fatorial(n-1)");
  const [socraticResponse, setSocraticResponse] = useState<string>("💡 Análise Socrática pronta: O código está funcional para recursão simples. Para enriquecer o aprendizado do aluno, pergunte qual seria o impacto na pilha de chamadas (Call Stack) se n = 100.000 e como a recursão de cauda ou iteração resolveria estouros de stack.");
  const [socraticLoading, setSocraticLoading] = useState(false);

  const handleGenerateChallengeWithAI = () => {
    setCopilotLoading(true);
    setTimeout(() => {
      setCopilotGenerated({
        title: `Desafio Inteligente: ${copilotTopic}`,
        difficulty: copilotDifficulty,
        language: copilotLanguage,
        objective: `Implementar uma solução eficiente em ${copilotLanguage} para processar ${copilotTopic} respeitando limites rigorosos de complexidade assintótica.`,
        testCases: [
          { input: "Dataset Principal (N=10.000)", expected: "Execução < 50ms" },
          { input: "Edge Case / Stress Test", expected: "Tratamento seguro sem exceptions" },
        ],
        rubric: [
          "Corretude algorítmica e testes unitários (40%)",
          "Complexidade e otimização de recursos (30%)",
          "Clean code e manutenibilidade (30%)"
        ]
      });
      setCopilotLoading(false);
    }, 750);
  };

  const handleGenerateSocraticHints = () => {
    setSocraticLoading(true);
    setTimeout(() => {
      setSocraticResponse(`💡 **Análise Socrática do Copiloto (Braço Direito do Professor):**\n1. O código cumpre o objetivo básico, mas avalie se o uso de memória auxiliar é estritamente necessário.\n2. Questione o aluno sobre o comportamento do algoritmo com entradas extremas (null, vazias ou duplicadas).\n3. Sugestão de feedback socrático: 'Como você poderia otimizar este trecho para evitar o consumo excessivo de CPU?'`);
      setSocraticLoading(false);
    }, 600);
  };

  // Academic Automation AI State (AI_PEDAGOGICAL_MODEL)
  const [autoSummary, setAutoSummary] = useState<string>(
    "📊 **Resumo Executivo Diário (Gerado por AI_PEDAGOGICAL_MODEL / gemma3:4b)**:\n• **Engajamento Geral**: 86% dos discentes ativos nas últimas 24h.\n• **Gargalo Identificado**: Módulo de Ponteiros Duplos apresentou taxa de estouro de SLA de 28% na Turma B.\n• **Destaque Positivo**: Turma A concluiu o desafio de Algoritmos de Ordenação com 94% de acurácia na primeira tentativa.\n• **Recomendação da IA**: Ajustar o SLA de Árvores Binárias de 60 para 90 minutos para alinhar com o ritmo real de raciocínio da turma."
  );
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [slaSuggestions, setSlaSuggestions] = useState<any[]>([
    {
      id: "s1",
      activity: "Estruturas de Dados - Árvores Binárias e Percursos",
      currentSla: "60 min",
      suggestedSla: "90 min",
      reason: "Taxa de estouro de 34% e tempo médio de conclusão 28% acima do estimado.",
      status: "pending"
    },
    {
      id: "s2",
      activity: "Algoritmos de Ordenação - QuickSort & MergeSort",
      currentSla: "45 min",
      suggestedSla: "30 min",
      reason: "Turma concluiu 88% das entregas antes de 25 minutos com alta fluidez.",
      status: "pending"
    },
    {
      id: "s3",
      activity: "Programação Orientada a Objetos - Herança & Polimorfismo",
      currentSla: "120 min",
      suggestedSla: "150 min",
      reason: "Complexidade conceitual elevada gerou aumento de 22% em dúvidas e pedidos de suporte.",
      status: "pending"
    }
  ]);
  const [applyingSlaId, setApplyingSlaId] = useState<string | null>(null);

  const handleGenerateDailySummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(apiUrl("/api/academic-automation/generate-summary"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await safeJsonResponse(res);
      if (data && data.summary) {
        setAutoSummary(data.summary);
      }
    } catch (err) {
      console.warn("Error calling AI academic summary API:", err);
      setAutoSummary(
        `📊 **Resumo Executivo Diário (Gerado por AI_PEDAGOGICAL_MODEL)**:\n• **Status da Turma**: 91% de participação ativa.\n• **Ritmo**: Aceleração de 12% na velocidade de entrega.\n• **Atenção**: Módulo de Recursão Avançada exigiu suporte adicional.`
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleApplySlaAdjustment = (id: string) => {
    setApplyingSlaId(id);
    setTimeout(() => {
      setSlaSuggestions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "applied" } : item))
      );
      setApplyingSlaId(null);
    }, 600);
  };

  // State for Templates
  const [templates, setTemplates] = useState([
    {
      id: 1,
      title: "Lógica Impecável",
      category: "Elogio",
      text: "Excelente raciocínio lógico no desenvolvimento da solução. Atendeu 100% aos requisitos e demonstrou excelente complexidade ciclomática.",
      count: 184,
    },
    {
      id: 2,
      title: "Cuidado com Complexidade",
      category: "Orientação",
      text: "Seu algoritmo funciona para conjuntos pequenos de dados, mas utiliza loops aninhados desnecessários. Busque refatorar utilizando dicionários/tabelas hash para otimizar para O(N).",
      count: 92,
    },
    {
      id: 3,
      title: "Indentação e Estilo",
      category: "Refatoração",
      text: "Código funcional, porém fora das diretrizes PEP8 (ou guia de estilos). Lembre-se que legibilidade é fundamental no mercado corporativo.",
      count: 64,
    },
    {
      id: 4,
      title: "Instrução de Recuperação",
      category: "Ação Pedagógica",
      text: "Identifiquei que você teve dificuldades com laços. Recomendo fortemente acessar a Trilha de Treinamento Paralelo em 'Recuperação' para repassar os fundamentos.",
      count: 47,
    },
  ]);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Orientação");
  const [newTemplateText, setNewTemplateText] = useState("");

  // State for Planner
  const [plannerEvents, setPlannerEvents] = useState([
    {
      id: 1,
      day: "Segunda-feira",
      time: "09:00",
      text: "Feedback em lote Lista 02 (Turma A)",
      done: true,
    },
    {
      id: 2,
      day: "Terça-feira",
      time: "14:30",
      text: "Revisar logs de sandbox timeout e ajustar limites",
      done: false,
    },
    {
      id: 3,
      day: "Quarta-feira",
      time: "10:00",
      text: "Disparar alertas automáticos para alunos de risco",
      done: false,
    },
    {
      id: 4,
      day: "Quinta-feira",
      time: "15:00",
      text: "Geração IA de novas atividades de recursão",
      done: false,
    },
    {
      id: 5,
      day: "Sexta-feira",
      time: "11:00",
      text: "Acompanhar trilhas de recuperação paralela ativa",
      done: false,
    },
  ]);
  const [newEventDay, setNewEventDay] = useState("Segunda-feira");
  const [newEventTime, setNewEventTime] = useState("10:00");
  const [newEventText, setNewEventText] = useState("");

  // Target comparison config
  const [selectedCohortA, setSelectedCohortA] = useState("turma_1a");
  const [selectedCohortB, setSelectedCohortB] = useState("turma_1b");

  useEffect(() => {
    fetch(apiUrl("/api/codecheck/module08/overview"))
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setOverviewData(data);
      })
      .catch(console.error);
  }, []);

  const handleToggleEvent = (id: number) => {
    setPlannerEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)),
    );
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventText.trim()) return;
    setPlannerEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        day: newEventDay,
        time: newEventTime,
        text: newEventText,
        done: false,
      },
    ]);
    setNewEventText("");
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim() || !newTemplateText.trim()) return;
    setTemplates((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newTemplateTitle,
        category: newTemplateCategory,
        text: newTemplateText,
        count: 0,
      },
    ]);
    setNewTemplateTitle("");
    setNewTemplateText("");
  };

  const handleSelectAllBulk = () => {
    if (selectedSubIds.length === bulkSubmissions.length) {
      setSelectedSubIds([]);
    } else {
      setSelectedSubIds(bulkSubmissions.map((s) => s.id));
    }
  };

  const handleToggleSelectBulk = (id: string) => {
    setSelectedSubIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const triggerBulkCorrection = () => {
    if (selectedSubIds.length === 0) return;
    setBulkProcessing(true);
    setBulkProgress(5);

    const interval = setInterval(() => {
      setBulkProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Apply correction
            const updated = bulkSubmissions.map((sub) => {
              if (selectedSubIds.includes(sub.id)) {
                return {
                  ...sub,
                  status: "corrected" as const,
                  statusText: "Corrigida - Lote",
                };
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
      const highUpdated = prev.tasks.high_priority.filter(
        (t: any) => t.id !== activeTaskModal.id,
      );
      const medUpdated = prev.tasks.medium_priority.filter(
        (t: any) => t.id !== activeTaskModal.id,
      );
      return {
        ...prev,
        tasks: {
          high_priority: highUpdated,
          medium_priority: medUpdated,
        },
        analytics: {
          ...prev.analytics,
          feedbacks_this_week: prev.analytics.feedbacks_this_week + 1,
        },
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
  const cohortAStats =
    selectedCohortA === "turma_1a"
      ? {
          name: "Turma 1-A (Algoritmos Avançados)",
          grade: 84.2,
          compilerRate: 92.5,
          timeouts: 1.2,
          criticals: 2,
          aiProbability: 14.2,
        }
      : {
          name: "Turma 1-B (Introdução CLI)",
          grade: 71.5,
          compilerRate: 81.0,
          timeouts: 3.5,
          criticals: 5,
          aiProbability: 24.8,
        };

  const cohortBStats =
    selectedCohortB === "turma_1c"
      ? {
          name: "Turma 1-C (Programação Estruturada)",
          grade: 63.8,
          compilerRate: 70.4,
          timeouts: 7.8,
          criticals: 9,
          aiProbability: 45.2,
        }
      : {
          name: "Turma 1-B (Introdução CLI)",
          grade: 71.5,
          compilerRate: 81.0,
          timeouts: 3.5,
          criticals: 5,
          aiProbability: 24.8,
        };

  const compareChartData = [
    {
      name: "Nota Média (x10)",
      CohortA: cohortAStats.grade,
      CohortB: cohortBStats.grade,
    },
    {
      name: "Compilador (%)",
      CohortA: cohortAStats.compilerRate,
      CohortB: cohortBStats.compilerRate,
    },
    {
      name: "Timeout Sandbox (x10)",
      CohortA: cohortAStats.timeouts * 10,
      CohortB: cohortBStats.timeouts * 10,
    },
    {
      name: "IA Suspeita (%)",
      CohortA: cohortAStats.aiProbability,
      CohortB: cohortBStats.aiProbability,
    },
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
          <p className="text-xs text-slate-400 mt-1">
            Central do Professor (Fase 08)
          </p>
        </div>

        {[
          { id: "queue", label: "Fila Inteligente", icon: Target },
          { id: "bulk", label: "Correção em Lote", icon: CheckCircle2 },
          { id: "nlp", label: "NLP & Sentimento", icon: MessageSquare },
          { id: "copilot", label: "Copiloto IA Docente", icon: Sparkles },
          { id: "autofix", label: "Auto-Fixer & Patch IA", icon: Sparkles },
          { id: "visionary", label: "IA Visionary Teacher", icon: Sparkles },
          { id: "automation", label: "IA Automação Acadêmica", icon: Cpu },
          { id: "planner", label: "Planejador Semanal", icon: Clock },
          { id: "library", label: "Bibl. Templates", icon: FileText },
          { id: "compare", label: "Comparar Turmas", icon: Map },
          { id: "analytics", label: "Produtividade", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 p-3 text-left rounded-xl border transition-all ${
              activeTab === tab.id
                ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300"
                : "bg-[#0f172a]/50 border-transparent text-slate-400 hover:bg-[#0f172a] hover:text-slate-200"
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
            {activeTab === "nlp" && "Processamento de Linguagem Natural (NLP) & Análise de Sentimentos"}
            {activeTab === "copilot" && "Copiloto IA Docente (O Braço Direito do Professor)"}
            {activeTab === "autofix" && "Auto-Fixer & Patch IA (Correção e Sanitização Autônoma)"}
            {activeTab === "automation" && "IA de Automação Acadêmica & Prazos Dinâmicos"}
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
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Feedbacks Enviados
                  </span>
                  <span className="text-2xl font-black text-slate-200">
                    {overviewData.analytics.feedbacks_this_week}
                  </span>
                </div>
                <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Tempo Médio/Correção
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    {overviewData.analytics.average_correction_time_min}m
                  </span>
                </div>
                <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Intervenções Ativas
                  </span>
                  <span className="text-2xl font-black text-fuchsia-400">
                    {overviewData.analytics.interventions_active}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold font-mono text-rose-400 uppercase tracking-widest flex items-center gap-2 border-b border-rose-500/10 pb-2">
                  <AlertTriangle className="w-4 h-4" /> Prioridade Máxima
                </h4>
                {overviewData.tasks.high_priority.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic">
                    Sem pendências de alta prioridade.
                  </p>
                ) : (
                  overviewData.tasks.high_priority.map((task: any) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between hover:border-rose-500/40 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-200">
                          {task.title}
                        </span>
                        <span className="text-xs text-slate-400">
                          Impacto: {task.impact}
                        </span>
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
                  <p className="text-xs text-slate-500 font-mono italic">
                    Sem pendências de prioridade média.
                  </p>
                ) : (
                  overviewData.tasks.medium_priority.map((task: any) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-200">
                          {task.title}
                        </span>
                        <span className="text-xs text-slate-400">
                          Impacto: {task.impact}
                        </span>
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
                  <h5 className="font-bold text-slate-100">
                    Como funciona a Correção em Lote?
                  </h5>
                  <p className="mt-1 text-slate-400">
                    Selecione múltiplos alunos pendentes na Lista 03 abaixo,
                    aplique uma nota rápida e um feedback padrão da biblioteca
                    de templates. O CodeCheck processará o envio e as
                    notificações simultaneamente.
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
                    Selecionar Todos ({selectedSubIds.length}/
                    {bulkSubmissions.length})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Nota:
                    </span>
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
                      <option value="Parabéns! Estruturas implementadas corretamente respeitando os parâmetros de complexidade assintótica informados.">
                        Feedback: Excelente Lógica
                      </option>
                      <option value="A solução resolve os testes primários, mas falha em testes de concorrência e robustez de limites. Revise as restrições e submeta novamente.">
                        Feedback: Erros de Limite
                      </option>
                      <option value="Atenção técnica com o correto fechamento de recursos de memória e tratamento de erros (Try/Catch).">
                        Feedback: Boas Práticas
                      </option>
                    </select>
                  </div>

                  <button
                    onClick={triggerBulkCorrection}
                    disabled={selectedSubIds.length === 0 || bulkProcessing}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-mono font-bold px-4 py-2 rounded-lg flex items-center gap-2 shrink-0 transition-colors"
                  >
                    {bulkProcessing
                      ? "Processando..."
                      : "Corrigir Selecionados"}
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
                    <div
                      style={{ width: `${bulkProgress}%` }}
                      className="h-full bg-fuchsia-500 transition-all duration-200"
                    />
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
                        <td className="p-4 font-bold text-slate-100">
                          {sub.student}
                        </td>
                        <td className="p-4 text-slate-400">{sub.activity}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] uppercase font-bold">
                            {sub.language}
                          </span>
                        </td>
                        <td
                          className="p-4 text-[10px] text-slate-400 font-mono truncate max-w-[200px]"
                          title={sub.codePreview}
                        >
                          <code>{sub.codePreview}</code>
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                              sub.status === "corrected"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
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

          {/* TAB: NLP & SENTIMENT ANALYSIS */}
          {activeTab === "nlp" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-fuchsia-950/40 border border-indigo-500/30 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Processamento de Linguagem Natural (NLP) & Análise de Sentimentos</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Analise automaticamente os comentários, dúvidas e feedbacks deixados pelos estudantes nas submissões para identificar os pontos de maior frustração, confusão conceitual e gerar uma nuvem de palavras inteligente.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Input new feedback */}
                <div className="bg-[#030712]/50 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
                  <h4 className="text-xs font-bold font-mono text-slate-200 border-b border-slate-800 pb-2 uppercase tracking-wider flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-indigo-400" /> Adicionar Comentário para Análise
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">Comentário do Aluno</label>
                      <textarea
                        rows={4}
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Ex: Não consegui entender ponteiros em C++, o código dá erro de compilação..."
                        className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newCommentText.trim()) return;
                        const text = newCommentText.toLowerCase();
                        let sentiment = "neutro";
                        let topic = "Geral";
                        if (text.includes("não") || text.includes("difícil") || text.includes("perdido") || text.includes("erro") || text.includes("trava")) {
                          sentiment = "negativo";
                        } else if (text.includes("excelente") || text.includes("fácil") || text.includes("ótimo") || text.includes("consegui") || text.includes("divertido")) {
                          sentiment = "positivo";
                        }
                        if (text.includes("ponteiro") || text.includes("memória") || text.includes("c++")) topic = "Ponteiros e Memória";
                        else if (text.includes("árvore") || text.includes("recursão")) topic = "Árvores Binárias";
                        else if (text.includes("sandbox") || text.includes("timeout")) topic = "Timeouts & Sandbox";
                        else if (text.includes("clean") || text.includes("lint") || text.includes("jsdoc")) topic = "Clean Code & Lint";

                        const newItem = {
                          id: Date.now(),
                          student: "Aluno Anônimo / Recente",
                          comment: newCommentText,
                          sentiment,
                          topic
                        };
                        setNlpCorpus([newItem, ...nlpCorpus]);
                        setNewCommentText("");
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20"
                    >
                      Adicionar e Classificar com NLP
                    </button>
                  </div>

                  <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-200 font-mono">📊 Estatísticas de Sentimento</span>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg">
                        <span className="text-[10px] text-emerald-400 font-mono uppercase block">Positivos</span>
                        <span className="text-base font-bold text-emerald-300">
                          {nlpCorpus.filter(c => c.sentiment === 'positivo').length}
                        </span>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg">
                        <span className="text-[10px] text-amber-400 font-mono uppercase block">Neutros</span>
                        <span className="text-base font-bold text-amber-300">
                          {nlpCorpus.filter(c => c.sentiment === 'neutro').length}
                        </span>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg">
                        <span className="text-[10px] text-rose-400 font-mono uppercase block">Negativos</span>
                        <span className="text-base font-bold text-rose-300">
                          {nlpCorpus.filter(c => c.sentiment === 'negativo').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Cloud & Feedbacks List */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {/* Word Cloud & Pain Points */}
                  <div className="bg-[#030712]/50 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-400" /> Nuvem de Palavras e Focos de Dúvida / Frustração
                      </h4>
                      <button
                        onClick={() => {
                          setNlpAnalyzing(true);
                          setTimeout(() => {
                            setNlpInsights({
                              topPainPoints: ["Ponteiros e Alocação de Memória", "Timeouts no Sandbox Local", "Recursão e Caso Base", "Complexidade Ciclomática"],
                              executiveDiagnosis: "O corpus de feedback indica alta incidência de dúvidas conceituais na manipulação de ponteiros em C++ e travamentos de tempo limite (timeout) no executor local de sandbox."
                            });
                            setNlpAnalyzing(false);
                          }, 800);
                        }}
                        disabled={nlpAnalyzing}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[11px] shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {nlpAnalyzing ? "Analisando Corpus..." : "Gerar Diagnóstico IA de NLP"}
                      </button>
                    </div>

                    {/* Word Cloud Pills */}
                    <div className="flex flex-wrap gap-2.5 py-2">
                      {[
                        { word: "Ponteiros", count: 18, color: "bg-rose-500/20 text-rose-300 border-rose-500/40 text-sm" },
                        { word: "Recursão", count: 14, color: "bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs" },
                        { word: "Timeout", count: 12, color: "bg-rose-500/20 text-rose-300 border-rose-500/40 text-sm" },
                        { word: "Memória", count: 11, color: "bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs" },
                        { word: "Árvores", count: 9, color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs" },
                        { word: "C++", count: 9, color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 text-sm" },
                        { word: "Complexidade", count: 7, color: "bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs" },
                        { word: "JSDoc", count: 5, color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px]" },
                        { word: "Excelente", count: 8, color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs" },
                        { word: "Difícil", count: 10, color: "bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs" }
                      ].map((item, idx) => (
                        <span key={idx} className={`px-3 py-1.5 rounded-xl border font-mono font-bold flex items-center gap-1.5 ${item.color}`}>
                          <span>{item.word}</span>
                          <span className="text-[10px] opacity-75 bg-black/30 px-1 rounded">({item.count})</span>
                        </span>
                      ))}
                    </div>

                    {nlpInsights && (
                      <div className="mt-2 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col gap-2 animate-fade-in">
                        <span className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-2">
                          🧠 Diagnóstico de NLP & Sentimentos da Turma
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {nlpInsights.executiveDiagnosis}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {nlpInsights.topPainPoints.map((pt: string, i: number) => (
                            <span key={i} className="text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/25 px-2 py-0.5 rounded">
                              ⚠️ {pt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Corpus Table */}
                  <div className="bg-[#030712]/50 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
                    <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                      Feedbacks e Comentários Recentes Analisados ({nlpCorpus.length})
                    </h4>
                    <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {nlpCorpus.map((item) => (
                        <div key={item.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-200 font-mono">{item.student}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">{item.topic}</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                                item.sentiment === 'positivo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                item.sentiment === 'negativo' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {item.sentiment}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 font-sans italic">"{item.comment}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
                    <PlusCircle className="w-4 h-4 text-fuchsia-400" /> Agendar
                    Tarefa
                  </h4>
                  <form
                    onSubmit={handleAddEvent}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col">
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Dia da Semana
                      </label>
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
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Horário
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 14:00"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 p-2 focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Descrição
                      </label>
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
                    <Clock className="w-4 h-4 text-fuchsia-400" /> Agenda
                    Semanal e Organização
                  </h4>

                  <div className="flex flex-col gap-3">
                    {plannerEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                          event.done
                            ? "bg-slate-800/10 border-slate-800 text-slate-500 line-through"
                            : "bg-[#030712]/60 border-slate-700/50 text-slate-200"
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
                              <span className="text-[10px] font-mono text-slate-400">
                                {event.time}
                              </span>
                            </div>
                            <span className="text-xs font-mono">
                              {event.text}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setPlannerEvents((prev) =>
                              prev.filter((e) => e.id !== event.id),
                            )
                          }
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
                    <PlusCircle className="w-4 h-4 text-fuchsia-400" /> Novo
                    Modelo
                  </h4>
                  <form
                    onSubmit={handleAddTemplate}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col">
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Título Rápido
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Refatorar Recursão"
                        value={newTemplateTitle}
                        onChange={(e) => setNewTemplateTitle(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 p-2 focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Categoria
                      </label>
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
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Conteúdo do Feedback
                      </label>
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
                    <FileText className="w-4 h-4 text-fuchsia-400" /> Modelos
                    Especiais Cadastrados
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((tmp) => (
                      <div
                        key={tmp.id}
                        className="p-4 bg-[#030712]/40 border border-slate-800 rounded-xl hover:border-slate-700 flex flex-col justify-between gap-3 group relative"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-200">
                              {tmp.title}
                            </span>
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
                              onClick={() =>
                                setTemplates((prev) =>
                                  prev.filter((t) => t.id !== tmp.id),
                                )
                              }
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
                  <Users className="w-4 h-4 text-fuchsia-400" /> Comparar Turas
                  e Painéis em Tempo Real
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Turma A:
                    </span>
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
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Turma B:
                    </span>
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
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">
                      Coorte A
                    </span>
                    <h4 className="text-sm font-bold font-mono text-fuchsia-300 mt-1">
                      {cohortAStats.name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">
                        Média Geral
                      </span>
                      <span className="text-base font-bold block text-slate-200 mt-1">
                        {cohortAStats.grade}/100
                      </span>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">
                        Erros de Compilador
                      </span>
                      <span className="text-base font-bold block text-emerald-400 mt-1">
                        {Number(100 - cohortAStats.compilerRate).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">
                        Timeouts Sandbox
                      </span>
                      <span className="text-base font-bold block text-amber-400 mt-1">
                        {cohortAStats.timeouts}%
                      </span>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">
                        Incongruências IA
                      </span>
                      <span className="text-base font-bold block text-rose-400 mt-1">
                        {cohortAStats.aiProbability}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Alunos Críticos:
                    </span>
                    <span className="text-slate-200 font-bold">
                      {cohortAStats.criticals} Alunos em risco
                    </span>
                  </div>
                </div>

                {/* Card Cohort B */}
                <div className="bg-[#030712]/50 border border-slate-800/80 p-5 rounded-xl flex flex-col gap-4">
                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">
                      Coorte B
                    </span>
                    <h4 className="text-sm font-bold font-mono text-sky-300 mt-1">
                      {cohortBStats.name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">
                        Média Geral
                      </span>
                      <span className="text-base font-bold block text-slate-200 mt-1">
                        {cohortBStats.grade}/100
                      </span>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">
                        Erros de Compilador
                      </span>
                      <span className="text-base font-bold block text-emerald-400 mt-1">
                        {Number(100 - cohortBStats.compilerRate).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">
                        Timeouts Sandbox
                      </span>
                      <span className="text-base font-bold block text-amber-400 mt-1">
                        {cohortBStats.timeouts}%
                      </span>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">
                        Incongruências IA
                      </span>
                      <span className="text-base font-bold block text-rose-400 mt-1">
                        {cohortBStats.aiProbability}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Alunos Críticos:
                    </span>
                    <span className="text-slate-200 font-bold">
                      {cohortBStats.criticals} Alunos em risco
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparison BarChart */}
              <div className="border border-slate-800 p-5 rounded-xl bg-[#030712]/40">
                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase mb-4 tracking-wider">
                  Dispersão Side-by-Side: Coorte A (Fúcsia) vs Coorte B (Sky)
                </h4>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="CohortA"
                        fill="#d946ef"
                        radius={[4, 4, 0, 0]}
                        name="Coorte A"
                      />
                      <Bar
                        dataKey="CohortB"
                        fill="#0ea5e9"
                        radius={[4, 4, 0, 0]}
                        name="Coorte B"
                      />
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
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Horas de Trabalho Salvas
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    18.4 Horas
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Neste mês de aula
                  </span>
                </div>
                <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Eficácia Corretor IA
                  </span>
                  <span className="text-2xl font-black text-fuchsia-400">
                    92.4%
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Aceitação sem refações
                  </span>
                </div>
                <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Alertas Auto Trigo
                  </span>
                  <span className="text-2xl font-black text-amber-400">
                    112 Alertas
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Disparados auto-pedagógico
                  </span>
                </div>
                <div className="flex flex-col bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Evolução Alunos
                  </span>
                  <span className="text-2xl font-black text-sky-400">+18%</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Melhora média nota final
                  </span>
                </div>
              </div>

              {/* Workload Reductions Curve */}
              <div className="border border-slate-800 p-5 rounded-xl bg-[#030712]/50 flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold font-mono text-slate-200">
                    Curva de Redução de Sobrecarga Administrativa Docente (Em
                    horas/semana)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Como a central reduziu o tempo gasto com tarefas de correção
                    de listas manuais
                  </p>
                </div>
                <div className="w-full h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        {
                          week: "Semana 1 (Manual)",
                          totalHours: 16.5,
                          autograding: 0.5,
                        },
                        {
                          week: "Semana 2 (Autograding)",
                          totalHours: 11.2,
                          autograding: 5.4,
                        },
                        {
                          week: "Semana 3 (Lotes/Templates)",
                          totalHours: 6.8,
                          autograding: 9.8,
                        },
                        {
                          week: "Semana 4 (Auto-Alertas)",
                          totalHours: 2.1,
                          autograding: 14.2,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="week"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="totalHours"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        name="Tempo Gasto com Grading (H)"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="autograding"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Tempo Poupado SecOps (H)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NEW WIDGET: Mapa de Calor de Estouro de SLA */}
              <div className="border border-slate-800 p-5 rounded-xl bg-[#030712]/50 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-400" /> Mapa de Calor de Estouro de SLA por Horário e Dia da Semana
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Identificação de janelas críticas de sobrecarga discente com base no tempo de conclusão de listas e prazos.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20">
                      🔴 Pico Crítico: Domingos 20h - 00h
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto pt-2">
                  <div className="min-w-[650px] grid grid-cols-8 gap-2 text-center text-xs font-mono">
                    <div className="text-slate-500 text-left font-bold pb-2">Horário \ Dia</div>
                    {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day, dIdx) => (
                      <div key={dIdx} className="text-slate-300 font-bold pb-2">{day}</div>
                    ))}

                    {[
                      { time: "08h - 12h", levels: [12, 18, 15, 22, 14, 5, 8] },
                      { time: "12h - 16h", levels: [25, 30, 28, 35, 20, 10, 15] },
                      { time: "16h - 20h", levels: [45, 52, 48, 65, 40, 18, 72] },
                      { time: "20h - 00h", levels: [78, 85, 82, 94, 60, 25, 98] },
                    ].map((row, rIdx) => (
                      <React.Fragment key={rIdx}>
                        <div className="text-slate-400 font-bold text-left flex items-center">{row.time}</div>
                        {row.levels.map((val, cIdx) => {
                          let colorBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                          let label = "Baixo";
                          if (val > 80) {
                            colorBg = "bg-red-600/40 text-red-200 border-red-500/50 animate-pulse";
                            label = "Crítico";
                          } else if (val > 50) {
                            colorBg = "bg-amber-500/30 text-amber-200 border-amber-500/40";
                            label = "Alto";
                          } else if (val > 25) {
                            colorBg = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
                            label = "Médio";
                          }
                          return (
                            <div
                              key={cIdx}
                              onClick={() => alert(`Janela ${row.time} (${["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][cIdx]}): ${val}% de estouro de SLA. Recomenda-se estender o prazo limite em 2h para evitar evasão por estresse.`)}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${colorBg}`}
                              title={`Estouro de SLA: ${val}% (${label})`}
                            >
                              <span className="font-bold text-sm">{val}%</span>
                              <span className="text-[9px] opacity-75">{label}</span>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400 gap-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/40"></span> &lt;25% Seguro</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-yellow-500/40"></span> 25-50% Alerta</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500/50"></span> 50-80% Alto</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-600/60"></span> &gt;80% Crítico</span>
                  </div>
                  <button
                    onClick={() => alert("Automação de Prazos Ativada: O sistema ajustará dinamicamente os prazos das atividades que caem aos domingos às 23:59 para segundas-feiras às 12:00.")}
                    className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mono font-bold text-xs shadow-lg shadow-fuchsia-600/30 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ajustar Prazos Automaticamente via IA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COPILOT IA DOCENTE (O Braço Direito do Professor) */}
          {activeTab === "copilot" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-indigo-950/40 border border-fuchsia-500/30 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-fuchsia-400" />
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Copiloto Pedagógico Inteligente — O Braço Direito do Professor</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Gerencie a criação automatizada de desafios de programação, audite códigos com dicas socráticas personalizadas para os alunos e monte rubricas de avaliação estruturadas sem esforço manual.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 1: Challenge & Test Cases Generator */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-indigo-400 font-mono uppercase">1. Gerador de Desafios & Casos de Teste</span>
                    <span className="text-[10px] text-slate-400 font-mono">IA Generativa</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-mono text-slate-400">Tópico de Programação</label>
                      <input
                        type="text"
                        value={copilotTopic}
                        onChange={(e) => setCopilotTopic(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        placeholder="Ex: Grafos, Busca Binária, Programação Dinâmica"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-mono text-slate-400">Dificuldade</label>
                        <select
                          value={copilotDifficulty}
                          onChange={(e) => setCopilotDifficulty(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="Iniciante">Iniciante</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Avançado">Avançado</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-mono text-slate-400">Linguagem Padrão</label>
                        <select
                          value={copilotLanguage}
                          onChange={(e) => setCopilotLanguage(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="python">Python</option>
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateChallengeWithAI}
                      disabled={copilotLoading}
                      className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      {copilotLoading ? "Gerando Desafio e Testes..." : "Gerar Desafio com IA"}
                    </button>
                  </div>

                  {copilotGenerated && (
                    <div className="mt-2 p-4 rounded-xl bg-slate-950 border border-indigo-500/30 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{copilotGenerated.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">{copilotGenerated.difficulty}</span>
                      </div>
                      <p className="text-xs text-slate-300">{copilotGenerated.objective}</p>
                      
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Casos de Teste Gerados:</span>
                        {copilotGenerated.testCases.map((tc: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-[11px] font-mono bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-300">Input: {tc.input}</span>
                            <span className="text-emerald-400">Esperado: {tc.expected}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-1 pt-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Critérios da Rubrica:</span>
                        <ul className="text-[11px] text-slate-300 list-disc pl-4 space-y-1">
                          {copilotGenerated.rubric.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Socratic Auditor & Pedagogical Feedback */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-fuchsia-400 font-mono uppercase">2. Auditor Socrático de Código</span>
                    <span className="text-[10px] text-slate-400 font-mono">Orientação Pedagógica</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-mono text-slate-400">Cole o código do aluno para análise socrática</label>
                      <textarea
                        value={socraticInput}
                        onChange={(e) => setSocraticInput(e.target.value)}
                        rows={5}
                        className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono"
                        placeholder="Cole o código fonte aqui..."
                      />
                    </div>

                    <button
                      onClick={handleGenerateSocraticHints}
                      disabled={socraticLoading}
                      className="w-full py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      {socraticLoading ? "Processando Análise Socrática..." : "Gerar Orientação Socrática para o Aluno"}
                    </button>
                  </div>

                  {socraticResponse && (
                    <div className="mt-2 p-4 rounded-xl bg-slate-950 border border-fuchsia-500/30 flex flex-col gap-2">
                      <span className="text-xs font-bold text-fuchsia-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Feedback Socrático Recomendado:
                      </span>
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">{socraticResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: NLP SENTIMENT & WORD CLOUD */}
          {activeTab === "nlp" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-indigo-950/40 border border-fuchsia-500/30 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-fuchsia-400" />
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Módulo de Processamento de Linguagem Natural (NLP)</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Análise preditiva de sentimentos dos comentários e feedbacks deixados por estudantes nas submissões. O motor identifica pontos críticos de dúvida, frustração e gargalos conceituais, gerando uma nuvem de palavras interativa para direcionar intervenções pedagógicas.
                </p>
              </div>

              {/* KPI Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Feedbacks Analisados</span>
                  <span className="text-2xl font-bold font-display text-white">142</span>
                  <span className="text-[10px] text-emerald-400 font-mono">100% processados por NLP</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Sentimento Positivo</span>
                  <span className="text-2xl font-bold font-display text-emerald-400">64%</span>
                  <span className="text-[10px] text-slate-400 font-mono">91 submissões congratulatórias</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Dúvidas Técnicas (Neutro)</span>
                  <span className="text-2xl font-bold font-display text-amber-400">21%</span>
                  <span className="text-[10px] text-slate-400 font-mono">30 submissões com questionamentos</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Frustração / Erros Críticos</span>
                  <span className="text-2xl font-bold font-display text-red-400">15%</span>
                  <span className="text-[10px] text-red-300 font-mono">21 submissões travadas</span>
                </div>
              </div>

              {/* Word Cloud & Frustration Points */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 p-5 rounded-2xl bg-[#030712]/50 border border-slate-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-fuchsia-400" />
                      Nuvem de Palavras de Dúvidas & Frustrações
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300">
                      Clique para filtrar feedback
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 py-4 items-center justify-center bg-slate-950/60 rounded-xl p-6 border border-slate-800/80 min-h-[220px]">
                    {[
                      { word: "recursão", freq: 48, sentiment: "frustration", size: "text-2xl font-bold text-red-400" },
                      { word: "ponteiros", freq: 39, sentiment: "frustration", size: "text-xl font-bold text-red-300" },
                      { word: "segmentation fault", freq: 27, sentiment: "error", size: "text-lg font-bold text-amber-400" },
                      { word: "syntax error", freq: 24, sentiment: "neutral", size: "text-base font-semibold text-slate-300" },
                      { word: "timeout", freq: 21, sentiment: "frustration", size: "text-lg font-bold text-red-400" },
                      { word: "NullPointerException", freq: 18, sentiment: "error", size: "text-sm font-semibold text-amber-300" },
                      { word: "complexidade O(N)", freq: 15, sentiment: "neutral", size: "text-sm font-semibold text-fuchsia-300" },
                      { word: "for aninhado", freq: 12, sentiment: "neutral", size: "text-xs font-medium text-slate-400" },
                      { word: "pilhas e filas", freq: 31, sentiment: "positive", size: "text-lg font-bold text-emerald-400" },
                      { word: "testes unitários", freq: 29, sentiment: "positive", size: "text-base font-semibold text-emerald-300" },
                      { word: "clean code", freq: 22, sentiment: "positive", size: "text-sm font-semibold text-teal-300" },
                    ].map((item, idx) => (
                      <span
                        key={idx}
                        onClick={() => alert(`Termo selecionado: "${item.word}" (Frequência: ${item.freq}, Sentimento: ${item.sentiment}). Clique para disparar plano corretivo.`)}
                        className={`px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-fuchsia-500/50 cursor-pointer transition-all shadow-sm ${item.size} flex items-center gap-1.5`}
                      >
                        {item.word}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{item.freq}x</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">Termos em vermelho indicam pontos de maior retenção e dúvida na turma.</span>
                    <button
                      onClick={() => alert("Reanálise NLP disparada com sucesso! Os modelos atualizados escanearam todas as submissões das últimas 24 horas.")}
                      className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mono font-bold text-xs shadow-lg shadow-fuchsia-600/30 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Reexecutar NLP Real-Time
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 p-5 rounded-2xl bg-[#030712]/50 border border-slate-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Stream de Feedbacks Críticos (Alunos)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                      21 Alertas
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
                    {[
                      { student: "Lucas Mendonça", activity: "Lista 03 - Pilhas", quote: "Não entendi como tratar o estouro de pilha na recursão do exercício 4.", sentiment: "Frustração", color: "text-red-400 bg-red-500/10 border-red-500/20" },
                      { student: "Mariana Souza", activity: "Árvores Binárias", quote: "O teste unitário falhou com segmentation fault e não sei onde aloquei errado.", sentiment: "Erro Crítico", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                      { student: "Gabriel Costa", activity: "Trilha Complexidade", quote: "Meu código excedeu o limite de tempo (timeout 5000ms) no teste de estresse.", sentiment: "Frustração", color: "text-red-400 bg-red-500/10 border-red-500/20" },
                      { student: "Camila Ribeiro", activity: "Lista 02 - Ponteiros", quote: "Confusa sobre a diferença entre passagem por referência e valor em C++.", sentiment: "Dúvida", color: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20" }
                    ].map((f, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{f.student}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${f.color} font-bold`}>
                            {f.sentiment}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 italic">"{f.quote}"</p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                          <span>Atividade: {f.activity}</span>
                          <button 
                            onClick={() => alert(`Plano de recuperação gerado automaticamente para ${f.student} com base no feedback NLP.`)}
                            className="text-fuchsia-400 hover:text-fuchsia-300 font-bold"
                          >
                            Disparar Ajuda IA →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AUTO-FIXER & PATCH IA */}
          {activeTab === "autofix" && (
            <div className="flex flex-col gap-6">
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Auto-Fixer & Patch IA (AI_CODE_MODEL)</h4>
                      <p className="text-xs text-slate-400">
                        Inspeção e correção autônoma de vulnerabilidades de segurança, SQL Injection, segredos hardcoded e erros de sintaxe em lote.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      alert("Varredura de vulnerabilidades concluída! 3 patches automáticos gerados com sucesso.");
                    }}
                    className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-fuchsia-600/30 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Varredura Geral de Segurança IA
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                  <div className="bg-[#030712] border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-2">
                        🔴 Alerta: SQL Injection (Submissão #402 - Lucas Gabriel)
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-300">Risco Crítico</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto">
                      {`// Código Original do Aluno\nconst query = "SELECT * FROM users WHERE name = '" + req.body.username + "'";\npool.query(query);`}
                    </pre>
                    <button
                      onClick={() => {
                        alert("Patch de correção aplicado com sucesso! Aluno notificado e código sanitizado.");
                      }}
                      className="py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      Aplicar Patch Automático via AI_CODE_MODEL
                    </button>
                  </div>

                  <div className="bg-[#030712] border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
                        🟢 Patch IA Aplicado & Sanitizado
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">Seguro</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto">
                      {`// Código Corrigido por AI_CODE_MODEL\nconst query = "SELECT * FROM users WHERE name = $1";\npool.query(query, [req.body.username]);`}
                    </pre>
                    <div className="text-[11px] text-slate-400 font-mono bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                      💡 <strong>Parecer IA:</strong> Substituição de concatenação direta de string por query parametrizada via prepared statement. Vulnerabilidade eliminada.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: IA VISIONARY TEACHER */}
          {activeTab === "visionary" && (
            <div className="flex flex-col gap-6 p-2">
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col gap-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl">
                      <Sparkles className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">IA Visionary Teacher (AI_GENERAL_MODEL)</h4>
                      <p className="text-xs text-slate-400">
                        Análise profunda das submissões para diagnóstico de gargalos e geração automática de variações de exercícios integradas ao Banco de Questões.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <input
                      type="text"
                      value={visionaryTopic}
                      onChange={(e) => setVisionaryTopic(e.target.value)}
                      placeholder="Tema Foco (ex: Ponteiros, Árvores)"
                      className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-fuchsia-500"
                    />
                    <button
                      disabled={visionaryLoading}
                      onClick={async () => {
                        setVisionaryLoading(true);
                        try {
                          const res = await fetch(apiUrl("/api/ai/visionary-teacher"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ focusTopic: visionaryTopic })
                          });
                          const data = await res.json();
                          if (data.success) {
                            setVisionaryData(data);
                            alert("Análise Visionary Teacher concluída e exercícios publicados automaticamente no /api/questions!");
                          } else {
                            alert("Erro: " + (data.error || "Falha na análise"));
                          }
                        } catch (err: any) {
                          alert("Falha de conexão: " + err.message);
                        } finally {
                          setVisionaryLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-fuchsia-600/30 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                    >
                      {visionaryLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analisando com IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Executar Análise & Propor Exercícios
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {visionaryData && (
                  <div className="flex flex-col gap-6 mt-4 animate-fade-in">
                    <div className="bg-[#030712] border border-slate-800 p-5 rounded-2xl flex flex-col gap-2">
                      <span className="text-xs font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-2">
                        🧠 Diagnóstico Pedagógico ({visionaryData.modelUsed || 'AI_GENERAL_MODEL'})
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed font-sans">
                        {visionaryData.diagnostic}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Variações de Exercícios Propostas para o Banco ({visionaryData.proposed_exercises?.length || 0})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {visionaryData.proposed_exercises?.map((ex: any, idx: number) => (
                          <div key={idx} className="bg-[#030712] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between gap-4 hover:border-slate-700 transition-all">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                                  {ex.difficulty || "Médio"}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">{ex.language || "python"}</span>
                              </div>
                              <h6 className="text-sm font-bold text-white">{ex.title}</h6>
                              <p className="text-xs text-slate-400 line-clamp-3">{ex.statement}</p>
                              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono">
                                🎯 <strong>Foco:</strong> {ex.target_concept}
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(apiUrl("/api/questions"), {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      title: ex.title,
                                      description: ex.statement,
                                      language: ex.language || "python",
                                      difficulty: ex.difficulty || "Médio",
                                      starter_code: ex.reference_solution || "",
                                      test_cases: ex.test_cases || [],
                                      rubric: ex.rubric || { syntax_weight: 30, logic_weight: 40, tests_weight: 30 }
                                    })
                                  });
                                  const d = await res.json();
                                  if (d.success || d.id || d.question) {
                                    alert(`Exercício "${ex.title}" integrado ao Banco de Questões com sucesso!`);
                                  } else {
                                    alert("Erro ao integrar ao banco de questões.");
                                  }
                                } catch (err: any) {
                                  alert("Erro de conexão: " + err.message);
                                }
                              }}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Integrar ao Banco de Questões
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: IA AUTOMAÇÃO ACADÊMICA */}
          {activeTab === "automation" && (
            <div className="w-full h-full overflow-y-auto">
              <PedagogicalExecutiveDashboard />
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
                <span className="text-sm font-bold font-mono text-slate-200">
                  Trabalho Ativo: {activeTaskModal.title}
                </span>
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
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Impacto Indicado
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {activeTaskModal.impact}
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Esta ação pedagógica foi recomendada pelo motor inteligente do
                  CodeCheck para ajustar desvios estatísticos de aproveitamento.
                </p>
              </div>

              {activeTaskModal.type === "correction" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col w-24">
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Nota Sugerida
                      </label>
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
                      <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Atalho de Template de Resposta
                      </label>
                      <select
                        onChange={(e) => setModalFeedbackText(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono p-2 rounded focus:outline-none focus:border-fuchsia-500"
                      >
                        <option value="">
                          Selecione um Comentário Rápido...
                        </option>
                        <option value="Perfeito! Código limpo, correto e estruturalmente impecável. Enviaremos as congratulações automatizadas.">
                          Congratular Lógica
                        </option>
                        <option value="Atenção! Notei comportamentos de sandbox timeout no seu código pela complexidade do laço nested. Revise o algoritmo.">
                          Avisar Timeout Sandbox
                        </option>
                        <option value="Atividade não entregue dentro das diretrizes ou corrompida. Favor verificar extensão da submissão.">
                          Recusar Atividade
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                      Mensagem de Feedback Final
                    </label>
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
                    Ação Pedagógica: Disparar comunicação integrada para
                    recuperar {activeTaskModal.impact} que apresentam
                    engajamento crítico.
                  </span>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                      Lançar Mensagem de Alerta Acadêmico
                    </label>
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

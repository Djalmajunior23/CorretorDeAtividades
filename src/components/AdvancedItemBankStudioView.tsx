import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Brain,
  Download,
  Copy,
  Plus,
  Play,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  Cpu,
  Target,
  Shuffle,
  Eye,
  FileCode,
  ShieldAlert,
  Bug,
  Filter,
  BarChart2,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  AdvancedItemBankService,
  ItemTriMetrics,
  DiagnosticMcqQuestion,
  ParametricQuestionTemplate,
  IngestedParsedItem,
  AssembledExamBooklet,
  CodeBugHuntChallenge
} from "../services/advancedItemBankService";
import { apiUrl } from "../config/api";

type ActiveModuleTab = "tri_calibration" | "diagnostic_mcq" | "parametric_anticheat" | "ocr_ingestion" | "exam_assembler" | "bughunt_lab";

export default function AdvancedItemBankStudioView() {
  const [activeTab, setActiveTab] = useState<ActiveModuleTab>("tri_calibration");

  // =========================================================================
  // MODULE 1: TRI CALIBRATION STATE
  // =========================================================================
  const [triItemId, setTriItemId] = useState("ITEM-SENAI-2026-08");
  const [triItemTitle, setTriItemTitle] = useState("Manipulação de Ponteiros e Alocação Dinâmica no Heap");
  const [triMetrics, setTriMetrics] = useState<ItemTriMetrics | null>(null);

  const handleRunTriCalibration = () => {
    // Simula 30 submissões empíricas para demonstrar o cálculo TRI
    const mockSubs = [
      { studentId: "s1", studentAbilityScore: 92, isCorrect: true, timeSpentSeconds: 45 },
      { studentId: "s2", studentAbilityScore: 88, isCorrect: true, timeSpentSeconds: 60 },
      { studentId: "s3", studentAbilityScore: 85, isCorrect: true, timeSpentSeconds: 50 },
      { studentId: "s4", studentAbilityScore: 78, isCorrect: true, timeSpentSeconds: 70 },
      { studentId: "s5", studentAbilityScore: 75, isCorrect: true, timeSpentSeconds: 80 },
      { studentId: "s6", studentAbilityScore: 70, isCorrect: false, timeSpentSeconds: 90 },
      { studentId: "s7", studentAbilityScore: 65, isCorrect: true, timeSpentSeconds: 110 },
      { studentId: "s8", studentAbilityScore: 60, isCorrect: false, timeSpentSeconds: 120 },
      { studentId: "s9", studentAbilityScore: 55, isCorrect: false, timeSpentSeconds: 85 },
      { studentId: "s10", studentAbilityScore: 48, isCorrect: false, timeSpentSeconds: 130 },
      { studentId: "s11", studentAbilityScore: 40, isCorrect: false, timeSpentSeconds: 140 },
      { studentId: "s12", studentAbilityScore: 35, isCorrect: false, timeSpentSeconds: 60 }
    ];

    const result = AdvancedItemBankService.calculateItemTriMetrics({
      itemId: triItemId,
      itemTitle: triItemTitle,
      submissions: mockSubs
    });

    setTriMetrics(result);
    toast.success("Calibração Psicométrica TRI calculada com sucesso!");
  };

  // =========================================================================
  // MODULE 2: DIAGNOSTIC MCQ STATE
  // =========================================================================
  const [mcqTopic, setMcqTopic] = useState("Estruturas de Dados e Algoritmos");
  const [mcqSubtopic, setMcqSubtopic] = useState("Recursão, Pilha de Execução e Imutabilidade");
  const [mcqBloom, setMcqBloom] = useState("Análise / Diagnóstico");
  const [mcqCompetency, setMcqCompetency] = useState("Construir algoritmos com eficiência de memória e controle de escopo");
  const [isGeneratingMcq, setIsGeneratingMcq] = useState(false);
  const [generatedMcq, setGeneratedMcq] = useState<DiagnosticMcqQuestion | null>(null);
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);

  const handleGenerateMcq = async () => {
    setIsGeneratingMcq(true);
    try {
      const q = await AdvancedItemBankService.generateDiagnosticMcq({
        topic: mcqTopic,
        subtopic: mcqSubtopic,
        bloomLevel: mcqBloom,
        targetCompetency: mcqCompetency
      });
      setGeneratedMcq(q);
      setSelectedMcqOption(null);
      toast.success("Questão de Múltipla Escolha Diagnóstica gerada!");
    } catch (e: any) {
      toast.error("Erro ao gerar questão: " + e.message);
    } finally {
      setIsGeneratingMcq(false);
    }
  };

  // =========================================================================
  // MODULE 3: PARAMETRIC ANTI-CHEAT STATE
  // =========================================================================
  const [paramTitle, setParamTitle] = useState("Cálculo de Juros Compostos e Rendimento de CDB");
  const [paramFormula, setParamFormula] = useState<"FINANCE_INTEREST" | "SHIPPING_WEIGHT" | "ARRAY_ANOMALY">("FINANCE_INTEREST");
  const [generatedTemplate, setGeneratedTemplate] = useState<ParametricQuestionTemplate | null>(null);

  const handleGenerateParametric = () => {
    const students = [
      { id: "SENAI-2026-001", name: "Ana Beatriz Rocha" },
      { id: "SENAI-2026-002", name: "Bruno Henrique Lima" },
      { id: "SENAI-2026-003", name: "Carlos Eduardo Silva" },
      { id: "SENAI-2026-004", name: "Daniela Ferreira Alves" },
      { id: "SENAI-2026-005", name: "Eduardo Matheus Santos" }
    ];

    const tmpl = AdvancedItemBankService.generateParametricInstances({
      title: paramTitle,
      scenarioTemplate: "Geração de instâncias polimórficas anti-cola para avaliação presencial.",
      studentList: students,
      formulaType: paramFormula
    });

    setGeneratedTemplate(tmpl);
    toast.success("Instâncias polimórficas anti-cola geradas para 5 estudantes!");
  };

  // =========================================================================
  // MODULE 4: OCR & MULTI-SOURCE INGESTION STATE
  // =========================================================================
  const [rawOcrText, setRawOcrText] = useState(`1. Implemente um algoritmo em Python que receba uma lista de temperaturas industriais coletadas a cada 10 minutos. O programa deve calcular a média móvel simples de 3 períodos, identificar momentos de sobreaquecimento (> 85°C) e retornar um relatório contendo a lista de alertas e a temperatura máxima registrada. Garanta complexidade O(n) e trate listas vazias com segurança.`);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedItems, setIngestedItems] = useState<IngestedParsedItem[]>([]);

  const handleRunOcrIngestion = async () => {
    setIsIngesting(true);
    try {
      const res = await AdvancedItemBankService.ingestMultiSourceExam({
        rawTextOrOcr: rawOcrText,
        sourceType: "PDF_PROVA",
        targetCourse: "Técnico em Desenvolvimento de Sistemas"
      });
      setIngestedItems(res.items);
      toast.success(`${res.totalIngested} questão(ões) segmentada(s) e catalogada(s) com testes!`);
    } catch (e: any) {
      toast.error("Erro na ingestão: " + e.message);
    } finally {
      setIsIngesting(false);
    }
  };

  // =========================================================================
  // MODULE 5: SMART EXAM ASSEMBLER STATE
  // =========================================================================
  const [examTitle, setExamTitle] = useState("Avaliação Prática SAEP • Engenharia de Software e Banco de Dados");
  const [examCourse, setExamCourse] = useState("Curso Técnico em Desenvolvimento de Sistemas");
  const [examClass, setExamClass] = useState("Turma DS-1B");
  const [examDuration, setExamDuration] = useState(90);
  const [assembledBooklets, setAssembledBooklets] = useState<AssembledExamBooklet[]>([]);
  const [selectedBookletVersion, setSelectedBookletVersion] = useState<"A" | "B" | "C" | "D">("A");

  const handleAssembleExam = () => {
    const mockBank = [
      {
        id: "Q1",
        title: "Normalização de Banco de Dados e 3FN",
        type: "Múltipla Escolha",
        difficulty: "Fácil" as const,
        statement: "Qual das seguintes regras define rigorosamente que uma tabela está na Terceira Forma Normal (3FN)?",
        options: [
          { letter: "A", text: "Está na 2FN e não possui dependências transitivas entre atributos não-chave." },
          { letter: "B", text: "Possui apenas chaves primárias compostas sem valores nulos." },
          { letter: "C", text: "Todos os atributos multivalorados foram convertidos em colunas JSON." },
          { letter: "D", text: "A tabela possui ao menos 3 chaves estrangeiras indexadas." }
        ],
        correctAnswer: "A",
        points: 25
      },
      {
        id: "Q2",
        title: "Tratamento Assíncrono com Promises em Node.js",
        type: "Código / Discursiva",
        difficulty: "Médio" as const,
        statement: "Explique a diferença entre Promise.all() e Promise.allSettled() e implemente um exemplo tratando requisições concorrentes de pagamento.",
        correctAnswer: "Promise.all falha rápido (rejeita no primeiro erro); Promise.allSettled aguarda todas as promessas completarem independentemente do status.",
        points: 35
      },
      {
        id: "Q3",
        title: "Prevenção contra SQL Injection e Prepared Statements",
        type: "Múltipla Escolha",
        difficulty: "Fácil" as const,
        statement: "Por que a concatenação direta de strings em comandos SQL expõe a aplicação a ataques de SQL Injection?",
        options: [
          { letter: "A", text: "Porque permite que o atacante altere a árvore sintática do comando executado no SGBD." },
          { letter: "B", text: "Porque o compilador C/C++ do banco trava a memória." },
          { letter: "C", text: "Porque aumenta a latência de rede em 500%." },
          { letter: "D", text: "Porque desabilita o garbage collector do banco de dados." }
        ],
        correctAnswer: "A",
        points: 20
      },
      {
        id: "Q4",
        title: "Otimização de Consultas com Índices B-Tree",
        type: "Discursiva Avançada",
        difficulty: "Difícil" as const,
        statement: "Dado um volume de 10 milhões de registros, projete um índice composto para a query 'SELECT * FROM pedidos WHERE cliente_id = ? AND data_criacao >= ? ORDER BY data_criacao DESC' e justifique a ordem das colunas.",
        correctAnswer: "CREATE INDEX idx_pedidos_cliente_data ON pedidos (cliente_id, data_criacao DESC). Permite busca exata por igualdade e range scan sem filesort.",
        points: 20
      }
    ];

    const booklets = AdvancedItemBankService.assembleBalancedExam({
      examTitle,
      courseName: examCourse,
      classId: examClass,
      durationMinutes: examDuration,
      distribution: { easyPct: 40, mediumPct: 40, hardPct: 20 },
      availableBankItems: mockBank
    });

    setAssembledBooklets(booklets);
    setSelectedBookletVersion("A");
    toast.success("4 Cadernos de Prova (Versões A, B, C e D) gerados com gabarito sincronizado!");
  };

  const handleDownloadExamPdf = (booklet: AssembledExamBooklet) => {
    try {
      const buffer = AdvancedItemBankService.exportExamBookletToPdf(booklet);
      const blob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Caderno_Prova_${booklet.examTitle.replace(/\s+/g, "_")}_Versao_${booklet.versionLetter}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`PDF Oficial da Versão ${booklet.versionLetter} exportado!`);
    } catch (e: any) {
      toast.error("Erro ao gerar PDF do caderno: " + e.message);
    }
  };

  // =========================================================================
  // MODULE 6: BUG HUNT & REFACTORING LAB STATE
  // =========================================================================
  const [bugTopic, setBugTopic] = useState("Reserva Concorrente de Ingressos & Overbooking");
  const [bugLang, setBugLang] = useState("TypeScript");
  const [isGeneratingBug, setIsGeneratingBug] = useState(false);
  const [generatedBugChallenge, setGeneratedBugChallenge] = useState<CodeBugHuntChallenge | null>(null);

  const handleGenerateBugHunt = async () => {
    setIsGeneratingBug(true);
    try {
      const chal = await AdvancedItemBankService.generateBugHuntChallenge({
        topic: bugTopic,
        language: bugLang
      });
      setGeneratedBugChallenge(chal);
      toast.success("Desafio de Bug Hunt & Refactoring gerado com 3 bugs sutis de produção!");
    } catch (e: any) {
      toast.error("Erro ao gerar Bug Hunt: " + e.message);
    } finally {
      setIsGeneratingBug(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header Institucional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-display tracking-tight flex items-center gap-2">
                Banco de Itens & Engenharia de Avaliações
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-sans uppercase font-semibold">
                  Padrão SENAI / SAEP
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Psicometria TRI, Distratores Cognitivos, Anti-Cola Paramétrico, Ingestão OCR e Cadernos Balanceados A/B/C/D.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2 text-right">
            <div className="text-xs text-slate-400 font-medium">Modo de Avaliação</div>
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Psicométrico & Paramétrico
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {[
          { id: "tri_calibration", label: "1. Calibração TRI & Psicometria", icon: TrendingUp },
          { id: "diagnostic_mcq", label: "2. Múltipla Escolha Diagnóstica", icon: Target },
          { id: "parametric_anticheat", label: "3. Anti-Cola Paramétrico", icon: Shuffle },
          { id: "ocr_ingestion", label: "4. Ingestão OCR & Multi-Fonte", icon: FileText },
          { id: "exam_assembler", label: "5. Montador de Cadernos A/B/C/D", icon: BookOpen },
          { id: "bughunt_lab", label: "6. Bug Hunt & Refactoring Lab", icon: Bug }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveModuleTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TRI CALIBRATION */}
      {activeTab === "tri_calibration" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Parâmetros do Item para Calibração
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ID do Item no Banco</label>
                <input
                  type="text"
                  value={triItemId}
                  onChange={e => setTriItemId(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Título / Descritor da Questão</label>
                <input
                  type="text"
                  value={triItemTitle}
                  onChange={e => setTriItemTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                O motor psicométrico analisa o histórico de submissões dos alunos, calcula a curva característica do item (CCI), a discriminação e detecta ambiguidades.
              </div>

              <button
                onClick={handleRunTriCalibration}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Calcular Métricas TRI & Psicometria
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              Relatório de Qualidade Psicométrica (TRI)
            </h2>

            {triMetrics ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-xs text-slate-500">Dificuldade (b)</div>
                    <div className="text-xl font-bold text-white mt-0.5">{triMetrics.difficultyParamB}</div>
                    <div className="text-[10px] text-slate-400">Escala -3 a +3</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-xs text-slate-500">Discriminação (a)</div>
                    <div className="text-xl font-bold text-emerald-400 mt-0.5">{triMetrics.discriminationParamA}</div>
                    <div className="text-[10px] text-slate-400">Poder de seleção</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-xs text-slate-500">Taxa de Acerto Real</div>
                    <div className="text-xl font-bold text-indigo-400 mt-0.5">{triMetrics.successRatePercentage}%</div>
                    <div className="text-[10px] text-slate-400">{triMetrics.totalAttempts} submissões</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-xs text-slate-500">Correlação Bisserial</div>
                    <div className="text-xl font-bold text-amber-400 mt-0.5">{triMetrics.pointBiserialCorrelation}</div>
                    <div className="text-[10px] text-slate-400">r_pbi item-teste</div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${
                  triMetrics.qualityStatus === "EXCELENTE"
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                    : triMetrics.qualityStatus === "ADEQUADO"
                    ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-200"
                    : "bg-amber-950/40 border-amber-500/30 text-amber-200"
                }`}>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Status do Item: {triMetrics.qualityStatus}
                  </div>
                  <p className="text-xs mt-1 opacity-90">{triMetrics.diagnosticRecommendation}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">
                Clique no botão ao lado para executar a calibração com a amostra de submissões.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNOSTIC MCQ */}
      {activeTab === "diagnostic_mcq" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Engenharia de Distratores
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unidade / Tema</label>
                <input
                  type="text"
                  value={mcqTopic}
                  onChange={e => setMcqTopic(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subtópico de Foco</label>
                <input
                  type="text"
                  value={mcqSubtopic}
                  onChange={e => setMcqSubtopic(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taxonomia de Bloom</label>
                <select
                  value={mcqBloom}
                  onChange={e => setMcqBloom(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="Compreensão Conceitual">Compreensão Conceitual</option>
                  <option value="Aplicação Algorítmica">Aplicação Algorítmica</option>
                  <option value="Análise / Diagnóstico">Análise / Diagnóstico</option>
                  <option value="Avaliação de Performance">Avaliação de Performance</option>
                </select>
              </div>

              <button
                onClick={handleGenerateMcq}
                disabled={isGeneratingMcq}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingMcq ? "Projetando Distratores..." : "Gerar Múltipla Escolha Diagnóstica"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                Questão Diagnóstica com Mapeamento de Equívocos
              </span>
              {generatedMcq && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(generatedMcq, null, 2));
                    toast.success("Questão copiada em JSON!");
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
              )}
            </h2>

            {generatedMcq ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs text-indigo-400 font-semibold">{generatedMcq.contextScenario}</div>
                  <div className="text-sm text-slate-200 font-medium">{generatedMcq.questionStem}</div>
                  {generatedMcq.codeSnippet && (
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto">
                      {generatedMcq.codeSnippet}
                    </pre>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">Alternativas (Clique para inspecionar a armadilha cognitiva):</div>
                  {generatedMcq.options.map(opt => {
                    const isSelected = selectedMcqOption === opt.optionLetter;
                    return (
                      <div
                        key={opt.optionLetter}
                        onClick={() => setSelectedMcqOption(isSelected ? null : opt.optionLetter)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          opt.isCorrect
                            ? "bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/40"
                            : isSelected
                            ? "bg-indigo-950/30 border-indigo-500/50"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            opt.isCorrect ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"
                          }`}>
                            {opt.optionLetter}
                          </span>
                          <div className="flex-1 text-xs text-slate-300">
                            {opt.text}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-1 text-slate-400">
                            <div><strong className="text-amber-300">Equívoco Mapeado:</strong> {opt.misconceptionDiagnosed}</div>
                            <div><strong className="text-indigo-300">Intervenção do Professor:</strong> {opt.pedagogicalIntervention}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                Configure os tópicos e gere uma questão para visualizar os distratores diagnósticos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PARAMETRIC ANTI-CHEAT */}
      {activeTab === "parametric_anticheat" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-indigo-400" />
              Template Polimórfico
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Título da Questão</label>
                <input
                  type="text"
                  value={paramTitle}
                  onChange={e => setParamTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Motor Matemático / Lógico</label>
                <select
                  value={paramFormula}
                  onChange={e => setParamFormula(e.target.value as any)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="FINANCE_INTEREST">Cálculo Financeiro (Juros & Rendimento)</option>
                  <option value="SHIPPING_WEIGHT">Logística & Cargas (Frete & Tarifas)</option>
                  <option value="ARRAY_ANOMALY">Filtro de Telemetria (Threshold de Sensores)</option>
                </select>
              </div>

              <button
                onClick={handleGenerateParametric}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Gerar Instâncias Únicas por Aluno
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              Instâncias Geradas por Estudante (Anti-Cola)
            </h2>

            {generatedTemplate ? (
              <div className="space-y-3 animate-in fade-in max-h-[500px] overflow-y-auto pr-1">
                {generatedTemplate.sampleInstances.map((inst, i) => (
                  <div key={inst.seedId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-400">{inst.studentNameOrId}</span>
                      <span className="font-mono text-slate-500 text-[10px]">{inst.verificationHash}</span>
                    </div>
                    <p className="text-xs text-slate-300">{inst.renderedStatement}</p>
                    <div className="flex items-center gap-4 text-xs pt-2 border-t border-slate-800/80">
                      <div className="text-emerald-400">
                        <strong>Gabarito Calculado:</strong> {String(inst.expectedResult)}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        <strong>Testes Gerados:</strong> {inst.testCases.length} casos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                Clique no botão para gerar as variações matemáticas exclusivas por aluno.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: OCR INGESTION */}
      {activeTab === "ocr_ingestion" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Documento / OCR Bruto
            </h2>

            <div className="space-y-3">
              <textarea
                value={rawOcrText}
                onChange={e => setRawOcrText(e.target.value)}
                rows={8}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none"
                placeholder="Cole o texto bruto de uma prova antiga, lista de exercícios ou transcrição de OCR..."
              />

              <button
                onClick={handleRunOcrIngestion}
                disabled={isIngesting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isIngesting ? "Segmentando Itens..." : "Processar e Catalogar no Banco"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Itens Estruturados & Testes Gerados ({ingestedItems.length})
            </h2>

            {ingestedItems.length > 0 ? (
              <div className="space-y-3 animate-in fade-in">
                {ingestedItems.map(item => (
                  <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-200">{item.extractedTitle}</h3>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                        Confiança: {item.confidenceScore}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{item.commandText}</p>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span><strong>Competência:</strong> {item.saepTargetCompetency}</span>
                      <span><strong>Testes Auto-Gerados:</strong> {item.autoGeneratedTestCases?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                Cole o texto de uma prova ou lista para segmentar os itens automaticamente.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SMART EXAM ASSEMBLER */}
      {activeTab === "exam_assembler" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Montador de Avaliações & 4 Cadernos (A, B, C, D)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gera 4 permutações balanceadas de itens e alternativas para distribuição em sala com gabarito mestre unificado.
                </p>
              </div>

              <button
                onClick={handleAssembleExam}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Montar 4 Cadernos de Prova
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Título da Prova</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={e => setExamTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Curso</label>
                <input
                  type="text"
                  value={examCourse}
                  onChange={e => setExamCourse(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Turma</label>
                <input
                  type="text"
                  value={examClass}
                  onChange={e => setExamClass(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Duração (Minutos)</label>
                <input
                  type="number"
                  value={examDuration}
                  onChange={e => setExamDuration(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {assembledBooklets.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  {(["A", "B", "C", "D"] as Array<"A" | "B" | "C" | "D">).map(v => (
                    <button
                      key={v}
                      onClick={() => setSelectedBookletVersion(v)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedBookletVersion === v
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Caderno Versão {v}
                    </button>
                  ))}
                </div>

                {assembledBooklets.find(b => b.versionLetter === selectedBookletVersion) && (
                  <button
                    onClick={() => handleDownloadExamPdf(assembledBooklets.find(b => b.versionLetter === selectedBookletVersion)!)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar PDF Oficial (Versão {selectedBookletVersion})
                  </button>
                )}
              </div>

              {assembledBooklets.find(b => b.versionLetter === selectedBookletVersion) && (
                <div className="space-y-3">
                  {assembledBooklets.find(b => b.versionLetter === selectedBookletVersion)!.items.map(it => (
                    <div key={it.itemNumber} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">Questão {it.itemNumber} • {it.title}</span>
                        <span className="text-xs text-emerald-400 font-semibold">{it.points} pontos</span>
                      </div>
                      <p className="text-xs text-slate-300">{it.statement}</p>
                      {it.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {it.options.map(opt => (
                            <div key={opt.letter} className="text-xs text-slate-400 flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                              <span className="font-bold text-slate-300">({opt.letter})</span>
                              <span>{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: BUG HUNT LAB */}
      {activeTab === "bughunt_lab" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bug className="w-5 h-5 text-indigo-400" />
              Parâmetros do Desafio
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cenário / Domínio</label>
                <input
                  type="text"
                  value={bugTopic}
                  onChange={e => setBugTopic(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Linguagem</label>
                <select
                  value={bugLang}
                  onChange={e => setBugLang(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C">C / C++</option>
                </select>
              </div>

              <button
                onClick={handleGenerateBugHunt}
                disabled={isGeneratingBug}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingBug ? "Injetando Falhas Reais..." : "Gerar Bug Hunt & Refactoring"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400" />
              Código Legado com 3 Bugs Críticos
            </h2>

            {generatedBugChallenge ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <h3 className="text-sm font-bold text-white">{generatedBugChallenge.title}</h3>
                  <p className="text-xs text-slate-300">{generatedBugChallenge.scenario}</p>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto max-h-60">
                    {generatedBugChallenge.buggySourceCode}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">Gabarito de Auditoria de Bugs:</div>
                  {generatedBugChallenge.bugsCatalog.map(b => (
                    <div key={b.bugId} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400">{b.bugId} • {b.bugType}</span>
                        <span className="text-slate-500">{b.locationHint}</span>
                      </div>
                      <p className="text-slate-300">{b.explanation}</p>
                      <p className="text-indigo-300"><strong>Correção:</strong> {b.fixSolution}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                Gere um desafio para obter código legado com falhas intencionais e baterias de teste.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Sparkles,
  Award,
  FileText,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  BookOpen,
  HelpCircle,
  Download,
  Database,
  Shield,
  AlertTriangle,
  Users,
  Upload,
  Trash2,
  Library,
  Eye,
  LineChart,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AvaliacoesView() {
  const [subTab, setSubTab] = useState<
    "assessments" | "generator" | "evidence" | "analytics"
  >("assessments");

  // State for Construtor of assessments (Módulo 2)
  const [assessments, setAssessments] = useState([
    {
      id: 1,
      title: "Prova Prática: Estruturas de Loops Iterativos",
      type: "Híbrida",
      uc: "Lógica de Programação",
      status: "Publicado",
      questionsCount: 5,
      competency: "COMP-02",
    },
    {
      id: 2,
      title: "Simulado Geral SAEP Técnica 2026",
      type: "Simulado",
      uc: "Desenvolvimento Web",
      status: "Publicado",
      questionsCount: 40,
      competency: "COMP-01",
    },
    {
      id: 3,
      title: "Diagnóstico Inicial: Algoritmos Fundamentais",
      type: "Diagnóstica",
      uc: "Lógica de Programação",
      status: "Publicado",
      questionsCount: 10,
      competency: "COMP-01",
    },
    {
      id: 4,
      title: "Exame Corretor de Recuperação Paralela",
      type: "Recuperação",
      uc: "Sistemas de Computação",
      status: "Rascunho",
      questionsCount: 4,
      competency: "COMP-03",
    },
  ]);

  // Form states for manual assessment creation (Módulo 2)
  const [showManualForm, setShowManualForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("Prática");
  const [formUc, setFormUc] = useState("Lógica de Programação");
  const [formComp, setFormComp] = useState("COMP-02");

  // State for AI Exam Builder (Módulo 3)
  const [aiTheme, setAiTheme] = useState(
    "Instruções de repetição condicional While e Loops Aninhados",
  );
  const [aiComp, setAiComp] = useState("COMP-02");
  const [aiDifficulty, setAiDifficulty] = useState("Média");
  const [aiQuestionsCount, setAiQuestionsCount] = useState(3);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestedExam, setAiSuggestedExam] = useState<any | null>(null);

  // State for Evidence storage (Módulo 6 & 7)
  const [evidences, setEvidences] = useState([
    {
      id: 1,
      student: "Ana Rodrigues Silva",
      class: "Desenvolvimento Web 1A",
      competency: "COMP-01",
      grade: "9.5",
      file: "trabalho_logica.pdf",
      date: "2026-06-01",
    },
    {
      id: 2,
      student: "Carlos Henrique Souza",
      class: "Desenvolvimento Web 1A",
      competency: "COMP-02",
      grade: "5.0",
      file: "atividade_loops.py",
      date: "2026-06-08",
    },
    {
      id: 3,
      student: "Beatriz Oliveira Costa",
      class: "Desenvolvimento Web 1A",
      competency: "COMP-01",
      grade: "8.5",
      file: "apresentacao_slides.pptx",
      date: "2026-06-11",
    },
  ]);
  const [newEvidenceStudent, setNewEvidenceStudent] = useState("");
  const [newEvidenceClass, setNewEvidenceClass] = useState(
    "Desenvolvimento Web 1A",
  );
  const [newEvidenceComp, setNewEvidenceComp] = useState("COMP-01");
  const [newEvidenceGrade, setNewEvidenceGrade] = useState("8.5");
  const [newEvidenceFile, setNewEvidenceFile] = useState("");

  // Result Analytics (Módulo 8)
  const [classAverage, setClassAverage] = useState(7.4);
  const [criticalCompCode, setCriticalCompCode] = useState("COMP-03");
  const [recoveryAdvisedNum, setRecoveryAdvisedNum] = useState(4);

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setAssessments([
      ...assessments,
      {
        id: Date.now(),
        title: formTitle,
        type: formType,
        uc: formUc,
        status: "Rascunho",
        questionsCount: 5,
        competency: formComp,
      },
    ]);
    setFormTitle("");
    setShowManualForm(false);
  };

  const handleGenerateAIExam = async () => {
    setAiGenerating(true);
    setAiSuggestedExam(null);

    try {
      const resp = await fetch("/api/codecheck/module06/simulated-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: aiTheme,
          comp: aiComp,
          difficulty: aiDifficulty,
          count: aiQuestionsCount,
        }),
      });
      const data = await resp.json();

      setTimeout(() => {
        setAiSuggestedExam({
          title: `Avaliação com IA: ${aiTheme}`,
          competency: aiComp,
          questions: [
            {
              num: 1,
              enunciado:
                "Escreva uma estrutura em Python que imprima os números de 1 a 10 utilizando o laço 'while' de forma simplificada, validando limites de forma assintótica ideal.",
              alternatives: [
                "A) while i <= 10: print(i)",
                "B) while i < 11: print(i)",
                "C) for i in range(1, 11): print(i)",
                "D) Nenhuma das anteriores",
              ],
              gabarito: "C",
              justification:
                "O laço for com determinismo do iterador aproveita a pilha de execução melhor",
              rubric:
                "Critério de Correção: Valide complexidade cilomática <= 2. Bonifique indentação impecável.",
            },
            {
              num: 2,
              enunciado:
                "Explique como evitar loop infinito quando se trabalha com sentenças condicionais de alteração de variáveis sentinelas em Java.",
              alternatives: [
                "A) Inicializar a variável com zero",
                "B) Modificar a variável de controle obrigatoriamente dentro do escopo interno",
                "C) Usar break recursivo",
                "D) Todas as alternativas",
              ],
              gabarito: "B",
              justification:
                "A modificação garante a quebra lógica da condição booleana no registrador",
              rubric:
                "Critério de Correção: Analise se o aluno declarou incremento pós-condição.",
            },
          ],
        });
        setAiGenerating(false);
      }, 1500);
    } catch {
      setAiGenerating(false);
    }
  };

  const handleApproveAIExam = () => {
    if (!aiSuggestedExam) return;
    setAssessments([
      ...assessments,
      {
        id: Date.now(),
        title: aiSuggestedExam.title,
        type: "Objetiva/Prática",
        uc: "Lógica de Programação",
        status: "Publicado",
        questionsCount: aiSuggestedExam.questions.length,
        competency: aiSuggestedExam.competency,
      },
    ]);
    setAiSuggestedExam(null);
  };

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceStudent.trim()) return;
    setEvidences([
      ...evidences,
      {
        id: Date.now(),
        student: newEvidenceStudent,
        class: newEvidenceClass,
        competency: newEvidenceComp,
        grade: newEvidenceGrade,
        file: newEvidenceFile || "documento_anexo.pdf",
        date: new Date().toISOString().split("T")[0],
      },
    ]);
    setNewEvidenceStudent("");
    setNewEvidenceFile("");
  };

  const handleExportExamPDF = (title: string, competency: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text("CODECHECK EXAM - CADERNO DE PROVA", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Avaliação de Competência: ${title}`, 14, 28);
    doc.text(`Matriz Requerida: ${competency}`, 14, 34);
    doc.text(`Parâmetros: Documento de aplicação docente em sala`, 14, 40);

    const questionsData = [
      [
        "Questao 1",
        "Implementar estrutura em Python resolvendo Fibonacci usando loops",
        "COMP-02",
      ],
      [
        "Questao 2",
        "Explique a diferenca de passagem por valor e referencia",
        "COMP-03",
      ],
      ["Questao 3", "Analise de logs assintoticos no simulador", "COMP-01"],
    ];

    autoTable(doc, {
      startY: 48,
      head: [["Questão", "Enunciado Lógico Proposto", "Competência Vinculada"]],
      body: questionsData,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`Prova_Docente_${competency.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 text-slate-100 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10b981] uppercase">
            Fase 13: Central de Avaliações, Simulados e Evidências
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display mt-0.5">
            Central de Avaliações e Evidências
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gere, gerencie e documente todo o processo avaliativo curricular de
            forma integrada aos seus planos de ensino.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("generator")}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-[#030712] font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Criador de Provas IA
          </button>
        </div>
      </div>

      {/* Internal Navigation */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setSubTab("assessments")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "assessments" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Central de Provas
          {subTab === "assessments" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setSubTab("generator")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "generator" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Gerador Inteligente IA
          {subTab === "generator" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setSubTab("evidence")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "evidence" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Repositório de Evidências (Módulo 6 & 7)
          {subTab === "evidence" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setSubTab("analytics")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "analytics" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Dashboard Analítico
          {subTab === "analytics" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>
      </div>

      {/* RENDER PAGES BASED ON SUB-TABS */}
      <AnimatePresence mode="wait">
        {/* TAB 1: Central de Provas */}
        {subTab === "assessments" && (
          <motion.div
            key="assessments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="flex justify-between items-center bg-[#0f172a] p-5 rounded-2xl border border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">
                  Banco de Provas e Diagnósticos
                </h3>
                <p className="text-xs text-slate-400">
                  Modelos construídos para aplicação pedagógica local ou
                  sandbox.
                </p>
              </div>

              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold hover:bg-slate-805 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Criar Avaliação
              </button>
            </div>

            {/* Manual builder Form */}
            {showManualForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-4 overflow-hidden"
                onSubmit={handleCreateManual}
              >
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Construtor de Provas Curriculares (Módulo 2)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-slate-400">
                      Título do Instrumento
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ex: Prova de Lógica 2B"
                      className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="flex grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-slate-400 font-bold">
                        Tipo
                      </label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                      >
                        <option value="Prática">Prova Prática</option>
                        <option value="Objetiva">Prova Objetiva</option>
                        <option value="Híbrida">Exame Híbrido</option>
                        <option value="Diagnóstica">
                          Avaliação Diagnóstica
                        </option>
                        <option value="Recuperação">
                          Recuperação Paralela
                        </option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-slate-400 font-bold">
                        Competência-Alvo
                      </label>
                      <select
                        value={formComp}
                        onChange={(e) => setFormComp(e.target.value)}
                        className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                      >
                        <option value="COMP-01">COMP-01 (Dados)</option>
                        <option value="COMP-02">COMP-02 (Loops)</option>
                        <option value="COMP-03">COMP-03 (Arranjos)</option>
                        <option value="COMP-04">COMP-04 (Módulos)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="px-3 py-1 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 text-slate-955 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Salvar Projeto
                  </button>
                </div>
              </motion.form>
            )}

            {/* Assessment Grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assessments.map((ass) => (
                <div
                  key={ass.id}
                  className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/20 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                        {ass.type}
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {ass.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-1">
                        <span>UC: {ass.uc}</span>
                        <span>●</span>
                        <span>COMP: {ass.competency}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                        ass.status === "Publicado"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {ass.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-[11px] text-slate-500 font-mono">
                    <span>{ass.questionsCount} Questões Vinculadas</span>
                    <button
                      onClick={() =>
                        handleExportExamPDF(ass.title, ass.competency)
                      }
                      className="flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 2: Intelligent Generator with IA */}
        {subTab === "generator" && (
          <motion.div
            key="generator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#10b981]/10 text-emerald-400 border border-emerald-500/15">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Criador e Gerador de Provas com IA
                  </h3>
                  <p className="text-xs text-slate-400">
                    Idealize questões completas de avaliações, justificativas
                    didáticas e rubricas com IA.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-400 uppercase">
                    Tema/Tópico Pedagógico
                  </label>
                  <input
                    type="text"
                    value={aiTheme}
                    onChange={(e) => setAiTheme(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs hover:border-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-400 uppercase">
                    Dificuldade Estimada
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs hover:border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                  >
                    <option value="Fácil">Básica/Inicial</option>
                    <option value="Média">Média (Recomendada)</option>
                    <option value="Difícil">Complexa (Desafio)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-400 uppercase">
                    Competência Requerida (Syllabus)
                  </label>
                  <select
                    value={aiComp}
                    onChange={(e) => setAiComp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                  >
                    <option value="COMP-01">
                      COMP-01 (Dados primitivos, Tipos, Variáveis)
                    </option>
                    <option value="COMP-02">
                      COMP-02 (Selecção condicional, Loops, Laços)
                    </option>
                    <option value="COMP-03">
                      COMP-03 (Pesquisa, Arranjos, Matrizes)
                    </option>
                    <option value="COMP-04">
                      COMP-04 (Abstração, Funções, Parâmetros)
                    </option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-400 uppercase">
                    Quantidade de Questões
                  </label>
                  <input
                    type="number"
                    value={aiQuestionsCount}
                    onChange={(e) =>
                      setAiQuestionsCount(Number(e.target.value))
                    }
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-900">
                <button
                  onClick={handleGenerateAIExam}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-[#030712] font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  {aiGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Gerar Questões e Rubricas com IA
                </button>
              </div>
            </div>

            {/* Suggestion Preview layout (Módulo 3) */}
            <AnimatePresence>
              {aiSuggestedExam && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/20 flex flex-col gap-6"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                        Modelo Gerado
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">
                        {aiSuggestedExam.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Mapeado à Competência {aiSuggestedExam.competency}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setAiSuggestedExam(null)}
                        className="px-3 py-1.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-mono font-bold"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={handleApproveAIExam}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-955 font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        Publicar Avaliação
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    {aiSuggestedExam.questions.map((q: any) => (
                      <div
                        key={q.num}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded bg-slate-800 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            Q{q.num}
                          </span>
                          <span className="text-xs font-bold leading-relaxed text-slate-200">
                            {q.enunciado}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7 text-[11px] text-slate-400 font-semibold">
                          {q.alternatives.map((alt: string, key: number) => (
                            <span
                              key={key}
                              className="p-2 bg-slate-950 border border-slate-900 rounded-lg"
                            >
                              {alt}
                            </span>
                          ))}
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 text-xs text-slate-300 flex flex-col gap-2 mt-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block pb-1 border-b border-[#10b981]/15 mb-1.5">
                              Gabarito e Justificativa
                            </span>
                            <span>
                              Correcta: <strong>{q.gabarito}</strong> —{" "}
                              {q.justification}
                            </span>
                          </div>

                          <div className="mt-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a5f3fc] block pb-1 border-b border-cyan-500/10 mb-1.5">
                              Critérios de Correção (Rubricas)
                            </span>
                            <span
                              className="font-mono text-[10px]"
                              style={{ color: "#a5f3fc" }}
                            >
                              {q.rubric}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* TAB 3: Student Portfolio Evidence Storage */}
        {subTab === "evidence" && (
          <motion.div
            key="evidence"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6 animate-fade-in"
          >
            {/* Registers and library details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: List of items */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
                  <h3 className="text-lg font-bold text-white mb-1">
                    Repositório de Evidências Pedagógicas
                  </h3>
                  <p className="text-xs text-slate-300">
                    Portfólios de atividades, relatórios analíticos anexados sob
                    competência.
                  </p>

                  <div className="flex flex-col gap-3 mt-4">
                    {evidences.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-white">
                            {ev.student}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Turma: {ev.class} | Competência:{" "}
                            <span className="text-[#10b981] font-bold">
                              {ev.competency}
                            </span>
                          </span>
                          <span className="text-[11px] text-[#a5f3fc] font-mono flex items-center gap-1 mt-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            {ev.file}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right flex flex-col items-end">
                            <span className="text-[10px] font-mono text-slate-500">
                              {ev.date}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-300">
                              Nota: {ev.grade}/10
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setEvidences(
                                evidences.filter((e) => e.id !== ev.id),
                              )
                            }
                            className="p-1.5 text-rose-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Register new Evidence offline */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0f172a] border border-slate-800 h-fit">
                <h3 className="text-base font-bold text-white mb-0.5">
                  Registrar Evidência
                </h3>
                <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
                  Associe uma entrega mesmo sem acesso do aluno.
                </p>

                <form
                  onSubmit={handleAddEvidence}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-slate-400 font-bold uppercase">
                      Nome do Estudante
                    </label>
                    <input
                      type="text"
                      required
                      value={newEvidenceStudent}
                      onChange={(e) => setNewEvidenceStudent(e.target.value)}
                      placeholder="Ex: Ana Silva"
                      className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-slate-400 font-bold uppercase">
                      Competência Relacionada
                    </label>
                    <select
                      value={newEvidenceComp}
                      onChange={(e) => setNewEvidenceComp(e.target.value)}
                      className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                    >
                      <option value="COMP-01">
                        COMP-01 (Dados primitivos, Tipos)
                      </option>
                      <option value="COMP-02">
                        COMP-02 (Seleção, Loops, Laços)
                      </option>
                      <option value="COMP-03">
                        COMP-03 (Arranjos, Matrizes)
                      </option>
                      <option value="COMP-04">
                        COMP-04 (Funções, Parâmetros)
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-slate-400 font-bold uppercase">
                        Nota dita
                      </label>
                      <input
                        type="text"
                        value={newEvidenceGrade}
                        onChange={(e) => setNewEvidenceGrade(e.target.value)}
                        className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-slate-400 font-bold uppercase">
                        Nome do Arquivo
                      </label>
                      <input
                        type="text"
                        value={newEvidenceFile}
                        onChange={(e) => setNewEvidenceFile(e.target.value)}
                        className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono"
                        placeholder="projeto.pdf"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center mt-1 flex flex-col items-center cursor-pointer hover:bg-slate-900/30">
                    <Upload className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[10px] text-slate-400">
                      Anexar documento físico da entrega
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-955 font-bold font-mono text-xs py-2.5 rounded-xl cursor-pointer shadow-lg shadow-emerald-500/5 uppercase"
                  >
                    Salvar Evidência
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: Result Analytics & Diagnostic */}
        {subTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Média da Turma
                </span>
                <span className="text-4xl font-extrabold text-white block mt-1">
                  {classAverage}
                </span>
                <p className="text-[10px] text-slate-400 mt-2">
                  Média ponderada baseada nos critérios de todas as avaliações
                  publicadas.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Competência Pedagógica Crítica
                </span>
                <span className="text-2xl font-extrabold text-rose-400 block mt-1.5">
                  {criticalCompCode}
                </span>
                <p className="text-[10px] text-slate-400 mt-2">
                  Unidade curricular apresentando menor índice de fluência de
                  código.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Alunos Sob Alerta de Baixo Rendimento
                </span>
                <span className="text-4xl font-extrabold text-amber-500 block mt-1">
                  {recoveryAdvisedNum}
                </span>
                <p className="text-[10px] text-slate-400 mt-2">
                  Recomendação automática do Copiloto IA para iniciar Trilha de
                  Recuperação.
                </p>
              </div>
            </div>

            {/* Módulo 9: Automatic Diagnosis text with suggestion using local state */}
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-emerald-400" />
                Diagnóstico de Aprovação IA - Relatório de Intervenção Auto
              </h3>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed font-semibold">
                <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-1 uppercase">
                  Avaliação de Forças e Vulnerabilidades da Turma
                </span>
                Seu cronograma apresenta <strong>68% de conclusão</strong> do
                planejado acadêmico do SENAI para esta UC. A análise
                automatizada de logs indica que <strong>78% dos alunos</strong>{" "}
                conseguiram fluência em laços iterativos indexados, mas{" "}
                <strong>35% apresentaram problemas graves</strong> com escopo de
                variáveis dentro de laços aninhados (competência{" "}
                {criticalCompCode}).
                <div className="mt-3 text-slate-400">
                  <strong className="text-amber-400 block mb-1">
                    Recomendação de Intervenção Pedagógica:
                  </strong>
                  Recomendamos disparar uma lista de fixação complementar sobre
                  referências antes de avançar para 'Funções Modulares' de forma
                  a restabelecer a média geral de aproveitamentos de notas.
                </div>
              </div>

              {/* Recovery trigger */}
              <div className="flex justify-end mt-1">
                <button
                  disabled
                  className="px-4 py-2 bg-slate-800 text-slate-500 text-xs font-mono font-bold rounded-xl border border-slate-700/50 opacity-60 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500/50" />
                  Plano de Recuperação Paralela Sugerido
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

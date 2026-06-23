import React, { useState, useEffect } from "react";
import {
  Award,
  Search,
  Users,
  LineChart as LineChartIcon,
  TrendingUp,
  AlertTriangle,
  FileText,
  Plus,
  BrainCircuit,
  Trophy,
  BarChart2,
  Settings,
  Activity,
  Calendar,
  Download,
  Sparkles,
  Clock,
  Trash2,
  Edit3,
  Filter,
  CheckCircle,
  CheckCircle2,
  XOctagon,
  X,
  FileSpreadsheet,
  Grid,
  Sparkle,
  GraduationCap,
  Volume2,
  Bookmark,
  Share2,
  RefreshCw,
  Bell,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../utils/api";
import { apiUrl, safeJsonResponse } from "../config/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface Competency {
  id: string;
  code: string;
  name: string;
  description: string;
  area: string;
  curricular_unit: string;
  level: string;
  prerequisites: string;
  recommended_hours: number;
}

interface Alert {
  id: string;
  student_name: string;
  class_name: string;
  competency_code: string;
  competency_name: string;
  type_alert: string;
  details: string;
  checked: boolean;
  created_at: string;
}

interface Report {
  id: string;
  type_report: string;
  format: string;
  student_name?: string;
  class_name?: string;
  content: string;
  created_at?: string;
}

export default function CompetenciesManagerView({ featureFlags }: any) {
  // Navigation & Sub-Tabs state
  const [activeTab, setActiveTab] = useState<string>("observatory"); // observatory, catalog, heatmap, coverage, alerts, reports
  const [selectedClass, setSelectedClass] = useState<string>(
    "Turma de Desenvolvimento Web 1A",
  );
  const [classesList] = useState<string[]>([
    "Turma de Desenvolvimento Web 1A",
    "Turma de Banco de Dados Avançado 2B",
    "Turma de Mobile Integrado 1C",
  ]);

  // Catalog CRUD States
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingComp, setEditingComp] = useState<Competency | null>(null);
  const [newComp, setNewComp] = useState<Partial<Competency>>({
    code: "",
    name: "",
    description: "",
    area: "Tecnologia",
    curricular_unit: "Lógica de Programação",
    level: "Básico",
    prerequisites: "Nenhum",
    recommended_hours: 20,
  });

  // Coverage Stats State
  const [coverageData, setCoverageData] = useState<any>({
    concluded: 3,
    inProgress: 1,
    notWorked: 1,
    coverageSemestre: 80,
    coverageTurma: 60,
    coverageDisciplina: 70,
  });

  // Heatmap Matrix states
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    student: string;
    competency: string;
    score: number;
  } | null>(null);

  // Observatory aggregated statuses
  const [observatoryData, setObservatoryData] = useState<any>({
    criticalComps: [],
    topComps: [],
    studentsAtRisk: [],
    allComps: [],
    allStudents: [],
    alertsCount: 0,
    classroomAverage: 75,
  });

  // Alerts Feed states
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertFilter, setAlertFilter] = useState<string>("all"); // all, active, archived

  // Reports states
  const [reports, setReports] = useState<Report[]>([]);
  const [reportType, setReportType] = useState<string>("individual"); // individual, classroom, semester
  const [reportTargetStudent, setReportTargetStudent] =
    useState<string>("Carlos Souza");
  const [reportTargetClass, setReportTargetClass] = useState<string>(
    "Turma de Desenvolvimento Web 1A",
  );
  const [reportDocPreview, setReportDocPreview] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // IA recommendations interaction
  const [aiRecData, setAiRecData] = useState<any | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [recommendationTarget, setRecommendationTarget] = useState<{
    student?: string;
    competency?: string;
  }>({});

  // Timeline Evolution data
  const [evolutionData, setEvolutionData] = useState<any[]>([]);

  // Page Load
  useEffect(() => {
    fetchCompetencies();
    fetchCoverage();
    fetchHeatmap();
    fetchObservatory();
    fetchAlerts();
    fetchReports();
    fetchEvolution();
  }, [selectedClass]);

  // Fetch Services
  const fetchCompetencies = async () => {
    try {
      const res = await fetch(apiUrl("/api/competencies"));
      if (res.ok) {
        setCompetencies(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCoverage = async () => {
    try {
      const res = await fetch(
        apiUrl(`/api/competencies/coverage?class_name=${encodeURIComponent(selectedClass)}`),
      );
      if (res.ok) {
        setCoverageData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await fetch(
        apiUrl(`/api/competencies/heatmap?class_name=${encodeURIComponent(selectedClass)}`),
      );
      if (res.ok) {
        setHeatmapData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchObservatory = async () => {
    try {
      const res = await fetch(
        apiUrl(`/api/competencies/observatory?class_name=${encodeURIComponent(selectedClass)}`),
      );
      if (res.ok) {
        setObservatoryData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(
        apiUrl(`/api/competencies/alerts?class_name=${encodeURIComponent(selectedClass)}`),
      );
      if (res.ok) {
        setAlerts(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(apiUrl("/api/competencies/reports"));
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEvolution = async () => {
    try {
      const res = await fetch(
        apiUrl(`/api/competencies/evolution?class_name=${encodeURIComponent(selectedClass)}`),
      );
      if (res.ok) {
        setEvolutionData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CRUD events
  const handleSaveCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingComp || newComp;
    const url = editingComp
      ? apiUrl(`/api/competencies/${editingComp.id}`)
      : apiUrl("/api/competencies");
    const method = editingComp ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingComp(null);
        setNewComp({
          code: "",
          name: "",
          description: "",
          area: "Tecnologia",
          curricular_unit: "Lógica de Programação",
          level: "Básico",
          prerequisites: "Nenhum",
          recommended_hours: 20,
        });
        fetchCompetencies();
        fetchObservatory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCompetency = async (id: string) => {
    if (
      !window.confirm(
        "Deseja realmente excluir esta competência? Isso removerá as amarrações do catálogo.",
      )
    )
      return;
    try {
      const res = await fetch(apiUrl(`/api/competencies/${id}`), { method: "DELETE" });
      if (res.ok) {
        fetchCompetencies();
        fetchObservatory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Alert Dismiss implementation
  const handleToggleAlert = async (id: string, currentlyChecked: boolean) => {
    try {
      const res = await fetch(apiUrl("/api/competencies/alerts/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, checked: !currentlyChecked }),
      });
      if (res.ok) {
        fetchAlerts();
        fetchObservatory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Gemini-powered AI recommendations
  const handleTriggerRecommendations = async (
    studentName?: string,
    competencyName?: string,
  ) => {
    setLoadingAI(true);
    setAiRecData(null);
    setRecommendationTarget({
      student: studentName,
      competency: competencyName,
    });

    const criticalList = competencyName
      ? [competencyName]
      : observatoryData.criticalComps.map((c: any) => c.name);

    try {
      const res = await fetch(apiUrl("/api/competencies/recommend"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName || null,
          class_name: selectedClass,
          critical_competencies: criticalList,
        }),
      });
      if (res.ok) {
        setAiRecData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingAI(false);
  };

  // Report Generator action
  const handleGenerateReportDoc = async () => {
    setGeneratingReport(true);
    setReportDocPreview(null);

    // Heuristically construct text report with rich formatting
    const isIndiv = reportType === "individual";
    const title = isIndiv
      ? `RELATÓRIO DE DESENVOLVIMENTO DE COMPETÊNCIAS - INDIVIDUAL`
      : `DASHBOARD DE COBERTURA PEDAGÓGICA - ${reportTargetClass.toUpperCase()}`;

    const dateStr = new Date().toLocaleDateString("pt-BR");

    let textDoc = `========================================================
${title}
CodeCheck - Módulo de Gestão Pedagógica SENAI
========================================================
Data de Emissão: ${dateStr}
Unidade Curricular: Desenvolvimento de Sistemas Core
Filtro Aplicado: ${isIndiv ? `Aluno: ${reportTargetStudent}` : `Turma Inteira`}
--------------------------------------------------------

SÍNTESE ATUAL DO APROVEITAMENTO:
A média global estimada do grupo monitorado registra ${observatoryData.classroomAverage}% de rendimento.
Competências em conformidade (Média >= 70%): ${observatoryData.topComps.length} itens.
Competências sob intervenção recomendada (Média < 70%): ${observatoryData.criticalComps.length} itens.

ANÁLISE DETALHADA DAS LACUNAS CRÍTICAS:
${observatoryData.criticalComps.map((c: any) => `* [${c.code}] ${c.name} - Aproveitamento Médio: ${c.average_score}% (${c.level})`).join("\r\n")}

RECOMENDAÇÕES PEDAGÓGICAS DO CO-PILOTO IA:
1. Praticar laços de repetição aplicando técnicas de depuração manual.
2. Inserir monitorias síncronas com auxílio do Sandbox do CodeCheck.
3. Cadastrar novos simulados curtos com pesos equilibrados nas rubricas de competência.

--------------------------------------------------------
Documento Homologado Digitalmente por: Professor Orientador
Código Chave de Autenticação: CC-${Math.floor(Math.random() * 900000 + 100000)}
========================================================`;

    try {
      const res = await fetch(apiUrl("/api/competencies/reports"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_report: reportType,
          format: "PDF",
          student_name: isIndiv ? reportTargetStudent : undefined,
          class_name: reportTargetClass,
          content: textDoc,
        }),
      });

      if (res.ok) {
        setReportDocPreview(textDoc);
        fetchReports();
      }
    } catch (e) {
      console.error(e);
    }
    setGeneratingReport(false);
  };

  const downloadMockFile = (content: string, name: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${name}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85)
      return {
        bg: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20",
        text: "Excelente",
        border: "border-emerald-500",
      };
    if (score >= 70)
      return {
        bg: "bg-blue-950/40 text-blue-400 border-blue-500/20",
        text: "Regular",
        border: "border-blue-500",
      };
    if (score > 0)
      return {
        bg: "bg-amber-950/40 text-amber-500 border-amber-500/20",
        text: "Insuficiente",
        border: "border-amber-500",
      };
    return {
      bg: "bg-slate-900 text-slate-500 border-slate-800",
      text: "Não Trabalhado",
      border: "border-slate-800",
    };
  };

  // Filters catalog
  const filteredCompetencies = competencies.filter((c) => {
    const text = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(text) ||
      c.name.toLowerCase().includes(text) ||
      c.curricular_unit.toLowerCase().includes(text) ||
      c.level.toLowerCase().includes(text)
    );
  });

  return (
    <div className="flex flex-col gap-6 text-slate-100 max-w-7xl mx-auto w-full animate-fade-in p-1">
      {/* Top Banner & Title Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-950/50 rounded-2xl border border-indigo-500/30 text-indigo-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-950 text-indigo-400 px-2.5 py-0.5 rounded-full font-mono border border-indigo-800/50 font-medium">
                Fase 11
              </span>
              <span className="text-xs bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono border border-emerald-800/50 font-medium">
                Ativo
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display mt-1">
              Gestor de Competências & Observatório Pedagógico
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Visão unificada do catálogo de saberes, análises de conformidade e
              intervenções preventivas automáticas com IA.
            </p>
          </div>
        </div>

        {/* Toolbar selectors */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-400">
              SELECIONE A TURMA ALVO
            </span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 cursor-pointer"
            >
              {classesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub-navigation Controls */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-1.5">
        <button
          onClick={() => setActiveTab("observatory")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === "observatory"
              ? "bg-slate-800 text-white shadow-md border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Observatório Pedagógico
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === "catalog"
              ? "bg-slate-800 text-white shadow-md border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <Award className="w-4 h-4" />
          Catálogo / Matriz
        </button>
        <button
          onClick={() => setActiveTab("heatmap")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === "heatmap"
              ? "bg-slate-800 text-white shadow-md border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <Grid className="w-4 h-4" />
          Mapa de Calor
        </button>
        <button
          onClick={() => setActiveTab("coverage")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === "coverage"
              ? "bg-slate-800 text-white shadow-md border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Painel de Cobertura
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all relative ${
            activeTab === "alerts"
              ? "bg-slate-800 text-white shadow-md border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <Bell className="w-4 h-4" />
          Alertas Automatizados
          {observatoryData.alertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white ring-2 ring-slate-950">
              {observatoryData.alertsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === "reports"
              ? "bg-slate-800 text-white shadow-md border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <FileText className="w-4 h-4" />
          Relatórios & Certificação
        </button>
      </div>

      {/* Main Container switch */}
      <div className="flex flex-col gap-6 min-h-[500px]">
        {/* TAB 1: OBSERVATORIO PEDAGÓGICO */}
        {activeTab === "observatory" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Statistics column */}
            <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Média Global Turma
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mt-2 font-display">
                    {observatoryData.classroomAverage}%
                  </h3>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${observatoryData.classroomAverage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    +4.2% em relação ao trimestre anterior
                  </p>
                </div>

                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Lacunas Críticas
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mt-2 font-display">
                    {observatoryData.criticalComps.length}{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      competências
                    </span>
                  </h3>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (observatoryData.criticalComps.length / 5) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Nível crítico se estabelece abaixo de 70%
                  </p>
                </div>

                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Alunos sob Atenção
                    </span>
                    <Users className="w-4 h-4 text-rose-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mt-2 font-display">
                    {observatoryData.studentsAtRisk.length}{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      alunos
                    </span>
                  </h3>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{
                        width: `${(observatoryData.studentsAtRisk.length / 4) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Alunos com rendimento médio menor que 70%
                  </p>
                </div>
              </div>

              {/* Progress and Critical Areas lists */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                    <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
                    Saberes Críticos sob Intervenção Requerida
                  </h3>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 roundedborder border-amber-800/30">
                    PENDÊNCIAS PEDAGÓGICAS
                  </span>
                </div>

                {observatoryData.criticalComps.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-200">
                      Parabéns! Todas as competências registram média acima de
                      70% nesta turma.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {observatoryData.criticalComps.map((comp: any) => (
                      <div
                        key={comp.code}
                        className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-amber-950/30 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10 font-bold">
                              {comp.code}
                            </span>
                            <h4 className="text-xs font-semibold text-white">
                              {comp.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Unidade Curricular: {comp.curricular_unit} | Nível:{" "}
                            {comp.level}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block font-mono">
                              RENDIMENTO MÉDIO
                            </span>
                            <span className="text-xs font-bold text-amber-500 font-mono">
                              {comp.average_score}%
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleTriggerRecommendations(undefined, comp.name)
                            }
                            className="bg-indigo-900/60 hover:bg-indigo-800 text-[10px] font-mono px-3 py-1.5 rounded-lg text-indigo-200 border border-indigo-500/20 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                            Prevenir com IA
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top achievements of the class */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
                <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                  <Trophy className="w-4.5 h-4.5 text-yellow-500" />
                  Performance Excelente & Conformidades Dominadas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {observatoryData.topComps.map((comp: any) => (
                    <div
                      key={comp.code}
                      className="p-3 bg-slate-950/20 rounded-xl border border-slate-800/60 flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/30 px-1.5 py-0.2 rounded border border-emerald-500/10 mr-1.5">
                          {comp.code}
                        </span>
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {comp.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {comp.average_score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Alerts & Action column */}
            <div className="col-span-1 flex flex-col gap-6">
              {/* List of priority attention students */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
                <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Alunos com Alerta de Risco
                </h3>

                {observatoryData.studentsAtRisk.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Nenhum aluno registrando nível crítico de aproveitamento no
                    momento.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {observatoryData.studentsAtRisk.map((student: any) => (
                      <div
                        key={student.student_name}
                        className="p-3 bg-rose-950/10 border border-rose-500/10 rounded-xl flex items-center justify-between transition-all hover:bg-rose-950/20"
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-rose-200">
                            {student.student_name}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {student.registries} competências registradas
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-800/10">
                            {student.avg_score}%
                          </span>
                          <button
                            onClick={() =>
                              handleTriggerRecommendations(
                                student.student_name,
                                undefined,
                              )
                            }
                            title="Ver histórico de suporte e gerar intervenção IA"
                            className="p-1.5 bg-indigo-950 text-indigo-400 hover:text-indigo-200 rounded-lg border border-indigo-800/50 cursor-pointer"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action shortcuts / Quick reports */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3.5">
                <h3 className="text-xs font-bold font-mono text-slate-400 tracking-wider">
                  AÇÕES RÁPIDAS
                </h3>

                <button
                  onClick={() => {
                    setActiveTab("reports");
                    setReportType("classroom");
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center gap-3 text-left transition-all group"
                >
                  <div className="p-2 bg-indigo-950/50 text-indigo-400 rounded-lg group-hover:bg-indigo-950">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Relatório Consolidado
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Gerar parecer de competências do semestre
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("catalog");
                    setShowAddModal(true);
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center gap-3 text-left transition-all group"
                >
                  <div className="p-2 bg-emerald-950/50 text-emerald-400 rounded-lg group-hover:bg-emerald-950">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Adicionar Competência
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Criar novo saber e correlacionar na matriz
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("alerts");
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center gap-3 text-left transition-all group"
                >
                  <div className="p-2 bg-rose-950/50 text-rose-400 rounded-lg group-hover:bg-rose-950">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Painel de Alertas
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Acompanhar e resolver avisos preventivos
                    </p>
                  </div>
                </button>
              </div>

              {/* Historical audit preview */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    Log de Alterações da Matriz
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    AUDITORIA
                  </span>
                </div>
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  <div className="p-2 bg-slate-950/20 border border-slate-800/50 rounded-lg">
                    <p className="text-[10px] text-slate-300 font-medium">
                      Competência COMP-003 atualizada no catálogo
                    </p>
                    <span className="text-[8px] font-mono text-slate-500 mt-1 block">
                      Por: teacher_portal • Hoje
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950/20 border border-slate-800/50 rounded-lg">
                    <p className="text-[10px] text-slate-300 font-medium">
                      Nova atividade de repetições mapeada à COMP-003
                    </p>
                    <span className="text-[8px] font-mono text-slate-500 mt-1 block">
                      Por: teacher_portal • Ontem
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOGO / MATRIZ CRUD */}
        {activeTab === "catalog" && (
          <div className="flex flex-col gap-6">
            {/* Header filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/25 p-4 rounded-xl border border-slate-800/80">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Filtrar por código, nome, unidade curricular..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs pl-10 pr-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingComp(null);
                    setShowAddModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Saber
                </button>
              </div>
            </div>

            {/* List Table of competencies */}
            <div className="bg-slate-950/40 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 bg-slate-900/60 border-b border-slate-800">
                <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  Catálogo Nacional de Competências (CodeCheck Core)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/20 text-slate-400 text-[10px] font-mono uppercase">
                      <th className="p-4">Código</th>
                      <th className="p-4">Nome da Competência / Descrição</th>
                      <th className="p-4">Unidade Curricular</th>
                      <th className="p-4">Nível</th>
                      <th className="p-4">Cesta de Horas</th>
                      <th className="p-4">Pré-requisito</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredCompetencies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-slate-500"
                        >
                          Nenhuma competência cadastrada ou filtro não
                          correspondente.
                        </td>
                      </tr>
                    ) : (
                      filteredCompetencies.map((comp) => (
                        <tr
                          key={comp.id}
                          className="hover:bg-slate-900/20 transition-all"
                        >
                          <td className="p-4 font-mono font-bold text-indigo-400">
                            {comp.code}
                          </td>
                          <td className="p-4 max-w-sm">
                            <span className="font-semibold text-white block">
                              {comp.name}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block line-clamp-1">
                              {comp.description}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300">
                            {comp.curricular_unit}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                                comp.level === "Básico"
                                  ? "bg-slate-800 text-slate-300"
                                  : comp.level === "Intermediário"
                                    ? "bg-indigo-950 text-indigo-300"
                                    : "bg-emerald-950 text-emerald-300"
                              }`}
                            >
                              {comp.level}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-300">
                            {comp.recommended_hours}h t/p
                          </td>
                          <td className="p-4 text-slate-400 font-mono text-[10px]">
                            {comp.prerequisites || "Nenhum"}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingComp(comp);
                                  setShowAddModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                                title="Editar competência"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCompetency(comp.id)}
                                className="p-1.5 hover:bg-rose-950/40 rounded text-slate-400 hover:text-rose-400"
                                title="Excluir competência"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HEATMAP MATRIX */}
        {activeTab === "heatmap" && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                <Grid className="w-4.5 h-4.5 text-indigo-400" />
                Matriz de Calor de Cobertura de Saberes por Aluno
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Este controle faz o cruzamento bidirecional individual da turma
                sintonizada para identificar gargalos em tempo recorde.
              </p>

              {/* Matrix Layout */}
              <div className="mt-6 overflow-x-auto border border-slate-800/60 rounded-xl bg-slate-950/60 p-4">
                <div className="min-w-[600px] flex flex-col gap-3">
                  {/* Legend guide */}
                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 self-end mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-emerald-950/40 border border-emerald-500/20" />{" "}
                      Excelente (&gt;=85%)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-blue-950/40 border border-blue-500/20" />{" "}
                      Regular (&gt;=70%)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-amber-950/40 border border-amber-500/20" />{" "}
                      Crítico (&lt;70%)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800" />{" "}
                      Não Trabalhado
                    </div>
                  </div>

                  {heatmapData.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Povoando matriz...
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {/* Grid Header of Competencies */}
                      <div className="grid grid-cols-6 gap-1.5 items-center">
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          Aluno
                        </div>
                        {Array.from(
                          new Set(heatmapData.map((d) => d.competency_name)),
                        ).map((cName) => (
                          <div
                            key={cName}
                            className="text-[10px] font-mono font-bold text-slate-300 text-center truncate px-1"
                            title={cName}
                          >
                            {cName}
                          </div>
                        ))}
                      </div>

                      {/* Students rows */}
                      {Array.from(
                        new Set(heatmapData.map((d) => d.student_name)),
                      ).map((stName) => {
                        return (
                          <div
                            key={stName}
                            className="grid grid-cols-6 gap-1.5 items-center"
                          >
                            <div className="text-xs font-semibold text-white truncate pr-2">
                              {stName}
                            </div>
                            {Array.from(
                              new Set(
                                heatmapData.map((d) => d.competency_name),
                              ),
                            ).map((cName) => {
                              const match = heatmapData.find(
                                (d) =>
                                  d.student_name === stName &&
                                  d.competency_name === cName,
                              );
                              const score = match ? match.score : 0;
                              const colors = getScoreColor(score);

                              return (
                                <button
                                  key={cName}
                                  onClick={() =>
                                    setSelectedCell({
                                      student: stName,
                                      competency: cName,
                                      score,
                                    })
                                  }
                                  className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-[1.02] ${colors.bg}`}
                                >
                                  <span className="text-xs font-bold font-mono">
                                    {score > 0 ? `${score}%` : "-"}
                                  </span>
                                  <span className="text-[8px] font-mono opacity-80 mt-0.5">
                                    {colors.text}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Matrix click modal detail */}
            <AnimatePresence>
              {selectedCell && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-slate-900/60 p-6 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-800/30 font-medium">
                        DIAGNÓSTICO DA CÉLULA
                      </span>
                      <span className="text-xs text-slate-400">
                        Aluno:{" "}
                        <strong className="text-white">
                          {selectedCell.student}
                        </strong>
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1.5">
                      Saber focado: {selectedCell.competency}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Aproveitamento atual:{" "}
                      <span className="font-mono font-bold text-white">
                        {selectedCell.score}%
                      </span>
                      . Status pedagógico classificado como{" "}
                      <strong>{getScoreColor(selectedCell.score).text}</strong>.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        handleTriggerRecommendations(
                          selectedCell.student,
                          selectedCell.competency,
                        )
                      }
                      className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4 py-2.5 rounded-xl font-medium text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
                    >
                      <BrainCircuit className="w-4 h-4" />
                      Intervenção Especial IA
                    </button>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className="text-slate-400 hover:text-white text-xs px-3 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl"
                    >
                      Ignorar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 4: PAINEL DE COBERTURA */}
        {activeTab === "coverage" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Charts column */}
            <div className="flex flex-col gap-6">
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4.5 h-4.5 text-indigo-400" />
                  Divisão de Status Pedagógico de Saberes Trabalhados
                </h3>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Concluído",
                          valor: coverageData.concluded,
                          fill: "#10b981",
                        },
                        {
                          name: "Em Progresso",
                          valor: coverageData.inProgress,
                          fill: "#3b82f6",
                        },
                        {
                          name: "Não Trabalhado",
                          valor: coverageData.notWorked,
                          fill: "#64748b",
                        },
                      ]}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                        }}
                        labelStyle={{ fontStyle: "bold" }}
                      />
                      <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#64748b" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line graph of progress over time */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <LineChartIcon className="w-4.5 h-4.5 text-indigo-400" />
                  Evolução do Rendimento de Competências Turma
                </h3>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={evolutionData}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right side coverage specifications column */}
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Percentuais de Cobertura Curricular
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Indicadores chave calculados em tempo real do plano pedagógico
                  cadastrado no CodeCheck.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">
                      Cobertura Curricular de Competências
                    </span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {coverageData.coverageSemestre}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-500"
                      style={{ width: `${coverageData.coverageSemestre}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Proporção de competências que já foram associadas a pelo
                    menos uma atividade prática ou prova de avaliação do SENAI.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium font-semibold">
                      Média Geral Dominada (Saber &gt;= 70%)
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {coverageData.coverageTurma}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full duration-500 transition-all"
                      style={{ width: `${coverageData.coverageTurma}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Fração das competências em que a turma já atingiu e
                    estabilizou rendimento com notas equivalentes à conformidade
                    estipulada pelo MEC.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">
                      Proficiência Curricular da Disciplina
                    </span>
                    <span className="font-mono text-blue-400 font-bold">
                      {coverageData.coverageDisciplina}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${coverageData.coverageDisciplina}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Fator ponderado acumulado do desenvolvimento progressivo de
                    todas as competências mapeadas da grade técnica curricular.
                  </span>
                </div>
              </div>

              {/* Curricular recommendation notes */}
              <div className="mt-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex items-start gap-3">
                <BrainCircuit className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Recomendação Curricular do Sistema
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    A sua turma possui excelente aproveitamento acumulado em{" "}
                    <strong>Lógica de Programação Básica</strong>, mas necessita
                    de novos exercícios práticos com{" "}
                    <strong>Funções Combinadas e Recursividade</strong> para
                    ampliar a cobertura de proficiência curricular.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ALERTS MONITOR */}
        {activeTab === "alerts" && (
          <div className="flex flex-col gap-6">
            {/* Header filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/45 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAlertFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    alertFilter === "all"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Todos os alertas
                </button>
                <button
                  onClick={() => setAlertFilter("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    alertFilter === "active"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Não Resolvidos
                </button>
                <button
                  onClick={() => setAlertFilter("archived")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    alertFilter === "archived"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Arquivados / Homologados
                </button>
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                CodeCheck IA Monitor: escaneando submissões a cada 5 segundos.
              </div>
            </div>

            {/* List alerts */}
            <div className="flex flex-col gap-3">
              {alerts
                .filter((a) => {
                  if (alertFilter === "active") return !a.checked;
                  if (alertFilter === "archived") return a.checked;
                  return true;
                })
                .map((a) => (
                  <div
                    key={a.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      a.checked
                        ? "bg-slate-950/20 border-slate-900 opacity-70"
                        : "bg-rose-950/10 border-rose-500/10 hover:bg-slate-900/25"
                    }`}
                  >
                    <div className="flex-1 flex gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl border self-start ${
                          a.checked
                            ? "bg-slate-900 border-slate-800 text-slate-400"
                            : "bg-rose-950 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">
                            {a.student_name}
                          </span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-xs text-slate-300 font-medium">
                            {a.class_name}
                          </span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] font-mono bg-indigo-950/40 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/10 font-bold">
                            {a.competency_code}
                          </span>
                          <span className="text-xs text-slate-400 font-medium truncate">
                            {a.competency_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-200 mt-1 font-semibold">
                          {a.type_alert}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {a.details}
                        </p>
                        <span className="text-[9px] text-slate-500 mt-2 block font-mono">
                          Gerado em:{" "}
                          {new Date(a.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    {/* Operational controls for trigger intervention, snooze, check */}
                    <div className="flex items-center gap-2 border-l border-slate-800/80 pl-4">
                      {/* Intervene */}
                      <button
                        onClick={() =>
                          handleTriggerRecommendations(
                            a.student_name,
                            a.competency_name,
                          )
                        }
                        className="bg-indigo-900/50 hover:bg-indigo-800 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-mono border border-indigo-500/20 text-indigo-300 cursor-pointer transition-all"
                      >
                        Intervir IA
                      </button>

                      {/* Snooze */}
                      <button
                        onClick={() => {
                          alert("Alerta adiado por 48 horas.");
                        }}
                        className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-mono border border-slate-800 text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-all"
                      >
                        Sonecar
                      </button>

                      {/* Check off / Homologate */}
                      <button
                        onClick={() => handleToggleAlert(a.id, a.checked)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          a.checked
                            ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                            : "bg-emerald-950/25 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/50"
                        }`}
                        title={
                          a.checked
                            ? "Tornar não-resolvido"
                            : "Homologar Alerta"
                        }
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS & CERTIFICATION */}
        {activeTab === "reports" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Setup inputs column */}
            <div className="col-span-1 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
              <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-indigo-400" />
                Gerador de Pareceres de Competências
              </h3>
              <p className="text-xs text-slate-400">
                Emita documentos homologados de aproveitamento com parecer
                automático gerado pelo motor de inteligência artificial.
              </p>

              <div className="flex flex-col gap-3.5 mt-2">
                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-400 block mb-1">
                    TIPO DE PARECER
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full"
                  >
                    <option value="individual">
                      Parecer Técnico Individual por Aluno
                    </option>
                    <option value="classroom">
                      Dashboard Consolidado da Turma
                    </option>
                    <option value="semester">
                      Relatório Semestral das Unidades Curriculares
                    </option>
                  </select>
                </div>

                {reportType === "individual" && (
                  <div>
                    <label className="text-[10px] font-bold font-mono text-slate-400 block mb-1">
                      SELECIONE O ALUNO ALVO
                    </label>
                    <select
                      value={reportTargetStudent}
                      onChange={(e) => setReportTargetStudent(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full"
                    >
                      <option value="Carlos Souza">Carlos Souza</option>
                      <option value="Mariana Costa">Mariana Costa</option>
                      <option value="Ana Silva">Ana Silva</option>
                      <option value="Djalma Junior">Djalma Junior</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-400 block mb-1">
                    TURMA RELACIONADA
                  </label>
                  <select
                    value={reportTargetClass}
                    onChange={(e) => setReportTargetClass(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full"
                  >
                    {classesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerateReportDoc}
                  disabled={generatingReport}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 text-white font-medium text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
                >
                  {generatingReport ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Gerando parecer homologado...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      Emitir Documento de Certificação
                    </>
                  )}
                </button>
              </div>

              {/* Historical records of emitted reports */}
              <div className="mt-4 border-t border-slate-800 pt-4 flex flex-col gap-2">
                <h4 className="text-[11px] font-bold font-mono text-slate-400 tracking-wider">
                  ÚLTIMOS PARECERES EXPEDIDOS
                </h4>
                {reports.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">
                    Nenhum parecer exportado recentemente no banco.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {reports.map((rep: any) => (
                      <div
                        key={rep.id}
                        className="p-2 bg-slate-950/30 rounded border border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="truncate pr-2">
                          <span className="text-[10px] text-slate-200 block truncate font-medium">
                            Parecer: {rep.type_report}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono truncate">
                            {rep.student_name
                              ? `Aluno: ${rep.student_name}`
                              : `Turma: ${rep.class_name}`}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            downloadMockFile(rep.content, `parecer-${rep.id}`)
                          }
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                          title="Baixar Txt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right preview column */}
            <div className="col-span-1 lg:col-span-2 bg-slate-950/60 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-slate-400 tracking-wider">
                  PREVISÃO DO PARECER PARALELO DO ALUNO
                </h3>
                {reportDocPreview && (
                  <button
                    onClick={() =>
                      downloadMockFile(
                        reportDocPreview,
                        `parecer_homologado_${reportType}`,
                      )
                    }
                    className="bg-indigo-900/50 hover:bg-indigo-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-indigo-200 border border-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Parecer
                  </button>
                )}
              </div>

              {!reportDocPreview ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-900/10 rounded-xl border border-dashed border-slate-850">
                  <FileText className="w-12 h-12 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-300">
                    Nenhum parecer ativo na visualização.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                    Configure as opções no painel lateral e toque em "Emitir
                    Documento de Certificação" para visualizar e assinar
                    digitalmente o parecer.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre leading-relaxed shadow-inner max-h-[350px]">
                  {reportDocPreview}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL IA INTERVENTIONS - GEMINI RESULTS RENDER */}
      <AnimatePresence>
        {loadingAI && (
          <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-900 p-8 rounded-2xl border border-indigo-500/30 max-w-sm w-full text-center flex flex-col items-center gap-3">
              <Sparkle className="w-8 h-8 text-indigo-400 animate-spin" />
              <h3 className="text-sm font-semibold text-white">
                Analisando dados do CodeCheck...
              </h3>
              <p className="text-xs text-slate-400">
                Consultando portfólios no banco de dados e gerando pareceres
                técnicos com IA para prevenir evasão pedagógica.
              </p>
            </div>
          </div>
        )}

        {aiRecData && (
          <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col my-8"
            >
              {/* Header */}
              <div className="p-5 bg-indigo-950/30 border-b border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Diretriz Pedagógica de Intervenção com IA
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Foco:{" "}
                      {recommendationTarget.student
                        ? `Aluno: ${recommendationTarget.student}`
                        : `Turma: ${selectedClass}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAiRecData(null)}
                  className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-5 max-h-[450px] overflow-y-auto">
                {/* Summary */}
                <div className="p-4 bg-indigo-950/25 border border-indigo-500/10 rounded-xl">
                  <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    PARECER CONSOLIDADO DO CO-PILOTO
                  </h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {aiRecData.summary}
                  </p>
                </div>

                {/* Exercises Recommended */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-bold font-mono text-slate-400 tracking-wider">
                    EXERCÍCIOS DE APOIO SUGERIDOS
                  </h4>
                  <div className="flex flex-col gap-2.5">
                    {aiRecData.activities?.map((act: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950/40 rounded-xl border border-slate-800"
                      >
                        <span className="text-[10px] font-bold text-white block">
                          {act.title || `Exercício Prático #${idx + 1}`}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {act.details || act.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lessons */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-bold font-mono text-slate-400 tracking-wider">
                    TÓPICOS DE REVISÃO CONCEITUAL
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
                    {aiRecData.revision_lessons?.map(
                      (ls: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">
                          {ls}
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* Learning Trajectory */}
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-300 uppercase">
                      Trilha Autônoma de Estudos
                    </h5>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {aiRecData.learning_paths}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer action */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => {
                    alert(
                      "Intervenção integrada com sucesso ao perfil de monitoria do aluno!",
                    );
                    setAiRecData(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4 py-2 rounded-xl text-white font-medium cursor-pointer"
                >
                  Homologar Intervenção
                </button>
                <button
                  onClick={() => setAiRecData(null)}
                  className="text-xs hover:bg-slate-800 px-3 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL CATALOG CRUD (ADD/EDIT) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  {editingComp
                    ? `Editar Competência: ${editingComp.code}`
                    : "Cadastrar Sabedoria Curricular"}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleSaveCompetency}
                className="p-5 flex flex-col gap-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold font-mono text-slate-450 block mb-1">
                      CÓDIGO ÚNICO
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: COMP-006"
                      value={editingComp ? editingComp.code : newComp.code}
                      onChange={(e) =>
                        editingComp
                          ? setEditingComp({
                              ...editingComp,
                              code: e.target.value,
                            })
                          : setNewComp({ ...newComp, code: e.target.value })
                      }
                      className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold font-mono text-slate-450 block mb-1 font-sans">
                      NÍVEL DE PROFICIÊNCIA
                    </label>
                    <select
                      value={editingComp ? editingComp.level : newComp.level}
                      onChange={(e) =>
                        editingComp
                          ? setEditingComp({
                              ...editingComp,
                              level: e.target.value,
                            })
                          : setNewComp({ ...newComp, level: e.target.value })
                      }
                      className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full"
                    >
                      <option value="Básico">Básico</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-450 block mb-1">
                    NOME DA COMPETÊNCIA
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Recursividade e Decomposição Complexa"
                    value={editingComp ? editingComp.name : newComp.name}
                    onChange={(e) =>
                      editingComp
                        ? setEditingComp({
                            ...editingComp,
                            name: e.target.value,
                          })
                        : setNewComp({ ...newComp, name: e.target.value })
                    }
                    className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-450 block mb-1">
                    UNIDADE CURRICULAR (DISCIPLINA)
                  </label>
                  <input
                    type="text"
                    required
                    value={
                      editingComp
                        ? editingComp.curricular_unit
                        : newComp.curricular_unit
                    }
                    onChange={(e) =>
                      editingComp
                        ? setEditingComp({
                            ...editingComp,
                            curricular_unit: e.target.value,
                          })
                        : setNewComp({
                            ...newComp,
                            curricular_unit: e.target.value,
                          })
                    }
                    className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-450 block mb-1">
                    DESCRIÇÃO DIDÁTICA DO COMPORTAMENTO ESPERADO
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Escreva quais capacidades operacionais e pragmáticas o estudante desenvolve..."
                    value={
                      editingComp
                        ? editingComp.description
                        : newComp.description
                    }
                    onChange={(e) =>
                      editingComp
                        ? setEditingComp({
                            ...editingComp,
                            description: e.target.value,
                          })
                        : setNewComp({
                            ...newComp,
                            description: e.target.value,
                          })
                    }
                    className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full resize-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold font-mono text-slate-450 block mb-1">
                      CARGA HORÁRIA (H)
                    </label>
                    <input
                      type="number"
                      value={
                        editingComp
                          ? editingComp.recommended_hours
                          : newComp.recommended_hours
                      }
                      onChange={(e) =>
                        editingComp
                          ? setEditingComp({
                              ...editingComp,
                              recommended_hours: parseInt(e.target.value) || 10,
                            })
                          : setNewComp({
                              ...newComp,
                              recommended_hours: parseInt(e.target.value) || 10,
                            })
                      }
                      className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold font-mono text-slate-450 block mb-1">
                      PRÉ-REQUISITO
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: COMP-001"
                      value={
                        editingComp
                          ? editingComp.prerequisites
                          : newComp.prerequisites
                      }
                      onChange={(e) =>
                        editingComp
                          ? setEditingComp({
                              ...editingComp,
                              prerequisites: e.target.value,
                            })
                          : setNewComp({
                              ...newComp,
                              prerequisites: e.target.value,
                            })
                      }
                      className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none w-full font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4 py-2 rounded-xl text-white font-medium cursor-pointer"
                  >
                    Salvar na Matriz
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-xs hover:bg-slate-800 px-3 py-2 text-slate-400 hover:text-white rounded-xl"
                  >
                    Retornar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

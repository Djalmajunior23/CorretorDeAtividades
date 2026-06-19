import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Terminal,
  Award,
  AlertTriangle,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  RefreshCw,
  Bell,
  ChevronRight,
  BarChart3,
  ShieldCheck,
  HeartCrack,
  Cpu,
  Bookmark
} from "lucide-react";
import { toast } from "sonner";

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    total_classes: 0,
    total_students: 0,
    total_activities: 0,
    total_corrections: 0,
    avg_score: 0,
    recent_corrections: [],
    needy_students: [],
    recent_reports: [],
    status_ia: "Offline",
    status_ocr: "Operacional",
    status_sandbox: "Operacional"
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/dashboard/teacher");
      if (resp.ok) {
        const payload = await resp.json();
        setData(payload);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao sincronizar informações do cockpit.");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto flex flex-col gap-8 text-slate-100"
    >
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
            SISTEMA INTEGRADO DE PRODUTIVIDADE DOCENTE
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display mt-1">
            Cockpit de Gestão e Comando
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitore estatísticas de turmas, progresso de notas, correções recentes e pareceres de acompanhamento.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850 text-xs font-mono font-bold text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`}
            />
            Sincronizar Cockpit
          </button>

          <div className="flex items-center gap-2 bg-[#10b981]/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              PROFESSOR PORTAL ATIVO
            </span>
          </div>
        </div>
      </div>

      {/* Grid of operational summaries */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Classes Count */}
        <div
          onClick={() => onNavigate("turmas")}
          className="group rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/10">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full uppercase">
              Turmas
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white leading-none tracking-tight">
              {data.total_classes}
            </span>
            <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide font-mono">
              Turmas Cadastradas
            </h4>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Total de grupos e disciplinas vinculadas para acompanhamento.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold font-mono mt-4 opacity-0 group-hover:opacity-100 transition-all">
            Ver Turmas
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Total Students */}
        <div
          onClick={() => onNavigate("students")}
          className="group rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase">
              Alunos
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white leading-none tracking-tight">
              {data.total_students}
            </span>
            <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide font-mono">
              Estudantes Ativos
            </h4>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Estudantes vinculados com submissões ativas no corretor.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold font-mono mt-4 opacity-0 group-hover:opacity-100 transition-all">
            Gerenciar Alunos
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Total Activities */}
        <div
          onClick={() => onNavigate("atividades")}
          className="group rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-450 border border-emerald-500/10">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase">
              Projetos
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white leading-none tracking-tight">
              {data.total_activities}
            </span>
            <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide font-mono">
              Atividades Práticas
            </h4>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Coleção de problemas e casos de testes lógicos cadastrados.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono mt-4 opacity-0 group-hover:opacity-100 transition-all">
            Ir para Atividades
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Corrections count & average */}
        <div
          onClick={() => onNavigate("corrector")}
          className="group rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase">
              Média {data.avg_score}%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white leading-none tracking-tight">
              {data.total_corrections}
            </span>
            <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide font-mono">
              Correções Concluídas
            </h4>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Exames e envios corrigidos pela banca integradora de códigos.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold font-mono mt-4 opacity-0 group-hover:opacity-100 transition-all">
            Ver Área de Correção
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Row: Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Recent Active Corrections & Health statuses */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Recent corrections table */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider text-emerald-400">
                  Correções Executadas Recentemente
                </h3>
                <p className="text-xs text-slate-400">
                  Acompanhamento de notas recentes enviadas ao prontuário do aluno.
                </p>
              </div>
              <button
                onClick={() => onNavigate("corrector")}
                className="text-xs font-mono font-bold text-emerald-550 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Nova Correção
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {data.recent_corrections && data.recent_corrections.length > 0 ? (
                data.recent_corrections.map((cls: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-white">
                        {cls.student_name || "Estudante Geral"}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-500/10 uppercase">
                          {cls.language || "Código"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {cls.activity_title || "Exercício Prático"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
                          Nota Avaliada
                        </span>
                        <span className={`text-xs font-mono font-bold ${cls.score >= 70 ? 'text-emerald-450' : 'text-rose-400'}`}>
                          {cls.score} / 100
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
                          Turma Vinculada
                        </span>
                        <span className="text-xs text-slate-300 font-semibold max-w-[120px] truncate">
                          {cls.class_name || "Geral"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-600 font-mono">
                  Nenhuma correção recente registrada.
                </div>
              )}
            </div>
          </div>

          {/* System status tools */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-1 font-mono uppercase tracking-wider text-emerald-400">
              Status Tecnológico das Ferramentas
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Verifique a integridade e latência dos analisadores de OCR, Sandbox de compilação e IA de suporte.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold font-mono">Motor de IA</span>
                    <h5 className="text-xs font-bold text-slate-200 mt-0.5">Gemini 1.5 Flash</h5>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${data.status_ia === "Operacional" ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10" : "text-amber-400 bg-amber-500/5 border border-amber-500/10"}`}>
                  {data.status_ia || "Offline"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold font-mono">Análise de OCR</span>
                    <h5 className="text-xs font-bold text-slate-200 mt-0.5">Visão Computacional</h5>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/5 border border-emerald-500/10">
                  {data.status_ocr}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold font-mono">Secure Sandbox</span>
                    <h5 className="text-xs font-bold text-slate-200 mt-0.5">Juiz de Compilação</h5>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/5 border border-emerald-500/10">
                  {data.status_sandbox}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Needy Students & Recent Reports generated */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Needy students list */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <HeartCrack className="w-4.5 h-4.5" />
              Estudantes Críticos (Apoio)
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Alunos com rendimento de código abaixo de 60% que exigem pareceres de intervenção.
            </p>

            <div className="flex flex-col gap-3">
              {data.needy_students && data.needy_students.length > 0 ? (
                data.needy_students.map((std: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{std.name}</h4>
                      <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">{std.class_name || "Geral"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold text-rose-450 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                        {std.average_score}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-[11px] border border-dashed border-slate-800 rounded-xl text-slate-500">
                  Todos os alunos estão operando acima da linha crítica de rendimento.
                </div>
              )}
            </div>
          </div>

          {/* Recent Reports list */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex-1">
            <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase tracking-wider text-cyan-405 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-cyan-400" />
              Pareceres Elaborados (Recentes)
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Últimos pareceres pedagógicos e fechamentos emitidos pelo Cockpit.
            </p>

            <div className="flex flex-col gap-3">
              {data.recent_reports && data.recent_reports.length > 0 ? (
                data.recent_reports.map((rep: any) => (
                  <div
                    key={rep.id}
                    onClick={() => onNavigate("reports")}
                    className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-all"
                  >
                    <div className="max-w-[70%]">
                      <h5 className="text-[11px] font-bold text-slate-200 truncate">{rep.title}</h5>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">
                        {rep.type === "student_summary" ? "Individual" : "Coletivo"}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(rep.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-[11px] border border-dashed border-slate-800 rounded-xl text-slate-500">
                  Nenhum relatório foi consolidado recentemente.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

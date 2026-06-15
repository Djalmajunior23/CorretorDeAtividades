import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  ChevronRight,
  FileText,
  Download,
  Trash2,
  Archive,
  RefreshCw,
  LayoutGrid,
  Zap,
  BrainCircuit,
  ClipboardList,
  Target,
  FlaskConical,
  Database,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PedagogicalTrack, InterventionPlan } from "../types";

export default function PedagogicalTracksView() {
  const [tracks, setTracks] = useState<PedagogicalTrack[]>([]);
  const [plans, setPlans] = useState<InterventionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"tracks" | "plans">("tracks");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentClass, setCurrentClass] = useState("Turma A - Engenharia");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tracksRes, plansRes] = await Promise.all([
        fetch("/api/pedagogical-tracks"),
        fetch("/api/intervention-plans"),
      ]);
      setTracks(await tracksRes.json());
      setPlans(await plansRes.json());
    } catch (e) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const generateTrackIA = async (type: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch(
        `/api/pedagogical-tracks/generate/class/${encodeURIComponent(currentClass)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Trilha gerada com sucesso!");
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      toast.error("Erro ao gerar trilha com IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = async (id: string) => {
    window.open(`/api/pedagogical-tracks/${id}/export/pdf`, "_blank");
  };

  const deleteTrack = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta trilha?")) return;
    try {
      await fetch(`/api/pedagogical-tracks/${id}`, { method: "DELETE" });
      toast.success("Trilha excluída.");
      fetchData();
    } catch (e) {
      toast.error("Erro ao excluir.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-950 text-slate-200">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-500" />
            Trilhas e Intervenções
          </h1>
          <p className="text-slate-400 mt-2">
            Apoio pedagógico baseado em Learning Analytics e IA
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveView("tracks")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === "tracks"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Trilhas Pedagógicas
          </button>
          <button
            onClick={() => setActiveView("plans")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === "plans"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Planos de Intervenção
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Controls */}
        <div className="lg:w-64 space-y-6">
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 space-y-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Filtros
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full bg-slate-950 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                />
              </div>
              <select
                value={currentClass}
                onChange={(e) => setCurrentClass(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50"
              >
                <option>Turma A - Engenharia</option>
                <option>Turma B - Computação</option>
                <option>Turma C - Matemática</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Ações com IA
              </span>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => generateTrackIA("reforço")}
                disabled={isGenerating}
                className="w-full flex items-center justify-between px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-sm text-blue-100 transition-all font-medium disabled:opacity-50"
              >
                <span>Gerar Trilha de Reforço</span>
                <BrainCircuit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => generateTrackIA("recuperação")}
                disabled={isGenerating}
                className="w-full flex items-center justify-between px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-sm text-indigo-100 transition-all font-medium disabled:opacity-50"
              >
                <span>Gerar Trilha de Recuperação</span>
                <Target className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => generateTrackIA("aprofundamento")}
                disabled={isGenerating}
                className="w-full flex items-center justify-between px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-sm text-emerald-100 transition-all font-medium disabled:opacity-50"
              >
                <span>Gerar Aprofundamento</span>
                <Zap className="w-3.5 h-3.5" />
              </button>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-blue-400 mt-2 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Gerando recomendações...
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 border border-white/5 bg-slate-900/20 rounded-2xl">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-slate-400">Carregando planos e trilhas...</p>
            </div>
          ) : activeView === "tracks" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tracks.length === 0 ? (
                <div className="col-span-full p-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500">
                    Nenhuma trilha pedagógica ativa no momento.
                  </p>
                  <button className="mt-4 text-blue-500 hover:underline text-sm">
                    Criar primeira trilha
                  </button>
                </div>
              ) : (
                tracks.map((track) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/40 border border-white/10 rounded-xl p-5 hover:bg-slate-900/60 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${
                          track.type === "recuperação"
                            ? "bg-red-500/20 text-red-400"
                            : track.type === "reforço"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {track.type}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => exportPDF(track.id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded"
                          title="Exportar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTrack(track.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
                      {track.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                      {track.diagnosis}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-2.5 bg-slate-950/50 rounded-lg border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> Objetivos
                        </p>
                        <p className="text-xs text-slate-300 font-medium">
                          {track.learning_objectives?.length || 0} definidos
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-950/50 rounded-lg border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <History className="w-3 h-3" /> Duração
                        </p>
                        <p className="text-xs text-slate-300 font-medium">
                          {track.estimated_duration || "Indefinida"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${track.status === "active" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-amber-500 animate-pulse"}`}
                        ></span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          {track.status}
                        </span>
                      </div>
                      <button className="flex items-center gap-1 font-bold text-blue-500 hover:text-blue-400 text-xs transition-all tracking-wider uppercase group-hover:translate-x-1">
                        Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {plans.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-2xl bg-slate-900/20">
                  <Target className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500">
                    Ainda não há planos de intervenção para esta turma.
                  </p>
                </div>
              ) : (
                plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-slate-900/40 border border-white/5 rounded-xl p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-900/60 transition-all border-l-4 border-l-blue-500"
                  >
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">
                          {plan.title}
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full">
                          Intervenção de IA
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                        {plan.diagnosis}
                      </p>
                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span>
                            Ações prioritárias:{" "}
                            {(plan.actions as any)?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>
                            Critérios de sucesso:{" "}
                            {plan.success_criteria?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                      <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/10">
                        <Eye className="w-4 h-4" /> Detalhes
                      </button>
                      <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold transition-all">
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <path
      className={className}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

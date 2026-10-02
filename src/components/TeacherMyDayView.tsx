import React, { useState } from "react";
import { 
  Sun, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  BookOpen, 
  ArrowRight, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Users, 
  FileText,
  Star,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { TeacherDailyHubService, DailyHubOverview } from "../services/teacherDailyHubService";

interface TeacherMyDayViewProps {
  onNavigate?: (tabId: string, params?: any) => void;
}

export default function TeacherMyDayView({ onNavigate = () => {} }: TeacherMyDayViewProps) {
  const [overview] = useState<DailyHubOverview>(() => {
    return TeacherDailyHubService.getDailyOverview();
  });

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans pb-12 animate-fade-in">
      {/* Header Banner: Greeting & Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1829] to-[#040817] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              MEU DIA DOCENTE
            </span>
            <span className="text-xs text-slate-400 font-mono">• {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
            <Sun className="w-6 h-6 text-amber-400" />
            Painel Diário: {overview.teacherName}
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Visão consolidada das suas aulas de hoje, materiais necessários, correções pendentes e retome seu trabalho exatamente de onde parou.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("teacher_action_queue")}
            className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Fila de Trabalho ({overview.pendingGradingCount + overview.openHelpRequestsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* "ÚLTIMO PONTO DE TRABALHO" CARD (1-Click Resume) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-950 to-[#0b1329] border border-indigo-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">Último Ponto de Trabalho Registrado</span>
              <span className="text-[10px] text-slate-500 font-mono">• {new Date(overview.lastWorkPosition.lastUpdatedIso).toLocaleTimeString("pt-BR")}</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">{overview.lastWorkPosition.title}</h3>
            <p className="text-xs text-slate-300 mt-0.5">{overview.lastWorkPosition.description}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate(overview.lastWorkPosition.tabId, overview.lastWorkPosition.contextParams)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-slate-950" />
          Retomar Trabalho
        </button>
      </div>

      {/* Main Grid: Left Column (Schedule & Materials) | Right Column (Deadlines & Pinned Shortcuts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Schedule & Materials */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Cronograma de Aulas de Hoje ({overview.todayClasses.length})
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {overview.todayClasses.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all ${
                  item.status === "EM_ANDAMENTO"
                    ? "bg-gradient-to-b from-[#0e1730] to-slate-950 border-cyan-500/50 shadow-lg shadow-cyan-500/5"
                    : item.status === "CONCLUIDA"
                      ? "bg-slate-950/60 border-slate-800/80 opacity-80"
                      : "bg-[#090e21] border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                      {item.timeSlot}
                    </span>
                    <span className="text-xs font-bold text-white">{item.className}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.classRoom})</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                    item.status === "EM_ANDAMENTO"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                      : item.status === "CONCLUIDA"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-800 text-slate-400"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-200">{item.topic}</span>
                  <span className="text-[11px] text-slate-400">{item.competency}</span>
                </div>

                {/* Didactic Materials Required */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Materiais & Recursos Didáticos:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.requiredMaterials.map((mat) => (
                      <span
                        key={mat.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 hover:border-slate-700 cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3 text-cyan-400" />
                        {mat.title}
                      </span>
                    ))}
                    {item.activeActivityTitle && (
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-mono text-indigo-300 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        Atividade: {item.activeActivityTitle}
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct quick action buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => onNavigate("live_lab_companion", { className: item.className })}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-800 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Abrir Bancada ao Vivo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate("diary", { classId: item.id })}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Lançar no Diário</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Deadlines, Shortcuts & Quick Hub */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Pinned Shortcuts */}
          <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              Atalhos de Alta Produtividade
            </span>
            <div className="grid grid-cols-2 gap-2">
              {overview.pinnedShortcuts.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => onNavigate(sc.tabId)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-left flex flex-col justify-between gap-2 transition-all group cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">{sc.label}</span>
                  {sc.badgeCount && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold self-start border border-cyan-500/20">
                      {sc.badgeCount} pendente(s)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Approaching Activity Deadlines */}
          <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Prazos Próximos
            </span>

            <div className="flex flex-col gap-2.5">
              {overview.upcomingDeadlines.map((dl) => (
                <div key={dl.activityId} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{dl.activityTitle}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{dl.className}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>Encerra: {new Date(dl.deadlineIso).toLocaleDateString("pt-BR")}</span>
                    <span className="text-emerald-400 font-semibold">{dl.submittedRatio}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

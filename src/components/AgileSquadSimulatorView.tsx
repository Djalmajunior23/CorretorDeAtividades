import React, { useState } from "react";
import {
  Users,
  Layers,
  Play,
  FileDown,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  GitMerge,
  Flame,
  MessageSquare,
  TrendingDown
} from "lucide-react";
import { toast } from "sonner";
import {
  SprintState,
  UserStory,
  KanbanColumn,
  AgileSquadSimulatorService
} from "../services/agileSquadSimulatorService";

export const AgileSquadSimulatorView: React.FC = () => {
  const [studentName, setStudentName] = useState("Lucas Gabriel");
  const [sprintGoal, setSprintGoal] = useState("Desenvolver Módulo de Checkout Resiliente e Autenticação JWT");
  const [sprint, setSprint] = useState<SprintState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleStartSprint = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/agile-squad/start-sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, sprintGoal })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.sprint) {
          setSprint(data.sprint);
          toast.success("Sprint 1 iniciada com sucesso!");
          return;
        }
      }

      const fallback = await AgileSquadSimulatorService.startSprint({ studentName, sprintGoal });
      setSprint(fallback);
      toast.success("Sprint iniciada localmente!");
    } catch (err: any) {
      const fallback = await AgileSquadSimulatorService.startSprint({ studentName, sprintGoal });
      setSprint(fallback);
      toast.success("Sprint iniciada com sucesso!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerScopeChange = async (eventType: "SCOPE_CHANGE_PO" | "GIT_MERGE_CONFLICT" | "CRITICAL_BUG_INTRUSION") => {
    if (!sprint) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/agile-squad/trigger-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprint, eventType })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.updatedSprint) {
          setSprint(data.updatedSprint);
          toast.warning(data.announcementMessage);
          return;
        }
      }

      const { updatedSprint, announcementMessage } = await AgileSquadSimulatorService.triggerSprintEvent({ sprint, eventType });
      setSprint(updatedSprint);
      toast.warning(announcementMessage);
    } catch (err: any) {
      const { updatedSprint, announcementMessage } = await AgileSquadSimulatorService.triggerSprintEvent({ sprint, eventType });
      setSprint(updatedSprint);
      toast.warning(announcementMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const moveStoryStatus = (storyId: string, newStatus: KanbanColumn) => {
    if (!sprint) return;
    const updated = sprint.stories.map((s) => (s.id === storyId ? { ...s, status: newStatus } : s));
    const completed = updated.filter((s) => s.status === "DONE").reduce((acc, s) => acc + s.storyPoints, 0);

    setSprint({
      ...sprint,
      stories: updated,
      completedStoryPoints: completed
    });
    toast.success(`História ${storyId} movida para ${newStatus}`);
  };

  const handleExportPdf = async () => {
    if (!sprint) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/agile-squad/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprint })
      });

      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        const pdfBuf = await AgileSquadSimulatorService.generateAgileReportPdf(sprint);
        blob = new Blob([pdfBuf as any], { type: "application/pdf" });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laudo_sprint_${sprint.sprintId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Dossiê de Performance Ágil baixado!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const columns: KanbanColumn[] = ["TODO", "IN_PROGRESS", "CODE_REVIEW", "DONE"];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-sky-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
              <Users className="w-3 h-3 text-sky-400" /> Virtual Agile Scrum Squad
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Autonomous PO & Scrum Master AI
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Virtual Agile Scrum Squad & GitOps Simulator
          </h1>
          <p className="text-slate-400 text-sm">
            Simulação de squad industrial com papéis autônomos, sprint burndown dinâmico, injeção de mudanças de escopo e resolução de conflitos Git.
          </p>
        </div>

        {sprint && (
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 transition shadow-lg text-sm font-semibold disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {isExportingPdf ? "Gerando Dossiê..." : "Exportar Dossiê Ágil (PDF)"}
          </button>
        )}
      </div>

      {!sprint ? (
        <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" /> Planejamento da Sprint
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Desenvolvedor (Aluno)</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Meta da Sprint (Sprint Goal)</label>
            <textarea
              value={sprintGoal}
              onChange={(e) => setSprintGoal(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <button
            onClick={handleStartSprint}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Iniciar Sprint com o Squad Virtual
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Bar: Progress & Scope injection buttons */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Meta da Sprint: {sprint.goal}</span>
              <div className="flex items-center gap-3">
                <div className="w-48 bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.round((sprint.completedStoryPoints / Math.max(1, sprint.totalStoryPoints)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-sky-300">
                  {sprint.completedStoryPoints} / {sprint.totalStoryPoints} pts (Dia {sprint.currentDay}/{sprint.durationDays})
                </span>
              </div>
            </div>

            {/* Emergency injection triggers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleTriggerScopeChange("SCOPE_CHANGE_PO")}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Mudança de Escopo (PO)
              </button>

              <button
                type="button"
                onClick={() => handleTriggerScopeChange("GIT_MERGE_CONFLICT")}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 transition flex items-center gap-1.5"
              >
                <GitMerge className="w-3.5 h-3.5" /> Injetar Conflito Git
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {columns.map((col) => {
              const columnStories = sprint.stories.filter((s) => s.status === col);
              const colLabel = col === "TODO" ? "A Fazer" : col === "IN_PROGRESS" ? "Em Desenvolvimento" : col === "CODE_REVIEW" ? "Code Review" : "Concluído (Done)";

              return (
                <div key={col} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl flex flex-col min-h-[380px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300">{colLabel}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                      {columnStories.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {columnStories.map((story) => (
                      <div key={story.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sky-400">{story.id}</span>
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono text-[10px]">
                            {story.storyPoints} pts
                          </span>
                        </div>

                        <p className="text-slate-200 font-medium leading-tight">{story.title}</p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {story.assignee}</span>
                          <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {story.gitBranchName}</span>
                        </div>

                        {story.hasMergeConflict && (
                          <div className="p-1.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold flex items-center gap-1">
                            <GitMerge className="w-3 h-3" /> Conflito de Merge Ativo
                          </div>
                        )}

                        {/* Status Switcher Buttons */}
                        <div className="flex gap-1 pt-1">
                          {columns.filter((c) => c !== col).map((targetCol) => (
                            <button
                              key={targetCol}
                              onClick={() => moveStoryStatus(story.id, targetCol)}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            >
                              → {targetCol.substring(0, 4)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Standup Feeds */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" /> Relato da Daily Standup Virtual (Squad Feed)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sprint.dailyStandupHistory.map((entry, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-sky-300">{entry.participantName} ({entry.role})</div>
                  <div className="text-slate-400">Ontem: <span className="text-slate-200">{entry.yesterday}</span></div>
                  <div className="text-slate-400">Hoje: <span className="text-slate-200">{entry.today}</span></div>
                  <div className="text-slate-400">Impedimentos: <span className="text-slate-200">{entry.blockers}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgileSquadSimulatorView;

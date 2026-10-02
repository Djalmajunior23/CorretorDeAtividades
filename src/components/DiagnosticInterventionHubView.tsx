import React, { useState } from "react";
import { 
  Activity, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  Send, 
  RefreshCw, 
  ChevronRight,
  BarChart3,
  Calendar,
  Layers
} from "lucide-react";
import { PedagogicalInterventionService, ErrorCluster } from "../services/pedagogicalInterventionService";

export default function DiagnosticInterventionHubView() {
  const [clusters, setClusters] = useState<ErrorCluster[]>(() => {
    return PedagogicalInterventionService.getClusters();
  });
  const [selectedCluster, setSelectedCluster] = useState<ErrorCluster | null>(clusters[0] || null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleAssignIntervention = (clusterId: string) => {
    const updated = PedagogicalInterventionService.assignIntervention(clusterId);
    if (updated) {
      setClusters([...PedagogicalInterventionService.getClusters()]);
      setSelectedCluster({ ...updated });
      setNotification(`Atividade de reforço "${updated.recommendedReinforcement.title}" atribuída para os ${updated.affectedStudentsCount} alunos impactados!`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#120d2b] to-[#040817] border border-fuchsia-500/20 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
              CENTRAL DE DIAGNÓSTICO & RECUPERAÇÃO
            </span>
            <span className="text-xs text-slate-400 font-mono">• Mapeamento por Competência</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
            <Activity className="w-6 h-6 text-fuchsia-400" />
            Diagnóstico de Fragilidades & Intervenção Dirigida
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Agrupamento estatístico de erros recorrentes por competência, evidências de log e atribuição com 1-clique de reforço pedagógico adaptativo.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid: Left side Clusters List | Right side Cluster Diagnostics & Intervention Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Error Clusters */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono px-2">
            Clusters de Erros Detectados ({clusters.length})
          </span>

          <div className="flex flex-col gap-3">
            {clusters.map((c) => {
              const isSelected = selectedCluster?.clusterId === c.clusterId;
              return (
                <div
                  key={c.clusterId}
                  onClick={() => setSelectedCluster(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-slate-900 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/5"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{c.competency}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      c.severity === "CRITICA" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                    }`}>
                      {c.severity}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">{c.topic}</span>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <Users className="w-3 h-3" />
                      {c.affectedStudentsCount} alunos impactados ({c.failureRatePercentage}%)
                    </span>
                    <span className="text-emerald-400 font-bold">
                      +{c.postInterventionRecoveryRate}% recuperação
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cluster Detail & Intervention Action */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {selectedCluster ? (
            <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-6 shadow-2xl">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-fuchsia-400 uppercase font-bold">
                    Competência em Foco
                  </span>
                  <h3 className="text-lg font-bold text-white">{selectedCluster.competency}</h3>
                  <span className="text-xs text-slate-400 font-mono">Tópico: {selectedCluster.topic}</span>
                </div>

                <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-slate-400 font-mono uppercase">Taxa de Falha</span>
                    <span className="text-base font-bold text-rose-400 font-mono">{selectedCluster.failureRatePercentage}%</span>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-800" />
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-slate-400 font-mono uppercase">Evolução Esperada</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">+{selectedCluster.postInterventionRecoveryRate}%</span>
                  </div>
                </div>
              </div>

              {/* Error Pattern Description & Log Sample */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Padrão de Erro Identificado pelo Sistema:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedCluster.errorPatternDescription}
                </p>
                <pre className="p-3 bg-slate-950 border border-rose-500/20 text-rose-300 rounded-xl font-mono text-xs overflow-x-auto">
                  Log de Evidência: {selectedCluster.sampleErrorMessage}
                </pre>
              </div>

              {/* Affected Students List */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-400" />
                  Estudantes que Apresentaram Esta Fragilidade ({selectedCluster.affectedStudents.length}):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCluster.affectedStudents.map((std) => (
                    <div key={std.studentId} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{std.studentName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{std.attemptCount} tentativa(s) recente(s)</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {std.lastScore} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Reinforcement Assignment Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-fuchsia-950/30 to-slate-950 border border-fuchsia-500/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                      Atividade de Reforço Recomendada pelo Banco de Questões
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                    selectedCluster.interventionStatus === 'EM_PROGRESSO' 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-fuchsia-500/20 text-fuchsia-300'
                  }`}>
                    {selectedCluster.interventionStatus}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h5 className="text-sm font-bold text-white">{selectedCluster.recommendedReinforcement.title}</h5>
                  <p className="text-xs text-slate-300">{selectedCluster.recommendedReinforcement.scaffoldingObjective}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Dificuldade: {selectedCluster.recommendedReinforcement.difficulty} • Duração estimada: {selectedCluster.recommendedReinforcement.estimatedDurationMinutes} min
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    disabled={selectedCluster.interventionStatus === "EM_PROGRESSO"}
                    onClick={() => handleAssignIntervention(selectedCluster.clusterId)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
                      selectedCluster.interventionStatus === "EM_PROGRESSO"
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white shadow-lg shadow-fuchsia-500/20 cursor-pointer"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {selectedCluster.interventionStatus === "EM_PROGRESSO" ? "Intervenção em Andamento" : "Atribuir Reforço aos Alunos Impactados"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <Activity className="w-10 h-10 text-slate-600" />
              <span className="text-xs font-bold text-slate-400">Selecione um cluster de erros</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

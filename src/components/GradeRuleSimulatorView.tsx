import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sliders,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Save,
  Users,
  Award,
  Layers,
  History,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  GradeRuleSimulatorService,
  GradeRuleConfig,
  SimulationSummary,
  GradePolicyAuditSnapshot
} from "../services/gradeRuleSimulatorService";

interface GradeRuleSimulatorViewProps {
  onNavigate?: (tab: string) => void;
}

export default function GradeRuleSimulatorView({ onNavigate }: GradeRuleSimulatorViewProps) {
  const [config, setConfig] = useState<GradeRuleConfig>(() =>
    GradeRuleSimulatorService.getActiveConfig()
  );
  const [simulation, setSimulation] = useState<SimulationSummary>(() =>
    GradeRuleSimulatorService.simulate(config)
  );
  const [snapshots, setSnapshots] = useState<GradePolicyAuditSnapshot[]>(() =>
    GradeRuleSimulatorService.getAuditSnapshots()
  );
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [justificationReason, setJustificationReason] = useState("");

  const handleConfigChange = (newValues: Partial<GradeRuleConfig>) => {
    const updated = { ...config, ...newValues };
    setConfig(updated);
    setSimulation(GradeRuleSimulatorService.simulate(updated));
  };

  const handleApplyOfficially = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justificationReason.trim()) {
      toast.error("Por favor, forneça uma justificativa pedagógica para a alteração.");
      return;
    }

    const snap = GradeRuleSimulatorService.applyConfigOfficially({
      classId: "turma-ds-a",
      newConfig: config,
      teacherName: "Prof. Djalma Batista",
      justificationReason
    });

    toast.success("Nova regra de notas homologada oficialmente!", {
      description: `Snapshot de auditoria #${snap.id} registrado com possibilidade de reversão.`
    });

    setSnapshots([...GradeRuleSimulatorService.getAuditSnapshots()]);
    setShowApplyModal(false);
    setJustificationReason("");
  };

  const handleRollback = (snapId: string) => {
    const ok = GradeRuleSimulatorService.rollbackSnapshot(snapId);
    if (ok) {
      toast.info("Regra de notas revertida para o snapshot anterior com sucesso!");
      const current = GradeRuleSimulatorService.getActiveConfig();
      setConfig(current);
      setSimulation(GradeRuleSimulatorService.simulate(current));
      setSnapshots([...GradeRuleSimulatorService.getAuditSnapshots()]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Sliders className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Simulador de Regras e Políticas de Notas
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                What-If Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simule pesos, regras de recuperação, descarte e arredondamento antes de aplicar oficialmente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Aplicar Regra Oficialmente</span>
          </button>
        </div>
      </div>

      {/* Safety Sandbox Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Ambiente Seguro de Simulação:</strong> Alterar os parâmetros abaixo não modifica o banco de notas dos estudantes. A publicação é uma ação separada, auditável e reversível a qualquer momento.
        </div>
      </div>

      {/* Top Controls Grid: Rule Adjustments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weights Card */}
        <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
          <h2 className="text-xs font-mono uppercase text-blue-400 font-bold tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>Pesos das Avaliações</span>
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Listas de Exercícios:</span>
                <span className="text-blue-400 font-bold">{config.weightHomework}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.weightHomework}
                onChange={(e) => handleConfigChange({ weightHomework: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Projeto Prático / Lab:</span>
                <span className="text-cyan-400 font-bold">{config.weightProject}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.weightProject}
                onChange={(e) => handleConfigChange({ weightProject: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Avaliação Teórico-Prática:</span>
                <span className="text-indigo-400 font-bold">{config.weightExam}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.weightExam}
                onChange={(e) => handleConfigChange({ weightExam: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="pt-1 text-[11px] text-slate-400 text-right">
              Soma dos pesos: <strong className="text-white">{config.weightHomework + config.weightProject + config.weightExam}%</strong>
            </div>
          </div>
        </div>

        {/* Policies Card: Recovery & Composition */}
        <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
          <h2 className="text-xs font-mono uppercase text-indigo-400 font-bold tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>Recuperação & Composição</span>
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">Política de Recuperação:</label>
              <select
                value={config.recoveryPolicy}
                onChange={(e) => handleConfigChange({ recoveryPolicy: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="MAIOR_NOTA">Maior Nota (Original vs Recuperação)</option>
                <option value="SUBSTITUTIVA_TOTAL">Substituição Total da Prova</option>
                <option value="MEDIA_ARITMETICA">Média Simples (Original + Recup)/2</option>
                <option value="TETO_MAXIMO_60">Teto Máximo de 60 Pontos</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Composição de Listas:</label>
              <select
                value={config.compositionRule}
                onChange={(e) => handleConfigChange({ compositionRule: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="TODAS_NOTAS">Todas as listas computadas</option>
                <option value="DESCARTAR_MENOR_LISTA">Descartar a menor nota de lista</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Atividades Não Entregues:</label>
              <select
                value={config.unsubmittedHandling}
                onChange={(e) => handleConfigChange({ unsubmittedHandling: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="NOTA_ZERO">Atribuir Nota Zero (0 pts)</option>
                <option value="DESCONSIDERAR">Desconsiderar do denominador</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rounding & Thresholds Card */}
        <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
          <h2 className="text-xs font-mono uppercase text-teal-400 font-bold tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Arredondamento & Aprovação</span>
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">Regra de Arredondamento:</label>
              <select
                value={config.roundingRule}
                onChange={(e) => handleConfigChange({ roundingRule: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="PADRAO_MATEMATICO">Padrão Matemático (ex: 59.5 ➔ 60)</option>
                <option value="SEMPRE_CIMA_MEIO_PONTO">Meio-Ponto Acima (a partir de 0.5 sobe)</option>
                <option value="TRUNCAMENTO">Truncamento / Sem arredondamento</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 mb-1">Nota Mín. Aprovação:</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.passingScoreMin}
                  onChange={(e) => handleConfigChange({ passingScoreMin: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Frequência Mín.:</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.minAttendancePercent}
                  onChange={(e) => handleConfigChange({ minAttendancePercent: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Results Panel */}
      <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Impacto Comparativo na Turma (Regra Vigente vs Proposta Simulada)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {simulation.affectedStudentsCount} de {simulation.totalStudents} estudantes sofreram alteração na nota ou situação acadêmica.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Média Atual: </span>
              <strong className="text-white">{simulation.currentClassAverage} pts</strong>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400" />
            <div className="px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/40">
              <span className="text-blue-300">Média Simulada: </span>
              <strong className="text-white">{simulation.simulatedClassAverage} pts</strong>
            </div>
          </div>
        </div>

        {/* Status Distribution Comparison */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <span className="text-emerald-400 font-bold block mb-1">Aprovados</span>
            <span className="text-lg font-bold text-white">{simulation.currentApprovedCount} ➔ {simulation.simulatedApprovedCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <span className="text-amber-400 font-bold block mb-1">Em Recuperação</span>
            <span className="text-lg font-bold text-white">{simulation.currentRecoveryCount} ➔ {simulation.simulatedRecoveryCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <span className="text-rose-400 font-bold block mb-1">Reprovados</span>
            <span className="text-lg font-bold text-white">{simulation.currentFailedCount} ➔ {simulation.simulatedFailedCount}</span>
          </div>
        </div>

        {/* Affected Students Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
            Detalhamento Individual dos Estudantes
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Estudante</th>
                  <th className="p-3">Freq.</th>
                  <th className="p-3">Nota Atual</th>
                  <th className="p-3">Situação Atual</th>
                  <th className="p-3">Nota Simulada</th>
                  <th className="p-3">Situação Simulada</th>
                  <th className="p-3">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {simulation.studentResults.map(res => (
                  <tr
                    key={res.studentId}
                    className={`hover:bg-slate-900/50 transition-colors ${
                      res.statusChanged ? "bg-blue-950/20" : ""
                    }`}
                  >
                    <td className="p-3 text-white font-semibold">{res.studentName}</td>
                    <td className="p-3 text-slate-400">{res.attendancePercent}%</td>
                    <td className="p-3 text-slate-300">{res.currentFinalScore}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.currentStatus === "APROVADO" ? "bg-emerald-500/20 text-emerald-400" :
                        res.currentStatus === "RECUPERACAO" ? "bg-amber-500/20 text-amber-400" :
                        "bg-rose-500/20 text-rose-400"
                      }`}>
                        {res.currentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-white font-bold">{res.simulatedFinalScore}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.simulatedStatus === "APROVADO" ? "bg-emerald-500/20 text-emerald-400" :
                        res.simulatedStatus === "RECUPERACAO" ? "bg-amber-500/20 text-amber-400" :
                        "bg-rose-500/20 text-rose-400"
                      }`}>
                        {res.simulatedStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${
                        res.scoreDelta > 0 ? "text-emerald-400" :
                        res.scoreDelta < 0 ? "text-rose-400" : "text-slate-500"
                      }`}>
                        {res.scoreDelta > 0 ? `+${res.scoreDelta}` : res.scoreDelta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Historical Audit Snapshots & Rollback */}
      {snapshots.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <span>Histórico de Alterações de Regras & Snapshots de Reversão</span>
          </h2>

          <div className="space-y-3">
            {snapshots.map(snap => (
              <div
                key={snap.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">Snapshot #{snap.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {snap.appliedAtIso}
                    </span>
                    {snap.isRolledBack && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        Revertido
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 italic">
                    "{snap.justificationReason}"
                  </p>
                </div>

                {!snap.isRolledBack && (
                  <button
                    onClick={() => handleRollback(snap.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reverter para Esta Regra</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Official Application */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#090e21] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <span>Homologar Regra de Notas Oficialmente</span>
                </h3>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApplyOfficially} className="space-y-4 text-xs font-mono">
                <p className="text-slate-300">
                  Esta ação aplicará a nova regra à turma <strong>DS - Turma A</strong> ({simulation.affectedStudentsCount} estudantes impactados).
                </p>

                <div>
                  <label className="block text-slate-300 mb-1">
                    Justificativa Pedagógica Obrigatória:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ex: Ajuste do peso do projeto após deliberação de colegiado e inclusão de recuperação..."
                    value={justificationReason}
                    onChange={(e) => setJustificationReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    Confirmar Homologação
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

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  ShieldCheck,
  AlertTriangle,
  Play,
  Code2,
  Clock,
  Award,
  BookOpen,
  Sparkles,
  Layers,
  Send,
  CheckCircle2,
  FileCode,
  Terminal,
  HelpCircle,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import { UnifiedLifecycleEngineService, ManagedActivity } from "../services/unifiedLifecycleEngineService";
import { PedagogicalConfigHierarchyService } from "../services/pedagogicalConfigHierarchyService";

interface StudentExperiencePreviewViewProps {
  onNavigate?: (tab: string) => void;
}

export default function StudentExperiencePreviewView({ onNavigate }: StudentExperiencePreviewViewProps) {
  const [activities] = useState<ManagedActivity[]>(() =>
    UnifiedLifecycleEngineService.getActivities()
  );
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    activities[0]?.id || ""
  );

  const selectedActivity = activities.find(a => a.id === selectedActivityId) || activities[0];
  const activeSnapshot = selectedActivity?.versionHistory[selectedActivity.activeVersion - 1] || selectedActivity?.versionHistory[0];

  const resolvedConfig = PedagogicalConfigHierarchyService.resolveEffectiveConfig({
    activityId: selectedActivity?.id,
    classId: selectedActivity?.classId
  });

  // Interactive student simulation editor
  const [studentSimulatedCode, setStudentSimulatedCode] = useState<string>(
    activeSnapshot?.starterCode || "def somar_pares_ate_limite(limite):\n    # Escreva sua solucao aqui\n    pass\n"
  );
  const [simulatedResults, setSimulatedResults] = useState<{
    ran: boolean;
    testsPassed: number;
    totalTests: number;
    output: string;
  } | null>(null);

  const handleSimulateStudentRun = () => {
    // Quick trial run
    const hasCorrectReturn = studentSimulatedCode.includes("sum") || studentSimulatedCode.includes("+=");
    const passed = hasCorrectReturn ? 4 : 2;

    setSimulatedResults({
      ran: true,
      testsPassed: passed,
      totalTests: 4,
      output: passed === 4 
        ? "✅ 4/4 casos de teste aprovados no Sandbox Wasm (Trial Simulado)." 
        : "⚠️ 2/4 testes passaram. Falha nos casos de borda range(1, n)."
    });

    toast.info("Ensaio de teste executado no modo prévia.", {
      description: "Nenhuma nota ou submissão real foi gravada no banco de dados."
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Permanent Student Preview Mode Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-500/50 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
              <span>Modo de Prévia Docente (Visualização como Aluno)</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px]">Somente Ensaio</span>
            </span>
            <p className="text-[11px] text-amber-200/80 mt-0.5">
              Esta tela renderiza exatamente o que o estudante vê ao abrir a atividade. Testes e envios aqui são ensaios sintéticos e não geram notas oficiais.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedActivityId}
            onChange={(e) => {
              setSelectedActivityId(e.target.value);
              setSimulatedResults(null);
            }}
            className="bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-amber-200 font-mono focus:outline-none"
          >
            {activities.map(a => (
              <option key={a.id} value={a.id}>
                {a.title} (v{a.activeVersion})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedActivity && activeSnapshot && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Activity Prompt, Rules and Rubrics */}
          <div className="space-y-5">
            {/* Metadata Card */}
            <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedActivity.className}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    Versão Ativa: v{activeSnapshot.versionNumber}
                  </span>
                </div>
                <h1 className="text-base font-bold text-white font-display">
                  {selectedActivity.title}
                </h1>
              </div>

              {/* Delivery Rules Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Prazo Final
                  </span>
                  <strong className="text-white text-[11px]">{new Date(activeSnapshot.deliveryRules.deadlineIso).toLocaleDateString("pt-BR")}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                    <Award className="w-3 h-3 text-indigo-400" />
                    Tentativas
                  </span>
                  <strong className="text-white text-[11px]">Máx: {resolvedConfig.effectiveSettings.maxAttempts} envios</strong>
                </div>
              </div>

              {/* AI Policy Badge */}
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/40 text-xs font-mono flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300">Política de Apoio por IA:</strong>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    {resolvedConfig.effectiveSettings.allowedAiAssistanceLevel === "SOCRATICO_DICAS"
                      ? "Tutor Socrático ativo (dicas e scaffolding sem fornecer código pronto)."
                      : "Uso de IA restrito para esta atividade."}
                  </p>
                </div>
              </div>
            </div>

            {/* Rubrics Card */}
            <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 space-y-3">
              <h2 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Critérios da Rubrica de Avaliação</span>
              </h2>

              <div className="space-y-2">
                {activeSnapshot.rubric.map(crit => (
                  <div key={crit.criterionId} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{crit.name}</span>
                      <span className="font-mono text-emerald-400">{crit.maxPoints} pts</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{crit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor & Simulated Submission Studio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
              {/* Problem statement */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <span className="text-xs font-mono uppercase text-cyan-400 font-bold">
                  Enunciado do Problema:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {activeSnapshot.prompt}
                </p>
              </div>

              {/* Code Editor Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Editor de Código do Estudante (Python)</span>
                </span>
                <button
                  onClick={handleSimulateStudentRun}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Testar no Sandbox (Ensaio)</span>
                </button>
              </div>

              {/* Textarea editor */}
              <textarea
                value={studentSimulatedCode}
                onChange={(e) => setStudentSimulatedCode(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-300 font-mono leading-relaxed focus:outline-none focus:border-cyan-500"
              />

              {/* Simulation output */}
              {simulatedResults && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Resultado do Ensaio:</span>
                    <span className="text-emerald-400 font-bold">
                      {simulatedResults.testsPassed} / {simulatedResults.totalTests} testes aprovados
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-slate-200">{simulatedResults.output}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

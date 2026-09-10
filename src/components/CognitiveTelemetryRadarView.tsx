import React, { useState, useEffect } from "react";
import {
  Activity,
  Zap,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  Brain,
  Lightbulb,
  Cpu,
  UserCheck,
  Send
} from "lucide-react";
import { toast } from "sonner";
import {
  CognitiveTelemetryService,
  StudentTelemetryMetrics,
  MicroHintResponse
} from "../services/cognitiveTelemetryService";

export default function CognitiveTelemetryRadarView() {
  const [radarData, setRadarData] = useState<{
    totalActiveStudents: number;
    flowCount: number;
    hesitationCount: number;
    overloadCount: number;
    disengagedCount: number;
    averageCognitiveLoad: number;
    urgentInterventions: StudentTelemetryMetrics[];
    students: StudentTelemetryMetrics[];
  } | null>(null);

  const [isLoadingRadar, setIsLoadingRadar] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentTelemetryMetrics | null>(null);

  // Live Telemetry Simulator state
  const [simStudentName, setSimStudentName] = useState("Mariana Costa");
  const [simCode, setSimCode] = useState("def processar_pedidos(lista):\n    for i in range(len(lista)):\n        if lista[i] > 100:\n            # travado aqui com erro de index");
  const [simErrorsCount, setSimErrorsCount] = useState(3);
  const [simDeletions, setSimDeletions] = useState(35);
  const [simAdditions, setSimAdditions] = useState(45);
  const [simPastes, setSimPastes] = useState(2);

  // Micro-Hint AI requester state
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3>(1);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [activeHint, setActiveHint] = useState<MicroHintResponse | null>(null);

  const fetchRadar = async () => {
    setIsLoadingRadar(true);
    try {
      const res = await fetch("/api/telemetry/radar");
      const data = await res.json();
      if (data.success && data.radar) {
        setRadarData(data.radar);
      } else {
        throw new Error("Failed to load radar");
      }
    } catch {
      const fallback = CognitiveTelemetryService.getClassroomRadar();
      setRadarData(fallback);
    } finally {
      setIsLoadingRadar(false);
    }
  };

  useEffect(() => {
    fetchRadar();
    const interval = setInterval(fetchRadar, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateTelemetry = async () => {
    try {
      const payload = {
        studentId: "stu_sim_01",
        studentName: simStudentName,
        classId: "TURMA-SENAI-DEV-A",
        activityId: "ACT-ALGO-01",
        timestamp: Date.now(),
        charsAdded: simAdditions,
        charsDeleted: simDeletions,
        pasteCount: simPastes,
        executionErrorsCount: simErrorsCount,
        currentCodeLength: simCode.length,
        activeLanguage: "python"
      };

      const res = await fetch("/api/telemetry/record-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setSelectedStudent(data.metrics);
        toast.success(`Telemetria registrada! Estado detectado: ${data.metrics.stateLabel}`);
        fetchRadar();
      }
    } catch (e: any) {
      toast.error(`Erro ao registrar telemetria: ${e.message}`);
    }
  };

  const handleRequestMicroHint = async (level: 1 | 2 | 3) => {
    setIsGeneratingHint(true);
    setHintLevel(level);
    try {
      const res = await fetch("/api/telemetry/micro-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: selectedStudent?.studentName || simStudentName,
          studentId: selectedStudent?.studentId || "stu_104",
          codeSnippet: simCode,
          language: "python",
          errorLog: "IndexError: list index out of range at line 3",
          hintLevel: level
        })
      });
      const data = await res.json();
      if (data.success && data.hint) {
        setActiveHint(data.hint);
        toast.success("Micro-Dica Socrática gerada pela IA!");
      } else {
        throw new Error(data.error || "Falha na dica.");
      }
    } catch {
      const fallbackHint = await CognitiveTelemetryService.generateMicroHint({
        studentName: simStudentName,
        studentId: "stu_104",
        codeSnippet: simCode,
        language: "python",
        hintLevel: level
      });
      setActiveHint(fallbackHint);
      toast.info("Micro-Dica gerada com sucesso via motor socrático.");
    } finally {
      setIsGeneratingHint(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#030712] text-slate-100">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/70 via-slate-900 to-emerald-950/70 border border-violet-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5" />
              Telemetria Cognitiva em Tempo Real
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-violet-400" />
              Cognitive Load & Live Engagement Radar
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Monitoramento não-intrusivo de cadência de digitação (CPM/WPM), taxa de churn por backspace e loops de erro no sandbox. Disparo automático de <span className="text-violet-400 font-semibold">Micro-Dicas Socráticas Just-In-Time</span> antes do desestímulo do estudante.
            </p>
          </div>

          <button
            onClick={fetchRadar}
            disabled={isLoadingRadar}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all text-xs font-semibold border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRadar ? "animate-spin" : ""}`} />
            Atualizar Radar
          </button>
        </div>
      </div>

      {/* Real-Time Radar Macro Indicators */}
      {radarData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Estudantes Ativos</div>
            <div className="text-2xl font-black text-white">{radarData.totalActiveStudents}</div>
            <div className="text-[10px] text-slate-500">Conectados na sessão</div>
          </div>

          <div className="bg-[#090d1f] border border-emerald-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase">Em Flow</div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{radarData.flowCount}</div>
            <div className="text-[10px] text-emerald-500/80">Ritmo criativo ótimo</div>
          </div>

          <div className="bg-[#090d1f] border border-amber-500/30 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-semibold text-amber-400 uppercase">Hesitação Leve</div>
            <div className="text-2xl font-black text-amber-400">{radarData.hesitationCount}</div>
            <div className="text-[10px] text-amber-500/80">Revisando conceitos</div>
          </div>

          <div className="bg-[#090d1f] border border-rose-500/40 rounded-2xl p-4 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-rose-400 uppercase">Sobrecarga / Bloqueio</div>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">{radarData.overloadCount}</div>
            <div className="text-[10px] text-rose-400/80 font-medium">Intervenção recomendada</div>
          </div>

          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Inativos / Pausa</div>
            <div className="text-2xl font-black text-slate-400">{radarData.disengagedCount}</div>
            <div className="text-[10px] text-slate-500">Sem eventos recentes</div>
          </div>

          <div className="bg-[#090d1f] border border-violet-500/30 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-semibold text-violet-400 uppercase">Índice Geral (CLI)</div>
            <div className="text-2xl font-black text-violet-400">{Math.round(radarData.averageCognitiveLoad * 100)}%</div>
            <div className="text-[10px] text-violet-400/80">Carga cognitiva média</div>
          </div>
        </div>
      )}

      {/* Main Workspace: Active Cohort Radar & Interactive Micro-Hint Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Classroom Cohort Table */}
        <div className="lg:col-span-7 bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-400" />
              Radar da Turma em Tempo Real
            </h2>
            <span className="text-xs text-slate-400">Turma: TURMA-SENAI-DEV-A</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Estudante</th>
                  <th className="p-3">Cadência</th>
                  <th className="p-3">Churn (Del)</th>
                  <th className="p-3">Erros</th>
                  <th className="p-3">Estado Cognitivo</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {radarData?.students.map((st) => {
                  const isOverloaded = st.state === "cognitive_overload";
                  const isFlow = st.state === "flow_state";
                  const isHesitant = st.state === "mild_hesitation";

                  return (
                    <tr
                      key={st.studentId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        selectedStudent?.studentId === st.studentId ? "bg-violet-950/20" : ""
                      }`}
                    >
                      <td className="p-3 font-sans font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isFlow ? "bg-emerald-400" : isOverloaded ? "bg-rose-400 animate-pulse" : isHesitant ? "bg-amber-400" : "bg-slate-500"
                            }`}
                          />
                          {st.studentName}
                        </div>
                      </td>
                      <td className="p-3">{st.cpm} cpm</td>
                      <td className="p-3">{Math.round(st.churnRate * 100)}%</td>
                      <td className="p-3">{st.consecutiveExecutionErrors} err</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold ${
                            isFlow
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : isOverloaded
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              : isHesitant
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {st.stateLabel}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudent(st);
                            setSimStudentName(st.studentName);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 hover:bg-violet-600/40 border border-violet-500/30 text-[11px] font-sans font-semibold"
                        >
                          Inspecionar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Just-In-Time Micro-Hint & Socratic Scaffold Engine */}
        <div className="lg:col-span-5 bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Just-In-Time Micro-Hint AI
            </h2>
            <span className="text-xs text-emerald-400 font-semibold">Tutor Socrático Ativo</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Estudante Alvo</label>
              <input
                type="text"
                value={simStudentName}
                onChange={(e) => setSimStudentName(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Trecho de Código em Análise</label>
              <textarea
                value={simCode}
                onChange={(e) => setSimCode(e.target.value)}
                rows={5}
                className="w-full mt-1 bg-[#040815] border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-emerald-300 resize-none focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Level selection buttons */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Nível da Micro-Dica Pedagógica</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {[
                  { level: 1 as const, label: "Nível 1: Nudge", desc: "Pergunta reflexiva" },
                  { level: 2 as const, label: "Nível 2: Âncora", desc: "Conceito chave" },
                  { level: 3 as const, label: "Nível 3: Scaffold", desc: "Estrutura mental" }
                ].map((l) => (
                  <button
                    key={l.level}
                    onClick={() => handleRequestMicroHint(l.level)}
                    disabled={isGeneratingHint}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      hintLevel === l.level && activeHint
                        ? "bg-violet-950/40 border-violet-500 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold">{l.label}</div>
                    <div className="text-[10px] text-slate-400">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Hint Output Display */}
          {activeHint && (
            <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  {activeHint.levelTitle}
                </span>
                <span className="text-[10px] text-slate-400">SENAI Socratic Tutor</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-white font-medium leading-relaxed">
                "{activeHint.socraticHint}"
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-violet-300">💡 Dica Conceitual:</div>
                <p className="text-[11px] text-slate-300">{activeHint.pedagogicalTip}</p>
              </div>

              {activeHint.pseudocodeScaffold && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap">
                  {activeHint.pseudocodeScaffold}
                </div>
              )}

              <button
                onClick={() => toast.success(`Dica enviada diretamente para o editor de ${simStudentName}!`)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                Despachar Dica para o Estudante
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

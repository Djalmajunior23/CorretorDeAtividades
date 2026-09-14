import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  Brain, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Lightbulb, 
  AlertTriangle, 
  FileCode, 
  TrendingUp, 
  Download, 
  RefreshCw,
  Users,
  Award,
  Terminal,
  ChevronRight,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  SocraticScaffoldingService, 
  ScaffoldingLevel, 
  SCAFFOLDING_LEVELS_META, 
  SocraticHint, 
  StudentScaffoldingTelemetry,
  ClassScaffoldingRadar 
} from "../services/socraticScaffoldingService";

export default function SocraticTutorScaffoldingView() {
  const [activeViewMode, setActiveViewMode] = useState<"student" | "teacher_radar">("student");
  
  // Student view state
  const [exerciseTitle, setExerciseTitle] = useState("Cálculo de Desconto Progressivo & Validação");
  const [problemStatement, setProblemStatement] = useState("Implemente uma função que receba o total de uma compra e calcule o desconto correspondente: 5% até R$ 100, 15% acima de R$ 500. Entradas negativas devem lançar erro 'ValorInválido'.");
  const [studentCode, setStudentCode] = useState(`export function calcularDesconto(valorTotal: number): number {
  if (valorTotal < 0) {
    // Como lançar o erro corretamente?
  }
  
  // Estou travado aqui para calcular as faixas de desconto
  let total = valorTotal;
  return total;
}`);
  const [studentDoubt, setStudentDoubt] = useState("Não consigo fazer a condição do desconto funcionar para valores acima de 500 sem quebrar os outros casos.");
  const [selectedLevel, setSelectedLevel] = useState<ScaffoldingLevel>(1);
  const [unlockedLevels, setUnlockedLevels] = useState<ScaffoldingLevel[]>([1]);
  const [hintsHistory, setHintsHistory] = useState<SocraticHint[]>([]);
  const [currentHint, setCurrentHint] = useState<SocraticHint | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Teacher radar state
  const [classRadar, setClassRadar] = useState<ClassScaffoldingRadar | null>(null);

  useEffect(() => {
    const radar = SocraticScaffoldingService.getClassRadarSummary();
    setClassRadar(radar);
  }, []);

  const handleRequestHint = async (levelToRequest: ScaffoldingLevel) => {
    setLoadingHint(true);
    setSelectedLevel(levelToRequest);
    if (!unlockedLevels.includes(levelToRequest)) {
      setUnlockedLevels(prev => [...prev, levelToRequest]);
    }

    try {
      const hint = await SocraticScaffoldingService.generateSocraticHint({
        exerciseTitle,
        problemStatement,
        studentCode,
        studentDoubt,
        targetLevel: levelToRequest,
        previousHintsUsed: unlockedLevels
      });

      setCurrentHint(hint);
      setHintsHistory(prev => [hint, ...prev]);
      toast.success(`Dica do ${hint.levelMeta.badge} liberada!`);
    } catch (err: any) {
      toast.error("Erro ao gerar dica socrática: " + err.message);
    } finally {
      setLoadingHint(false);
    }
  };

  const currentAutonomyScore = SocraticScaffoldingService.calculateAutonomyIndex(unlockedLevels);

  const handleExportStudentPdf = async () => {
    setExportingPdf(true);
    try {
      const telemetry: StudentScaffoldingTelemetry = {
        studentId: "std_2026_09",
        studentName: "Lucas Mendonça de Castro",
        exerciseTitle,
        levelsRequested: unlockedLevels,
        finalAutonomyIndex: currentAutonomyScore,
        autonomyClassification: currentAutonomyScore >= 80 ? "ALTAMENTE_AUTONOMO" : currentAutonomyScore >= 60 ? "MODERADAMENTE_AUTONOMO" : "PRECISA_DE_INTERVENCAO",
        timestamp: new Date().toISOString()
      };

      const pdfBuffer = await SocraticScaffoldingService.generateScaffoldingReportPdf(telemetry);
      const blob = new Blob([pdfBuffer as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laudo_autonomia_socratica_${telemetry.studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Parecer de Autonomia Cognitiva em PDF exportado!");
    } catch (err: any) {
      toast.error("Erro ao exportar PDF: " + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-slate-100 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold tracking-wide uppercase">
              <Brain className="w-3.5 h-3.5" />
              Pedagogia Socrática • Scaffolding em 4 Degraus
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Tutor Socrático Adaptativo & Autonomia Cognitiva
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Auxilia o estudante a desenvolver pensamento computacional sem entregar a resposta pronta. Cada degrau de ajuda é medido em tempo real para alimentar o relatório de autonomia do docente.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportStudentPdf}
              disabled={exportingPdf}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-all border border-slate-700 flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {exportingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              ) : (
                <Download className="w-4 h-4 text-purple-400" />
              )}
              Laudo de Autonomia PDF
            </button>
          </div>
        </div>
      </div>

      {/* Dual Mode Switch */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveViewMode("student")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === "student"
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Brain className="w-3.5 h-3.5" /> Visão do Estudante (Laboratório Socrático)
          </button>

          <button
            onClick={() => setActiveViewMode("teacher_radar")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === "teacher_radar"
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Radar de Autonomia da Turma (Docente)
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Autonomia Restante:</span>
          <span className={`px-2.5 py-0.5 rounded-full font-bold ${
            currentAutonomyScore >= 80 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
            currentAutonomyScore >= 60 ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
            "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}>
            {currentAutonomyScore}%
          </span>
        </div>
      </div>

      {/* Mode 1: Student Socratic Lab */}
      {activeViewMode === "student" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: 4-Step Scaffolding Ladder */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Escada de 4 Degraus Pedagógicos
                </span>
              </div>

              <div className="space-y-3">
                {([1, 2, 3, 4] as ScaffoldingLevel[]).map((lvl) => {
                  const meta = SCAFFOLDING_LEVELS_META[lvl];
                  const isUnlocked = unlockedLevels.includes(lvl);
                  const isCurrent = selectedLevel === lvl;

                  return (
                    <div
                      key={lvl}
                      onClick={() => handleRequestHint(lvl)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        isCurrent
                          ? "bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-500/10"
                          : isUnlocked
                          ? "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                          : "bg-slate-950/40 border-slate-900 opacity-70 hover:opacity-100 hover:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-white flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            isUnlocked ? "bg-purple-500 text-slate-950" : "bg-slate-800 text-slate-400"
                          }`}>
                            {lvl}
                          </span>
                          {meta.name}
                        </span>
                        <span className="text-[10px] font-mono text-purple-300">
                          {meta.autonomyRetentionPercent}% Autonomia
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                        {meta.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Doubt Input Box */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-medium text-slate-300">Descreva sua Dúvida ou Bloqueio:</label>
                <textarea
                  rows={3}
                  value={studentDoubt}
                  onChange={(e) => setStudentDoubt(e.target.value)}
                  placeholder="Ex: Não entendi como estruturar a condição para a segunda faixa de desconto..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-sans text-xs resize-none"
                />
                <button
                  onClick={() => handleRequestHint(selectedLevel)}
                  disabled={loadingHint}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingHint ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Pedir Dica no Nível {selectedLevel}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor & Socratic Guidance Card */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Active Socratic Response Card */}
            {currentHint ? (
              <div className="rounded-2xl border border-purple-500/40 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-mono font-bold">
                      {currentHint.levelMeta.badge}
                    </span>
                    <h2 className="text-sm font-bold text-white">{currentHint.title}</h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(currentHint.generatedAt).toLocaleTimeString("pt-BR")}
                  </span>
                </div>

                {/* Socratic Inquiry Highlight */}
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-purple-300 uppercase tracking-wider font-mono text-[10px]">Reflexão Socrática:</span>
                    <p className="text-slate-200 font-medium text-sm leading-relaxed italic">"{currentHint.socraticInquiry}"</p>
                  </div>
                </div>

                {/* Guidance Details */}
                <div className="space-y-1 text-xs text-slate-300 font-sans leading-relaxed">
                  <span className="font-mono font-bold text-slate-400 uppercase text-[10px]">Orientação Didática:</span>
                  <p className="whitespace-pre-line">{currentHint.guidanceMessage}</p>
                </div>

                {/* Code Scaffold Snippet (if level >= 3) */}
                {currentHint.codeScaffoldSnippet && (
                  <div className="space-y-1">
                    <span className="font-mono font-bold text-slate-400 uppercase text-[10px]">Esqueleto de Scaffolding Sugerido:</span>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[180px] scrollbar-thin">
                      {currentHint.codeScaffoldSnippet}
                    </pre>
                  </div>
                )}

                {/* Encouragement Footer */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 font-sans flex items-center justify-between">
                  <span>💡 {currentHint.nextStepEncouragement}</span>
                  <button
                    onClick={() => {
                      if (selectedLevel < 4) {
                        handleRequestHint((selectedLevel + 1) as ScaffoldingLevel);
                      }
                    }}
                    disabled={selectedLevel >= 4}
                    className="text-xs font-mono font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    Avançar para o Degrau {Math.min(selectedLevel + 1, 4)} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto opacity-60" />
                <h3 className="text-sm font-bold text-slate-300">Nenhuma Dica Solicitada Ainda</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Clique no <strong className="text-purple-400">Nível 1 (Questionamento Socrático)</strong> ao lado para receber orientações sem penalizar sua autonomia.
                </p>
              </div>
            )}

            {/* Student Monaco / Code Workspace */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" /> Editor de Resolução do Estudante
                </span>
                <span className="text-[10px] font-mono text-slate-500">TypeScript / Sandbox Live</span>
              </div>

              <textarea
                rows={10}
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500 resize-none scrollbar-thin"
              />
            </div>

          </div>
        </div>
      )}

      {/* Mode 2: Teacher Radar & Telemetry */}
      {activeViewMode === "teacher_radar" && classRadar && (
        <div className="space-y-6">
          {/* Radar Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Média de Autonomia</span>
              <div className="text-2xl font-black font-mono text-emerald-400">{classRadar.averageAutonomyIndex}%</div>
              <p className="text-[10px] text-slate-500">Média ponderada da turma em 42 sessões</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Degrau 1 (Reflexão)</span>
              <div className="text-2xl font-black font-mono text-blue-400">{classRadar.levelDistribution.level1}</div>
              <p className="text-[10px] text-slate-500">Estudantes resolveram com apenas 1 pergunta</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Degrau 2 (Conceitual)</span>
              <div className="text-2xl font-black font-mono text-purple-400">{classRadar.levelDistribution.level2}</div>
              <p className="text-[10px] text-slate-500">Precisaram de dica de estratégia lógica</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Degrau 4 (Intervenção)</span>
              <div className="text-2xl font-black font-mono text-amber-400">{classRadar.levelDistribution.level4}</div>
              <p className="text-[10px] text-slate-500">Necessitaram de apontamento direto de bug</p>
            </div>
          </div>

          {/* Struggling Topics & Interventions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Tópicos com Maior Travamento & Recomendações Docentes
              </span>
              <span className="text-[10px] font-mono text-slate-500">Mapeamento Inteligente</span>
            </div>

            <div className="space-y-3">
              {classRadar.topStrugglingTopics.map((topic, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{topic.topic}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                        {topic.level4RequestsCount} pedidos de ajuda direta
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">
                      <strong className="text-slate-300">Intervenção Sugerida:</strong> {topic.recommendedIntervention}
                    </p>
                  </div>

                  <button
                    onClick={() => toast.success(`Plano de aula corretivo agendado para o tópico "${topic.topic}"!`)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold shrink-0 transition-all cursor-pointer"
                  >
                    Agendar Recuperação
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

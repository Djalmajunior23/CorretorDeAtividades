import React, { useState, useEffect } from "react";
import { 
  Brain, 
  Sparkles, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Award, 
  ChevronRight, 
  Send, 
  RefreshCw, 
  FileText, 
  Download, 
  Cpu, 
  Flame, 
  Zap, 
  ShieldCheck, 
  HelpCircle, 
  Eye, 
  Terminal, 
  Activity, 
  Search, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  DeepLearningAcademyService, 
  MasteryConceptNode, 
  SocraticInquirySession, 
  MentalDebuggerStep, 
  SpacedRepetitionCard, 
  TradeOffRefactoringChallenge, 
  MasteryPassportReport 
} from "../services/deepLearningAcademyService";
import { apiUrl } from "../config/api";

interface StudentAcademyMasteryViewProps {
  studentId?: string;
  studentName?: string;
  courseName?: string;
}

export const StudentAcademyMasteryView: React.FC<StudentAcademyMasteryViewProps> = ({
  studentId = "st-01",
  studentName = "Ana Beatriz Silva",
  courseName = "Técnico em Desenvolvimento de Sistemas - SENAI"
}) => {
  const [activeTab, setActiveTab] = useState<"graph" | "socratic" | "debugger" | "spaced_repetition" | "tradeoffs" | "passport">("graph");

  // Domain Concept Nodes State
  const [concepts, setConcepts] = useState<MasteryConceptNode[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<MasteryConceptNode | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>("all");

  // Socratic Inquiry State
  const [activeSession, setActiveSession] = useState<SocraticInquirySession | null>(null);
  const [studentAnswer, setStudentAnswer] = useState<string>("");
  const [isEvaluatingStep, setIsEvaluatingStep] = useState<boolean>(false);

  // Mental Debugger State
  const [debuggerSteps, setDebuggerSteps] = useState<MentalDebuggerStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [predictionSubmitted, setPredictionSubmitted] = useState<boolean>(false);

  // Spaced Repetition State
  const [cards, setCards] = useState<SpacedRepetitionCard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState<number>(0);
  const [showCardAnswer, setShowCardAnswer] = useState<boolean>(false);

  // Trade-off Dojo State
  const [tradeOffs, setTradeOffs] = useState<TradeOffRefactoringChallenge[]>([]);
  const [selectedTradeOff, setSelectedTradeOff] = useState<TradeOffRefactoringChallenge | null>(null);

  // Export State
  const [exportingPassport, setExportingPassport] = useState<boolean>(false);

  // Load initial dataset
  useEffect(() => {
    const initialNodes = DeepLearningAcademyService.getInitialConceptNodes();
    setConcepts(initialNodes);
    setSelectedConcept(initialNodes[0]);

    const initialSteps = DeepLearningAcademyService.simulateMentalDebugger("demo");
    setDebuggerSteps(initialSteps);

    const initialCards = DeepLearningAcademyService.getSpacedRepetitionDeck();
    setCards(initialCards);

    const initialTradeOffs = DeepLearningAcademyService.getTradeOffChallenges();
    setTradeOffs(initialTradeOffs);
    setSelectedTradeOff(initialTradeOffs[0]);
  }, []);

  // Socratic Handlers
  const handleStartSocraticSession = async (node: MasteryConceptNode) => {
    try {
      setActiveTab("socratic");
      const session = await DeepLearningAcademyService.startSocraticInquiry({
        studentId,
        conceptId: node.id,
        conceptTitle: node.title
      });
      setActiveSession(session);
      toast.success(`Mergulho Socrático iniciado em "${node.title}"!`);
    } catch (err: any) {
      toast.error("Erro ao iniciar sessão socrática: " + err.message);
    }
  };

  const handleSendSocraticAnswer = async () => {
    if (!activeSession || !studentAnswer.trim()) return;
    setIsEvaluatingStep(true);
    try {
      const updated = await DeepLearningAcademyService.evaluateSocraticStep({
        session: activeSession,
        studentResponse: studentAnswer
      });
      setActiveSession(updated);
      setStudentAnswer("");
      if (updated.currentStage === "completed") {
        toast.success("✓ Domínio Conceitual Validado com Sucesso!");
      }
    } catch (e: any) {
      toast.error("Erro ao processar resposta: " + e.message);
    } finally {
      setIsEvaluatingStep(false);
    }
  };

  // Spaced Repetition Rating
  const handleRateCard = (quality: number) => {
    if (cards.length === 0) return;
    const currentCard = cards[currentCardIdx];
    const updatedCard = DeepLearningAcademyService.reviewCard(currentCard, quality);
    
    setCards(prev => prev.map((c, i) => i === currentCardIdx ? updatedCard : c));
    setShowCardAnswer(false);
    
    if (currentCardIdx < cards.length - 1) {
      setCurrentCardIdx(prev => prev + 1);
    } else {
      toast.success("🎉 Todas as cartas de active recall de hoje foram revisadas!");
      setCurrentCardIdx(0);
    }
  };

  // Passport PDF Export
  const handleExportPassport = () => {
    setExportingPassport(true);
    try {
      const report: MasteryPassportReport = {
        studentId,
        studentName,
        courseName,
        overallMasteryPercentage: Math.round(concepts.reduce((acc, c) => acc + c.masteryScore, 0) / concepts.length),
        deepConcepts: concepts.map(c => ({ concept: c.title, score: c.masteryScore, level: c.cognitiveDepthLevel })),
        verifiedHours: 34,
        socraticSynthesesCount: 8,
        pedagogicalEndorsement: "O estudante demonstrou excelência no raciocínio causal, domínio de complexidade assintótica e adesão a princípios arquiteturais modernos.",
        hashVerification: `SENAI-MASTERY-${Date.now().toString(36).toUpperCase()}`,
        issuedAt: new Date().toISOString()
      };

      const pdfBuffer = DeepLearningAcademyService.exportMasteryPassportPdf(report);
      const blob = new Blob([new Uint8Array(pdfBuffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Passaporte_Dominio_SENAI_${studentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Passaporte de Domínio SENAI exportado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar passaporte PDF: " + err.message);
    } finally {
      setExportingPassport(false);
    }
  };

  const domains = ["all", ...Array.from(new Set(concepts.map(c => c.domain)))];
  const filteredConcepts = filterDomain === "all" ? concepts : concepts.filter(c => c.domain === filterDomain);
  const avgMastery = concepts.length > 0 ? Math.round(concepts.reduce((a, c) => a + c.masteryScore, 0) / concepts.length) : 85;

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6 max-w-7xl mx-auto">
      
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-2xl p-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/20">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">CiberAcademy • Aprendizado Profundo</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Domínio Cognitivo
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-1">
                Ambiente de Aprendizagem Conceitual, Raciocínio Causal e Modelos Mentais de Alta Complexidade.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Estudante: <span className="text-white font-medium">{studentName}</span> • {courseName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPassport}
              disabled={exportingPassport}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              {exportingPassport ? "Gerando Passaporte..." : "Emitir Passaporte de Domínio (PDF)"}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("graph")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "graph"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Layers className="w-4 h-4" />
          Mapa de Domínio ({concepts.length})
        </button>

        <button
          onClick={() => setActiveTab("socratic")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "socratic"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Brain className="w-4 h-4 text-purple-400" />
          Mergulho Socrático IA
        </button>

        <button
          onClick={() => setActiveTab("debugger")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "debugger"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          Debugger Mental & Memória
        </button>

        <button
          onClick={() => setActiveTab("spaced_repetition")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "spaced_repetition"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          Repetição Espaçada (SM-2)
        </button>

        <button
          onClick={() => setActiveTab("tradeoffs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "tradeoffs"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          Dojo de Trade-Offs & Refatoração
        </button>
      </div>

      {/* TAB 1: KNOWLEDGE GRAPH & DOMAIN MAP */}
      {activeTab === "graph" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Concept List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Conceitos Estruturantes
              </span>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-[11px] text-white rounded-lg px-2.5 py-1"
              >
                {domains.map(d => (
                  <option key={d} value={d}>{d === "all" ? "Todos os Domínios" : d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto scrollbar-thin pr-1">
              {filteredConcepts.map((c) => {
                const isSelected = selectedConcept?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConcept(c)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-semibold text-indigo-400 uppercase tracking-wider">{c.domain}</span>
                        <h3 className="text-sm font-bold text-white mt-0.5">{c.title}</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {c.masteryScore}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full" style={{ width: `${c.masteryScore}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5">
                      <span>{c.verifiedPractices} práticas validadas</span>
                      <span className="text-indigo-300 font-medium flex items-center gap-1">
                        Ver Modelo Mental <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Mental Model Inspector */}
          <div className="lg:col-span-7">
            {selectedConcept ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-400">{selectedConcept.domain}</span>
                    <h2 className="text-xl font-bold text-white mt-0.5">{selectedConcept.title}</h2>
                  </div>
                  <button
                    onClick={() => handleStartSocraticSession(selectedConcept)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    <Brain className="w-4 h-4" />
                    Iniciar Sabatina Socrática
                  </button>
                </div>

                {/* Core Intuition */}
                <div className="space-y-1.5 p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Intuição & Mecanismo Central
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{selectedConcept.mentalModel.coreIntuition}</p>
                </div>

                {/* Real World Analogy */}
                <div className="space-y-1.5 p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Analogia do Mundo Real
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{selectedConcept.mentalModel.realWorldAnalogy}</p>
                </div>

                {/* Why It Works */}
                <div className="space-y-1.5 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Por Que Funciona na Engenharia?
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{selectedConcept.mentalModel.whyItWorks}</p>
                </div>

                {/* Gotchas and Anti-patterns */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Armadilhas & Falácias Frequentes
                  </span>
                  <div className="space-y-1.5">
                    {selectedConcept.mentalModel.failureGotchas.map((g, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Selecione um conceito para visualizar seu modelo mental
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SOCRATIC INQUIRY LAB */}
      {activeTab === "socratic" && (
        <div className="max-w-4xl mx-auto space-y-6">
          {activeSession ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-indigo-400">Sessão Socrática de Aprendizado</span>
                  <h2 className="text-xl font-bold text-white">{activeSession.conceptTitle}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Profundidade: {activeSession.depthScore}%
                  </span>
                </div>
              </div>

              {/* Chat Conversation */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
                {activeSession.conversationHistory.map((msg, idx) => {
                  const isMentor = msg.role === "mentor";
                  return (
                    <div key={idx} className={`flex gap-3 ${isMentor ? "justify-start" : "justify-end"}`}>
                      {isMentor && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1">
                          <Brain className="w-4 h-4" />
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                        isMentor 
                          ? "bg-slate-800/80 border border-slate-700 text-slate-100 rounded-tl-sm whitespace-pre-line" 
                          : "bg-indigo-600 text-white rounded-tr-sm shadow-md"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Box */}
              {activeSession.currentStage !== "completed" ? (
                <div className="space-y-3 pt-2">
                  <textarea
                    rows={3}
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder="Elabore sua resposta explicando o 'porquê' e os mecanismos causais..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Responda com suas próprias palavras para validar o raciocínio causal.
                    </span>
                    <button
                      onClick={handleSendSocraticAnswer}
                      disabled={isEvaluatingStep || !studentAnswer.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isEvaluatingStep ? "Avaliando..." : "Submeter ao Mentor IA"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Sessão Concluída com Sucesso!</h3>
                  <p className="text-xs text-slate-300">Seu raciocínio causal foi registrado com louvor no passaporte de proficiência.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center border border-slate-800 bg-slate-900/60 rounded-2xl space-y-3">
              <Brain className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhuma Sessão Socrática Ativa</h3>
              <p className="text-xs text-slate-400">Selecione qualquer conceito na aba "Mapa de Domínio" e clique em "Iniciar Sabatina Socrática".</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MENTAL DEBUGGER & MEMORY SIMULATOR */}
      {activeTab === "debugger" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" /> Rastreamento de Execução & Linha de Código
                </span>
                <span className="text-xs font-mono text-cyan-400">Passo {currentStepIdx + 1} de {debuggerSteps.length}</span>
              </div>

              {debuggerSteps[currentStepIdx] && (
                <div className="space-y-4">
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300">
                    {debuggerSteps[currentStepIdx].lineCode}
                  </pre>
                  
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    {debuggerSteps[currentStepIdx].explanation}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setCurrentStepIdx(prev => Math.max(0, prev - 1));
                        setPredictionSubmitted(false);
                      }}
                      disabled={currentStepIdx === 0}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white disabled:opacity-40 cursor-pointer"
                    >
                      ← Passo Anterior
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStepIdx(prev => Math.min(debuggerSteps.length - 1, prev + 1));
                        setPredictionSubmitted(false);
                      }}
                      disabled={currentStepIdx === debuggerSteps.length - 1}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Próximo Passo →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Predictive Question */}
            {debuggerSteps[currentStepIdx]?.predictionQuestion && (
              <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-400" /> Desafio de Predição Cognitiva
                </span>
                <p className="text-xs text-white font-medium">{debuggerSteps[currentStepIdx].predictionQuestion!.question}</p>

                <div className="space-y-2 pt-1">
                  {debuggerSteps[currentStepIdx].predictionQuestion!.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedOption(idx);
                        setPredictionSubmitted(true);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                        predictionSubmitted
                          ? idx === debuggerSteps[currentStepIdx].predictionQuestion!.correctIndex
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                            : selectedOption === idx
                            ? "bg-rose-500/20 border-rose-500 text-rose-300"
                            : "bg-slate-900/60 border-slate-800 text-slate-400"
                          : "bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {predictionSubmitted && (
                  <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 mt-2">
                    💡 {debuggerSteps[currentStepIdx].predictionQuestion!.explanation}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Memory & Call Stack State */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" /> Estado da Memória (Stack & Heap)
              </span>

              {debuggerSteps[currentStepIdx] && (
                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Call Stack:</span>
                    <div className="mt-1 space-y-1">
                      {debuggerSteps[currentStepIdx].callStack.map((frame, i) => (
                        <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800 text-indigo-300">
                          {frame}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Alocações na Heap:</span>
                    <pre className="mt-1 p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400 overflow-x-auto">
                      {JSON.stringify(debuggerSteps[currentStepIdx].heapAllocations, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Variáveis de Escopo:</span>
                    <pre className="mt-1 p-2 rounded bg-slate-950 border border-slate-800 text-amber-300 overflow-x-auto">
                      {JSON.stringify(debuggerSteps[currentStepIdx].scopeVariables, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SPACED REPETITION (SM-2) */}
      {activeTab === "spaced_repetition" && (
        <div className="max-w-2xl mx-auto space-y-6">
          {cards.length > 0 && cards[currentCardIdx] && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-amber-400">{cards[currentCardIdx].topic}</span>
                <span className="text-xs font-mono text-slate-400">Card {currentCardIdx + 1} de {cards.length}</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">{cards[currentCardIdx].question}</h3>
                {cards[currentCardIdx].codeSnippet && (
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300">
                    {cards[currentCardIdx].codeSnippet}
                  </pre>
                )}
              </div>

              {!showCardAnswer ? (
                <button
                  onClick={() => setShowCardAnswer(true)}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Revelar Resposta & Armadilha Conceitual
                </button>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                    <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Armadilha Frequente:</span>
                    <p>{cards[currentCardIdx].conceptualTrap}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                    <span className="font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Explicação Profunda:</span>
                    <p>{cards[currentCardIdx].deepExplanation}</p>
                  </div>

                  <div className="pt-2">
                    <span className="block text-center text-xs text-slate-400 mb-2">Como foi sua retenção deste conceito?</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleRateCard(1)}
                        className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer"
                      >
                        Difícil (Repetir Hoje)
                      </button>
                      <button
                        onClick={() => handleRateCard(3)}
                        className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
                      >
                        Bom (Revisar em breve)
                      </button>
                      <button
                        onClick={() => handleRateCard(5)}
                        className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-pointer"
                      >
                        Fácil (Dominado!)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TRADEOFFS & REFACTORING DOJO */}
      {activeTab === "tradeoffs" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">Desafios de Arquitetura & Otimização</span>
            {tradeOffs.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTradeOff(t)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedTradeOff?.id === t.id
                    ? "bg-slate-800 border-indigo-500 shadow-lg"
                    : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/40"
                }`}
              >
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300">
                  {t.tradeOffAxis}
                </span>
                <h3 className="text-sm font-bold text-white mt-1">{t.title}</h3>
              </div>
            ))}
          </div>

          <div className="lg:col-span-7">
            {selectedTradeOff && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
                <div>
                  <span className="text-xs font-mono text-indigo-400">{selectedTradeOff.tradeOffAxis}</span>
                  <h2 className="text-lg font-bold text-white">{selectedTradeOff.title}</h2>
                  <p className="text-xs text-slate-300 mt-1">{selectedTradeOff.scenario}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-rose-400">Implementação Ingênua (Subótima):</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                    {selectedTradeOff.naiveCode}
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">Solução Otimizada & Análise de Trade-off:</span>
                  {selectedTradeOff.optimalSolutions.map((sol, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
                        <span>{sol.paradigm}</span>
                        <span className="text-emerald-400 font-bold">{sol.timeComplexity} | {sol.spaceComplexity}</span>
                      </div>
                      <pre className="text-xs font-mono text-slate-200">{sol.code}</pre>
                      <p className="text-xs text-slate-400 pt-1 border-t border-slate-850">{sol.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentAcademyMasteryView;

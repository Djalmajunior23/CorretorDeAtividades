import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  Monitor,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  HelpCircle,
  Award,
  Flame,
  Zap,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Radio,
  Copy,
  Check,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Plus,
  Sliders,
  FileCheck,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  TeacherLiveLabCompanionService,
  StudentDesk,
  LabLayoutConfig,
  StuckTicket,
  LabClosingSummary
} from "../services/teacherLiveLabCompanionService";

export default function TeacherLiveLabCompanionView() {
  const [initialData] = useState(() => TeacherLiveLabCompanionService.getInitialLabState());
  const [layout, setLayout] = useState<LabLayoutConfig>(initialData.layout);
  const [desks, setDesks] = useState<StudentDesk[]>(initialData.desks);
  const [tickets, setTickets] = useState<StuckTicket[]>(initialData.tickets);
  const [selectedDesk, setSelectedDesk] = useState<StudentDesk | null>(initialData.desks[2] || null);

  // Quick evidence note input
  const [noteInput, setNoteInput] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isLabPaused, setIsLabPaused] = useState(false);

  // Broadcast banner
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [activeBroadcast, setActiveBroadcast] = useState<string | null>(null);

  // Closing Debrief State
  const [isGeneratingDebrief, setIsGeneratingDebrief] = useState(false);
  const [debriefResult, setDebriefResult] = useState<LabClosingSummary | null>(null);

  // Active micro-hint in ticket modal
  const [activeHintTicketId, setActiveHintTicketId] = useState<string | null>(null);
  const [generatedHintText, setGeneratedHintText] = useState<string | null>(null);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Handlers
  const handleDeskClick = (desk: StudentDesk) => {
    if (desk.studentId.startsWith("empty-")) return;
    setSelectedDesk(desk);
  };

  const handleAddBadge = (badge: string) => {
    if (!selectedDesk) return;
    const updatedDesks = desks.map(d =>
      d.deskId === selectedDesk.deskId
        ? { ...d, badgesEarnedToday: [...d.badgesEarnedToday.filter(b => b !== badge), badge] }
        : d
    );
    setDesks(updatedDesks);
    setSelectedDesk({ ...selectedDesk, badgesEarnedToday: [...selectedDesk.badgesEarnedToday.filter(b => b !== badge), badge] });
    toast.success(`Selo '${badge}' atribuído a ${selectedDesk.studentName}!`);
  };

  const handleAddNote = () => {
    if (!selectedDesk || !noteInput.trim()) return;
    const updatedDesks = desks.map(d =>
      d.deskId === selectedDesk.deskId ? { ...d, quickNotes: [...d.quickNotes, noteInput.trim()] } : d
    );
    setDesks(updatedDesks);
    setSelectedDesk({ ...selectedDesk, quickNotes: [...selectedDesk.quickNotes, noteInput.trim()] });
    setNoteInput("");
    toast.success("Evidência pedagógica registrada com sucesso!");
  };

  const handleResolveTicket = (ticketId: string) => {
    const ticket = tickets.find(t => t.ticketId === ticketId);
    if (!ticket) return;

    setTickets(tickets.filter(t => t.ticketId !== ticketId));

    // Update desk status to smooth
    const updatedDesks = desks.map(d =>
      d.deskNumber === ticket.deskNumber ? { ...d, status: "smooth" as const, stuckReason: undefined } : d
    );
    setDesks(updatedDesks);
    if (selectedDesk?.deskNumber === ticket.deskNumber) {
      setSelectedDesk({ ...selectedDesk, status: "smooth", stuckReason: undefined });
    }
    toast.success(`Dúvida de ${ticket.studentName} (Bancada ${ticket.deskNumber}) marcada como atendida!`);
  };

  const handleSendMicroHint = async (ticket: StuckTicket) => {
    try {
      const hint = await TeacherLiveLabCompanionService.generateSocraticMicroHint({
        studentName: ticket.studentName,
        doubtSummary: ticket.doubtSummary,
        codeSnippet: ticket.errorCodeSnippet
      });
      setGeneratedHintText(hint.hintText);
      setActiveHintTicketId(ticket.ticketId);

      // Update ticket status
      setTickets(tickets.map(t => (t.ticketId === ticket.ticketId ? { ...t, status: "hint_sent" } : t)));
      toast.success(`Micro-Dica Socrática enviada para a tela da Bancada ${ticket.deskNumber}!`);
    } catch {
      toast.error("Erro ao gerar micro-dica.");
    }
  };

  const handleDispatchMentor = (ticket: StuckTicket) => {
    if (!ticket.suggestedPeerMentor) return;

    setTickets(tickets.map(t => (t.ticketId === ticket.ticketId ? { ...t, status: "mentor_assigned" } : t)));

    // Set mentor status
    setDesks(
      desks.map(d =>
        d.deskNumber === ticket.suggestedPeerMentor?.deskNumber
          ? { ...d, status: "mentoring" as const, activeTaskTitle: `Mentoria: Bancada ${ticket.deskNumber}` }
          : d
      )
    );

    toast.success(
      `Mentor ${ticket.suggestedPeerMentor.studentName} (Bancada ${ticket.suggestedPeerMentor.deskNumber}) acionado para apoiar ${ticket.studentName}!`
    );
  };

  const handleBroadcastMessage = () => {
    if (!broadcastMessage.trim()) return;
    setActiveBroadcast(broadcastMessage.trim());
    setBroadcastMessage("");
    toast.success("Comunicado transmitido para todas as bancadas do laboratório!");
  };

  const handleToggleLabPause = () => {
    setIsLabPaused(!isLabPaused);
    if (!isLabPaused) {
      toast.warning("Laboratório pausado para alinhamento pedagógico geral no telão!");
    } else {
      toast.success("Laboratório retomado!");
    }
  };

  const handleGenerateDebrief = async () => {
    setIsGeneratingDebrief(true);
    try {
      const debrief = await TeacherLiveLabCompanionService.generateLabClosingDebrief({
        theme: layout.activeSessionTheme,
        desks,
        ticketsResolvedCount: initialData.tickets.length - tickets.length + 3
      });
      setDebriefResult(debrief);
      toast.success("Dossiê de Fechamento da Aula sintetizado com sucesso!");
    } catch {
      toast.error("Erro ao gerar fechamento.");
    } finally {
      setIsGeneratingDebrief(false);
    }
  };

  const counts = {
    smooth: desks.filter(d => d.status === "smooth" && !d.studentId.startsWith("empty-")).length,
    attention: desks.filter(d => d.status === "attention").length,
    stuck: desks.filter(d => d.status === "stuck").length,
    completed: desks.filter(d => d.status === "completed").length,
    mentoring: desks.filter(d => d.status === "mentoring").length
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col gap-6">
      {/* HEADER: LIVE LAB HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-indigo-950/60 border border-teal-500/30 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1.5 shadow-sm">
                <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                MODO BANCADA & LAB COMPANION (AO VIVO)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {layout.labName}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Monitor className="w-8 h-8 text-teal-400 drop-shadow-md" />
              Painel do Dia a Dia & Mapa de Bancadas
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              Tema Atual: <strong className="text-white">{layout.activeSessionTheme}</strong>
            </p>
          </div>

          {/* POMODORO TIMER & LAB GOD CONTROLS */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <Clock className="w-4 h-4 text-teal-400" />
              <span className="font-mono text-lg font-black text-white">{formatTime(timerSeconds)}</span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                title={isTimerRunning ? "Pausar Cronômetro" : "Iniciar Cronômetro"}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={handleToggleLabPause}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isLabPaused
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              {isLabPaused ? "▶️ Retomar Lab" : "⏸️ Pausar Lab (3 min)"}
            </button>

            <button
              onClick={() => toast.success("Desafio Boss Challenge liberado para toda a turma!")}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" /> Liberar Boss Challenge
            </button>
          </div>
        </div>

        {/* ACTIVE BROADCAST BANNER */}
        {activeBroadcast && (
          <div className="mt-4 p-3 bg-teal-500/15 border border-teal-500/30 rounded-xl flex items-center justify-between text-xs text-teal-200 animate-fade-in">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                <strong>Aviso Geral Transmitido:</strong> {activeBroadcast}
              </span>
            </div>
            <button
              onClick={() => setActiveBroadcast(null)}
              className="text-[11px] text-teal-400 hover:text-white underline font-mono"
            >
              Dispensar
            </button>
          </div>
        )}
      </div>

      {/* QUICK STATUS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">Em Fluxo</span>
          </div>
          <span className="text-lg font-black text-emerald-400">{counts.smooth}</span>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs font-bold text-slate-300">Atenção</span>
          </div>
          <span className="text-lg font-black text-amber-400">{counts.attention}</span>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-rose-300">Travados ("Mão Levantada")</span>
          </div>
          <span className="text-lg font-black text-rose-400">{counts.stuck}</span>
        </div>

        <div className="bg-slate-900/80 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold text-slate-300">Concluídos</span>
          </div>
          <span className="text-lg font-black text-indigo-400">{counts.completed}</span>
        </div>

        <div className="bg-slate-900/80 border border-purple-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs font-bold text-slate-300">Em Mentoria</span>
          </div>
          <span className="text-lg font-black text-purple-400">{counts.mentoring}</span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN: VISUAL DESK GRID MAP (MAPA DE BANCADAS) */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-teal-400" />
                <h2 className="text-sm font-bold text-white">
                  Mapa Visual de Bancadas ({layout.rows} fileiras × {layout.cols} mesas)
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>Clique em qualquer bancada para abrir o inspetor ao vivo</span>
              </div>
            </div>

            {/* DESK GRID */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {desks.map(desk => {
                const isSelected = selectedDesk?.deskId === desk.deskId;
                const isEmpty = desk.studentId.startsWith("empty-");
                const isStuck = desk.status === "stuck";
                const isAttention = desk.status === "attention";
                const isCompleted = desk.status === "completed";
                const isMentoring = desk.status === "mentoring";

                return (
                  <motion.div
                    key={desk.deskId}
                    whileHover={{ scale: isEmpty ? 1 : 1.03 }}
                    whileTap={{ scale: isEmpty ? 1 : 0.98 }}
                    onClick={() => handleDeskClick(desk)}
                    className={`relative p-3 rounded-xl border flex flex-col justify-between min-h-[110px] transition-all cursor-pointer ${
                      isEmpty
                        ? "bg-slate-950/40 border-slate-800/40 opacity-40 cursor-default"
                        : isSelected
                        ? "bg-slate-800/95 border-teal-400 ring-2 ring-teal-500/30 shadow-lg shadow-teal-950"
                        : isStuck
                        ? "bg-rose-950/30 border-rose-500/60 hover:border-rose-400 shadow-md shadow-rose-950/40"
                        : isAttention
                        ? "bg-amber-950/30 border-amber-500/50 hover:border-amber-400"
                        : isCompleted
                        ? "bg-indigo-950/30 border-indigo-500/40 hover:border-indigo-300"
                        : isMentoring
                        ? "bg-purple-950/30 border-purple-500/40 hover:border-purple-300"
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Top Desk Number & Status Indicator */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black text-slate-400">
                        #{desk.deskNumber.toString().padStart(2, "0")}
                      </span>
                      {!isEmpty && (
                        <div className="flex items-center gap-1">
                          {isStuck && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isStuck
                                ? "bg-rose-500"
                                : isAttention
                                ? "bg-amber-500"
                                : isCompleted
                                ? "bg-indigo-400"
                                : isMentoring
                                ? "bg-purple-400"
                                : "bg-emerald-500"
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Student Name and Task */}
                    <div className="my-1">
                      <h4 className="text-xs font-bold text-white truncate" title={desk.studentName}>
                        {desk.studentName}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{desk.activeTaskTitle}</p>
                    </div>

                    {/* Bottom Badges or Stuck Alert */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[9px] font-mono text-slate-400">
                      {isStuck ? (
                        <span className="text-rose-300 font-bold flex items-center gap-0.5 truncate">
                          ⚠️ Travado {desk.stuckTimestamp}
                        </span>
                      ) : desk.badgesEarnedToday.length > 0 ? (
                        <span className="truncate">{desk.badgesEarnedToday[0]}</span>
                      ) : (
                        <span>{desk.compilationErrorsCount > 0 ? `${desk.compilationErrorsCount} erros` : "Normal"}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* BROADCAST MESSAGE BAR */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 shadow-xl">
            <input
              type="text"
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              placeholder="Digite uma dica ou aviso rápido para projetar no telão e estações..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={handleBroadcastMessage}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-md"
            >
              <Radio className="w-3.5 h-3.5" /> Transmitir
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: DESK INSPECTOR & STUCK TICKETS QUEUE */}
        <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
          {/* STUCK TICKETS QUEUE (FILA DE DÚVIDAS) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Fila "Estou Travado" ({tickets.length})</h3>
              </div>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                Triagem IA
              </span>
            </div>

            {tickets.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {tickets.map(ticket => (
                  <div
                    key={ticket.ticketId}
                    className="p-3 bg-slate-950 rounded-xl border border-rose-500/30 flex flex-col gap-2.5 text-xs shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        Bancada #{ticket.deskNumber} • {ticket.studentName}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">há {ticket.waitingMinutes} min</span>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-snug">{ticket.doubtSummary}</p>

                    {/* AI Diagnostic Pre-Triage */}
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-teal-300/90">
                      💡 <strong>Diagnóstico IA:</strong> {ticket.aiDiagnosticSuggestion}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        onClick={() => handleSendMicroHint(ticket)}
                        className="py-1 px-2.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-[11px] font-bold text-teal-300 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Micro-Dica IA
                      </button>

                      {ticket.suggestedPeerMentor && (
                        <button
                          onClick={() => handleDispatchMentor(ticket)}
                          className="py-1 px-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-[11px] font-bold text-purple-300 flex items-center gap-1"
                        >
                          <Users className="w-3 h-3" /> Chamar {ticket.suggestedPeerMentor.studentName.split(" ")[0]}
                        </button>
                      )}

                      <button
                        onClick={() => handleResolveTicket(ticket.ticketId)}
                        className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white flex items-center gap-1 ml-auto"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Atendido
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                Nenhum aluno travado no momento. A turma está em pleno fluxo! 🚀
              </div>
            )}
          </div>

          {/* DESK INSPECTOR & EVIDENCE LOGGER */}
          {selectedDesk && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-teal-400 uppercase">Inspecionando Bancada #{selectedDesk.deskNumber}</span>
                  <h3 className="text-sm font-bold text-white">{selectedDesk.studentName}</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedDesk.activeTaskTitle}
                </span>
              </div>

              {/* Quick Code Preview */}
              {selectedDesk.currentCodeSnippet && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-slate-400">Terminal & Código da Bancada:</span>
                  <div className="h-28 rounded-lg overflow-hidden border border-slate-800">
                    <Editor
                      height="100%"
                      language="javascript"
                      theme="vs-dark"
                      value={selectedDesk.currentCodeSnippet}
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 11 }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Badge Stamp */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Carimbar Selo de Evidência Prática:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["⚡ Resolução Rápida", "🛡️ Clean Code", "💡 Criatividade", "🤝 Colaboração", "🎓 Mentor do Dia"].map(
                    badge => (
                      <button
                        key={badge}
                        onClick={() => handleAddBadge(badge)}
                        className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                          selectedDesk.badgesEarnedToday.includes(badge)
                            ? "bg-teal-500/30 border-teal-400 text-teal-200 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        {badge}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Quick Pedagogical Note Memo */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Nota Rápida do Professor (Portfólio):</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Ex: Demonstrou clareza ao explicar o middleware..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={handleAddNote}
                    className="py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white"
                  >
                    Salvar
                  </button>
                </div>

                {selectedDesk.quickNotes.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {selectedDesk.quickNotes.map((note, i) => (
                      <div key={i} className="text-[10px] text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800">
                        📝 {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CLOSING DEBRIEF BUTTON & SUMMARY */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <button
              onClick={handleGenerateDebrief}
              disabled={isGeneratingDebrief}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isGeneratingDebrief ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
              Gerar Dossiê de Fechamento da Aula
            </button>

            {debriefResult && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-teal-500/30 flex flex-col gap-2 text-xs">
                <span className="font-bold text-teal-300">Fechamento do Dia • {debriefResult.date}</span>
                <p className="text-slate-300 text-[11px]">
                  <strong>Dúvida Principal:</strong> {debriefResult.topRecurringDoubt}
                </p>
                <p className="text-slate-300 text-[11px]">
                  <strong>Recap Próxima Aula:</strong> {debriefResult.recommendedNextClassRecap}
                </p>
                <div className="border-t border-slate-800 pt-1.5 text-[10px] text-slate-400">
                  {debriefResult.highlightStudents.map((h, i) => (
                    <div key={i}>
                      ⭐ <strong className="text-white">{h.name}:</strong> {h.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

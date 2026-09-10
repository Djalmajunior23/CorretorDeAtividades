import React, { useState, useEffect } from "react";
import {
  Zap,
  Award,
  Trophy,
  Swords,
  Users,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  Code2,
  Flame,
  Star
} from "lucide-react";
import { toast } from "sonner";
import {
  CodeArenaService,
  ArenaRoom,
  ArenaChallenge,
  DuelSubmissionResult,
  LeaderboardEntry,
  ArenaMode
} from "../services/codeArenaService";

export default function CodeArenaView() {
  const [activeTab, setActiveTab] = useState<"arena" | "leaderboard">("arena");
  const [mode, setMode] = useState<ArenaMode>("1v1_duel");
  const [language, setLanguage] = useState("python");
  const [currentRoom, setCurrentRoom] = useState<ArenaRoom | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [duelistCode, setDuelistCode] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<DuelSubmissionResult | null>(null);

  // Initialize room and leaderboard
  const initArena = async () => {
    try {
      const res = await fetch("/api/code-arena/room/arena_demo_live");
      const data = await res.json();
      if (data.success && data.room) {
        setCurrentRoom(data.room);
        setDuelistCode(data.room.challenge.starterCode[language] || data.room.challenge.starterCode["python"] || "");
      }
    } catch {
      const demo = CodeArenaService.getRoom("arena_demo_live");
      setCurrentRoom(demo);
      setDuelistCode(demo.challenge.starterCode[language] || demo.challenge.starterCode["python"] || "");
    }
    fetchLeaderboard();
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/code-arena/leaderboard");
      const data = await res.json();
      if (data.success && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch {
      setLeaderboard(CodeArenaService.getLeaderboard());
    }
  };

  useEffect(() => {
    initArena();
  }, [language]);

  // Timer interval
  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleStartMatch = () => {
    setTimeElapsed(0);
    setTimerActive(true);
    setSubmissionResult(null);
    toast.success("Duelo iniciado! O cronômetro está rodando.");
  };

  const handleSubmitDuel = async () => {
    if (!currentRoom) return;
    setIsSubmitting(true);
    setTimerActive(false);

    try {
      const res = await fetch("/api/code-arena/submit-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: currentRoom.roomId,
          duelistId: "stu_102",
          code: duelistCode,
          language,
          timeElapsedSeconds: Math.max(1, timeElapsed)
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setSubmissionResult(data.result);
        if (data.result.allPassed) {
          toast.success(`Vitória! +${data.result.eloDelta} Elo Rating conquistado!`);
        } else {
          toast.warning(`Submissão avaliada: ${data.result.testsPassed}/${data.result.totalTests} testes passaram.`);
        }
        fetchLeaderboard();
      }
    } catch {
      const localResult = CodeArenaService.submitSolution({
        roomId: currentRoom.roomId,
        duelistId: "stu_102",
        code: duelistCode,
        language,
        timeElapsedSeconds: Math.max(1, timeElapsed)
      });
      setSubmissionResult(localResult);
      toast.info(`Resultado calculado localmente: ${localResult.testsPassed}/${localResult.totalTests} testes.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const challenge = currentRoom?.challenge;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#030712] text-slate-100">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-rose-950/70 border border-amber-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              Gamificação Competitiva & ELO Rating
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Swords className="w-8 h-8 text-amber-400" />
              Code Arena: Coding Duels & Leaderboards
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Duelos de código 1v1 ao vivo, desafios em duplas e projeção em tempo real de ranking gamificado com cálculo de <span className="text-amber-400 font-semibold">Elo Rating</span> e medalhas de conquista.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              onClick={() => setActiveTab("arena")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "arena" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Swords className="w-4 h-4" />
              Arena de Duelo
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "leaderboard" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Ranking Geral
            </button>
          </div>
        </div>
      </div>

      {/* Duel Arena Tab */}
      {activeTab === "arena" && challenge && (
        <div className="space-y-6">
          {/* Match Status Bar */}
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Desafio em Disputa</div>
                <div className="text-base font-bold text-white">{challenge.title}</div>
              </div>
            </div>

            {/* Duelists Head-to-Head */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">Lucas Silveira (1420 Elo)</div>
                <div className="text-[11px] text-slate-400 font-mono">4/4 testes • 42s (Vencedor)</div>
              </div>
              <span className="text-xs font-black text-amber-400">VS</span>
              <div className="text-left">
                <div className="text-xs font-bold text-indigo-400">Você: Ana Beatriz (1390 Elo)</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {submissionResult ? `${submissionResult.testsPassed}/${submissionResult.totalTests} testes` : "Em codificação..."}
                </div>
              </div>
            </div>

            {/* Timer and Action */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-sm font-bold text-amber-400">
                <Clock className="w-4 h-4" />
                {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, "0")}
              </div>

              {!timerActive && !submissionResult && (
                <button
                  onClick={handleStartMatch}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all"
                >
                  Começar Duelo
                </button>
              )}
            </div>
          </div>

          {/* Main Dual Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Challenge Description & Public Tests */}
            <div className="lg:col-span-5 bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{challenge.category}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  {challenge.difficulty}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-slate-200">Contexto Real:</span> {challenge.storyContext}
              </div>

              <div className="text-sm text-slate-200 leading-relaxed">{challenge.description}</div>

              {/* Public Test Cases preview */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-400 uppercase">Casos de Teste Públicos</div>
                <div className="space-y-2">
                  {challenge.testCases.map((tc, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                      <div className="text-slate-400">
                        Entrada: <span className="text-emerald-400">{tc.input}</span>
                      </div>
                      <div className="text-slate-400">
                        Esperado: <span className="text-indigo-400">{tc.expectedOutput}</span>
                      </div>
                      {tc.isHidden && <span className="text-[10px] text-amber-400/80 font-sans">[Caso de Teste Oculto]</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Code Editor & Live Test Runner */}
            <div className="lg:col-span-7 bg-[#090d1f] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Editor de Código da Arena</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                  </select>
                </div>

                <textarea
                  value={duelistCode}
                  onChange={(e) => setDuelistCode(e.target.value)}
                  rows={14}
                  className="w-full bg-[#040815] border border-slate-700/80 rounded-xl p-4 text-xs font-mono text-emerald-300 resize-none focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Submission Test Details if evaluated */}
              {submissionResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {submissionResult.allPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      Testes: {submissionResult.testsPassed}/{submissionResult.totalTests} Passaram
                    </span>
                    <span className="text-xs font-bold text-amber-400">Score: {submissionResult.scoreGained} pts</span>
                  </div>

                  {/* Badges unlocked */}
                  {submissionResult.badgesUnlocked.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {submissionResult.badgesUnlocked.map((b) => (
                        <div key={b.id} className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          {b.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={initArena}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resetar
                </button>

                <button
                  onClick={handleSubmitDuel}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submeter Solução do Duelo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Quadro de Honra e Elo Ranking da Turma
              </h2>
              <p className="text-xs text-slate-400">Classificação atualizada em tempo real com base em duelos competitivos.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Posição</th>
                  <th className="p-3.5">Estudante</th>
                  <th className="p-3.5">Turma</th>
                  <th className="p-3.5">Elo Rating</th>
                  <th className="p-3.5">Vitórias / Total</th>
                  <th className="p-3.5">Win Rate</th>
                  <th className="p-3.5 text-right">Medalhas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {leaderboard.map((entry) => (
                  <tr key={entry.studentId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-sans font-black text-sm">
                      {entry.rank === 1 && <span className="text-amber-400">🥇 #1</span>}
                      {entry.rank === 2 && <span className="text-slate-300">🥈 #2</span>}
                      {entry.rank === 3 && <span className="text-amber-600">🥉 #3</span>}
                      {entry.rank > 3 && `#${entry.rank}`}
                    </td>
                    <td className="p-3.5 font-sans font-bold text-white">{entry.studentName}</td>
                    <td className="p-3.5 text-slate-400 font-sans">{entry.className}</td>
                    <td className="p-3.5 text-amber-400 font-black">{entry.eloRating}</td>
                    <td className="p-3.5">{entry.victories}/{entry.duelsPlayed}</td>
                    <td className="p-3.5 text-emerald-400 font-bold">{entry.winRate}%</td>
                    <td className="p-3.5 text-right font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        🏆 {entry.badgesCount} Badges
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

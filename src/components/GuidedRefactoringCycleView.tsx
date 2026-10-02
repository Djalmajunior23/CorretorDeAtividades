import React, { useState } from "react";
import { 
  RefreshCw, 
  Lightbulb, 
  History, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  Lock, 
  Unlock, 
  Code2, 
  HelpCircle,
  Clock,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { RefactoringCycleService, RefactoringSession, ProgressiveHint } from "../services/refactoringCycleService";
import { executeInSandbox } from "../../sandbox";

export default function GuidedRefactoringCycleView() {
  const [session, setSession] = useState<RefactoringSession>(() => {
    return RefactoringCycleService.getSession("std-vinicius", "act-f12-01");
  });

  const [activeVersionIndex, setActiveVersionIndex] = useState<number>(1);
  const [editorCode, setEditorCode] = useState<string>(session.currentDraft);
  const [changeRationale, setChangeRationale] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [appealText, setAppealText] = useState<string>("");
  const [showAppealModal, setShowAppealModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeVersion = session.versions.find(v => v.versionIndex === activeVersionIndex) || session.versions[0];

  const handleUnlockHint = (level: 1 | 2 | 3) => {
    const updated = RefactoringCycleService.unlockHint(session.studentId, session.activityId, level);
    if (updated) {
      setSession({ ...session });
      setStatusMessage(`Dica Nível ${level} desbloqueada com sucesso!`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleRunAndSubmitRefactor = async () => {
    if (!changeRationale || changeRationale.trim().length < 10) {
      alert("Por favor, preencha a explicação do que você alterou e o motivo pedagógico (mínimo 10 caracteres).");
      return;
    }

    setIsSubmitting(true);
    try {
      // Execute test cases in sandbox
      const tc1 = await executeInSandbox(editorCode, "python", "10", 3000);
      const tc2 = await executeInSandbox(editorCode, "python", "5", 3000);
      const tc3 = await executeInSandbox(editorCode, "python", "0", 3000);
      const tc4 = await executeInSandbox(editorCode, "python", "100", 3000);

      let passed = 0;
      if (tc1.stdout.trim() === "30") passed++;
      if (tc2.stdout.trim() === "6") passed++;
      if (tc3.stdout.trim() === "0") passed++;
      if (tc4.stdout.trim() === "2550") passed++;

      const newScore = Math.round((passed / 4) * 100);

      const highlights: string[] = [];
      if (passed === 4) {
        highlights.push("Parabéns! Todos os 4 casos de teste foram atendidos.");
        highlights.push("Correção do limite superior range(1, n+1) aplicada com sucesso.");
      } else {
        highlights.push(`Você acertou ${passed} de 4 casos de teste.`);
        highlights.push("Revise a dica progressiva para tratar casos limite.");
      }

      const updatedSession = RefactoringCycleService.submitRefactoring({
        studentId: session.studentId,
        activityId: session.activityId,
        newCode: editorCode,
        changeRationale,
        scoreObtained: newScore,
        feedbackHighlights: highlights,
        testsPassed: passed,
        totalTests: 4
      });

      setSession({ ...updatedSession });
      setActiveVersionIndex(updatedSession.versions.length);
      setChangeRationale("");
      setStatusMessage(`Nova versão #${updatedSession.versions.length} submetida com sucesso! Nota: ${newScore}/100.`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      alert(`Erro na execução: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalScore = RefactoringCycleService.calculateFinalScore(session);

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans pb-12 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1426] to-[#040817] border border-indigo-500/20 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              CICLO FORMATIVO DE REFAÇÃO
            </span>
            <span className="text-xs text-slate-400 font-mono">• Política: Maior Nota entre Tentativas</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-indigo-400" />
            Refação Orientada & Evolução de Código
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Compare versões anteriores, receba scaffolding com dicas pedagógicas graduais e envie novas tentativas justificando seu aprendizado.
          </p>
        </div>

        {/* Score & Attempts summary */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Tentativas Usadas</span>
            <span className="text-base font-bold text-slate-200 font-mono">
              {session.attemptsCount} / {session.maxAttemptsAllowed}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-indigo-400 uppercase font-mono font-bold">Nota Final Atual</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{finalScore} / 100</span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Side (Version History & Progressive Hints) | Right Side (Refactoring Code Editor & Diff) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Versions Timeline + Progressive Hints */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Version History Navigation */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-400" />
                Histórico de Versões
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{session.versions.length} registradas</span>
            </div>

            <div className="flex flex-col gap-2">
              {session.versions.map((ver) => {
                const isSelected = ver.versionIndex === activeVersionIndex;
                return (
                  <div
                    key={ver.versionIndex}
                    onClick={() => setActiveVersionIndex(ver.versionIndex)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-indigo-500/15 border-indigo-500/50 text-white"
                        : "bg-slate-900/50 border-slate-800/80 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-slate-200">
                        Versão #{ver.versionIndex} {ver.versionIndex === 1 ? "(Original)" : "(Refatorada)"}
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-400">{ver.scoreObtained} pts</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(ver.timestamp).toLocaleTimeString("pt-BR")} • {ver.testsPassed}/{ver.totalTests} testes aprovados
                    </span>
                    {ver.changeRationale && (
                      <p className="text-[10px] text-slate-300 italic bg-black/30 p-1.5 rounded">
                        "{ver.changeRationale}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progressive Scaffolding Hints */}
          <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Dicas Pedagógicas Graduais
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Scaffolding</span>
            </div>

            <div className="flex flex-col gap-3">
              {session.hints.map((hint) => (
                <div
                  key={hint.level}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
                    hint.isUnlocked
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      {hint.isUnlocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
                      {hint.title}
                    </span>
                    {!hint.isUnlocked && (
                      <button
                        onClick={() => handleUnlockHint(hint.level)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold transition-all cursor-pointer"
                      >
                        Desbloquear
                      </button>
                    )}
                  </div>

                  {hint.isUnlocked ? (
                    <p className="text-[11px] text-slate-200 leading-relaxed bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/20 whitespace-pre-line font-mono">
                      {hint.content}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">
                      Dica bloqueada. Desbloqueie para receber orientação conceitual progressiva.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Code Diff View & Refactoring Editor */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Active Version Snapshot */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Visualizando Código da Versão #{activeVersion.versionIndex}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">Nota: {activeVersion.scoreObtained}/100</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
              {activeVersion.code}
            </pre>

            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">Pontos Avaliados nesta Versão:</span>
              <ul className="list-disc pl-4 text-xs text-slate-300 flex flex-col gap-1">
                {activeVersion.feedbackHighlights.map((fh, idx) => (
                  <li key={idx}>{fh}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* New Refactoring Submission Workplace */}
          {session.canRefactor ? (
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0c1229] to-[#040817] border border-indigo-500/30 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Editor de Refação (Tentativa #{session.attemptsCount + 1})
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Ajuste seu algoritmo aplicando as orientações pedagógicas.
                  </span>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-slate-300">Novo Código Corrigido:</label>
                <textarea
                  rows={8}
                  value={editorCode}
                  onChange={(e) => setEditorCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner"
                />
              </div>

              {/* Required Justification / Rationale */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>O que você alterou e por quê? (Obrigatório para envio):</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Autoria & Consciência Metacognitiva</span>
                </label>
                <input
                  type="text"
                  value={changeRationale}
                  onChange={(e) => setChangeRationale(e.target.value)}
                  placeholder="Ex: Corrigi o limite superior do range para 'n + 1' e adicionei tratamento para quando n for zero."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submission CTA */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  Prazo de entrega: {new Date(session.deadlineIso).toLocaleDateString("pt-BR")}
                </span>
                <button
                  disabled={isSubmitting}
                  onClick={handleRunAndSubmitRefactor}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? "Executando no Sandbox..." : "Submeter Versão Refatorada"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Limite de tentativas atingido</h4>
              <p className="text-xs text-slate-400">
                Você atingiu o máximo de {session.maxAttemptsAllowed} tentativas para esta atividade. Sua nota final consolidada é {finalScore}/100.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

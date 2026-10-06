import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ShieldCheck,
  Brain,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Terminal,
  Activity,
  Code2,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { HumanAiSynergyService, StudentSynergyAuditProfile, AiInteractionEvent } from "../services/humanAiSynergyService";

export default function HumanAiSynergyView() {
  const [studentName, setStudentName] = useState("Lucas Gabriel");
  const [projectName, setProjectName] = useState("Microsserviço de Pagamentos & Conciliação");
  const [language, setLanguage] = useState("TypeScript");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<StudentSynergyAuditProfile | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AiInteractionEvent | null>(null);

  useEffect(() => {
    // Initial load
    handleRunAnalysis();
  }, []);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const sampleCode = `import { Request, Response } from 'express';
import { Pool } from 'pg';
import BigNumber from 'bignumber.js';

export async function processPayment(req: Request, res: Response) {
  const { idempotencyKey, amount, customerId } = req.body;
  
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return res.status(400).json({ error: 'Chave de idempotência inválida.' });
  }

  const sanitizedAmount = new BigNumber(amount);
  if (sanitizedAmount.isLessThanOrEqualTo(0)) {
    return res.status(400).json({ error: 'Montante deve ser estritamente positivo.' });
  }

  // Executa transação com isolamento Serializable
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');
    const checkKey = await client.query('SELECT status FROM payments WHERE id_key = $1', [idempotencyKey]);
    if (checkKey.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Pagamento já processado com esta chave.' });
    }
    
    await client.query('INSERT INTO payments (id_key, amount, customer_id) VALUES ($1, $2, $3)', [
      idempotencyKey, sanitizedAmount.toString(), customerId
    ]);
    await client.query('COMMIT');
    return res.status(201).json({ success: true, message: 'Pagamento concluído' });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Falha interna ao liquidar transação.' });
  } finally {
    client.release();
  }
}`;

      const res = await HumanAiSynergyService.analyzeSynergy({
        studentName,
        projectName,
        language,
        studentCode: sampleCode,
        interactions: HumanAiSynergyService.getSampleInteractions()
      });

      setProfile(res);
      if (res.timeline.length > 0) {
        setSelectedEvent(res.timeline[0]);
      }
      toast.success("Auditoria de Sinergia Humano-IA concluída com sucesso!");
    } catch (e) {
      toast.error("Erro ao analisar telemetria de sinergia.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPdf = () => {
    if (!profile) return;
    HumanAiSynergyService.exportDossierPdf(profile);
    toast.success("Dossiê Forense PDF gerado e baixado!");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#030712] text-slate-100 p-6 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/50 border border-indigo-500/20 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            <span>Auditoria Ética 2026 • AI Synergy & Co-Pilot Telemetry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            Índice de Sinergia Humano-IA
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Telemetria forense de co-criação com IA no editor de código: avalie o rigor de revisão, independência cognitiva e refinamento de prompts dos estudantes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAnalyzing ? "Auditorando..." : "Recalcular Telemetria"}</span>
          </button>

          {profile && (
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Dossiê PDF</span>
            </button>
          )}
        </div>
      </div>

      {profile && (
        <>
          {/* Key Metric Scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Score 1 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span>ÍNDICE DE SINERGIA GLOBAL</span>
                <Brain className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-display">{profile.synergyScore}</span>
                <span className="text-xs text-indigo-400 font-mono">/ 100 pts</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${profile.synergyScore}%` }}
                />
              </div>
            </div>

            {/* Score 2 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span>INDEPENDÊNCIA COGNITIVA</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-display">{profile.aiIndependenceIndex}</span>
                <span className="text-xs text-emerald-400 font-mono">/ 100 pts</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${profile.aiIndependenceIndex}%` }}
                />
              </div>
            </div>

            {/* Score 3 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span>RIGOR DE REVISÃO CRÍTICA</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-display">{profile.criticalReviewRigor}</span>
                <span className="text-xs text-cyan-400 font-mono">/ 100 pts</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${profile.criticalReviewRigor}%` }}
                />
              </div>
            </div>

            {/* Score 4 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span>CLASSIFICAÇÃO DE RISCO</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm font-bold text-emerald-400 font-display mt-1">
                {profile.riskClassification}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-2">
                Maturidade: <span className="text-white font-semibold">{profile.promptMaturityLevel}</span>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline of AI Prompts & Iterations */}
            <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Telemetria de Prompts ({profile.timeline.length})
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">Ordem Cronológica</span>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {profile.timeline.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50"
                          : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {evt.timestamp}
                        </span>
                        {evt.studentAcceptedWithoutChange ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Cego (Sem Edição)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            Refatorado ({evt.studentManualModifications.length})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-2 font-mono">
                        {evt.promptSent}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Inspection Panel */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-5">
              {selectedEvent ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-mono text-indigo-400 uppercase">Detalhes da Interação</span>
                      <h3 className="text-base font-bold text-white font-mono mt-0.5">
                        {selectedEvent.promptSent}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono">Tempo de Análise</span>
                      <div className="text-sm font-bold text-white font-mono">
                        {selectedEvent.timeSpentReviewingSec} segundos
                      </div>
                    </div>
                  </div>

                  {/* AI Output vs Student Refactoring */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mb-1.5">
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        Código Sugerido pelo Modelo de IA:
                      </span>
                      <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-purple-200 overflow-x-auto">
                        {selectedEvent.aiSuggestedCode}
                      </pre>
                    </div>

                    <div>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mb-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Ações & Refatorações Manuais Realizadas pelo Estudante:
                      </span>
                      {selectedEvent.studentManualModifications.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedEvent.studentManualModifications.map((mod, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 font-mono"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{mod}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 font-mono flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Código colado diretamente sem modificações estruturais ou tratamento de exceção.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Strengths and Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                    <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                      <span className="text-xs font-bold font-mono text-indigo-300 flex items-center gap-1.5 mb-2">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                        Pontos Fortes Identificados
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300 font-mono">
                        {profile.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-indigo-400">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
                      <span className="text-xs font-bold font-mono text-purple-300 flex items-center gap-1.5 mb-2">
                        <Info className="w-3.5 h-3.5 text-purple-400" />
                        Recomendações Pedagógicas
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300 font-mono">
                        {profile.recommendations.map((r, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-purple-400">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-sm">
                  Selecione um evento na barra lateral para inspecionar.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState } from "react";
import {
  Building2,
  Shield,
  Cloud,
  Zap,
  Play,
  Send,
  Download,
  RefreshCw,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Layers,
  MessageSquare,
  Award
} from "lucide-react";
import { toast } from "sonner";
import {
  ArchitecturalBoardService,
  BoardSession,
  BOARD_PERSONAS
} from "../services/architecturalBoardService";

export default function ArchitecturalBoardView() {
  const [studentName, setStudentName] = useState("Lucas Silveira");
  const [systemName, setSystemName] = useState("Plataforma de Microsserviços para Telemetria de Caldeiras Industriais");
  const [techStack, setTechStack] = useState("React 19, Node.js / Express, PostgreSQL, Redis, Docker, RabbitMQ");

  const [architectureSummary, setArchitectureSummary] = useState(
    `A arquitetura proposta utiliza um API Gateway em Node.js com Express para autenticação via JWT (Stateless) e rate-limiting por IP.
As mensagens de telemetria dos sensores chegam via protocolo MQTT e são enfileiradas no RabbitMQ para evitar perda de dados.
Os dados operacionais de alta frequência são gravados com cache em Redis (TTL de 60s) e persistidos em lote no PostgreSQL com particionamento por data.
Toda a infraestrutura é executada em containers Docker orquestrados.`
  );

  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [activeSession, setActiveSession] = useState<BoardSession | null>(null);
  const [studentDefenseText, setStudentDefenseText] = useState(
    `Para responder à banca:
1. (Segurança): Adotamos mTLS (Mutual TLS) na comunicação interna entre os microsserviços e assinaturas criptográficas HMAC nos payloads dos sensores.
2. (Cloud/Escalabilidade): O RabbitMQ absorve picos de tráfego de até 50.000 msgs/segundo com buffer em disco e nós clusterizados.
3. (Performance): A camada de cache Redis atende 92% das consultas do painel de controle com latência média de 4ms.`
  );

  const handleStartSession = async () => {
    setIsLoadingSession(true);
    try {
      const res = await fetch("/api/arch-board/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          systemName,
          architectureSummary,
          techStack
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        toast.success("Banca examinadora virtual reunida com sucesso!");
      } else {
        throw new Error(data.error || "Falha ao iniciar sessão.");
      }
    } catch {
      const fallbackSession = await ArchitecturalBoardService.startSession({
        studentName,
        systemName,
        architectureSummary,
        techStack
      });
      setActiveSession(fallbackSession);
      toast.info("Banca iniciada via motor de agentes de arquitetura.");
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleConcludeDefense = async () => {
    if (!activeSession) return;
    setIsConcluding(true);
    try {
      const res = await fetch("/api/arch-board/conclude-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.sessionId,
          studentName,
          systemName,
          architectureSummary,
          interactions: activeSession.interactions,
          studentDefenseText
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        toast.success(`Defesa concluída! Parecer emitido: ${data.session.finalScore}/100`);
      } else {
        throw new Error(data.error || "Falha na conclusão.");
      }
    } catch {
      const fallbackConcluded = await ArchitecturalBoardService.concludeBoardAndGenerateADR({
        sessionId: activeSession.sessionId,
        studentName,
        systemName,
        architectureSummary,
        interactions: activeSession.interactions,
        studentDefenseText
      });
      setActiveSession(fallbackConcluded);
      toast.info("Parecer e ADR sintetizados com sucesso.");
    } finally {
      setIsConcluding(false);
    }
  };

  const handleExportPdf = async () => {
    if (!activeSession) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/arch-board/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: activeSession })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laudo_banca_arquitetural_${activeSession.sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Dossiê da Banca Arquitetural baixado em PDF!");
      }
    } catch (e: any) {
      toast.error(`Erro ao exportar PDF: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#030712] text-slate-100">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Banca Examinadora Virtual Multi-Agente
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-purple-400" />
              Virtual Architectural Board & Multi-Agent Panel
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Sabatina técnica com <span className="text-purple-400 font-semibold">3 Agentes de IA Especializados</span> (CISO de Segurança, Arquiteto Cloud e Head de Performance), debate socrático ao vivo e síntese de <span className="text-purple-400 font-semibold">ADRs (Architectural Decision Records)</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeSession?.adr && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
              >
                {isExportingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar Parecer da Banca em PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Board Setup Panel */}
      {!activeSession && (
        <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Configuração da Proposta Arquitetural
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estudante / Defensor</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Título do Sistema em Defesa</label>
              <input
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stack Tecnológica & Protocolos</label>
            <input
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resumo da Arquitetura & Decisões Chave</label>
            <textarea
              value={architectureSummary}
              onChange={(e) => setArchitectureSummary(e.target.value)}
              rows={6}
              className="w-full mt-1 bg-[#040815] border border-slate-700/80 rounded-xl p-3.5 text-xs font-mono text-purple-300 resize-none focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>

          {/* Personas Cards Preview */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membros da Banca Examinadora Virtual</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.values(BOARD_PERSONAS).map((p) => (
                <div key={p.roleId} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  <div className="text-[11px] font-semibold text-purple-400">{p.title}</div>
                  <p className="text-[10px] text-slate-400">{p.focusArea}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleStartSession}
              disabled={isLoadingSession}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-purple-500/20"
            >
              {isLoadingSession ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Reunir Banca & Iniciar Sabatina
            </button>
          </div>
        </div>
      )}

      {/* Active Defense Session Workspace */}
      {activeSession && (
        <div className="space-y-6">
          {/* Active Question Dialogue Feed */}
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Sessão da Banca em Andamento</span>
                <h3 className="text-lg font-bold text-white mt-1">{activeSession.systemName}</h3>
                <div className="text-xs text-slate-400">Defensor: {activeSession.studentName}</div>
              </div>

              {activeSession.adr && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Nota da Banca</div>
                    <div className="text-xs font-bold text-emerald-400">{activeSession.verdict}</div>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/30">
                    {activeSession.finalScore}%
                  </div>
                </div>
              )}
            </div>

            {/* Interactions Thread */}
            <div className="space-y-3">
              {activeSession.interactions.map((msg, i) => {
                const isStudent = msg.sender === "student";
                const isSystem = msg.sender === "system";

                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      isSystem
                        ? "bg-slate-900/60 border-slate-800 text-slate-400 text-xs"
                        : isStudent
                        ? "bg-indigo-950/30 border-indigo-500/40 text-slate-200"
                        : msg.sender === "security_cso"
                        ? "bg-rose-950/20 border-rose-500/30 text-slate-200"
                        : msg.sender === "cloud_devops"
                        ? "bg-blue-950/20 border-blue-500/30 text-slate-200"
                        : "bg-amber-950/20 border-amber-500/30 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        {!isStudent && !isSystem && msg.sender === "security_cso" && <Shield className="w-3.5 h-3.5 text-rose-400" />}
                        {!isStudent && !isSystem && msg.sender === "cloud_devops" && <Cloud className="w-3.5 h-3.5 text-blue-400" />}
                        {!isStudent && !isSystem && msg.sender === "performance_ux" && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{msg.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Student Defense Response Box */}
            {!activeSession.adr && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Sua Réplica e Defesa Técnica
                </label>
                <textarea
                  value={studentDefenseText}
                  onChange={(e) => setStudentDefenseText(e.target.value)}
                  rows={6}
                  placeholder="Responda pontualmente aos 3 questionamentos dos membros da banca..."
                  className="w-full bg-[#040815] border border-slate-700/80 rounded-xl p-3.5 text-xs font-mono text-purple-200 resize-none focus:outline-none focus:border-purple-500 leading-relaxed"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleConcludeDefense}
                    disabled={isConcluding}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
                  >
                    {isConcluding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submeter Defesa & Gerar ADR
                  </button>
                </div>
              </div>
            )}

            {/* ADR Record Output */}
            {activeSession.adr && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-purple-400" />
                      {activeSession.adr.title}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      {activeSession.adr.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-300">Contexto:</span>
                      <p className="text-slate-400 mt-0.5">{activeSession.adr.context}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-300">Decisão Arquitetural:</span>
                      <p className="text-slate-400 mt-0.5">{activeSession.adr.decision}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                      <div className="text-[11px] font-bold text-emerald-400">Consequências Positivas:</div>
                      <ul className="space-y-0.5">
                        {activeSession.adr.consequences.positive.map((p, idx) => (
                          <li key={idx} className="text-[10px] text-slate-300">• {p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-1">
                      <div className="text-[11px] font-bold text-amber-400">Trade-offs / Riscos:</div>
                      <ul className="space-y-0.5">
                        {activeSession.adr.consequences.negative.map((n, idx) => (
                          <li key={idx} className="text-[10px] text-slate-300">• {n}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setActiveSession(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                  >
                    ← Nova Defesa de Arquitetura
                  </button>

                  <button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
                  >
                    {isExportingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Baixar Parecer & ADR em PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

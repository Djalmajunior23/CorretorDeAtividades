import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Terminal,
  FileDown,
  AlertTriangle,
  Bug,
  Lock,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Flame,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  ThreatModelReport,
  ThreatItem,
  DevSecOpsThreatService
} from "../services/devSecOpsThreatService";

const SAMPLE_CODE = `import express from "express";
import { Client } from "pg";

const app = express();
app.use(express.json());

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// Vulnerable Login Endpoint
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  
  // VULNERABILITY 1: Direct SQL String Concatenation (SQLi)
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const result = await db.query(query);

  if (result.rows.length > 0) {
    // VULNERABILITY 2: Hardcoded Secret & No Expiration
    return res.json({ token: "SUPER_SECRET_TOKEN_ADMIN", user: result.rows[0] });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

// VULNERABILITY 3: IDOR - Insecure Direct Object Reference
app.get("/api/users/:id/profile", async (req, res) => {
  const user = await db.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
  // Returns raw sensitive data without sanitization or RBAC check
  res.json(user.rows[0]);
});

export default app;`;

export const DevSecOpsThreatLabView: React.FC = () => {
  const [studentName, setStudentName] = useState("Lucas Gabriel");
  const [systemName, setSystemName] = useState("Serviço de Autenticação & Checkout");
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState("typescript");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ThreatModelReport | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "RED_TEAM" | "BLUE_TEAM">("ALL");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleRunThreatModeling = async () => {
    if (!code.trim()) {
      toast.error("Por favor, insira o código para análise de ameaças.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/devsecops/threat-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, systemName, code, language })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          setReport(data.report);
          setSelectedThreat(data.report.threatsIdentified[0] || null);
          toast.success("Modelagem de Ameaças STRIDE/DREAD concluída!");
          return;
        }
      }

      // Fallback local service call
      const fallbackReport = await DevSecOpsThreatService.analyzeThreatsAndExploits({
        studentName,
        systemName,
        code,
        language
      });
      setReport(fallbackReport);
      setSelectedThreat(fallbackReport.threatsIdentified[0] || null);
      toast.success("Modelagem STRIDE concluída em modo de contingência local.");
    } catch (err: any) {
      console.warn("API error, using local service fallback:", err);
      const fallbackReport = await DevSecOpsThreatService.analyzeThreatsAndExploits({
        studentName,
        systemName,
        code,
        language
      });
      setReport(fallbackReport);
      setSelectedThreat(fallbackReport.threatsIdentified[0] || null);
      toast.success("Modelagem STRIDE gerada com sucesso!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/devsecops/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report })
      });

      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        const pdfBuf = await DevSecOpsThreatService.generateThreatReportPdf(report);
        blob = new Blob([pdfBuf as any], { type: "application/pdf" });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dossie_devsecops_${report.reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Dossiê DevSecOps baixado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-red-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-400" /> DevSecOps Red/Blue Lab
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              STRIDE & DREAD Certified
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Autonomous Threat Modeling & Red/Blue Team Lab
          </h1>
          <p className="text-slate-400 text-sm">
            Auditoria autônoma de segurança cibernética, exploração controlada de vetores de ataque e remediação estrutural.
          </p>
        </div>

        {report && (
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition shadow-lg text-sm font-semibold disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {isExportingPdf ? "Gerando Dossiê..." : "Exportar Dossiê DevSecOps (PDF)"}
          </button>
        )}
      </div>

      {/* Grid: Editor vs Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Input & Config */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> Parâmetros do Target de Auditoria
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Estudante / Dev</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Linguagem / Stack</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500/50"
                >
                  <option value="typescript">TypeScript / Node.js</option>
                  <option value="python">Python / FastAPI</option>
                  <option value="java">Java / Spring Boot</option>
                  <option value="csharp">C# / .NET Core</option>
                  <option value="php">PHP / Laravel</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Sistema / Microsserviço</label>
              <input
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">Código-Fonte ou Trecho de Arquitetura</label>
                <button
                  type="button"
                  onClick={() => setCode(SAMPLE_CODE)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Restaurar Exemplo
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={13}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-red-500/50 leading-relaxed"
                placeholder="Cole o código para análise STRIDE/DREAD..."
              />
            </div>

            <button
              onClick={handleRunThreatModeling}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-red-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Modelando Ameaças & Simulando Red Team...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Disparar Modelagem STRIDE & Simulação Red Team
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Report & Threat Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {!report && !isLoading && (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <ShieldAlert className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-1">Nenhuma Análise DevSecOps Ativa</h3>
              <p className="text-sm text-slate-400 max-w-md mb-4">
                Execute a modelagem de ameaças para identificar falhas STRIDE, pontuações DREAD e simulações de ataque e defesa.
              </p>
              <button
                onClick={handleRunThreatModeling}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
              >
                Executar Demonstração com Exemplo
              </button>
            </div>
          )}

          {isLoading && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[460px] space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
                <Bug className="w-6 h-6 text-red-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-medium text-slate-200">Analisando vetores STRIDE & calculando DREAD score...</p>
              <p className="text-xs text-slate-500">Simulando payloads de exploração Red Team e arquitetura Blue Team...</p>
            </div>
          )}

          {report && !isLoading && (
            <div className="space-y-4">
              {/* Scorecard Header */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Score Geral de Segurança</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold ${report.overallSecurityScore >= 75 ? "text-emerald-400" : report.overallSecurityScore >= 50 ? "text-amber-400" : "text-rose-500"}`}>
                      {report.overallSecurityScore}/100
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block">{report.securityMaturityLevel}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Ameaças Identificadas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-extrabold text-slate-100">
                      {report.threatsIdentified.length}
                    </span>
                    <span className="text-xs text-rose-400 font-semibold px-2 py-0.5 bg-rose-500/10 rounded-md border border-rose-500/20">
                      {report.threatsIdentified.filter(t => t.severity === "CRITICAL" || t.severity === "HIGH").length} Altas/Críticas
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block">STRIDE Categorized</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Status Blue Team</span>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-300">
                      {report.blueTeamRecommendations.length} Recomendações
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block">Mitigação Pronta</span>
                </div>
              </div>

              {/* Threat Selector List */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Matriz de Ameaças Detectadas
                  </h3>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {(["ALL", "RED_TEAM", "BLUE_TEAM"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                          activeTab === tab
                            ? "bg-slate-800 text-slate-100 shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tab === "ALL" ? "Geral" : tab === "RED_TEAM" ? "Red Team (Exploit)" : "Blue Team (Fix)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {report.threatsIdentified.map((threat) => (
                    <button
                      key={threat.id}
                      onClick={() => setSelectedThreat(threat)}
                      className={`px-3 py-2 rounded-xl text-left border transition min-w-[200px] shrink-0 ${
                        selectedThreat?.id === threat.id
                          ? "bg-red-500/15 border-red-500/40 text-slate-100"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-semibold ${threat.severity === "CRITICAL" ? "text-rose-400" : threat.severity === "HIGH" ? "text-orange-400" : "text-amber-400"}`}>
                          {threat.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">DREAD {threat.dreadScore.totalScore.toFixed(1)}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-200 truncate">{threat.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{threat.strideCategory.split(" ")[0]}</div>
                    </button>
                  ))}
                </div>

                {/* Selected Threat Inspector */}
                {selectedThreat && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-indigo-400">{selectedThreat.cwe}</span>
                        <h4 className="text-base font-bold text-slate-100">{selectedThreat.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{selectedThreat.description}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-300">
                        {selectedThreat.vulnerableLineOrComponent}
                      </span>
                    </div>

                    {/* DREAD Score Breakdown */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-5 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Damage</div>
                        <div className="text-xs font-bold text-rose-400">{selectedThreat.dreadScore.damage}/10</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Reproduce</div>
                        <div className="text-xs font-bold text-amber-400">{selectedThreat.dreadScore.reproducibility}/10</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Exploit</div>
                        <div className="text-xs font-bold text-orange-400">{selectedThreat.dreadScore.exploitability}/10</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Affected</div>
                        <div className="text-xs font-bold text-indigo-400">{selectedThreat.dreadScore.affectedUsers}/10</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Discover</div>
                        <div className="text-xs font-bold text-emerald-400">{selectedThreat.dreadScore.discoverability}/10</div>
                      </div>
                    </div>

                    {/* Red vs Blue Team Panels */}
                    {(activeTab === "ALL" || activeTab === "RED_TEAM") && (
                      <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                          <Flame className="w-4 h-4 text-red-400" /> Red Team: Exploit Payload de Teste
                        </div>
                        <pre className="bg-black/60 p-3 rounded-lg text-xs font-mono text-red-300 overflow-x-auto whitespace-pre-wrap border border-red-500/20">
                          {selectedThreat.redTeamExploitPayload}
                        </pre>
                      </div>
                    )}

                    {(activeTab === "ALL" || activeTab === "BLUE_TEAM") && (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          <Lock className="w-4 h-4 text-emerald-400" /> Blue Team: Remediação & Código Blindado
                        </div>
                        <p className="text-xs text-slate-300">{selectedThreat.blueTeamMitigationStrategy}</p>
                        <pre className="bg-black/60 p-3 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap border border-emerald-500/20">
                          {selectedThreat.remediatedCodeSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevSecOpsThreatLabView;

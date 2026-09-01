import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  Database, 
  Server, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Layers, 
  Users, 
  FileCode, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  X
} from "lucide-react";
import { apiUrl } from "../config/api";

interface CloudSyncStatus {
  isConnected: boolean;
  isCloudPersistent: boolean;
  databaseHost: string;
  latencyMs: number;
  statusMessage: string;
  counts: {
    classes: number;
    students: number;
    submissions: number;
    correction_vault: number;
    activities: number;
    questions: number;
    evidence: number;
  };
  vercelConfig: {
    isVercel: boolean;
    envRequired: string[];
    vercelPostgresSupported: boolean;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelCloudSyncModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<CloudSyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "backup" | "guide">("status");

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/cloud-sync/status"));
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e: any) {
      console.warn("Erro ao buscar status do banco:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  const handleExportDump = async () => {
    setActionLoading("export");
    setFeedbackMsg(null);
    try {
      const res = await fetch(apiUrl("/api/cloud-sync/export-dump"));
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `codecheck_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setFeedbackMsg({
          type: "success",
          text: "Backup completo exportado com sucesso! Arquivo JSON gerado para migração."
        });
      } else {
        throw new Error("Erro na resposta do servidor.");
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: `Falha ao exportar backup: ${err.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleImportDump = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionLoading("import");
    setFeedbackMsg(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const res = await fetch(apiUrl("/api/cloud-sync/import-dump"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({
          type: "success",
          text: `Dados importados e sincronizados com sucesso no banco em nuvem! (${data.importedCounts?.classes || 0} turmas, ${data.importedCounts?.students || 0} alunos, ${data.importedCounts?.vault || 0} correções)`
        });
        fetchStatus();
      } else {
        throw new Error(data.error || "Erro ao processar arquivo");
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: `Erro ao importar arquivo: ${err.message}`
      });
    } finally {
      setActionLoading(null);
      e.target.value = "";
    }
  };

  const handleSeedCloud = async () => {
    setActionLoading("seed");
    setFeedbackMsg(null);
    try {
      const res = await fetch(apiUrl("/api/cloud-sync/seed-cloud"), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({
          type: "success",
          text: "Dados pedagógicos e turmas SENAI sincronizados com a nuvem com sucesso!"
        });
        fetchStatus();
      } else {
        throw new Error(data.error || "Erro ao sincronizar dados");
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-tight">
                  Sincronização em Nuvem & Acesso no Vercel
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PostgreSQL Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Garantia de persistência total e sincronização entre este ambiente e o Vercel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab("status")}
            className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "status"
                ? "text-emerald-400 border-emerald-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Status da Conexão Nuvem
          </button>
          <button
            onClick={() => setActiveTab("backup")}
            className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "backup"
                ? "text-emerald-400 border-emerald-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar / Importar Dados
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "guide"
                ? "text-emerald-400 border-emerald-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Guia de Configuração Vercel
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* Feedback banner */}
          {feedbackMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-3 border ${
                feedbackMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : feedbackMsg.type === "error"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-300"
              }`}
            >
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* TAB 1: STATUS */}
          {activeTab === "status" && (
            <div className="space-y-5">
              {/* Connection Status Card */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                      status?.isCloudPersistent ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      {status?.isCloudPersistent ? "Banco de Dados em Nuvem Ativo" : "Armazenamento Local / Cache"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{status?.statusMessage}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">
                      Host: <span className="text-slate-300">{status?.databaseHost}</span>
                      {status?.latencyMs ? ` • Latência: ${status.latencyMs}ms` : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-xs font-mono font-medium text-slate-200 border border-slate-600 flex items-center gap-2 transition-colors self-end md:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Verificar Conexão
                </button>
              </div>

              {/* Data counts grid */}
              <div>
                <h4 className="text-xs uppercase font-mono font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Registros Prontos para Acesso no Vercel
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex flex-col">
                    <span className="text-xs text-slate-400">Turmas</span>
                    <span className="text-xl font-bold font-mono text-white mt-1">
                      {status?.counts?.classes ?? 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex flex-col">
                    <span className="text-xs text-slate-400">Alunos</span>
                    <span className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      {status?.counts?.students ?? 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex flex-col">
                    <span className="text-xs text-slate-400">Submissões & Vault</span>
                    <span className="text-xl font-bold font-mono text-blue-400 mt-1">
                      {(status?.counts?.submissions ?? 0) + (status?.counts?.correction_vault ?? 0)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex flex-col">
                    <span className="text-xs text-slate-400">Atividades & Itens</span>
                    <span className="text-xl font-bold font-mono text-purple-400 mt-1">
                      {status?.counts?.activities ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 font-mono">
                    Como funciona o compartilhamento com o Vercel?
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Ao conectar a variável <code className="text-emerald-400 font-mono">DATABASE_URL</code> (PostgreSQL / Neon / Supabase), qualquer alteração feita aqui ou no Vercel é sincronizada em tempo real.
                  </p>
                </div>
                {status?.isCloudPersistent && (
                  <button
                    onClick={handleSeedCloud}
                    disabled={actionLoading === "seed"}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md flex items-center gap-2 shrink-0 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {actionLoading === "seed" ? "Sincronizando..." : "Sincronizar Dados Padrão"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BACKUP & EXPORT */}
          {activeTab === "backup" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Export Card */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 w-fit mb-3">
                      <Download className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      Exportar Todos os Dados (.JSON)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Gera um arquivo completo com todas as turmas, alunos, submissões, correções da IA e gabaritos salvos até o momento.
                    </p>
                  </div>

                  <button
                    onClick={handleExportDump}
                    disabled={actionLoading === "export"}
                    className="mt-5 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/10"
                  >
                    <Download className="w-4 h-4" />
                    {actionLoading === "export" ? "Gerando Backup..." : "Baixar Backup Completo"}
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mb-3">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      Importar Backup para a Nuvem
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Restaure ou carregue dados de backup diretamente no PostgreSQL para torná-los visíveis instantaneamente no Vercel.
                    </p>
                  </div>

                  <label className="mt-5 w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-purple-500/10 text-center">
                    <Upload className="w-4 h-4" />
                    {actionLoading === "import" ? "Importando..." : "Selecionar Arquivo .JSON"}
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDump}
                      disabled={actionLoading === "import"}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  Os backups exportados possuem estrutura compatível para restauração automática em qualquer instância local, Docker, Vercel ou VPS.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL GUIDE */}
          {activeTab === "guide" && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                Para que todos os dados salvos aqui fiquem 100% sincronizados e acessíveis na sua hospedagem no <strong>Vercel</strong>, siga estes 3 passos rápidos:
              </p>

              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold font-mono">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
                  Crie um Banco PostgreSQL em Nuvem Gratuito
                </div>
                <p className="text-slate-400">
                  Crie um banco gratuito em serviços como <strong>Neon.tech</strong>, <strong>Supabase</strong>, ou diretamente no <strong>Vercel Postgres (Storage)</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold font-mono">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
                  Configure as Variáveis de Ambiente no Vercel
                </div>
                <p className="text-slate-400">
                  No painel do Vercel (Project Settings &rarr; Environment Variables), adicione:
                </p>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold">DATABASE_URL</span>
                      <span className="text-slate-500 ml-2">= postgresql://usuario:senha@host/db?sslmode=require</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("DATABASE_URL", "db_url")}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copiar nome da variável"
                    >
                      {copiedKey === "db_url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold">GEMINI_API_KEY</span>
                      <span className="text-slate-500 ml-2">= sua_chave_api_do_google</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("GEMINI_API_KEY", "gemini_key")}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copiar nome da variável"
                    >
                      {copiedKey === "gemini_key" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold font-mono">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
                  Deploy Automatizado (Arquivos já configurados)
                </div>
                <p className="text-slate-400">
                  O arquivo <code className="text-emerald-400">vercel.json</code> e o endpoint serverless <code className="text-emerald-400">/api/index.ts</code> já estão criados e prontos no projeto. O build e a inicialização das tabelas ocorrerão automaticamente no primeiro acesso.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/60 border-t border-slate-700/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            SENAI CodeCheck AI • Vercel Ready v2.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-mono text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

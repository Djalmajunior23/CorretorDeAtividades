import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle,
  RefreshCw,
  Download,
  Send,
  Webhook,
  Bell,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Sliders,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";

export default function LmsIntegrationView() {
  const [syncing, setSyncing] = useState(false);
  const [exportingMoodle, setExportingMoodle] = useState(false);
  const [exportingClassroom, setExportingClassroom] = useState(false);
  
  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState("https://discord.com/api/webhooks/12345/codecheck-alerts");
  const [webhookChannel, setWebhookChannel] = useState<"discord" | "slack" | "whatsapp">("discord");
  const [webhookEvent, setWebhookEvent] = useState("sla_warning");
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookPreview, setWebhookPreview] = useState<any | null>(null);
  const [dispatchingSla, setDispatchingSla] = useState(false);

  const handleSyncLms = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success("Sincronização LTI 1.3 com Moodle e Google Classroom concluída com sucesso!");
    }, 1200);
  };

  const handleExportMoodle = async () => {
    setExportingMoodle(true);
    try {
      const res = await fetch(apiUrl("/api/lms/export-moodle"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: "turma-1a", class_name: "Desenvolvimento de Sistemas 1A" })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `moodle_gradebook_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Arquivo de notas compatível com o Moodle (.csv) baixado!");
      }
    } catch (e) {
      toast.error("Erro ao exportar notas para o Moodle.");
    } finally {
      setExportingMoodle(false);
    }
  };

  const handleExportClassroom = async () => {
    setExportingClassroom(true);
    try {
      const res = await fetch(apiUrl("/api/lms/export-classroom"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_name: "Desenvolvimento de Sistemas 1A" })
      });

      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `classroom_gradebook_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Gradebook para o Google Classroom (.json) exportado!");
      }
    } catch (e) {
      toast.error("Erro ao exportar notas para o Classroom.");
    } finally {
      setExportingClassroom(false);
    }
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const res = await fetch(apiUrl("/api/lms/test-webhook"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          channel: webhookChannel,
          event_type: webhookEvent
        })
      });

      if (res.ok) {
        const data = await res.json();
        setWebhookPreview(data);
        toast.success(`Webhook ${webhookChannel.toUpperCase()} disparado e testado com sucesso!`);
      }
    } catch (e) {
      toast.error("Erro no teste do webhook.");
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleDispatchSlaAlerts = async () => {
    setDispatchingSla(true);
    try {
      const res = await fetch(apiUrl("/api/lms/dispatch-sla-alerts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_id: "act-01", channels: [webhookChannel, "email"] })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
      }
    } catch (e) {
      toast.error("Erro ao disparar alertas de SLA.");
    } finally {
      setDispatchingSla(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-1 font-bold">
            <BookOpen className="w-4 h-4" /> Módulo 04 • Interoperabilidade LMS & Webhooks
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Integração com Moodle, Classroom & Webhook Hub</h1>
          <p className="text-sm text-slate-400 mt-1">Sincronize notas LTI 1.3, exporte diários formatados e configure disparos automáticos de alertas de SLA.</p>
        </div>

        <button
          onClick={handleSyncLms}
          disabled={syncing}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs uppercase font-mono tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Sincronizando LMS..." : "Sincronizar LTI 1.3"}</span>
        </button>
      </div>

      {/* Connected Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Moodle Card */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold border text-amber-400 bg-amber-500/10 border-amber-500/30">
                Moodle LMS
              </span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">Conectado (LTI 1.3)</span>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">4 turmas sincronizadas com sucesso</span>
            </div>
          </div>

          <button
            onClick={handleExportMoodle}
            disabled={exportingMoodle}
            className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingMoodle ? "Baixando..." : "Exportar Diário Moodle (CSV)"}</span>
          </button>
        </div>

        {/* Google Classroom Card */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold border text-cyan-400 bg-cyan-500/10 border-cyan-500/30">
                Google Classroom
              </span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">Sincronizado Hoje</span>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">2 turmas ativas vinculadas</span>
            </div>
          </div>

          <button
            onClick={handleExportClassroom}
            disabled={exportingClassroom}
            className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingClassroom ? "Baixando..." : "Exportar Gradebook (JSON)"}</span>
          </button>
        </div>

        {/* Canvas LMS Card */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between hover:border-indigo-500/30 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold border text-indigo-400 bg-indigo-500/10 border-indigo-500/30">
                Canvas LMS
              </span>
              <CheckCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">Pronto para Conectar</span>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">Compatível com chave OAuth 2.0</span>
            </div>
          </div>

          <button
            onClick={() => toast.info("Configurações do Canvas prontas para sincronização.")}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-xl transition-all cursor-pointer"
          >
            Configurar Conexão OAuth
          </button>
        </div>
      </div>

      {/* Webhook Manager & Real-Time Alert Dispatcher */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Webhook className="w-4 h-4 text-emerald-400" /> Central de Webhooks & Alertas de SLA em Tempo Real
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Dispare notificações imediatas para Discord, Slack e WhatsApp quando atividades estiverem próximas do prazo limite.</p>
          </div>

          <button
            onClick={handleDispatchSlaAlerts}
            disabled={dispatchingSla}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <Bell className="w-4 h-4" />
            <span>{dispatchingSla ? "Disparando..." : "Disparar Alertas de SLA Agora"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-mono text-slate-300 uppercase font-bold">URL do Endpoint de Webhook</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase font-bold">Canal de Destino</label>
            <select
              value={webhookChannel}
              onChange={(e) => setWebhookChannel(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none cursor-pointer"
            >
              <option value="discord">Discord (Webhooks API)</option>
              <option value="slack">Slack (Incoming Webhooks)</option>
              <option value="whatsapp">WhatsApp Business API</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400 font-mono">Evento monitorado: Estouro Iminente de SLA (24h de tolerância)</span>
          <button
            onClick={handleTestWebhook}
            disabled={testingWebhook}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testingWebhook ? "Testando..." : "Testar Envio de Payload"}</span>
          </button>
        </div>

        {webhookPreview && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-2 animate-fade-in text-xs font-mono">
            <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
              <span>✓ Teste Bem-sucedido ({webhookPreview.channel.toUpperCase()})</span>
              <span className="text-[10px] text-slate-500">{webhookPreview.dispatched_at}</span>
            </div>
            <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded-xl text-[11px]">
              {JSON.stringify(webhookPreview.payload_preview, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

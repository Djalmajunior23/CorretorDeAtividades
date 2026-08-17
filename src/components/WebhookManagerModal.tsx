import React, { useState } from "react";
import { Webhook, Send, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface WebhookManagerModalProps {
  onClose: () => void;
}

export function WebhookManagerModal({ onClose }: WebhookManagerModalProps) {
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem("codecheck-webhook") || "");
  const [channelType, setChannelType] = useState("Discord");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSave = () => {
    localStorage.setItem("codecheck-webhook", webhookUrl);
    toast.success("Configuração de Webhook salva com sucesso!");
    onClose();
  };

  const handleTestWebhook = () => {
    if (!webhookUrl) {
      toast.error("Informe a URL do Webhook para testar.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult("Disparo de teste simulado com sucesso! Código HTTP 200 OK.");
      toast.success("Webhook disparado com sucesso!");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0f172a] border border-[#1e295b]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Gerenciador de Webhooks & Notificações</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure Webhooks HTTP para enviar alertas automáticos de estouro de SLA, relatórios de correção e resumos de turma para canais do Discord, Slack ou WhatsApp.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-200">Plataforma / Canal Alvo</label>
            <select
              value={channelType}
              onChange={(e) => setChannelType(e.target.value)}
              className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Discord">Discord (Webhook Channel)</option>
              <option value="Slack">Slack (Incoming Webhook)</option>
              <option value="WhatsApp">WhatsApp Business API Gateway</option>
              <option value="Custom">Custom HTTP Endpoint</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-200">URL do Webhook</label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{testResult}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#1e295b]/20">
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={testing}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-all flex items-center gap-2 border border-slate-700"
            >
              <Send className={`w-3.5 h-3.5 ${testing ? "animate-bounce" : ""}`} />
              {testing ? "Testando..." : "Disparar Teste"}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
              >
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

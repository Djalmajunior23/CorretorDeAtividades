import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { AIStatusResponse } from "../ai/types";
import { getApiBaseUrl } from "../services/apiService";

export const AIStatusDashboard: React.FC = () => {
  const [status, setStatus] = useState<AIStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/ai/status`);
      
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error("Não foi possível consultar o status da IA agora.");
      }

      let data: AIStatusResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error("Não foi possível consultar o status da IA agora.");
      }

      setStatus(data);
    } catch (err: any) {
      setError(err.message || "Não foi possível consultar o status da IA agora.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Status da Camada IA
            </h3>
            <p className="text-sm text-slate-400">
              Monitoramento em tempo real do AI Gateway
            </p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      ) : status ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">
              Provider
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200 capitalize">
                {status.provider}
              </span>
              {status.available && (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              )}
            </div>
          </div>
          {(Array.isArray(status.models)
            ? status.models.map((model: string, i: number) => {
                let key = "General Model";
                if (model.includes("coder") || i === 0) key = "Code Model";
                else if (model.includes("gemma") || i === 1) key = "Feedback Model";
                else if (model.includes("phi") || i === 2) key = "Report Model";
                return [key, model];
              })
            : Object.entries(status.models || {})
          ).map(([key, model]) => (
            <div
              key={key}
              className="p-4 bg-slate-950 rounded-xl border border-slate-800"
            >
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">
                {key}
              </div>
              <div className="text-sm font-bold text-slate-200 truncate">
                {typeof model === "string" ? model : ((model as any)?.name || (model as any)?.id || JSON.stringify(model))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center">
          <div className="animate-pulse text-slate-500">
            Carregando informações...
          </div>
        </div>
      )}
    </div>
  );
};

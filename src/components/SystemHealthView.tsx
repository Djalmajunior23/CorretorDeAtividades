import React, { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Database,
  BrainCircuit,
  Shield,
  ShieldAlert,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
} from "lucide-react";

export default function SystemHealthView() {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([
        fetch("/api/system/status"),
        fetch("/api/audit-logs"),
      ]);
      setStatus(await sRes.json());
      setLogs(await lRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (v: string) => {
    if (v === "Healthy") return "bg-emerald-500";
    if (v === "Warning") return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-950 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500" />
            Saúde do Sistema & Auditoria
          </h1>
          <p className="text-slate-400 mt-2">
            Monitoramento de serviços, infraestrutura local e nuvem.
          </p>
        </div>
        <div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />{" "}
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Frontend",
            key: "frontend",
            icon: <Network className="w-5 h-5" />,
          },
          {
            label: "Backend API",
            key: "backend",
            icon: <Server className="w-5 h-5" />,
          },
          {
            label: "PostgreSQL",
            key: "database",
            icon: <Database className="w-5 h-5" />,
          },
          {
            label: "Ollama / IA",
            key: "ai",
            icon: <BrainCircuit className="w-5 h-5" />,
          },
          {
            label: "Sandbox (VM)",
            key: "sandbox",
            icon: <Cpu className="w-5 h-5" />,
          },
        ].map((item) => (
          <div
            key={item.key}
            className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3"
          >
            <div className="p-3 bg-slate-800 rounded-full text-slate-400">
              {item.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-1">
                {item.label}
              </h3>
              {status ? (
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${getStatusColor(status[item.key])}`}
                  ></span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {status[item.key]}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-600">Verificando...</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/30 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">
            Log de Auditoria de Acesso (Phase 21)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-500 uppercase font-black tracking-widest border-b border-white/5">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Usuário / ID</th>
                <th className="px-4 py-3">Ação Executada</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-300">
                    {log.user_id}
                  </td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3 text-xs uppercase">{log.module}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                    >
                      {log.status || "unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

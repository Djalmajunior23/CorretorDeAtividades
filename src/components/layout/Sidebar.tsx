import React from "react";
import { 
  Zap, 
  Terminal, 
  Settings, 
  History, 
  Database, 
  CheckCircle, 
  XOctagon, 
  Layers 
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  dbConnected: boolean;
}

export default function Sidebar({ currentTab, setTab, dbConnected }: SidebarProps) {
  const menuItems = [
    { id: "corrector", label: "Correção Interativa", icon: Terminal, desc: "Playground de Execução" },
    { id: "history", label: "Histórico de Envios", icon: History, desc: "Resultados da Turma" },
    { id: "settings", label: "Configurações", icon: Settings, desc: "Conexões e Chaves" },
  ];

  return (
    <aside className="w-80 border-r border-[#1e295b]/40 bg-[#0f172a] p-6 flex flex-col h-full justify-between">
      <div className="flex flex-col gap-8">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-[#0a0f24]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-display">CodeCheck AI</h1>
            <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-medium">Motor de Correção</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-2 font-semibold">Módulos do Sistema</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 text-left relative overflow-hidden group ${
                  isActive 
                    ? "bg-[#1e293b] text-white shadow-md border border-[#334155]" 
                    : "text-slate-400 hover:text-white hover:bg-[#1e293b]/50"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{item.desc}</span>
                </div>
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-l-md" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Cloud SQL connection widget */}
      <div className="p-4 rounded-xl bg-[#132247]/40 border border-[#1e295b]/30">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-200">Banco de Dados</h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Armazenamento de logs persistentes em tempo real.
        </p>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbConnected ? "bg-emerald-400" : "bg-sky-400"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dbConnected ? "bg-emerald-500" : "bg-sky-500"}`} />
          </span>
          <span className="text-[10px] font-mono font-medium text-slate-300">
            {dbConnected ? "Postgres: Ativo" : "Cache Local Iniciado"}
          </span>
        </div>
      </div>
    </aside>
  );
}

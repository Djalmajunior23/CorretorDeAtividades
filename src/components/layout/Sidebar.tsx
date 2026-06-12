import React, { useState } from "react";
import { 
  Zap, 
  Terminal, 
  Settings, 
  History, 
  Database, 
  CheckCircle, 
  XOctagon, 
  Layers,
  Activity,
  BookOpen,
  BarChart3,
  Sparkles,
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  Award,
  Users,
  RefreshCw,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  currentTab?: string;
  setTab?: (tab: string) => void;
  dbConnected?: boolean;
  featureFlags?: any;
}

export default function Sidebar({ 
  currentTab = "dashboard", 
  setTab = () => {}, 
  dbConnected = true,
  featureFlags = {}
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("codecheck_favorites");
      return saved ? JSON.parse(saved) : ["dashboard", "planejamento"];
    } catch {
      return ["dashboard", "planejamento"];
    }
  });

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Briefcase, desc: "Central de Comando Docente", visible: true },
    { id: "planejamento", label: "Planejamento", icon: Layers, desc: "Ecosistema Semestral F12", visible: true },
    { id: "diary", label: "Diário de Classe", icon: BookOpen, desc: "Diário de Aula Inteligente", visible: featureFlags.ENABLE_SMART_CLASS_DIARY !== false },
    { id: "turmas", label: "Turmas", icon: Users, desc: "Gestão e Níveis de Acesso", visible: true },
    { id: "activities", label: "Atividades", icon: Zap, desc: "Banco de Questões e IA", visible: true },
    { id: "avaliacoes", label: "Avaliações", icon: FileText, desc: "Provas, Simulados e Evidências", visible: true },
    { id: "corrector", label: "Correções", icon: Terminal, desc: "Parâmetros e Sandbox", visible: true },
    { id: "competencies", label: "Competências", icon: Award, desc: "Mapeamento Curricular SENAI", visible: featureFlags.ENABLE_COMPETENCY_MANAGER !== false },
    { id: "recuperacao", label: "Recuperação", icon: RefreshCw, desc: "Estudos Paralelos F13", visible: true },
    { id: "reports", label: "Relatórios", icon: Activity, desc: "IA e Planos de Intervenção", visible: featureFlags.ENABLE_TEACHER_REPORTS !== false },
    { id: "materiais", label: "Materiais", icon: BookOpen, desc: "Biblioteca & Apoio Didático", visible: true },
    { id: "assistant", label: "Assistente IA", icon: Sparkles, desc: "Copiloto Pedagógico IA", visible: featureFlags.ENABLE_TEACHER_AI_ASSISTANT !== false },
    { id: "settings", label: "Configurações", icon: Settings, desc: "Conexões e Chaves", visible: true },
  ];

  const filteredItems = menuItems.filter(item => {
    if (!item.visible) return false;
    if (!searchQuery) return true;
    return item.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(fav => fav !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("codecheck_favorites", JSON.stringify(updated));
  };

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 80 : 320 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="border-r border-slate-800 bg-[#070b19] p-4 flex flex-col h-full justify-between relative select-none"
    >
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-2 mt-2">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="w-4.5 h-4.5 text-[#030712] stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">CodeCheck</h1>
                <span className="text-[9px] text-[#10b981] font-mono uppercase tracking-widest font-semibold">ECOSISTEMA CORE</span>
              </div>
            </motion.div>
          )}

          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Zap className="w-5 h-5 text-[#030712] stroke-[2.5]" />
            </div>
          )}

          {/* Collapse toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-all absolute -right-3 top-6 z-10 shadow-md"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Search */}
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar ferramenta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 overflow-y-auto max-h-[60vh] scrollbar-none pr-1">
          {!isCollapsed && (
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 font-bold px-2">
              Menu Principal
            </div>
          )}

          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isFav = favorites.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => setTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setTab(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-left relative overflow-hidden group cursor-pointer ${
                  isActive 
                    ? "bg-slate-800/80 text-white shadow-sm border border-slate-700/50" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold tracking-tight">{item.label}</span>
                      <span className="text-[9px] text-slate-500 font-normal leading-none mt-0.5">{item.desc}</span>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <button 
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 transition-all text-slate-500 hover:text-yellow-400"
                  >
                    <Star className={`w-3.5 h-3.5 ${isFav ? "fill-yellow-400 text-yellow-400" : ""}`} />
                  </button>
                )}

                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-0.75 bg-emerald-400 rounded-r-md" />
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Cloud SQL connection widget */}
      <div className={`p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/60 mt-auto ${isCollapsed ? "items-center flex justify-center" : ""}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2 mb-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <h3 className="text-xs font-semibold text-slate-300">Banco de Dados</h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal mb-3 font-medium">
              Armazenamento persistente e logs analíticos ativos.
            </p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbConnected ? "bg-emerald-400" : "bg-sky-400"}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dbConnected ? "bg-emerald-500" : "bg-sky-500"}`} />
              </span>
              <span className="text-[9px] font-mono font-medium text-slate-400">
                {dbConnected ? "PostgreSQL Ativo" : "Modo Cache Iniciado"}
              </span>
            </div>
          </>
        ) : (
          <div className="relative">
            <span className={`absolute -top-1 -right-1 flex h-2 w-2`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbConnected ? "bg-emerald-400" : "bg-sky-400"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dbConnected ? "bg-emerald-500" : "bg-sky-500"}`} />
            </span>
            <Database className="w-5 h-5 text-slate-400" />
          </div>
        )}
      </div>
    </motion.aside>
  );
}


import {
  LayoutDashboard,
  FileCode,
  CheckCircle,
  Play,
  Camera,
  Users,
  BarChart3,
  Settings,
  Bot,
  Cloud,
  ShieldAlert,
  BrainCircuit,
  Columns,
  Target,
  Sparkles,
  Building2,
  Library,
  Image,
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
  {
    name: "Correção Rápida",
    icon: FileCode,
    path: "/teacher/quick-correction",
  },
  {
    name: "Correção por Imagem",
    icon: Image,
    path: "/teacher/image-correction",
  },
  {
    name: "Correção em Lote",
    icon: Columns,
    path: "/teacher/batch-correction",
  },
  { name: "Relatórios", icon: Library, path: "/teacher/reports" },
  { name: "Similaridade", icon: ShieldAlert, path: "/teacher/similarity" },
  { name: "Analytics", icon: BarChart3, path: "/teacher/analytics" },
  { name: "Configurações", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#020617] text-gray-300 min-h-screen p-6 flex flex-col justify-between border-r border-gray-800 shrink-0">
      <div>
        <div className="mb-10">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="text-emerald-400" />
            CodeCheck AI
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
            Teacher Control
          </p>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Sistema online
        </div>
        <p className="text-xs text-gray-500">Inteligência Ativa</p>
      </div>
    </aside>
  );
}

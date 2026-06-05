import { LayoutDashboard, FileCode, CheckCircle, Play, Camera, Users, BarChart3, Settings, Bot } from 'lucide-react';
import { motion } from 'motion/react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Atividades', icon: FileCode },
  { name: 'Correções', icon: CheckCircle },
  { name: 'Execução', icon: Play },
  { name: 'OCR Imagens', icon: Camera },
  { name: 'Alunos', icon: Users },
  { name: 'Relatórios', icon: BarChart3 },
  { name: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#020617] text-gray-300 min-h-screen p-6 flex flex-col justify-between border-r border-gray-800">
      <div>
        <div className="mb-10">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="text-cyan-400" />
            CodeCheck AI
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Correção inteligente de código</p>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <motion.a 
              key={item.name} 
              href="#" 
              whileHover={{ x: 5 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              <item.icon size={20} />
              {item.name}
            </motion.a>
          ))}
        </nav>
      </div>

      <div className="mt-auto bg-gray-900 p-4 rounded-xl border border-gray-800">
         <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Sistema online
         </div>
         <p className="text-xs text-gray-500">Sandbox ativo</p>
      </div>
    </aside>
  );
}

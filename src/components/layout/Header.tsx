import { Bell, User, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 py-3 px-8 flex justify-between items-center sticky top-0 z-40">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Olá, Professor Djalma 👋</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:bg-white border border-transparent focus:border-blue-500 transition-all text-sm w-64"
            />
        </div>
        
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <Bell size={20} />
        </button>
        <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            DJ
        </div>
      </div>
    </header>
  );
}

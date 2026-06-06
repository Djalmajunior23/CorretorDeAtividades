import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, Library, FileText, Blocks, LayoutTemplate, Plus } from 'lucide-react';

export default function ContentFactoryDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/content-factory/dashboard`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E14] text-slate-200 flex flex-col items-center">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E0E14]/80 backdrop-blur sticky top-0 w-full">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
             <Library className="w-6 h-6 text-yellow-500" />
             <h1 className="text-xl font-bold">AI Content Factory</h1>
          </div>
          <nav className="flex space-x-4">
            <Link to="/teacher/ai-assistant" className="text-sm text-slate-400 hover:text-yellow-400 transition-colors">Chat Acadêmico</Link>
            <Link to="/teacher/assessment-studio" className="text-sm text-slate-400 hover:text-yellow-400 transition-colors">Assessment</Link>
            <Link to="/teacher/content-factory" className="text-sm text-yellow-400 font-medium transition-colors">Conteúdo</Link>
          </nav>
        </div>
      </header>
      
      <div className="max-w-6xl w-full p-6 space-y-8 mt-4">
         <div className="flex justify-between items-center">
             <div>
                 <h2 className="text-2xl font-bold">Fábrica de Conteúdos IA</h2>
                 <p className="text-sm text-slate-400 mt-1">Gere apostilas, laboratórios práticos e slides integrados ao seu currículo.</p>
             </div>
             <button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg font-bold flex items-center space-x-2 transition-colors">
                 <Plus className="w-4 h-4" />
                 <span>Novo Material</span>
             </button>
         </div>

         <div className="grid grid-cols-4 gap-4">
             <div className="bg-[#181824] p-5 rounded-xl border border-slate-800 hover:border-yellow-500/50 cursor-pointer transition-colors group">
                 <FileText className="w-6 h-6 text-yellow-400 mb-3" />
                 <h3 className="font-semibold text-slate-200 mb-1">Apostilas & Guias</h3>
                 <p className="text-xs text-slate-500 group-hover:text-slate-400">Gere e-books com exercícios teóricos.</p>
             </div>
             
             <div className="bg-[#181824] p-5 rounded-xl border border-slate-800 hover:border-yellow-500/50 cursor-pointer transition-colors group">
                 <Blocks className="w-6 h-6 text-yellow-400 mb-3" />
                 <h3 className="font-semibold text-slate-200 mb-1">Laboratórios Práticos</h3>
                 <p className="text-xs text-slate-500 group-hover:text-slate-400">Desafios focados em programação.</p>
             </div>
             
             <div className="bg-[#181824] p-5 rounded-xl border border-slate-800 hover:border-yellow-500/50 cursor-pointer transition-colors group">
                 <LayoutTemplate className="w-6 h-6 text-yellow-400 mb-3" />
                 <h3 className="font-semibold text-slate-200 mb-1">Slides de Aula</h3>
                 <p className="text-xs text-slate-500 group-hover:text-slate-400">Geração automática de deck de slides.</p>
             </div>
             
             <div className="bg-[#181824] p-5 rounded-xl border border-slate-800 hover:border-yellow-500/50 cursor-pointer transition-colors group">
                 <PenTool className="w-6 h-6 text-yellow-400 mb-3" />
                 <h3 className="font-semibold text-slate-200 mb-1">Projetos Integradores</h3>
                 <p className="text-xs text-slate-500 group-hover:text-slate-400">Desafios de final de semestre.</p>
             </div>
         </div>

         <div className="bg-[#181824] border border-slate-800 rounded-xl overflow-hidden mt-8">
             <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-slate-200">Biblioteca Materiais</h3>
                 <div className="flex space-x-6 text-sm">
                     <div className="text-slate-400">Projetos: <span className="font-bold text-slate-200">{data?.projects_count || 0}</span></div>
                     <div className="text-slate-400">Conteúdos Totais: <span className="font-bold text-slate-200">{data?.contents_generated || 0}</span></div>
                 </div>
             </div>
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-800/30 text-slate-400 border-b border-slate-800">
                     <tr>
                         <th className="px-6 py-4 font-medium">Material</th>
                         <th className="px-6 py-4 font-medium">Tipo</th>
                         <th className="px-6 py-4 font-medium">Formato</th>
                         <th className="px-6 py-4 font-medium text-right">Ação</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/50">
                     {data?.recent_contents.map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/20">
                            <td className="px-6 py-4 font-medium text-slate-200">{c.title}</td>
                            <td className="px-6 py-4 text-slate-400">
                                <span className="bg-slate-800 px-2 py-1 rounded text-xs">{c.type}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                                <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/20">{c.format}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-yellow-400 hover:text-white transition-colors">
                                    Baixar Arquivo
                                </button>
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

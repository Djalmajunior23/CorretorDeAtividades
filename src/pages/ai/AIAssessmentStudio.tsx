import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, Brain, SearchCheck, Layers, FileDown, Plus } from 'lucide-react';

export default function AIAssessmentStudio() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/assessment-studio/dashboard`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E14] text-slate-200 flex flex-col items-center">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E0E14]/80 backdrop-blur sticky top-0 w-full">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
             <PenTool className="w-6 h-6 text-orange-500" />
             <h1 className="text-xl font-bold">AI Assessment Studio</h1>
          </div>
          <nav className="flex space-x-4">
            <Link to="/teacher/ai-assistant" className="text-sm text-slate-400 hover:text-orange-400 transition-colors">Chat Acadêmico</Link>
            <Link to="/teacher/assessment-studio" className="text-sm text-orange-400 font-medium transition-colors">Assessment Studio</Link>
          </nav>
        </div>
      </header>
      
      <div className="max-w-6xl w-full p-6 space-y-8 mt-4">
         <div className="flex justify-between items-center">
             <div>
                 <h2 className="text-2xl font-bold">Gerador de Avaliações IA</h2>
                 <p className="text-sm text-slate-400 mt-1">Gere provas, simulados SAEP e atividades alinhadas à Taxonomia de Bloom.</p>
             </div>
             <button className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
                 <Plus className="w-4 h-4" />
                 <span>Nova Avaliação Master</span>
             </button>
         </div>

         <div className="grid grid-cols-4 gap-4">
             <div className="bg-[#181824] p-5 rounded-xl border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-colors group">
                 <SearchCheck className="w-6 h-6 text-orange-400 mb-3" />
                 <h3 className="font-semibold text-slate-200 mb-1">Simulado SAEP</h3>
                 <p className="text-xs text-slate-500 group-hover:text-slate-400">Gera simulados com base em descritores e matriz de referência SAEP.</p>
             </div>
             
             <div className="bg-[#181824] p-5 rounded-xl border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-colors group">
                 <Brain className="w-6 h-6 text-orange-400 mb-3" />
                 <h3 className="font-semibold text-slate-200 mb-1">Avaliação Teórica</h3>
                 <p className="text-xs text-slate-500 group-hover:text-slate-400">Perguntas objetivas e discursivas baseadas na aula.</p>
             </div>
             
             <div className="bg-[#181824] p-5 rounded-xl border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-colors group">
                 <PenTool className="w-6 h-6 text-orange-400 mb-3" />
                 <h3 className="font-semibold text-slate-200 mb-1">Desafio Prático</h3>
                 <p className="text-xs text-slate-500 group-hover:text-slate-400">Atividades com código de programação, diagramas e banco de dados.</p>
             </div>
             
             <div className="bg-[#181824] p-5 rounded-xl border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-colors group">
                 <Layers className="w-6 h-6 text-orange-400 mb-3" />
                 <h3 className="font-semibold text-slate-200 mb-1">Criação de Rubricas</h3>
                 <p className="text-xs text-slate-500 group-hover:text-slate-400">Gere critérios de avaliação detalhados.</p>
             </div>
         </div>

         <div className="bg-[#181824] border border-slate-800 rounded-xl overflow-hidden mt-8">
             <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-slate-200">Últimas Avaliações Geradas</h3>
                 <div className="flex space-x-6 text-sm">
                     <div className="text-slate-400">Banco de Questões: <span className="font-bold text-slate-200">{data?.questions_in_bank || 0}</span></div>
                     <div className="text-slate-400">Avaliações Totais: <span className="font-bold text-slate-200">{data?.assessments_created || 0}</span></div>
                 </div>
             </div>
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-800/30 text-slate-400 border-b border-slate-800">
                     <tr>
                         <th className="px-6 py-4 font-medium">Avaliação</th>
                         <th className="px-6 py-4 font-medium">Tipo</th>
                         <th className="px-6 py-4 font-medium">Volume</th>
                         <th className="px-6 py-4 font-medium text-right">Ação</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/50">
                     {data?.recent_assessments.map((a: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/20">
                            <td className="px-6 py-4 font-medium text-slate-200">{a.title}</td>
                            <td className="px-6 py-4 text-slate-400">
                                <span className="bg-slate-800 px-2 py-1 rounded text-xs">{a.type}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-300">{a.questions} Questões</td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-orange-400 hover:text-white flex items-center justify-end w-full space-x-2 transition-colors">
                                    <FileDown className="w-4 h-4" />
                                    <span>Exportar Forms / PDF</span>
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

import { apiUrl, safeJsonResponse } from "../../config/api";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Bot, MessageSquare, Database, FileText } from 'lucide-react';


export default function AIAcademicAssistant() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(apiUrl("/api/ai-academic-assistant/dashboard"))
      .then(r => safeJsonResponse(r))
      .then(d => setData(d))
      .catch(e => {
        console.warn("AI Academic Assistant fallback:", e);
        setData({
          status: "active",
          conversations: 42,
          artifacts_generated: 128,
          recent_artifacts: [
            { type: "Plano de Aula", title: "Plano de Aula: Introdução a Algoritmos de Ordenação" },
            { type: "Rubrica", title: "Rubrica de Avaliação: Projeto de Banco de Dados" },
            { type: "Lista de Exercícios", title: "Lista de Recuperação: Funções e Escopo de Variáveis" },
            { type: "Simulado", title: "Mini-Simulado SAEP: 10 Questões Descritor D14" }
          ]
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E14] text-slate-200 flex flex-col items-center">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E0E14]/80 backdrop-blur sticky top-0 w-full">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
             <Sparkles className="w-6 h-6 text-purple-500" />
             <h1 className="text-xl font-bold">EduProfessor AI</h1>
          </div>
          <nav className="flex space-x-4">
            <Link to="/teacher/ai-assistant" className="text-sm text-purple-400 font-medium transition-colors">Chat Acadêmico</Link>
            <Link to="/teacher/assessment-studio" className="text-sm text-slate-400 hover:text-purple-400 transition-colors">Assessment Studio</Link>
          </nav>
        </div>
      </header>
      
      <div className="max-w-6xl w-full p-6 flex gap-6 mt-4">
         
         <div className="flex-1 bg-[#181824] border border-slate-800 rounded-xl flex flex-col overflow-hidden h-[800px]">
             <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                     <Bot className="w-5 h-5 text-purple-400" />
                     <h3 className="font-semibold text-slate-200">EduProfessor AI</h3>
                 </div>
                 <div className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Modelo SAEP Especializado</div>
             </div>
             
             <div className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto">
                 <div className="flex justify-start">
                     <div className="bg-slate-800/50 text-slate-200 p-4 rounded-xl rounded-tl-none max-w-[80%] border border-slate-700">
                         Olá! Sou o EduProfessor AI, seu assistente acadêmico. Como posso ajudar com sua turma de Desenvolvimento de Sistemas hoje?
                         <br/><br/>
                         Posso gerar:
                         <ul className="list-disc ml-5 mt-2 text-sm text-slate-300">
                             <li>Planos de aula baseados nas UCs</li>
                             <li>Atividades práticas com rubricas</li>
                             <li>Planos de recuperação para competências em déficit</li>
                             <li>Simulados estilo SAEP</li>
                         </ul>
                     </div>
                 </div>
                 
                 <div className="flex justify-end">
                     <div className="bg-purple-600 text-white p-4 rounded-xl rounded-tr-none max-w-[80%]">
                         Gere uma recuperação prática de Java considerando que a turma teve apenas 60% de desempenho em "Estruturas Condicionais".
                     </div>
                 </div>
             </div>

             <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                 <div className="relative flex items-center">
                     <input 
                       type="text" 
                       placeholder="Pedir ao assistente educacional..." 
                       className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:border-purple-500"
                     />
                     <button className="absolute right-2 p-2 bg-purple-500 hover:bg-purple-400 rounded-md text-white transition-colors">
                        <Sparkles className="w-4 h-4" />
                     </button>
                 </div>
             </div>
         </div>

         <div className="w-96 flex flex-col space-y-6">
             <div className="bg-[#181824] border border-slate-800 rounded-xl p-5">
                 <h3 className="font-semibold text-slate-200 mb-4 flex items-center space-x-2">
                     <Database className="w-4 h-4 text-slate-400" />
                     <span>Sua Biblioteca Geral</span>
                 </h3>
                 <div className="space-y-4">
                     <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400">Conversas Ativas</span>
                         <span className="font-mono text-slate-200">{data?.conversations || 0}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400">Artefatos Gerados</span>
                         <span className="font-mono text-purple-400 font-bold">{data?.artifacts_generated || 0}</span>
                     </div>
                 </div>
             </div>

             <div className="bg-[#181824] border border-slate-800 rounded-xl p-5 flex-1">
                 <h3 className="font-semibold text-slate-200 mb-4 flex items-center space-x-2">
                     <FileText className="w-4 h-4 text-slate-400" />
                     <span>Artefatos Recentes</span>
                 </h3>
                 <div className="space-y-3">
                     {data?.recent_artifacts.map((a: any, i: number) => (
                        <div key={i} className="p-3 border border-slate-800 rounded-lg bg-slate-900/50 hover:border-purple-500/30 transition-colors cursor-pointer group">
                           <div className="text-xs text-purple-400 mb-1">{a.type}</div>
                           <div className="text-sm text-slate-200 font-medium group-hover:text-purple-300">{a.title}</div>
                        </div>
                     ))}
                 </div>
             </div>
         </div>

      </div>
    </div>
  );
}

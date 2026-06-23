import { apiUrl, API_BASE_URL } from "../../config/api";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, CheckCircle, BrainCircuit } from 'lucide-react';
import { cn } from '../../utils/cn';


export default function AdaptiveLearningDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // mock teacher dashboard fetch
    fetch(`${API_BASE_URL}/adaptive-learning/teacher/analytics`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E14] text-slate-200 flex flex-col items-center">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E0E14]/80 backdrop-blur sticky top-0 z-10 w-full">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
             <BrainCircuit className="w-6 h-6 text-indigo-500" />
             <h1 className="text-xl font-bold">Analytics & Recovery</h1>
          </div>
          <nav className="flex space-x-4">
            <Link to="/teacher/correction-lab" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Lab</Link>
            <Link to="/teacher/batch-correction" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Lotes</Link>
            <Link to="/teacher/classroom" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Classroom</Link>
            <Link to="/teacher/plagiarism" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Integridade</Link>
            <Link to="/teacher/adaptive-learning" className="text-sm text-emerald-400 font-medium transition-colors">Analytics</Link>
          </nav>
        </div>
      </header>
      
      <div className="max-w-6xl w-full p-6 space-y-8">

         {data ? (
            <>
              <div className="grid grid-cols-4 gap-6">
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Média da Turma Ponderada</div>
                    <div className="text-3xl font-bold text-slate-100">{data.turma_media}%</div>
                    <div className="mt-2 text-xs text-emerald-400 flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" /> <span>+4% vs Atividade Anterior</span>
                    </div>
                 </div>
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Alunos em Recuperação Automática</div>
                    <div className="text-3xl font-bold text-amber-400">{data.alunos_em_risco}</div>
                    <div className="mt-2 text-xs text-slate-400">Atividades de retreinamento geradas.</div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-[#181824] p-6 rounded-xl border border-emerald-900/40">
                     <h3 className="font-semibold text-emerald-400 mb-4 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Competências Dominadas pela Turma</span>
                     </h3>
                     <ul className="space-y-3">
                        {data.competencias_dominadas.map((c: string, i: number) => (
                           <li key={i} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm font-medium">{c}</li>
                        ))}
                     </ul>
                 </div>
                 <div className="bg-[#181824] p-6 rounded-xl border border-rose-900/40">
                     <h3 className="font-semibold text-rose-400 mb-4 flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <span>Competências Críticas (Déficit)</span>
                     </h3>
                     <ul className="space-y-3">
                        {data.competencias_criticas.map((c: string, i: number) => (
                           <li key={i} className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-rose-200 text-sm font-medium flex justify-between items-center">
                               <span>{c}</span>
                               <button className="bg-rose-500 text-white text-xs px-3 py-1 rounded hover:bg-rose-400 transition-colors">
                                  Gerar Trilha + Lista
                               </button>
                           </li>
                        ))}
                     </ul>
                 </div>
              </div>
            </>
         ) : (
            <div className="text-slate-500">Caregando Inteligência Analítica...</div>
         )}
      </div>
    </div>
  );
}

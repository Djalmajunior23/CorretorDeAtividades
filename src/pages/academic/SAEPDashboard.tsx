import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, ListChecks, ArrowUpRight, Activity } from 'lucide-react';

export default function SAEPDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/saep/dashboard`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E14] text-slate-200 flex flex-col items-center">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E0E14]/80 backdrop-blur sticky top-0 w-full">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
             <Target className="w-6 h-6 text-fuchsia-500" />
             <h1 className="text-xl font-bold">SAEP Intelligence Center</h1>
          </div>
          <nav className="flex space-x-4">
            <Link to="/teacher/saep" className="text-sm text-fuchsia-400 font-medium transition-colors">SAEP</Link>
            <Link to="/teacher/curriculum" className="text-sm text-slate-400 hover:text-fuchsia-400 transition-colors">Currículo</Link>
            <Link to="/teacher/academic-command-center" className="text-sm text-slate-400 hover:text-fuchsia-400 transition-colors">Command Center</Link>
          </nav>
        </div>
      </header>
      
      <div className="max-w-6xl w-full p-6 space-y-8">
         {data ? (
            <>
              <div className="grid grid-cols-3 gap-6">
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Competências Desenvolvidas</div>
                    <div className="text-4xl font-bold text-slate-100">{data.competencies_developed}</div>
                 </div>
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Competências Críticas</div>
                    <div className="text-4xl font-bold text-rose-500">{data.critical_competencies}</div>
                 </div>
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Evidências Geradas Autom.</div>
                    <div className="text-4xl font-bold text-fuchsia-500">{data.evidences_generated}</div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#181824] rounded-xl border border-slate-800 p-6">
                      <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
                         <Activity className="w-5 h-5 text-slate-400" />
                         <span>Indicadores por Competência</span>
                      </h3>
                      <div className="space-y-4">
                          {data.indicators.map((ind: any, i: number) => (
                             <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                <span className="font-mono text-sm">{ind.code}</span>
                                <div className="flex items-center space-x-3">
                                   <div className={`px-2 py-1 rounded text-xs font-bold leading-none
                                      ${ind.status === 'VERDE' ? 'bg-emerald-500/20 text-emerald-400' :
                                        ind.status === 'AMARELO' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-rose-500/20 text-rose-400'
                                      }
                                   `}>
                                      {ind.status} ({ind.value}%)
                                   </div>
                                </div>
                             </div>
                          ))}
                      </div>
                  </div>

                  <div className="bg-[#181824] rounded-xl border border-slate-800 p-6">
                      <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
                         <ListChecks className="w-5 h-5 text-slate-400" />
                         <span>Planos de Ação Pendentes</span>
                      </h3>
                      <div className="space-y-4">
                          {data.action_plans.map((ap: any, i: number) => (
                             <div key={i} className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-fuchsia-500/30 transition-colors">
                                 <h4 className="font-medium text-slate-200">{ap.title}</h4>
                                 <div className="mt-2 flex justify-between items-center text-xs text-slate-400">
                                     <span>Foco na Competência: {ap.competency}</span>
                                     <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">{ap.status}</span>
                                 </div>
                             </div>
                          ))}
                      </div>
                  </div>
              </div>
            </>
         ) : (
             <div className="text-slate-500 flex justify-center items-center h-48">Carregando SAEP Intelligence...</div>
         )}
      </div>
    </div>
  );
}

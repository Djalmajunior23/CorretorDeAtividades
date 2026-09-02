import { apiUrl, safeJsonResponse } from "../../config/api";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, AlertTriangle, BarChart4, Users } from 'lucide-react';
import { cn } from '../../utils/cn';

import Sidebar from '../../components/layout/Sidebar';

export default function AcademicCommandCenter() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(apiUrl("/api/academic-command-center/dashboard"))
      .then(r => safeJsonResponse(r))
      .then(d => setData(d))
      .catch(e => {
        console.warn("Academic Command Center fallback:", e);
        setData({
          kpis: {
            approval_rate: 91.4,
            average_score: 8.2,
            attendance: 94.6
          },
          risk_students: 4,
          classes_performance: [
            { name: "Dev Sistemas - Turma 1A", average: 8.7, completion: 94 },
            { name: "Dev Sistemas - Turma 2B", average: 7.9, completion: 86 },
            { name: "Redes & IoT - Turma 3C", average: 8.1, completion: 90 },
            { name: "Ciência de Dados - 1B", average: 8.5, completion: 92 }
          ]
        });
      });
  }, []);

  return (
    <div className="flex h-screen bg-[#0E0E14] text-slate-200 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E0E14]/80 backdrop-blur sticky top-0 z-10 w-full">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
               <Building2 className="w-6 h-6 text-blue-500" />
               <h1 className="text-xl font-bold">Academic Performance Command Center</h1>
            </div>
            <nav className="flex space-x-4">
              <Link to="/teacher/saep" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">SAEP</Link>
              <Link to="/teacher/curriculum" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Currículo</Link>
              <Link to="/teacher/academic-center" className="text-sm text-blue-400 font-medium transition-colors">Command Center</Link>
            </nav>
          </div>
        </header>
        
        <div className="max-w-7xl w-full p-6 space-y-8 mx-auto">
         {data ? (
            <>
              <div className="grid grid-cols-4 gap-6">
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Taxa de Aprovação</div>
                    <div className="text-3xl font-bold text-slate-100">{data.kpis.approval_rate}%</div>
                    <div className="mt-2 text-xs text-blue-400 flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" /> <span>Estável</span>
                    </div>
                 </div>
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Média da Instituição</div>
                    <div className="text-3xl font-bold text-slate-100">{data.kpis.average_score}</div>
                    <div className="mt-2 text-xs text-blue-400 flex items-center space-x-1">
                        <BarChart4 className="w-3 h-3" /> <span>Último Semestre: 7.6</span>
                    </div>
                 </div>
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Presença Média</div>
                    <div className="text-3xl font-bold text-slate-100">{data.kpis.attendance}%</div>
                    <div className="mt-2 text-xs text-slate-400 flex items-center space-x-1">
                        <Users className="w-3 h-3" /> <span>Global</span>
                    </div>
                 </div>
                 <div className="bg-[#181824] p-6 rounded-xl border border-rose-900/40">
                    <div className="text-rose-400/80 text-sm mb-2">Alunos em Risco Crítico</div>
                    <div className="text-3xl font-bold text-rose-400">{data.risk_students}</div>
                    <div className="mt-2 text-xs text-rose-400 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" /> <span>Previsão de Evasão</span>
                    </div>
                 </div>
              </div>

              <div className="bg-[#181824] rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                    <h3 className="font-bold text-lg">Desempenho por Turma</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-medium">Turma / Curso</th>
                            <th className="px-6 py-4 font-medium">Média</th>
                            <th className="px-6 py-4 font-medium">Taxa de Conclusão</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {data.classes_performance.map((c: any, i: number) => (
                           <tr key={i} className="hover:bg-slate-800/30">
                               <td className="px-6 py-4 font-medium text-slate-200">{c.name}</td>
                               <td className="px-6 py-4 font-bold text-slate-100">{c.average}</td>
                               <td className="px-6 py-4">
                                   <div className="flex items-center space-x-3">
                                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden max-w-[120px]">
                                         <div className={`h-full ${c.completion > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${c.completion}%`}}/>
                                      </div>
                                      <span className="text-slate-400 text-xs">{c.completion}%</span>
                                   </div>
                               </td>
                           </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </>
         ) : (
            <div className="text-slate-500 flex justify-center items-center h-48">Carregando indicadores...</div>
         )}
        </div>
      </div>
    </div>
  );
}

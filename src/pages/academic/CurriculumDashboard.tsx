import { apiUrl, API_BASE_URL } from "../../config/api";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Layers, LayoutList, Workflow } from 'lucide-react';

import Sidebar from '../../components/layout/Sidebar';

export default function CurriculumDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/curriculum/dashboard`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="flex h-screen bg-[#0E0E14] text-slate-200 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E0E14]/80 backdrop-blur sticky top-0 w-full">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
               <Map className="w-6 h-6 text-teal-500" />
               <h1 className="text-xl font-bold">Curriculum Intelligence Engine</h1>
            </div>
            <nav className="flex space-x-4">
              <Link to="/teacher/saep" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">SAEP</Link>
              <Link to="/teacher/curriculum" className="text-sm text-teal-400 font-medium transition-colors">Currículo</Link>
              <Link to="/teacher/academic-command-center" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Command Center</Link>
            </nav>
          </div>
        </header>
        
        <div className="max-w-6xl w-full p-6 space-y-8 mx-auto">
         {data ? (
            <>
              <div className="grid grid-cols-3 gap-6">
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Cursos Cadastrados</div>
                    <div className="text-4xl font-bold text-slate-100 flex items-center space-x-3">
                       <Layers className="w-8 h-8 text-teal-500/50" />
                       <span>{data.courses_count}</span>
                    </div>
                 </div>
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Unidades Curriculares (UCs)</div>
                    <div className="text-4xl font-bold text-slate-100 flex items-center space-x-3">
                       <LayoutList className="w-8 h-8 text-teal-500/50" />
                       <span>{data.units_count}</span>
                    </div>
                 </div>
                 <div className="bg-[#181824] p-6 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-sm mb-2">Banco de Competências</div>
                    <div className="text-4xl font-bold text-slate-100 flex items-center space-x-3">
                       <Workflow className="w-8 h-8 text-teal-500/50" />
                       <span>{data.competencies_count}</span>
                    </div>
                 </div>
              </div>

              <div className="bg-[#181824] rounded-xl border border-slate-800 overflow-hidden">
                 <div className="p-5 border-b border-slate-800">
                    <h3 className="font-bold text-lg">Planos de Ensino Ativos</h3>
                 </div>
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-medium">Curso</th>
                            <th className="px-6 py-4 font-medium">UC</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {data.recent_plans.map((p: any, i: number) => (
                           <tr key={i} className="hover:bg-slate-800/30">
                               <td className="px-6 py-4 font-medium text-slate-200">{p.course}</td>
                               <td className="px-6 py-4 text-slate-300">{p.unit}</td>
                               <td className="px-6 py-4">
                                  <span className="bg-teal-500/10 text-teal-400 px-2 py-1 rounded text-xs font-bold border border-teal-500/20">{p.status}</span>
                               </td>
                           </tr>
                        ))}
                    </tbody>
                 </table>
              </div>
            </>
         ) : (
            <div className="text-slate-500 flex justify-center items-center h-48">Carregando motores de currículo...</div>
         )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Download, AlertTriangle, Lightbulb, Activity, CheckCircle2 } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { reportsApi } from '../../services/reportsApi';

export default function PedagogicalReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await reportsApi.getReports();
      setReports(data);
      if (data.length === 0) {
        handleGenerateReport();
      } else {
        fetchReportDetails(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReportDetails = async (id: number) => {
    setLoading(true);
    setSelectedReportId(id);
    try {
      const data = await reportsApi.getReportDetails(id);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const payload = {
        teacher_id: 1,
        class_name: "Turma 101 - Lógica de Programação",
        title: "Relatório Mensal - Maio"
      };
      const res = await reportsApi.generateReport(payload);
      await loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="flex h-screen bg-[#0F111A] text-slate-200">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  const { report, items, insights } = reportData || { report: {}, items: [], insights: [] };
  const competencies = report?.critical_competencies ? JSON.parse(report.critical_competencies) : [];
  const recommendations = report?.recommendations ? JSON.parse(report.recommendations) : [];

  return (
    <div className="flex h-screen bg-[#0F111A] text-slate-200">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text">
              Relatórios Pedagógicos
            </h1>
            <p className="text-slate-400 mt-2">Visão analítica de desempenho e IA preditiva da turma.</p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => window.open(`/api/pedagogical-reports/${report.id}/export-csv`)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
               <Download className="w-4 h-4" /> Exportar CSV
             </button>
             <button onClick={() => window.open(`/api/pedagogical-reports/${report.id}/export-pdf`)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors text-white">
               <Download className="w-4 h-4" /> Exportar PDF
             </button>
          </div>
        </header>

        {reportData && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{report.title}</h2>
                <p className="text-sm text-slate-500">{report.class_name}</p>
              </div>
              <p className="text-sm text-slate-500">Gerado em: {new Date(report.created_at).toLocaleDateString('pt-BR')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1D27] p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400 font-medium">Média Geral</p>
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-white">{report.average_score.toFixed(1)}</p>
              </div>
              
              <div className="bg-[#1A1D27] p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400 font-medium">Risco Alto (Alunos)</p>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-white">{items.filter((i: any) => i.risk_level === 'HIGH').length}</p>
              </div>
              
              <div className="bg-[#1A1D27] p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400 font-medium">Pontos Fortes</p>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-white">{insights.filter((i: any) => i.type === 'STRENGTH').length}</p>
              </div>

               <div className="bg-[#1A1D27] p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400 font-medium">Pontos de Atenção</p>
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-white">{insights.filter((i: any) => i.type === 'WEAKNESS').length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#1A1D27] rounded-xl border border-slate-800 p-6 lg:col-span-2">
                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                   <Activity className="w-5 h-5 text-emerald-400" />
                   Desempenho dos Alunos
                 </h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="text-xs text-slate-500 uppercase bg-[#1E212B] border-b border-slate-800">
                       <tr>
                         <th className="px-4 py-3">Aluno</th>
                         <th className="px-4 py-3">Nota</th>
                         <th className="px-4 py-3">Risco</th>
                         <th className="px-4 py-3">Erros Frequentes</th>
                       </tr>
                     </thead>
                     <tbody>
                       {items.map((item: any) => (
                         <tr key={item.id} className="border-b border-slate-800/50 hover:bg-[#1E212B]/50">
                           <td className="px-4 py-3 font-medium text-slate-300">{item.student_name}</td>
                           <td className="px-4 py-3 text-emerald-400">{item.score}</td>
                           <td className="px-4 py-3">
                             <span className={`px-2 py-1 rounded text-xs font-semibold ${item.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400' : item.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                               {item.risk_level}
                             </span>
                           </td>
                           <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[200px]">
                             {JSON.parse(item.common_errors).join(', ') || '-'}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#1A1D27] rounded-xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                    Insights da IA
                  </h3>
                  <div className="space-y-4">
                    {insights.map((ins: any) => (
                      <div key={ins.id} className="flex gap-3 text-sm">
                        {ins.type === 'STRENGTH' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
                        {ins.type === 'WEAKNESS' && <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                        {ins.type === 'SUGGESTION' && <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
                        <p className="text-slate-300 leading-relaxed">{ins.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1A1D27] rounded-xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-emerald-400">Recomendações Práticas</h3>
                  <ul className="list-disc leading-relaxed list-inside text-sm text-slate-300 space-y-2">
                    {recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

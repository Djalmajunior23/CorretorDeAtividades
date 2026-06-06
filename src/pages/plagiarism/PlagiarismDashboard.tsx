import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { integrityApi } from '../../services/integrityApi';

export default function PlagiarismDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await integrityApi.getReports();
      setReports(data);
      if (data.length === 0) {
        handleAnalyzeActivity();
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
      const data = await integrityApi.getReportDetails(id);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeActivity = async () => {
    setLoading(true);
    try {
      const payload = {
        teacher_id: 1,
        activity_name: "Projeto 1: Calculadora Básica"
      };
      const res = await integrityApi.analyzeActivity(payload);
      await loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCase = async (pairId: number, status: string) => {
    try {
      await integrityApi.reviewCase(pairId, { status, notes: "Reviewed via UI" });
      if (selectedReportId) {
        fetchReportDetails(selectedReportId);
      }
    } catch (err) {
      console.error(err);
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

  const { report, pairs } = reportData || { report: {}, pairs: [] };

  return (
    <div className="flex h-screen bg-[#0F111A] text-slate-200">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-amber-400 text-transparent bg-clip-text">
              Integridade Acadêmica
            </h1>
            <p className="text-slate-400 mt-2">Detecção de plágio e verificação de similaridade de código.</p>
          </div>
          <button onClick={handleAnalyzeActivity} className="px-4 py-2 bg-[#1A1D27] border border-slate-700 hover:bg-slate-800 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Search className="w-4 h-4" /> Nova Análise
          </button>
        </header>

        {reportData && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1A1D27] p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400 font-medium">Submissões Analisadas</p>
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                <p className="text-3xl font-bold text-white">{report.analyzed_submissions}</p>
                <p className="text-xs text-slate-500 mt-2">{report.activity_name}</p>
              </div>
              
              <div className="bg-[#1A1D27] p-5 rounded-xl border border-red-900/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400 font-medium">Casos Críticos</p>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-400">{report.high_risk_cases}</p>
                 <p className="text-xs text-slate-500 mt-2">Requer revisão do professor</p>
              </div>
            </div>

            <div className="bg-[#1A1D27] rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Sinalizações de Código ({pairs.length})
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                {pairs.map((pair: any) => (
                    <div key={pair.id} className={`p-5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${pair.status === 'CONFIRMED' ? 'border-red-500/50 bg-red-500/5' : pair.status === 'FALSE_POSITIVE' ? 'border-emerald-500/50 bg-emerald-500/5 cursor-not-allowed opacity-60' : 'border-slate-700 bg-[#1E212B]'}`}>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 shadow-sm shrink-0" 
                                style={{ borderColor: pair.similarity_score > 80 ? '#ef4444' : pair.similarity_score > 60 ? '#f59e0b' : '#10b981' }}>
                                <span className={`text-xl font-bold ${pair.similarity_score > 80 ? 'text-red-400' : pair.similarity_score > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {Math.round(pair.similarity_score)}%
                                </span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg text-slate-200">
                                    {pair.student_a_name} <span className="text-slate-500 font-normal px-2">↔</span> {pair.student_b_name}
                                </h4>
                                <div className="flex gap-2 mt-2 text-sm">
                                    <span className="text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Estado: {pair.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {pair.status === 'PENDING_REVIEW' && (
                            <div className="flex gap-3">
                                <button 
                                  onClick={() => handleReviewCase(pair.id, 'FALSE_POSITIVE')}
                                  className="px-4 py-2 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 rounded-lg text-sm font-medium transition-colors text-slate-400"
                                >
                                  Descartar Alerta
                                </button>
                                <button 
                                  onClick={() => handleReviewCase(pair.id, 'CONFIRMED')}
                                  className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Notificar Alunos
                                </button>
                            </div>
                        )}
                        {pair.status === 'CONFIRMED' && (
                            <div className="flex gap-2 items-center text-red-400 font-medium text-sm">
                                <CheckCircle className="w-4 h-4" /> Plágio Confirmado
                            </div>
                        )}
                    </div>
                ))}
                </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

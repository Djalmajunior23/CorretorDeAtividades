import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { analyticsApi } from '../../services/analyticsApi';
import { BarChart3, Users, AlertTriangle, Lightbulb, TrendingDown, TrendingUp, Presentation } from 'lucide-react';

export default function TeacherAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    summary: null,
    risk: [],
    errors: [],
    competencies: [],
    recs: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const classId = "C101";
      const [summary, risk, errors, competencies, recs] = await Promise.all([
        analyticsApi.getClassSummary(classId),
        analyticsApi.getStudentsRisk(classId),
        analyticsApi.getCommonErrors(classId),
        analyticsApi.getCompetencies(classId),
        analyticsApi.generateRecommendations(classId)
      ]);
      setData({ summary, risk, errors, competencies, recs });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0F111A] text-slate-200">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  const { summary, risk, errors, competencies, recs } = data;

  return (
    <div className="flex h-screen bg-[#0F111A] text-slate-200">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        
        <header className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text">
            Learning Analytics
          </h1>
          <p className="text-slate-400 mt-2">Visão pedagógica e inteligência preditiva para suas turmas.</p>
        </header>

        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#1A1D27] p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400 font-medium">Média Geral</p>
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-white">{Number(summary?.class_metric.average_score || 0).toFixed(1)}</p>
            </div>
            <div className="bg-[#1A1D27] p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400 font-medium">Maior Nota</p>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-white">{Number(summary?.class_metric.highest_score || 0).toFixed(1)}</p>
            </div>
            <div className="bg-[#1A1D27] p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400 font-medium">Taxa de Conclusão</p>
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-3xl font-bold text-white">{Number(summary?.class_metric.completion_rate || 0).toFixed(1)}%</p>
            </div>
            <div className="bg-[#1A1D27] p-5 rounded-xl border border-red-900/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-red-400 font-medium">Alunos em Risco</p>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-400">{risk.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-[#1A1D27] rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold mb-4 text-emerald-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Alerta de Desempenho
              </h3>
              <div className="space-y-3">
                {risk.map((student: any) => (
                  <div key={student.id} className="flex justify-between items-center p-3 rounded-lg bg-[#1E212B] border border-red-900/30 text-sm">
                    <span className="font-medium text-slate-300">{student.student_name}</span>
                    <span className="text-red-400 font-bold">{Number(student.score || 0).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1D27] rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold mb-4 text-cyan-400 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" /> Erros Comuns
              </h3>
              <div className="space-y-3">
                {errors.map((err: any) => (
                  <div key={err.id} className="p-3 rounded-lg bg-[#1E212B] text-sm text-slate-300">
                    {err.description}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1D27] rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold mb-4 text-amber-400 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" /> Sugestões Pedagógicas
              </h3>
              <div className="space-y-4">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Competência Crítica</h4>
                  {competencies.map((c: any) => (
                    <span key={c.id} className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 text-xs rounded-full mr-2 mb-2">
                      {c.description}
                    </span>
                  ))}
                </div>
                
                <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Plano de Ação (IA)</h4>
                {recs.map((r: any) => (
                  <p key={r.id} className="text-sm text-slate-300 leading-relaxed p-4 bg-[#1E212B] rounded-lg border-l-2 border-amber-500">
                    {r.description}
                  </p>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

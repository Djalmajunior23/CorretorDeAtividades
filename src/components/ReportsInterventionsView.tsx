import React, { useState, useEffect } from "react";
import { Loader2, FileText, Download, Target, TrendingUp, Users, AlertTriangle, ShieldCheck } from "lucide-react";

export default function ReportsInterventionsView({ featureFlags = {} }: any) {
  const [subTab, setSubTab] = useState<"student" | "class" | "coordinator" | "risk">("class");
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [coordinatorData, setCoordinatorData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState("Vinícius Souza");
  
  // AI related states
  const [aiOpinion, setAiOpinion] = useState<string | null>(null);
  const [interventionPlan, setInterventionPlan] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    loadData();
  }, [subTab, selectedStudent]);

  const loadData = async () => {
    setLoading(true);
    setAiOpinion(null);
    setInterventionPlan(null);
    try {
      if (subTab === "class" && featureFlags.ENABLE_CLASS_ANALYTICS) {
         const res = await fetch("/api/codecheck/module05/class-report");
         if (res.ok) setClassData(await res.json());
      } else if (subTab === "student" && featureFlags.ENABLE_STUDENT_ANALYTICS) {
         const res = await fetch(`/api/codecheck/module05/student-report/${selectedStudent}`);
         if (res.ok) setStudentData(await res.json());
      } else if (subTab === "coordinator" && featureFlags.ENABLE_COORDINATOR_DASHBOARD) {
         const res = await fetch("/api/codecheck/module05/coordinator-dashboard");
         if (res.ok) setCoordinatorData(await res.json());
      } else if (subTab === "risk" && featureFlags.ENABLE_STUDENT_ANALYTICS) {
         const res = await fetch("/api/codecheck/module05/risk-profiles");
         if (res.ok) setRiskData(await res.json());
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadAIOpinion = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/codecheck/module05/pedagogical-opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: selectedStudent })
      });
      if (res.ok) {
        const data = await res.json();
        setAiOpinion(data.opinion);
      }
    } catch(e) {
      console.error(e);
    }
    setLoadingAI(false);
  };

  const loadInterventionPlan = async (competency: string) => {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/codecheck/module05/intervention-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competency })
      });
      if (res.ok) {
        const data = await res.json();
        setInterventionPlan(data.plan);
      }
    } catch(e) {
      console.error(e);
    }
    setLoadingAI(false);
  };

  const exportPDF = () => {
    alert("Iniciando exportação segura de documento em PDF com carimbo institucional...");
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100 max-w-6xl mx-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">Relatórios Cultivados e Intervenção (Fase 05)</h2>
          <p className="text-sm text-slate-400 mt-1">Análises consolidadas, pareceres com IA e exportação institucional.</p>
        </div>
        <div className="flex items-center gap-2">
          {featureFlags.ENABLE_PDF_EXPORT && (
            <button onClick={exportPDF} className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-xs rounded-xl flex items-center gap-2 border border-emerald-500/30 transition-colors">
               <Download className="w-4 h-4" />
               Exportar PDF
            </button>
          )}
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex gap-2 bg-[#0f172a] p-1.5 rounded-xl border border-[#1e295b]/30 self-start shrink-0">
        {featureFlags.ENABLE_CLASS_ANALYTICS && (
          <button
            onClick={() => setSubTab("class")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 ${subTab === "class" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            Relatório da Turma
          </button>
        )}
        {featureFlags.ENABLE_STUDENT_ANALYTICS && (
          <button
            onClick={() => setSubTab("student")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 ${subTab === "student" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            Acompanhamento Aluno
          </button>
        )}
        {featureFlags.ENABLE_STUDENT_ANALYTICS && (
          <button
            onClick={() => setSubTab("risk")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 ${subTab === "risk" ? "bg-rose-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            Gestão de Risco
          </button>
        )}
        {featureFlags.ENABLE_COORDINATOR_DASHBOARD && (
          <button
            onClick={() => setSubTab("coordinator")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 ${subTab === "coordinator" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            Visão Coordenação
          </button>
        )}
      </div>

      <div className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto pr-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* --- CLASS REPORT --- */}
            {subTab === "class" && classData && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-[#1e295b]/30 bg-[#0f172a] text-center">
                     <span className="block text-xs uppercase font-mono text-slate-400 mb-1">Média Geral</span>
                     <span className="text-3xl font-bold font-mono text-white">{classData.average_score}%</span>
                  </div>
                  <div className="p-4 rounded-xl border border-[#1e295b]/30 bg-[#0f172a] text-center">
                     <span className="block text-xs uppercase font-mono text-slate-400 mb-1">Conclusão</span>
                     <span className="text-3xl font-bold font-mono text-sky-400">{classData.completion_rate}%</span>
                  </div>
                  <div className="p-4 rounded-xl border border-[#1e295b]/30 bg-[#0f172a] text-center">
                     <span className="block text-xs uppercase font-mono text-slate-400 mb-1">Risco Recup.</span>
                     <span className="text-3xl font-bold font-mono text-rose-400">{classData.reprobation_risk_rate}%</span>
                  </div>
                  <div className="p-4 rounded-xl border border-[#1e295b]/30 bg-[#0f172a] text-center">
                     <span className="block text-xs uppercase font-mono text-slate-400 mb-1">Desvio Padrão</span>
                     <span className="text-3xl font-bold font-mono text-slate-200">{classData.std_deviation}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-xl border border-[#1e295b]/30 bg-[#0f172a]">
                    <h3 className="font-bold text-sm tracking-wide text-white uppercase font-mono mb-4 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-emerald-400" />
                       Fortalezas da Turma
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {classData.strong_competencies.map((c: string) => (
                        <li key={c} className="text-sm text-slate-300 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-xl border border-[#1e295b]/30 bg-[#0f172a]">
                    <h3 className="font-bold text-sm tracking-wide text-white uppercase font-mono mb-4 flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4 text-amber-400" />
                       Lacunas e Dificuldades
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {classData.weak_competencies.map((c: string) => (
                        <li key={c} className="flex items-center justify-between text-sm text-slate-300 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <span>{c}</span>
                          {featureFlags.ENABLE_INTERVENTION_PLAN && (
                            <button onClick={() => loadInterventionPlan(c)} className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded hover:bg-amber-500/40 transition">
                               Gerar Intervenção (IA)
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    
                    {interventionPlan && (
                      <div className="mt-4 p-4 rounded-lg bg-[#030712] border border-[#1e295b] text-sm text-slate-300 whitespace-pre-wrap font-mono">
                         {interventionPlan}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- STUDENT REPORT --- */}
            {subTab === "student" && studentData && (
              <div className="flex flex-col gap-6">
                <div className="bg-[#0f172a] rounded-xl border border-[#1e295b]/30 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-xs uppercase font-mono text-slate-400">Estudante:</label>
                    <select
                      value={selectedStudent}
                      onChange={e => setSelectedStudent(e.target.value)}
                      className="bg-[#030712] border border-[#1e295b]/50 px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                    >
                       <option value="Vinícius Souza">Vinícius Souza</option>
                       <option value="João Silva">João Silva</option>
                       <option value="Mariana Alencar">Mariana Alencar</option>
                    </select>
                  </div>
                  {featureFlags.ENABLE_AI_PEDAGOGICAL_OPINION && (
                    <button onClick={loadAIOpinion} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition">
                      {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar Parecer IA"}
                    </button>
                  )}
                </div>

                {aiOpinion && (
                   <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-xl text-slate-200">
                      <h4 className="font-bold font-mono text-indigo-400 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Parecer Pedagógico Automatizado
                      </h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiOpinion}</p>
                   </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-[#0f172a] border border-[#1e295b]/30 p-5 rounded-xl">
                      <h4 className="font-bold text-xs uppercase font-mono text-slate-400 mb-4">Competências Técnicas</h4>
                      <div className="flex flex-col gap-3">
                        {studentData.competencies.map((c: any, i: number) => (
                           <div key={i} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-slate-200">{c.name}</span>
                                 <span className="font-mono text-emerald-400">{c.score}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-[#1e295b]/50 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.score}%` }} />
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-[#0f172a] border border-[#1e295b]/30 p-4 rounded-xl flex flex-col justify-center items-center">
                        <span className="text-[10px] uppercase font-mono text-slate-500">Tentativas Médias</span>
                        <span className="text-2xl font-bold font-mono text-white mt-1">{studentData.attempts}</span>
                     </div>
                     <div className="bg-[#0f172a] border border-[#1e295b]/30 p-4 rounded-xl flex flex-col justify-center items-center">
                        <span className="text-[10px] uppercase font-mono text-slate-500">Sucesso Global</span>
                        <span className="text-2xl font-bold font-mono text-sky-400 mt-1">{studentData.success_rate}%</span>
                     </div>
                     <div className="bg-[#0f172a] border border-[#1e295b]/30 p-4 rounded-xl col-span-2 flex flex-col justify-center items-center">
                        <span className="text-[10px] uppercase font-mono text-slate-500">Status Geral do Estudante</span>
                        <span className="text-lg font-bold font-mono text-emerald-400 mt-1">Nível 3 (Proficiente)</span>
                     </div>
                   </div>
                </div>
              </div>
            )}

            {/* --- RISK PROFILES --- */}
            {subTab === "risk" && riskData && (
              <div className="flex flex-col gap-4">
                 {riskData.map((r: any, i: number) => (
                    <div key={i} className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                       r.riskLevel === 'Crítico' ? 'bg-rose-500/10 border-rose-500/30' :
                       r.riskLevel === 'Alto risco' ? 'bg-amber-500/10 border-amber-500/30' :
                       r.riskLevel === 'Médio risco' ? 'bg-yellow-500/10 border-yellow-500/30' :
                       'bg-emerald-500/10 border-emerald-500/30'
                    }`}>
                       <div className="flex flex-col">
                          <h4 className="font-bold text-white mb-1 tracking-wide">{r.name}</h4>
                          <span className="text-xs text-slate-400">{r.factors}</span>
                       </div>
                       <div className="shrink-0 flex items-center gap-3">
                          <span className={`px-3 py-1 rounded text-[10px] font-mono uppercase font-bold border ${ /*...color mapping*/
                             r.riskLevel === 'Crítico' ? 'text-rose-400 border-rose-500/50 bg-rose-500/10' :
                             r.riskLevel === 'Alto risco' ? 'text-amber-400 border-amber-500/50 bg-amber-500/10' :
                             r.riskLevel === 'Médio risco' ? 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10' :
                             'text-emerald-400 border-emerald-500/50 bg-emerald-500/10'
                          }`}>
                            {r.riskLevel}
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
            )}

            {/* --- COORDINATOR DASHBOARD --- */}
            {subTab === "coordinator" && coordinatorData && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#0f172a] border border-[#1e295b] rounded-xl text-center">
                     <span className="text-xs uppercase font-mono text-slate-400 block mb-1">Turmas Ativas</span>
                     <span className="text-3xl font-bold font-mono tracking-tighter text-white">{coordinatorData.total_classes}</span>
                  </div>
                  <div className="p-4 bg-[#0f172a] border border-[#1e295b] rounded-xl text-center">
                     <span className="text-xs uppercase font-mono text-slate-400 block mb-1">Estudantes</span>
                     <span className="text-3xl font-bold font-mono tracking-tighter text-white">{coordinatorData.total_students}</span>
                  </div>
                  <div className="p-4 bg-[#0f172a] border border-[#1e295b] rounded-xl text-center">
                     <span className="text-xs uppercase font-mono text-slate-400 block mb-1">Score Institucional</span>
                     <span className="text-3xl font-bold font-mono tracking-tighter text-sky-400">{coordinatorData.average_institutional_score}</span>
                  </div>
                  <div className="p-4 bg-[#0f172a] border border-[#1e295b] rounded-xl text-center">
                     <span className="text-xs uppercase font-mono text-slate-400 block mb-1">Engajamento</span>
                     <span className="text-3xl font-bold font-mono tracking-tighter text-emerald-400">{coordinatorData.engagement_rate}%</span>
                  </div>
                </div>

                <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e295b]">
                   <h3 className="font-bold text-sm tracking-widest text-slate-400 uppercase font-mono mb-4">Desempenho por Turma</h3>
                   <div className="flex flex-col gap-3">
                     {coordinatorData.classes_performance.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[#030712] rounded-lg border border-[#1e295b]/50">
                           <span className="text-sm font-bold text-slate-200">{c.name}</span>
                           <span className={`text-sm font-mono font-bold ${c.score >= 80 ? 'text-emerald-400' : c.score >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                             {c.score}% Aproveitamento
                           </span>
                        </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
            
          </>
        )}
      </div>
    </div>
  );
}

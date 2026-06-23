import React, { useState, useEffect } from "react";
import { apiUrl, safeJsonResponse } from "../config/api";
import { 
  X, User, BookOpen, TrendingUp, Award, CheckCircle, 
  AlertCircle, ChevronRight, FileText, Activity 
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from "recharts";

interface StudentProfileModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentProfileModal({ studentId, isOpen, onClose }: StudentProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"corrections" | "evidences">("corrections");

  useEffect(() => {
    if (!isOpen || !studentId) return;

    setLoading(true);
    fetch(apiUrl(`/api/students/${studentId}/profile`))
      .then(res => {
        if (!res.ok) throw new Error("Não foi possível carregar o perfil do aluno.");
        return res.json();
      })
      .then(data => {
        setProfileData(data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] rounded-2xl w-full max-w-5xl border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#070a13]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white font-display">Perfil Completo do Aluno</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Consolidação de evidências, evolução pedagógica e histórico de correções vinculado.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="text-sm font-mono uppercase tracking-wider">Buscando inteligência de perfil...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-rose-400">
            <AlertCircle className="w-12 h-12 stroke-1" />
            <span className="font-semibold text-lg">{error}</span>
            <button 
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white uppercase"
            >
              Fechar Visualização
            </button>
          </div>
        ) : (
          <div className="flex-grow flex flex-col lg:flex-row overflow-hidden max-h-[100%]">
            
            {/* Left Box (Details & Insights Summary) */}
            <div className="w-full lg:w-[42%] border-r border-slate-800 overflow-y-auto p-6 flex flex-col gap-5 bg-[#080c14]/50">
              
              {/* Profile Card */}
              <div className="p-5 bg-[#0f172a]/80 border border-slate-800 rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-white font-display">{profileData.student?.name}</h4>
                    <span className="text-xs text-emerald-400 font-mono font-medium block mt-1 uppercase">
                      Turma: <span className="font-bold underline">{profileData.student?.class_name || "Sem turma vinculada"}</span>
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/20 rounded-full flex flex-col items-center justify-center min-w-[70px]">
                    <span className="text-[10px] uppercase font-mono text-emerald-400 block tracking-wider">Média</span>
                    <span className="text-xl font-bold font-mono text-white leading-none mt-0.5">{profileData.average_score}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 mt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div>
                    <span className="block text-slate-500 font-mono text-[9px] uppercase tracking-wider mb-0.5">Matrícula</span>
                    <span className="font-mono text-slate-200">{profileData.student?.enrollment_code || "N/D"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-mono text-[9px] uppercase tracking-wider mb-0.5">Contato / E-mail</span>
                    <span className="text-slate-200 truncate block" title={profileData.student?.email}>{profileData.student?.email || "Sem e-mail"}</span>
                  </div>
                </div>

                {profileData.student?.notes && (
                  <div className="mt-2 text-xs p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-slate-400">
                    <span className="text-[9px] uppercase font-mono text-slate-500 block mb-1">Notas do Professor</span>
                    <p className="italic line-clamp-3">"{profileData.student.notes}"</p>
                  </div>
                )}
              </div>

              {/* Graphical Evolution (Priority 6) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 px-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Gráfico de Evolução
                </span>
                <div className="h-44 w-full bg-[#030712] rounded-xl border border-slate-800/80 p-3 flex flex-col justify-between">
                  {profileData.evolution && profileData.evolution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profileData.evolution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/30" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }}
                          labelClassName="text-slate-400 font-bold"
                        />
                        <Line type="monotone" dataKey="grade" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Nota" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
                      Histórico insuficiente para plotar evolução (requer correções).
                    </div>
                  )}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                {/* Strengths Box */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Pontos Fortes</span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {profileData.strengths?.map((str: string, index: number) => (
                      <li key={index} className="text-[11px] text-slate-300 leading-tight flex items-start gap-1">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements Box */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">A Otimizar</span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {profileData.improvements?.map((imp: string, index: number) => (
                      <li key={index} className="text-[11px] text-slate-300 leading-tight flex items-start gap-1">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

            {/* Right Box (Corrections list & Pedagogical Evidences list) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Tab Selector */}
              <div className="flex border-b border-slate-800 bg-[#070a13] p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("corrections")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    activeTab === "corrections" 
                      ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Atividades Corrigidas ({profileData.corrections?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("evidences")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    activeTab === "evidences" 
                      ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Award className="w-4 h-4 text-sky-400" />
                  Evidências Geradas ({profileData.evidences?.length || 0})
                </button>
              </div>

              {/* Tab Panels */}
              <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
                
                {activeTab === "corrections" ? (
                  <>
                    {profileData.corrections && profileData.corrections.length > 0 ? (
                      profileData.corrections.map((corr: any) => (
                        <div 
                          key={corr.id} 
                          className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h5 className="font-bold text-white text-sm">
                                {corr.activity_title || "Correção de Instrução Livre"}
                              </h5>
                              <div className="flex items-center gap-3 mt-1.5 text-slate-400 text-[10px] font-mono">
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 capitalize">
                                  {corr.correction_type}
                                </span>
                                <span className="uppercase text-rose-400 font-bold">{corr.language}</span>
                                <span>{new Date(corr.created_at).toLocaleDateString("pt-BR")}</span>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-slate-800/80 rounded-xl text-right shrink-0">
                              <span className="block text-[8px] text-slate-500 font-mono uppercase tracking-wider">Nota</span>
                              <span className="text-base font-bold font-mono text-emerald-400">{corr.score}</span>
                            </div>
                          </div>

                          {void 0}
                          {corr.code_content && (
                            <div className="bg-[#030712] p-3 rounded-lg border border-slate-800 text-xs font-mono overflow-x-auto max-h-[140px] text-slate-300">
                              <pre><code>{corr.code_content}</code></pre>
                            </div>
                          )}

                          {corr.feedback && (
                            <div className="text-[11px] text-slate-300 bg-slate-950/20 p-3 rounded-lg border border-slate-800/60">
                              <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block mb-1">Feedback Detalhado</span>
                              <p className="whitespace-pre-line leading-relaxed">{corr.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-500 italic text-sm">
                        Nenhuma atividade corrigida no histórico deste aluno.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {profileData.evidences && profileData.evidences.length > 0 ? (
                      profileData.evidences.map((evi: any) => (
                        <div 
                          key={evi.id} 
                          className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h5 className="font-bold text-sky-400 text-sm flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-sky-400" />
                                {evi.title}
                              </h5>
                              <div className="flex items-center gap-3 mt-1.5 text-slate-400 text-[10px] font-mono">
                                <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded uppercase font-bold text-[9px]">
                                  {evi.evidence_type}
                                </span>
                                <span>{new Date(evi.created_at).toLocaleDateString("pt-BR")}</span>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-slate-800/80 rounded-xl text-right shrink-0">
                              <span className="block text-[8px] text-slate-500 font-mono uppercase tracking-wider">Pontuação</span>
                              <span className="text-base font-bold font-mono text-emerald-400">{evi.score || "N/A"}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed bg-[#030712]/40 p-3 rounded-lg border border-slate-800">
                            {evi.description}
                          </p>

                          {evi.feedback && (
                            <div className="text-[11px] text-slate-300 p-2.5 rounded-lg border border-slate-800/60">
                              <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block mb-1">Feedback Vinculado</span>
                              <p className="whitespace-pre-line font-serif italic text-slate-400">"{evi.feedback}"</p>
                            </div>
                          )}

                          {evi.tags && Array.isArray(evi.tags) && evi.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {evi.tags.map((tg: string, i: number) => (
                                <span key={i} className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                                  #{tg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-500 italic text-sm">
                        Nenhuma evidência pedagógica gerada para este aluno.
                      </div>
                    )}
                  </>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

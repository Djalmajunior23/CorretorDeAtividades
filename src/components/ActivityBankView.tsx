import React, { useState, useEffect } from "react";
import { Copy, Archive, BookOpen, Search, Flag, Plus, Loader2, ListTree, Sparkles } from "lucide-react";

export default function ActivityBankView({ featureFlags = {} }: any) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterLang, setFilterLang] = useState("");
  const [filterDiff, setFilterDiff] = useState("");

  const loadBank = async () => {
    setLoading(true);
    try {
      // Usar a Nova API do Módulo 04 se ativado
      const url = featureFlags.ENABLE_QUESTION_BANK 
        ? "/api/codecheck/module04/questions" 
        : "/api/codecheck/activities";
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBank();
  }, [featureFlags.ENABLE_QUESTION_BANK]);

  const filteredActs = activities.filter(a => {
    if (filterLang && a.language !== filterLang) return false;
    // Map 'level' or 'difficulty'
    const diff = a.level || a.difficulty;
    if (filterDiff && diff !== filterDiff) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">Banco de Questões Inteligente</h2>
          <p className="text-sm text-slate-400 mt-1">Repositório de atividades reutilizáveis avaliadas por competências (Fase 04).</p>
        </div>
        <div className="flex items-center gap-2">
          {featureFlags.ENABLE_AI_QUESTION_SUGGESTIONS && (
            <button className="px-3 py-2 bg-[#1e293b]/50 hover:bg-[#1e293b] text-sky-400 shadow shadow-sky-500/10 font-mono text-xs rounded-xl flex items-center gap-2 border border-sky-500/30">
              <Sparkles className="w-4 h-4" />
              Sugestões IA
            </button>
          )}
          {featureFlags.ENABLE_LEARNING_PATHS && (
            <button className="px-3 py-2 bg-[#1e293b]/50 hover:bg-[#1e293b] text-emerald-400 shadow shadow-emerald-500/10 font-mono text-xs rounded-xl flex items-center gap-2 border border-emerald-500/30">
              <ListTree className="w-4 h-4" />
              Trilhas
            </button>
          )}
          <button
            onClick={loadBank}
            className="px-4 py-2 bg-[#1e293b] hover:bg-slate-700 text-white font-mono text-xs rounded-xl flex items-center gap-2 border border-slate-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Recarregar
          </button>
        </div>
      </div>

      <div className="flex gap-4 p-4 rounded-xl border border-[#1e295b]/30 bg-[#0f172a]">
        <div className="flex flex-col flex-1 gap-1">
          <label className="text-xs uppercase font-mono text-slate-500">Linguagem</label>
          <select 
            value={filterLang} onChange={e=>setFilterLang(e.target.value)}
            className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">Todas</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="c">C/C++</option>
          </select>
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <label className="text-xs uppercase font-mono text-slate-500">Nível / Dificuldade</label>
          <select 
            value={filterDiff} onChange={e=>setFilterDiff(e.target.value)}
            className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">Todas</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!loading && filteredActs.length === 0 ? (
          <div className="p-12 text-center bg-[#0f172a] rounded-2xl border border-dashed border-[#1e295b]/50 flex flex-col items-center">
            <BookOpen className="w-10 h-10 text-slate-600 mb-3" />
            <span className="text-sm font-mono text-slate-400">Nenhuma atividade encontrada ou banco vazio.</span>
            <button className="mt-4 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-emerald-500/20">
              <Plus className="w-3 h-3" /> Nova Questão Manual
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActs.map(act => (
              <div key={act.id} className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col gap-3 group relative overflow-hidden transition-all hover:border-emerald-500/30">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-white line-clamp-2">{act.title}</h3>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wide shrink-0 ${act.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'}`}>
                    {act.status === 'published' ? 'PUBLICADO' : 'RASCUNHO'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                  {act.theme && <span className="bg-[#030712] px-2 py-1 rounded text-slate-300">Tema: <span className="text-sky-400">{act.theme}</span></span>}
                  {act.language && <span className="bg-[#030712] px-2 py-1 rounded text-slate-300">Lang: <span className="text-rose-400 uppercase">{act.language}</span></span>}
                  {(act.level || act.difficulty) && <span className="bg-[#030712] px-2 py-1 rounded text-slate-300">Nível: <span className="text-amber-400">{act.level || act.difficulty}</span></span>}
                </div>

                {(act.competence || featureFlags.ENABLE_COMPETENCY_TAGGING) && (
                  <div className="text-[11px] text-slate-400 bg-[#030712]/50 p-2 rounded-lg border border-[#1e295b]/20">
                    <span className="text-slate-500 block mb-1 uppercase font-mono text-[9px] tracking-wider">Mapeamento de Competência</span>
                    <span className="line-clamp-2">{act.competence || act.competency_id || "Não mapeada"}</span>
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-[#1e295b]/30 flex items-center justify-end gap-2">
                  <button className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors" title="Duplicar">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors" title="Arquivar">
                    <Archive className="w-4 h-4" />
                  </button>
                  {act.status !== 'published' && (
                    <button className="ml-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded text-[10px] font-bold uppercase transition-colors shrink-0">
                      Publicar p/ Turma
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

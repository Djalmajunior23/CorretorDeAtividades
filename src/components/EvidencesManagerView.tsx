import { apiUrl, safeJsonResponse } from "../config/api";
import React, { useState, useEffect } from "react";
import { FileCheck, Search, Filter, Download, ArrowUpRight } from "lucide-react";

export function EvidencesManagerView() {
  const [evidences, setEvidences] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const clsResp = await fetch(apiUrl("/api/classes"));
      if (clsResp.ok) {
        const clsData = await safeJsonResponse(clsResp);
        setClasses(clsData || []);
      }
      
      const q = filterClass ? apiUrl(`/api/evidences/class/${filterClass}`) : apiUrl("/api/evidences");
      const evResp = await fetch(q);
      if (evResp.ok) {
        const evData = await safeJsonResponse(evResp);
        setEvidences(evData || []);
      }
    } catch (e) {
      console.warn("Error fetching evidences:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filterClass]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">Evidências Pedagógicas</h2>
          <p className="text-sm text-slate-400 mt-1">
            Histórico imutável de submissões, laudos e intervenções vinculadas por aluno.
          </p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex gap-2 items-center px-4 py-2 rounded-xl text-sm transition-all focus:outline-none">
          <Download className="w-4 h-4" />
          Exportar Relatório (PDF)
        </button>
      </div>

      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white w-56 focus:outline-none">
              <option value="">Todas as Turmas (Global)</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Buscar evidência ou CA..." className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pl-9 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400 text-center py-6 text-sm">Buscando rastreabilidade...</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {evidences.map(ev => (
              <div key={ev.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-emerald-500/10 p-2 rounded-lg shrink-0">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-white tracking-tight">{ev.title}</h4>
                    <span className="text-xs text-slate-400 mt-0.5">{ev.student_name} • {ev.class_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1">ID: {ev.id.split('-')[0].toUpperCase()} • Via: {ev.source_type}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {ev.score != null && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Score/Nota</span>
                      <span className={`text-lg font-bold font-mono ${ev.score >= 7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {ev.score}
                      </span>
                    </div>
                  )}
                  <button className="text-emerald-400 hover:text-emerald-300 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {evidences.length === 0 && (
              <div className="text-slate-500 text-center py-8 text-sm">Nenhuma evidência registrada para estes parâmetros.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

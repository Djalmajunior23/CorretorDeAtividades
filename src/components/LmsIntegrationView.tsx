import React, { useState } from "react";
import { BookOpen, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function LmsIntegrationView() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success("Sincronização LTI 1.3 com Moodle e Google Classroom concluída com sucesso!");
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-1 font-bold">
            <BookOpen className="w-4 h-4" /> Evolução 04 • Interoperabilidade LMS
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Integração Nativa com Moodle, Canvas & Google Classroom</h1>
          <p className="text-sm text-slate-400 mt-1">Sincronize notas, turmas e diários de classe via protocolo LTI 1.3.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs uppercase font-mono tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Sincronizando LMS..." : "Sincronizar Notas agora"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: "Moodle LMS", status: "Conectado (LTI 1.3)", activeCourses: 4, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
          { name: "Google Classroom", status: "Sincronizado hoje", activeCourses: 2, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
          { name: "Canvas LMS", status: "Disponível para configuração", activeCourses: 0, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
        ].map((lms, idx) => (
          <div key={idx} className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${lms.color}`}>{lms.name}</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">{lms.status}</span>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">{lms.activeCourses} turmas vinculadas</span>
            </div>
            <button 
              onClick={() => toast.success(`Configurações de ${lms.name} atualizadas.`)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-xl transition-all"
            >
              Configurar Integração
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

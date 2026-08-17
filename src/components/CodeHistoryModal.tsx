import React, { useState } from "react";
import { History, RotateCcw, Clock, FileCode, CheckCircle2 } from "lucide-react";

interface CodeHistoryModalProps {
  currentCode: string;
  onRestore: (code: string) => void;
  onClose: () => void;
}

export function CodeHistoryModal({ currentCode, onRestore, onClose }: CodeHistoryModalProps) {
  const [snapshots, setSnapshots] = useState<Array<{ id: string; timestamp: string; label: string; code: string }>>(() => {
    const saved = localStorage.getItem("codecheck-snapshots");
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [
      { id: "1", timestamp: "Hoje, 15:30", label: "Versão Inicial da Atividade", code: currentCode },
      { id: "2", timestamp: "Hoje, 14:15", label: "Ajuste na Lógica de Funções", code: "# Versão anterior\ndef calcular():\n    pass" }
    ];
  });

  const handleSaveSnapshot = () => {
    const newSnap = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " + new Date().toLocaleDateString(),
      label: `Snapshot Manual (${snapshots.length + 1})`,
      code: currentCode
    };
    const updated = [newSnap, ...snapshots];
    setSnapshots(updated);
    localStorage.setItem("codecheck-snapshots", JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-[#1e295b]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Histórico de Versões & Snapshots de Código</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Salve checkpoints do seu código a qualquer momento ou restaure versões anteriores em um clique.
            </p>
            <button
              onClick={handleSaveSnapshot}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all shadow-md shadow-indigo-500/10 flex items-center gap-1.5"
            >
              + Salvar Versão Atual
            </button>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {snapshots.map((snap) => (
              <div key={snap.id} className="p-4 rounded-xl bg-[#030712]/60 border border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200">{snap.label}</span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {snap.timestamp}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onRestore(snap.code);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/20 text-slate-200 hover:text-emerald-400 font-mono text-xs font-bold transition-all border border-slate-700 hover:border-emerald-500/30 flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar Versão
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[#1e295b]/30 bg-[#070a1a] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Layers,
  User,
  Clock,
  Eye,
  Trash2,
  AlertCircle,
  FileCode,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";

export default function SimilarityView() {
  const [batches, setBatches] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [pairs, setPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewingPair, setViewingPair] = useState<any>(null);

  useEffect(() => {
    fetchBatches();
    fetchAnalyses();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/batch");
      const data = await res.json();
      setBatches(data.filter((b: any) => b.status === "completed"));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const res = await fetch("/api/similarity");
      const data = await res.json();
      setAnalyses(data);
    } catch (e) {
      console.error(e);
    }
  };

  const startAnalysis = async (batchId: string, language: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/similarity/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId, language, threshold: 0.75 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Análise iniciada! Verifique o histórico em instantes.");
        fetchAnalyses();
      }
    } catch (e) {
      toast.error("Erro ao iniciar análise.");
    } finally {
      setAnalyzing(false);
    }
  };

  const selectAnalysis = async (analysis: any) => {
    setSelectedAnalysis(analysis);
    setLoading(true);
    try {
      const res = await fetch(`/api/similarity/${analysis.id}/pairs`);
      const data = await res.json();
      setPairs(data);
    } catch (e) {
      toast.error("Erro ao carregar pares.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-display">
            Detecção de Similaridade
          </h2>
          <p className="text-slate-400 mt-1">
            Identifique códigos semelhantes entre os alunos para análise
            pedagógica manual.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Controls & History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <RefreshCw
                className={`w-5 h-5 text-emerald-400 ${analyzing ? "animate-spin" : ""}`}
              />
              Nova Análise
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Selecione um lote de correção concluído para analisar a
              similaridade entre os arquivos.
            </p>

            <div className="space-y-3">
              {batches.map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center group"
                >
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">
                      {b.title}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {b.processed_files} arquivos • {b.language}
                    </p>
                  </div>
                  <button
                    onClick={() => startAnalysis(b.id, b.language)}
                    disabled={analyzing}
                    className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {batches.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-600 italic">
                  Nenhum lote concluído disponível.
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col h-[400px]">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Histórico de Análises
            </h3>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {analyses.map((a) => (
                <div
                  key={a.id}
                  onClick={() => selectAnalysis(a)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedAnalysis?.id === a.id ? "bg-emerald-500/10 border-emerald-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700"}`}
                >
                  <p className="text-sm font-bold text-white truncate">
                    {a.id.substring(0, 8)}...
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        a.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-blue-500/20 text-blue-400 animate-pulse"
                      }`}
                    >
                      {a.status === "completed"
                        ? `${a.high_similarity_count} Pares Altos`
                        : "Processando"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results Dashboard */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!selectedAnalysis ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[500px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-slate-900/10"
              >
                <Layers className="w-16 h-16 text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-white">
                  Nenhuma Análise Aberta
                </h3>
                <p className="text-slate-500 max-w-sm mt-1">
                  Selecione uma análise no histórico ou inicie uma nova para ver
                  os pares similares.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Analysis Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-emerald-400">
                      STATUS
                    </span>
                    <span className="text-lg font-bold text-white capitalize">
                      {selectedAnalysis.status}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-purple-400">
                      PARES ANALISADOS
                    </span>
                    <span className="text-2xl font-black text-white">
                      {selectedAnalysis.pairs_analyzed}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-amber-500">
                      SIMILARIDADE ALTA
                    </span>
                    <span className="text-2xl font-black text-white">
                      {selectedAnalysis.high_similarity_count}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-rose-500">
                      LIMITE (THRESHOLD)
                    </span>
                    <span className="text-2xl font-black text-white">
                      {Number(selectedAnalysis.threshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Results List */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden min-h-[400px]">
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Filter className="w-5 h-5 text-slate-500" />
                      Pares Detectados
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-800/50">
                    {pairs.map((p) => (
                      <div
                        key={p.id}
                        className="p-6 flex flex-col gap-4 hover:bg-slate-800/20 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-sm font-bold text-white">
                                  {p.student_a_name}
                                </span>
                                <span className="text-slate-600">e</span>
                                <span className="text-sm font-bold text-white">
                                  {p.student_b_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <FileCode className="w-3 h-3 text-slate-600" />
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {p.file_a} • {p.file_b}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span
                              className={`text-xl font-black ${p.similarity_score * 100 >= 90 ? "text-rose-500" : "text-amber-500"}`}
                            >
                              {Number(p.similarity_score * 100).toFixed(1)}%
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase ${p.level === "critical" ? "text-rose-400" : "text-amber-400"}`}
                            >
                              Similaridade{" "}
                              {p.level === "critical" ? "Crítica" : "Alta"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50">
                          <div className="flex items-center gap-2 mb-2 text-blue-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                              Explicação da IA
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed italic">
                            "{p.explanation}"
                          </p>
                          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-900">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-600 font-bold">
                                NORMALIZAÇÃO
                              </span>
                              <span className="text-[10px] text-slate-300">
                                {Number(
                                  p.method_scores.normalized_text * 100
                                ).toFixed(0)}
                                %
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-600 font-bold">
                                TOKENS
                              </span>
                              <span className="text-[10px] text-slate-300">
                                {Number(p.method_scores.tokens * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-600 font-bold">
                                ESTRUTURA
                              </span>
                              <span className="text-[10px] text-slate-300">
                                {Number(p.method_scores.structure * 100).toFixed(
                                  0
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setViewingPair(p)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            <Eye className="w-4 h-4" /> Comparar Códigos
                          </button>
                        </div>
                      </div>
                    ))}
                    {pairs.length === 0 && !loading && (
                      <div className="p-20 text-center flex flex-col items-center gap-3">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500/20" />
                        <p className="text-slate-600 text-sm">
                          Nenhum par de alta similaridade detectado.
                        </p>
                      </div>
                    )}
                    {loading && (
                      <div className="p-20 text-center flex flex-col items-center gap-3">
                        <RefreshCw className="w-10 h-10 text-emerald-500/20 animate-spin" />
                        <p className="text-slate-600 text-sm">
                          Carregando análise...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Code Comparison Modal */}
      <AnimatePresence>
        {viewingPair && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-white">
                    Comparação Lado a Lado
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Analisando similaridade de{" "}
                    {Number(viewingPair.similarity_score * 100).toFixed(1)}%
                  </p>
                </div>
                <button
                  onClick={() => setViewingPair(null)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                >
                  Feschar
                </button>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-slate-800">
                <div className="flex flex-col overflow-hidden">
                  <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">
                      {viewingPair.student_a_name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      {viewingPair.file_a}
                    </span>
                  </div>
                  <pre className="flex-1 p-6 text-[11px] font-mono bg-slate-950 text-slate-300 overflow-y-auto custom-scrollbar">
                    <code>{viewingPair.code_a}</code>
                  </pre>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white">
                      {viewingPair.student_b_name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      {viewingPair.file_b}
                    </span>
                  </div>
                  <pre className="flex-1 p-6 text-[11px] font-mono bg-slate-950 text-slate-300 overflow-y-auto custom-scrollbar">
                    <code>{viewingPair.code_b}</code>
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
                <button className="px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition-all">
                  Marcar como Possível Plágio
                </button>
                <button className="px-5 py-2.5 bg-emerald-600 text-white border border-emerald-500/20 rounded-xl text-xs font-bold transition-all">
                  Validar Solução (Sem Problema)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  FileArchive,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  FileText,
  Table,
  ChevronRight,
  Search,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  User,
  History,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl, safeJsonResponse } from "../config/api";

export default function BatchCorrectionView() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("python");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    let interval: any;
    if (polling && activeBatchId) {
      interval = setInterval(() => {
        fetchBatchStatus(activeBatchId);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [polling, activeBatchId]);

  const fetchBatches = async () => {
    try {
      const res = await fetch(apiUrl("/api/batch"));
      const data = await res.json();
      setBatches(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBatchStatus = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/batch/${id}`));
      const data = await res.json();

      if (data.status === "completed" || data.status === "failed") {
        setPolling(false);
        fetchBatches();
        if (selectedBatch?.id === id) {
          setSelectedBatch(data);
          fetchBatchResults(id);
        }
      } else {
        // Update the current selected batch view if is the one being polled
        if (selectedBatch?.id === id) {
          setSelectedBatch(data);
        }
      }
    } catch (e) {
      setPolling(false);
    }
  };

  const fetchBatchResults = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/batch/${id}/results`));
      const data = await res.json();
      setBatchResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      toast.error("Título e Arquivo ZIP são obrigatórios.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("language", language);
    formData.append("test_cases", JSON.stringify([])); // In a real app, users would define tests
    formData.append("rubric", JSON.stringify({}));

    try {
      const res = await fetch(apiUrl("/api/batch/upload"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Lote enviado com sucesso! Processando...");
        setActiveBatchId(data.batchId);
        setPolling(true);
        setTitle("");
        setFile(null);
        fetchBatches();
      }
    } catch (e) {
      toast.error("Erro ao enviar lote.");
    } finally {
      setUploading(false);
    }
  };

  const deleteBatch = async (id: string) => {
    if (!confirm("Deseja excluir este lote permanentemente?")) return;
    try {
      await fetch(apiUrl(`/api/batch/${id}`), { method: "DELETE" });
      fetchBatches();
      if (selectedBatch?.id === id) setSelectedBatch(null);
    } catch (e) {
      toast.error("Erro ao excluir.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-display">
            Correção em Lote
          </h2>
          <p className="text-slate-400 mt-1">
            Envie múltiplos códigos de alunos em um único arquivo ZIP para
            correção automatizada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & History */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Upload Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Novo Upload
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Título da Atividade
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Exercício de Estruturas Condicionais"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Linguagem Padrão
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="sql">PostgreSQL / SQL</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Arquivo ZIP
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${file ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/30"}`}
                  onClick={() => document.getElementById("zip-upload")?.click()}
                >
                  <FileArchive
                    className={`w-8 h-8 ${file ? "text-emerald-400" : "text-slate-600"}`}
                  />
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-300">
                      {file ? file.name : "Selecionar ZIP"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Máximo 50MB
                    </p>
                  </div>
                  <input
                    id="zip-upload"
                    type="file"
                    accept=".zip"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file || !title}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 group"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                Começar Correção em Lote
              </button>
            </form>
          </div>

          {/* History Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex-1 max-h-[500px] overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              Histórico de Lotes
            </h3>

            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {batches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBatch(b);
                    fetchBatchResults(b.id);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${selectedBatch?.id === b.id ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-800 hover:border-slate-700 bg-slate-950"}`}
                >
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate">
                      {b.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          b.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : b.status === "processing"
                              ? "bg-blue-500/20 text-blue-400 animate-pulse"
                              : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {b.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(b.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBatch(b.id);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 text-slate-600 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {batches.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-600 text-sm">
                    Nenhum lote processado ainda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Details & Results */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!selectedBatch ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10"
              >
                <div className="bg-slate-900 p-6 rounded-full mb-6">
                  <BarChart3 className="w-12 h-12 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Nenhum Lote Selecionado
                </h3>
                <p className="text-slate-500 max-w-sm mt-2">
                  Selecione um lote no histórico à esquerda para ver os
                  resultados detalhados e relatórios.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Batch Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest text-emerald-400">
                      STATUS ATUAL
                    </span>
                    <span
                      className={`text-lg font-bold flex items-center gap-2 ${selectedBatch.status === "processing" ? "text-blue-400 animate-pulse" : "text-white"}`}
                    >
                      {selectedBatch.status === "processing" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {selectedBatch.status === "processing"
                        ? "Processando"
                        : "Concluído"}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest text-blue-400">
                      MÉDIA TURMA
                    </span>
                    <span className="text-2xl font-black text-white">
                      {Number(selectedBatch.average_score || 0).toFixed(1)}/100
                    </span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest text-purple-400">
                      ARQUIVOS
                    </span>
                    <span className="text-2xl font-black text-white">
                      {selectedBatch.processed_files} /{" "}
                      {selectedBatch.total_files}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest text-rose-400">
                      FALHAS
                    </span>
                    <span className="text-2xl font-black text-white">
                      {selectedBatch.failed_files}
                    </span>
                  </div>
                </div>

                {/* Batch Exports */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-400">
                      Exportar Resultados:
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/batch/${selectedBatch.id}/export/pdf`}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                    >
                      <FileText className="w-3 h-3" /> PDF
                    </a>
                    <a
                      href={`/api/batch/${selectedBatch.id}/export/xlsx`}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Table className="w-3 h-3" /> EXCEL (XLSX)
                    </a>
                    <a
                      href={`/api/batch/${selectedBatch.id}/export/csv`}
                      className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                    >
                      <FileArchive className="w-3 h-3" /> CSV
                    </a>
                  </div>
                </div>

                {/* IA Class Summary */}
                {selectedBatch.class_summary && (
                  <div className="bg-[#0f172a] border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <BarChart3 className="w-32 h-32 text-blue-500" />
                    </div>
                    <div className="relative flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-bold text-white">
                          Insight Pedagógico da Turma
                        </h3>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-blue-500/50 pl-4 bg-slate-900/50 py-2 rounded-r-xl">
                        "{selectedBatch.class_summary}"
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="bg-slate-950/50 border border-rose-500/20 rounded-2xl p-4">
                          <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-3 h-3" /> Tópicos
                            Críticos
                          </span>
                          <ul className="space-y-1.5">
                            {selectedBatch.critical_topics?.map(
                              (t: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-xs text-slate-400 flex items-center gap-2"
                                >
                                  <div className="w-1 h-1 rounded-full bg-rose-500" />{" "}
                                  {t}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        <div className="bg-slate-950/50 border border-emerald-500/20 rounded-2xl p-4">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-3 h-3" /> Recomendações
                          </span>
                          <ul className="space-y-1.5">
                            {selectedBatch.teacher_recommendations?.map(
                              (r: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-xs text-slate-400 flex items-center gap-2"
                                >
                                  <div className="w-1 h-1 rounded-full bg-emerald-500" />{" "}
                                  {r}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual Results List */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-slate-500" />
                      Resultados Individuais
                    </h3>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar aluno..."
                        className="bg-slate-950 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-950/50 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Aluno</th>
                          <th className="px-6 py-4 text-center">Nota</th>
                          <th className="px-6 py-4">Linguagem</th>
                          <th className="px-6 py-4">Arquivo</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {batchResults.map((r) => (
                          <tr
                            key={r.id}
                            className="hover:bg-slate-800/20 transition-all group"
                          >
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-white">
                                {r.student_name}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`text-sm font-black ${
                                  r.score >= 70
                                    ? "text-emerald-400"
                                    : r.score >= 50
                                      ? "text-amber-400"
                                      : "text-rose-400"
                                }`}
                              >
                                {r.score}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-slate-400 font-mono capitalize">
                                {r.detected_language}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <FileArchive className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">
                                  {r.filename}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  r.status === "CORRECTED"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                    : r.status === "failed"
                                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                      : "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-slate-600 hover:text-emerald-400 transition-all opacity-0 group-hover:opacity-100">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {batchResults.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
                                <p className="text-slate-600 text-sm">
                                  Carregando resultados individuais...
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

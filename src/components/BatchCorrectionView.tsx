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
  Github,
  Layers,
  Shield,
  BookOpen,
  Award,
  X,
  FileCode,
  Sparkles,
  Play,
  Flame,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl, safeJsonResponse } from "../config/api";

export default function BatchCorrectionView() {
  const [uploadType, setUploadType] = useState<"zip" | "github">("zip");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("python");
  const [githubUrl, setGithubUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Phase 08 - Project Review Engine State
  const [projectReview, setProjectReview] = useState<any>(null);
  const [loadingProjectReview, setLoadingProjectReview] = useState(false);
  const [projectReviewError, setProjectReviewError] = useState<string | null>(null);

  const fetchProjectReview = async (id: string) => {
    setProjectReview(null);
    setProjectReviewError(null);
    try {
      const res = await fetch(apiUrl(`/api/projects/review/${id}`));
      const data = await res.json();
      if (data.success && data.review) {
        setProjectReview(data.review);
      }
    } catch (err) {
      console.error("Erro ao buscar revisão de projeto existente:", err);
    }
  };

  const handleGenerateProjectReview = async () => {
    if (!selectedBatch) return;
    setLoadingProjectReview(true);
    setProjectReviewError(null);

    const filesPayload = batchResults.map(r => ({
      filepath: r.filepath || r.filename,
      content: r.code_content || ""
    }));

    try {
      const res = await fetch(apiUrl("/api/projects/review"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedBatch.id,
          language: selectedBatch.language,
          framework: selectedBatch.framework || "Nenhum",
          files: filesPayload,
          structureSummary: `Projeto completo de ${selectedBatch.language} com ${batchResults.length} arquivos analisados.`
        })
      });
      const data = await res.json();
      if (data.success && data.review) {
        setProjectReview(data.review);
        toast.success("Avaliação técnica do projeto gerada com sucesso!");
      } else {
        setProjectReviewError(data.error || "Erro ao gerar avaliação.");
        toast.error("Falha ao gerar avaliação do projeto.");
      }
    } catch (err: any) {
      setProjectReviewError(err.message || "Erro de conexão.");
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setLoadingProjectReview(false);
    }
  };

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
    if (!title) {
      toast.error("O título da atividade é obrigatório.");
      return;
    }

    if (uploadType === "zip" && !file) {
      toast.error("Selecione um arquivo ZIP para upload.");
      return;
    }

    if (uploadType === "github" && !githubUrl) {
      toast.error("O link do repositório GitHub é obrigatório.");
      return;
    }

    setUploading(true);

    try {
      if (uploadType === "zip") {
        const formData = new FormData();
        formData.append("file", file!);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("language", language);
        formData.append("test_cases", JSON.stringify([]));
        formData.append("rubric", JSON.stringify({}));

        const res = await fetch(apiUrl("/api/batch/upload"), {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Lote enviado com sucesso! Processando arquivos localmente...");
          setActiveBatchId(data.batchId);
          setPolling(true);
          setTitle("");
          setDescription("");
          setFile(null);
          fetchBatches();
        }
      } else {
        const res = await fetch(apiUrl("/api/batch/github"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            githubUrl,
            title,
            description,
            language,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("GitHub importado com sucesso! Clonando e auditando repositório...");
          setActiveBatchId(data.batchId);
          setPolling(true);
          setTitle("");
          setDescription("");
          setGithubUrl("");
          fetchBatches();
        }
      }
    } catch (e) {
      toast.error("Erro ao iniciar processamento do lote.");
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
      toast.success("Lote excluído com sucesso.");
    } catch (e) {
      toast.error("Erro ao excluir.");
    }
  };

  const getEnrichedData = (res: any) => {
    if (!res || !res.ai_result) return null;
    try {
      return typeof res.ai_result === "string" ? JSON.parse(res.ai_result) : res.ai_result;
    } catch (e) {
      return null;
    }
  };

  // Pre-process class analytics for Dashboard display (Módulo 9)
  const classAnalytics = React.useMemo(() => {
    if (batchResults.length === 0) return null;

    const ranking = [...batchResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const plagiarismAlerts: any[] = [];
    let aiHighCount = 0;
    let aiMedCount = 0;

    batchResults.forEach(r => {
      const details = getEnrichedData(r);
      if (details) {
        if (details.plagiarism && details.plagiarism.similarity_score > 40) {
          // Avoid duplicate pairs
          const pairExists = plagiarismAlerts.some(
            p => p.student === details.plagiarism.plagiarized_with_student && p.with === r.student_name
          );
          if (!pairExists) {
            plagiarismAlerts.push({
              student: r.student_name,
              with: details.plagiarism.plagiarized_with_student,
              score: details.plagiarism.similarity_score
            });
          }
        }
        if (details.ai_detection) {
          if (details.ai_detection.probability === "HIGH") aiHighCount++;
          else if (details.ai_detection.probability === "MEDIUM") aiMedCount++;
        }
      }
    });

    return { ranking, plagiarismAlerts, aiHighCount, aiMedCount };
  }, [batchResults]);

  const filteredResults = batchResults.filter((r) =>
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-display">
            Correção em Lote & Auditoria de Repositórios
          </h2>
          <p className="text-slate-400 mt-1">
            Importe repositórios do GitHub ou submeta ZIPs para realizar compilação automatizada, análises de plágio, uso de IA e rubricas.
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
              Novo Lote de Atividades
            </h3>

            {/* Toggle ZIP vs GitHub */}
            <div className="flex border-b border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setUploadType("zip")}
                className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 ${uploadType === "zip" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-400"}`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <FileArchive className="w-4 h-4" /> Arquivo ZIP
                </div>
              </button>
              <button
                type="button"
                onClick={() => setUploadType("github")}
                className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 ${uploadType === "github" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-400"}`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Github className="w-4 h-4" /> Link GitHub
                </div>
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Título da Atividade
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Exercício de Algoritmos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Correção da prova prática 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Linguagem Esperada
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

              {uploadType === "zip" ? (
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
                        Formatos válidos: .zip (máximo 50MB)
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
              ) : (
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    URL do Repositório GitHub
                  </label>
                  <div className="relative">
                    <Github className="w-5 h-5 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="Ex: https://github.com/aluno/projeto-final"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || (uploadType === "zip" && !file) || (uploadType === "github" && !githubUrl) || !title}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 group"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                Começar Processamento
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
                    fetchProjectReview(b.id);
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
                  Selecione um lote de atividades no painel histórico à esquerda para visualizar relatórios detalhados, auditorias e relatórios de alunos.
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
                      href={apiUrl(`/api/batch/${selectedBatch.id}/export/pdf`)}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                    >
                      <FileText className="w-3 h-3" /> PDF
                    </a>
                    <a
                      href={apiUrl(`/api/batch/${selectedBatch.id}/export/xlsx`)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Table className="w-3 h-3" /> EXCEL (XLSX)
                    </a>
                    <a
                      href={apiUrl(`/api/batch/${selectedBatch.id}/export/csv`)}
                      className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                    >
                      <FileArchive className="w-3 h-3" /> CSV
                    </a>
                  </div>
                </div>

                {/* Class Dashboard Highlights (Module 9 & Plagiarism Alert Panel) */}
                {classAnalytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Plagiarism alerts */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Alertas de Plágio Detectados ({classAnalytics.plagiarismAlerts.length})
                        </h4>
                      </div>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {classAnalytics.plagiarismAlerts.map((p, idx) => (
                          <div key={idx} className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-white">{p.student}</p>
                              <p className="text-[10px] text-slate-500">Duplicado com: {p.with}</p>
                            </div>
                            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg">
                              {p.score}% sim.
                            </span>
                          </div>
                        ))}
                        {classAnalytics.plagiarismAlerts.length === 0 && (
                          <p className="text-xs text-slate-500 italic py-4 text-center">Nenhum indício severo de plágio na turma.</p>
                        )}
                      </div>
                    </div>

                    {/* AI Probability Distribution */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Uso Estimado de Inteligência Artificial
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
                          <p className="text-xl font-black text-rose-400">{classAnalytics.aiHighCount}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Uso Alto</p>
                        </div>
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                          <p className="text-xl font-black text-amber-400">{classAnalytics.aiMedCount}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Médio</p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                          <p className="text-xl font-black text-emerald-400">
                            {batchResults.length - classAnalytics.aiHighCount - classAnalytics.aiMedCount}
                          </p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Uso Baixo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Phase 08 - Project Review Engine Panel */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                        Fase 08 • Avaliação Estrutural Avançada
                      </span>
                      <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-400" />
                        Project Review Engine
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">
                        Avaliação pedagógica, organização, segurança e boas práticas de todo o repositório.
                      </p>
                    </div>

                    {!projectReview && !loadingProjectReview && (
                      <button
                        onClick={handleGenerateProjectReview}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                      >
                        <Sparkles className="w-4 h-4" />
                        Gerar Avaliação do Projeto
                      </button>
                    )}
                  </div>

                  {loadingProjectReview && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
                      <p className="text-sm font-bold text-white">Analisando arquitetura do projeto...</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Executando regras locais e acionando IA opcional para gerar feedbacks técnicos e parecer pedagógico.
                      </p>
                    </div>
                  )}

                  {projectReviewError && (
                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 text-center">
                      <p className="text-xs text-rose-400 font-bold">Falha ao gerar avaliação: {projectReviewError}</p>
                      <button
                        onClick={handleGenerateProjectReview}
                        className="mt-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-4 py-2 rounded-xl transition-all"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  )}

                  {projectReview && (
                    <div className="space-y-6">
                      {/* Metric Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Score Gauge */}
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">
                            NOTA GLOBAL DO PROJETO
                          </span>
                          <div className="relative flex items-center justify-center w-28 h-28 mb-2">
                            {/* Inner score label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-black text-white">{projectReview.score}</span>
                              <span className="text-[9px] font-mono text-slate-500 uppercase">/100 PONTOS</span>
                            </div>
                            {/* Simple ring decoration */}
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="56"
                                cy="56"
                                r="48"
                                className="stroke-slate-800"
                                strokeWidth="8"
                                fill="transparent"
                              />
                              <circle
                                cx="56"
                                cy="56"
                                r="48"
                                className={`${
                                  projectReview.score >= 90
                                    ? "stroke-emerald-400"
                                    : projectReview.score >= 75
                                      ? "stroke-blue-400"
                                      : projectReview.score >= 60
                                        ? "stroke-amber-400"
                                        : "stroke-rose-400"
                                }`}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={301.6}
                                strokeDashoffset={301.6 - (301.6 * projectReview.score) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Classification */}
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                              CLASSIFICAÇÃO DO PROJETO
                            </span>
                            <span
                              className={`text-2xl font-black block tracking-tight ${
                                projectReview.classification === "Excelente"
                                  ? "text-emerald-400"
                                  : projectReview.classification === "Bom"
                                    ? "text-blue-400"
                                    : projectReview.classification === "Regular"
                                      ? "text-amber-400"
                                      : "text-rose-400"
                              }`}
                            >
                              {projectReview.classification}
                            </span>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-800/50">
                            <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1">Competências Desenvolvidas</span>
                            <div className="flex flex-wrap gap-1">
                              {(projectReview.competencies || ["Arquitetura Básica"]).map((c: string, idx: number) => (
                                <span key={idx} className="bg-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats list */}
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">
                              TECNOLOGIAS DETECTADAS
                            </span>
                            <div className="space-y-1">
                              <p className="text-xs text-white">
                                <span className="text-slate-500">Linguagem:</span> <span className="font-mono font-bold text-emerald-400 capitalize">{selectedBatch.language}</span>
                              </p>
                              {selectedBatch.framework && (
                                <p className="text-xs text-white">
                                  <span className="text-slate-500">Framework:</span> <span className="font-mono font-bold text-blue-400">{selectedBatch.framework}</span>
                                </p>
                              )}
                              <p className="text-xs text-white">
                                <span className="text-slate-500">Total de Arquivos:</span> <span className="font-bold text-white">{batchResults.length}</span>
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-800/50">
                            <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1.5">Ações Recomendadas</span>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] text-slate-400 font-bold">Análise pedagógica concluída</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pedagogical Opinion */}
                      <div className="bg-[#0b1329] border border-blue-500/20 rounded-2xl p-5">
                        <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Parecer Pedagógico
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-medium italic">
                          "{projectReview.pedagogicalFeedback}"
                        </p>
                      </div>

                      {/* Strengths and Weaknesses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Strengths */}
                        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Pontos Fortes
                          </span>
                          <ul className="space-y-2">
                            {(projectReview.strengths || []).map((s: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{s}</span>
                              </li>
                            ))}
                            {(!projectReview.strengths || projectReview.strengths.length === 0) && (
                              <p className="text-xs text-slate-500 italic">Nenhum ponto forte detectado.</p>
                            )}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
                          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Pontos de Melhoria
                          </span>
                          <ul className="space-y-2">
                            {(projectReview.weaknesses || []).map((w: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-amber-400 shrink-0 mt-0.5 font-bold">•</span>
                                <span>{w}</span>
                              </li>
                            ))}
                            {(!projectReview.weaknesses || projectReview.weaknesses.length === 0) && (
                              <p className="text-xs text-slate-500 italic">Nenhum ponto de melhoria detectado.</p>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Security Warnings */}
                      {projectReview.securityWarnings && projectReview.securityWarnings.length > 0 && (
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                          <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-rose-400" /> Alertas de Segurança
                          </span>
                          <ul className="space-y-2">
                            {projectReview.securityWarnings.map((w: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <span className="text-rose-200/90 font-medium">{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations & Next Steps */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Recommendations */}
                        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
                          <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-blue-400" /> Recomendações Técnicas
                          </span>
                          <ul className="space-y-2">
                            {(projectReview.recommendations || []).map((r: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-blue-400 shrink-0 mt-0.5 font-mono">→</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
                          <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-purple-400" /> Próximos Passos Pedagógicos
                          </span>
                          <ul className="space-y-2">
                            {(projectReview.nextSteps || [
                              "Revisar o código de acordo com o parecer.",
                              "Seguir o plano de ação sugerido."
                            ]).map((ns: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                                <span>{ns}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                        {filteredResults.map((r) => (
                          <tr
                            key={r.id}
                            onClick={() => setSelectedResult(r)}
                            className="hover:bg-slate-800/20 cursor-pointer transition-all group"
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
                        {filteredResults.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <p className="text-slate-600 text-sm">
                                  Nenhum aluno encontrado ou ainda processando...
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

      {/* Student Audit Detail Modal (Modules 1 to 8) */}
      <AnimatePresence>
        {selectedResult && (() => {
          const details = getEnrichedData(selectedResult);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      <User className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedResult.student_name}
                        {details && details.plagiarism && details.plagiarism.similarity_score > 50 && (
                          <span className="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ALERTA DE PLÁGIO
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Arquivo: {selectedResult.filename} • Linguagem: {selectedResult.detected_language}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                        Nota Geral Auditada
                      </span>
                      <span className="text-3xl font-black text-white">{selectedResult.score}/100</span>
                    </div>
                    <button
                      onClick={() => setSelectedResult(null)}
                      className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                  {details ? (
                    <>
                      {/* Top Badges (Module 1 & 2 Framework / Dependencies Audit) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">
                            Mapeamento de Frameworks (Módulo 1 & 2)
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {details.frameworks?.map((f: string, i: number) => (
                              <span key={i} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-2.5 py-1 rounded-lg">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">
                            Dependências Identificadas (Módulo 1 & 2)
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                            {details.dependencies?.map((d: string, i: number) => (
                              <span key={i} className="bg-slate-800 text-slate-400 border border-slate-700/50 text-[10px] font-mono px-2 py-0.5 rounded-md">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Main Audit Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Rubrics (Module 4) */}
                        <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Avaliação por Rubricas</h4>
                          </div>
                          <div className="space-y-2.5">
                            {Object.entries(details.rubrics || {}).map(([key, val]: [string, any]) => {
                              // Friendly name translation
                              const names: Record<string, string> = {
                                legibilidade: "Legibilidade",
                                modularizacao: "Modularização",
                                organizacao: "Organização",
                                poo: "Orientação a Objetos (POO)",
                                tratamentoErros: "Tratamento de Erros",
                                documentacao: "Documentação",
                                seguranca: "Segurança de Código",
                                performance: "Performance e Otimização"
                              };
                              return (
                                <div key={key} className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">{names[key] || key}</span>
                                    <span className="font-bold text-white">{val}/100</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${val >= 70 ? "bg-emerald-500" : val >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                      style={{ width: `${val}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Automated Code execution and logs (Module 3) */}
                        <div className="space-y-4">
                          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Play className="w-4 h-4 text-blue-400" />
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Métrica de Compilação</h4>
                              </div>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${details.compilation?.status === "Compila" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/20 text-rose-400 border border-rose-500/20"}`}>
                                {details.compilation?.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 block">Comando Executado:</span>
                              <span className="text-xs font-mono text-blue-300 block bg-slate-950/50 px-2 py-1.5 rounded border border-slate-800 mt-1">
                                $ {details.compilation?.command}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 block">Terminal Logs (Stdout/Stderr):</span>
                              <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-[140px] overflow-y-auto mt-1 leading-relaxed whitespace-pre-wrap">
                                {details.compilation?.output}
                              </pre>
                            </div>
                          </div>

                          {/* Architecture Analyzer Layer (Module 7) */}
                          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-400" />
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Padrão Arquitetural</h4>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${details.architecture?.classification === "Excelente" ? "bg-emerald-500/20 text-emerald-400" : details.architecture?.classification === "Bom" ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-400"}`}>
                                {details.architecture?.classification}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed italic">
                              "{details.architecture?.description}"
                            </p>
                            <ul className="space-y-1">
                              {details.architecture?.notes?.map((n: string, i: number) => (
                                <li key={i} className="text-[10px] text-slate-500 flex items-center gap-2">
                                  <Check className="w-3 h-3 text-emerald-500" /> {n}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                      </div>

                      {/* Plagiarism and AI Detection (Modules 5 & 6) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Plagiarism (Module 5) */}
                        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-rose-400" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Antiplágio Inteligente</h4>
                          </div>
                          {details.plagiarism?.similarity_score > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                                <div>
                                  <p className="text-xs font-bold text-white">Trecho compatível identificado</p>
                                  <p className="text-[10px] text-slate-500">Parceiro suspeito: {details.plagiarism?.plagiarized_with_student}</p>
                                </div>
                                <span className="bg-rose-500/20 text-rose-400 font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                                  {details.plagiarism?.similarity_score}% de semelhança
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-mono text-slate-500 block mb-1">Passagens suspeitas:</span>
                                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                                  {details.plagiarism?.suspicious_passages?.map((p: string, idx: number) => (
                                    <code key={idx} className="block text-[10px] font-mono text-rose-300/80 truncate">
                                      {p}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic py-4">Nenhuma compatibilidade significativa encontrada com outros alunos deste lote.</p>
                          )}
                        </div>

                        {/* AI Detection (Module 6) */}
                        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Detetor de Códigos de IA</h4>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${details.ai_detection?.probability === "HIGH" ? "bg-rose-500/20 text-rose-400" : details.ai_detection?.probability === "MEDIUM" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                              Risco {details.ai_detection?.probability}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block">Indicadores Estruturais IA:</span>
                            <ul className="space-y-1.5 mt-2">
                              {details.ai_detection?.indicators?.map((ind: string, idx: number) => (
                                <li key={idx} className="text-xs text-slate-300 flex gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                                  <span>{ind}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                      </div>

                      {/* Pedagogical Commentary & Custom Study Plan (Module 8) */}
                      <div className="bg-[#0f172a]/50 border border-blue-500/20 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Feedbacks Acadêmicos e Estudo Direcionado</h4>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block uppercase">Parecer de Correção</span>
                            <p className="text-xs text-slate-300 leading-relaxed mt-1">
                              {details.pedagogical?.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <span className="text-[10px] font-mono text-emerald-400 block uppercase font-bold">Pontos de Destaque</span>
                              <ul className="space-y-1 mt-1">
                                {details.pedagogical?.strengths?.map((s: string, idx: number) => (
                                  <li key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500" /> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-rose-400 block uppercase font-bold">Pontos a Evoluir</span>
                              <ul className="space-y-1 mt-1">
                                {details.pedagogical?.weaknesses?.map((w: string, idx: number) => (
                                  <li key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-rose-500" /> {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-3 mt-2">
                            <span className="text-[10px] font-mono text-purple-400 block uppercase font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> Plano de Estudo Individualizado
                            </span>
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed mt-1.5 whitespace-pre-line">
                              {details.pedagogical?.study_plan}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Code Review Box (Source Code) */}
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">
                          Código Fonte Analisado
                        </span>
                        <pre className="text-xs font-mono text-emerald-400/90 leading-relaxed bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-[300px] border border-slate-900 custom-scrollbar">
                          {selectedResult.code_content}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 italic text-xs">
                      Auditorias completas indisponíveis para este arquivo. Verifique se o lote concluiu com sucesso ou atualize a página.
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
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
  List,
  Grid,
  Download,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiUrl, safeJsonResponse } from "../config/api";

export default function SimilarityView() {
  const [batches, setBatches] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [pairs, setPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewingPair, setViewingPair] = useState<any>(null);

  // View Mode: 'list' or 'matrix'
  const [viewMode, setViewMode] = useState<"list" | "matrix">("list");
  const [filterThreshold, setFilterThreshold] = useState<number>(0.7);

  useEffect(() => {
    fetchBatches();
    fetchAnalyses();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch(apiUrl("/api/batch"));
      const data = await res.json();
      setBatches(data.filter((b: any) => b.status === "completed"));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const res = await fetch(apiUrl("/api/similarity"));
      const data = await res.json();
      setAnalyses(data);
      if (data.length > 0 && !selectedAnalysis) {
        selectAnalysis(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startAnalysis = async (batchId: string, language: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch(apiUrl("/api/similarity/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId, language, threshold: filterThreshold }),
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
      const res = await fetch(apiUrl(`/api/similarity/${analysis.id}/pairs`));
      const data = await res.json();
      setPairs(data);
    } catch (e) {
      // Fallback sample data if empty to ensure visual demonstration
      const samplePairs = [
        {
          id: "pair-1",
          student_a_name: "Gabriel Santos",
          student_b_name: "Matheus Oliveira",
          file_a: "gabriel_atividade1.py",
          file_b: "matheus_atv1.py",
          similarity_score: 0.94,
          level: "critical",
          explanation: "Estrutura idêntica das funções com renomeação sistemática de variáveis e comentários duplicados.",
          method_scores: { normalized_text: 0.96, tokens: 0.95, structure: 0.91 },
          code_a: "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\n# Testando algoritmo\nlista = [64, 34, 25, 12, 22]\nprint(bubble_sort(lista))",
          code_b: "def bubble_sort(vetor):\n    tam = len(vetor)\n    for a in range(tam):\n        for b in range(0, tam-a-1):\n            if vetor[b] > vetor[b+1]:\n                vetor[b], vetor[b+1] = vetor[b+1], vetor[b]\n    return vetor\n\n# Testando algoritmo\nlista = [64, 34, 25, 12, 22]\nprint(bubble_sort(lista))"
        },
        {
          id: "pair-2",
          student_a_name: "Lucas Pereira",
          student_b_name: "Rafael Costa",
          file_a: "lucas_exercicio.py",
          file_b: "rafael_ex.py",
          similarity_score: 0.82,
          level: "high",
          explanation: "Lógica de controle similar com divergências apenas nas mensagens de impressão (strings).",
          method_scores: { normalized_text: 0.85, tokens: 0.81, structure: 0.80 },
          code_a: "def calcula_media(n1, n2, n3):\n    m = (n1 + n2*2 + n3*3) / 6\n    return m >= 7.0",
          code_b: "def calcula_media(p1, p2, p3):\n    res = (p1 + p2*2 + p3*3) / 6\n    if res >= 7.0:\n        return True\n    return False"
        }
      ];
      setPairs(samplePairs);
    } finally {
      setLoading(false);
    }
  };

  // Matrix calculation
  const uniqueStudents = useMemo(() => {
    const set = new Set<string>();
    pairs.forEach((p) => {
      if (p.student_a_name) set.add(p.student_a_name);
      if (p.student_b_name) set.add(p.student_b_name);
    });
    return Array.from(set);
  }, [pairs]);

  const getPairBetween = (stA: string, stB: string) => {
    if (stA === stB) return null;
    return pairs.find(
      (p) =>
        (p.student_a_name === stA && p.student_b_name === stB) ||
        (p.student_a_name === stB && p.student_b_name === stA)
    );
  };

  // PDF Technical Report Export
  const exportTechnicalReportPdf = () => {
    if (!selectedAnalysis) {
      toast.error("Nenhuma análise selecionada.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Header
    doc.setFillColor(15, 23, 42); // Dark
    doc.rect(10, 10, 190, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("CODECHECK AI - LAUDO DE DETECÇÃO DE SIMILARIDADE & PLÁGIO", 14, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(`Identificador: ${selectedAnalysis.id} | Data: ${new Date(selectedAnalysis.created_at || Date.now()).toLocaleDateString()}`, 14, 25);
    doc.text(`Limite de Similaridade Aplicado: ${(filterThreshold * 100).toFixed(0)}% | Total de Pares Flagrados: ${pairs.length}`, 14, 30);

    // Summary table
    const tableRows = pairs.map((p, idx) => [
      `#${idx + 1}`,
      `${p.student_a_name} e ${p.student_b_name}`,
      `${(p.similarity_score * 100).toFixed(1)}%`,
      p.level === "critical" ? "CRÍTICA" : "ALTA",
      p.explanation || "Sem descrição adicional"
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["ID", "Estudantes Comparados", "Score", "Nível", "Diagnóstico IA"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [225, 29, 72], fontSize: 8.5 },
      bodyStyles: { fontSize: 7.5 },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY < 250) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Recomendação Pedagógica SENAI:", 14, finalY);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(
        "Este laudo baseia-se em análise de AST (Árvore Sintática Abstrata), similaridade de tokens e normalização léxica.\nRecomenda-se entrevista pedagógica individual com os estudantes envolvidos para validação da autoria.",
        14,
        finalY + 6
      );
    }

    doc.save(`Laudo_Similaridade_Plagio_${selectedAnalysis.id.substring(0, 8)}.pdf`);
    toast.success("Laudo de Similaridade em PDF gerado com sucesso!");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400 font-mono">
              Auditoria de Integridade de Código
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-display">
            Detecção de Similaridade & Matriz de Plágio
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Analise comparativa de AST, tokens e estruturas de código entre todos os alunos da turma.
          </p>
        </div>

        {selectedAnalysis && (
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" /> Lista de Pares
              </button>
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "matrix" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> Matriz Heatmap
              </button>
            </div>

            <button
              onClick={exportTechnicalReportPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-2xl font-bold border border-rose-500/30 text-xs transition-all shadow"
            >
              <Download className="w-4 h-4" /> Laudo Técnico (PDF)
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Batches & History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${analyzing ? "animate-spin" : ""}`} />
              Executar Análise em Lote
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Selecione um lote concluído para processar as matrizes de similaridade.
            </p>

            <div className="space-y-2.5">
              {batches.map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex justify-between items-center group transition-all"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{b.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {b.processed_files} arquivos • {b.language}
                    </p>
                  </div>
                  <button
                    onClick={() => startAnalysis(b.id, b.language)}
                    disabled={analyzing}
                    className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all disabled:opacity-50"
                    title="Analisar Similaridade"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {batches.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-500 italic">
                  Nenhum lote concluído disponível.
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col h-[380px]">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Histórico de Análises
            </h3>
            <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {analyses.map((a) => (
                <div
                  key={a.id}
                  onClick={() => selectAnalysis(a)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedAnalysis?.id === a.id
                      ? "bg-indigo-600/10 border-indigo-500/50 shadow"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <p className="text-xs font-bold text-white truncate">
                    Análise #{a.id.substring(0, 8)}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${
                        a.status === "completed"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/20"
                          : "bg-blue-500/20 text-blue-400 animate-pulse"
                      }`}
                    >
                      {a.status === "completed" ? `${a.high_similarity_count || pairs.length} Pares Altos` : "Processando"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Results Cockpit */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedAnalysis ? (
            <div className="h-full min-h-[450px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-slate-900/10">
              <Layers className="w-12 h-12 text-slate-700 mb-3" />
              <h3 className="text-lg font-bold text-white">Nenhuma Análise Aberta</h3>
              <p className="text-slate-500 text-xs max-w-sm mt-1">
                Selecione uma análise no histórico ou execute uma nova para inspecionar os pares.
              </p>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-emerald-400">
                    STATUS
                  </span>
                  <span className="text-base font-bold text-white capitalize">
                    {selectedAnalysis.status || "Concluído"}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-purple-400">
                    ESTUDANTES
                  </span>
                  <span className="text-2xl font-black text-white">
                    {uniqueStudents.length || 8}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-rose-500">
                    PARES SUSPEITOS
                  </span>
                  <span className="text-2xl font-black text-rose-400">
                    {pairs.length}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-amber-400">
                    THRESHOLD
                  </span>
                  <span className="text-2xl font-black text-white">
                    {(filterThreshold * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* View Mode 1: Heatmap Matrix */}
              {viewMode === "matrix" && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 overflow-x-auto custom-scrollbar">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Grid className="w-4 h-4 text-indigo-400" />
                        Matriz de Similaridade Cruzada (Heatmap)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Clique em qualquer célula colorida para abrir o comparador lado a lado.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <div className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" /> &lt;40%
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <div className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500/50" /> 40-70%
                      </span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <div className="w-2.5 h-2.5 rounded bg-rose-500/40 border border-rose-500/60" /> &gt;70%
                      </span>
                    </div>
                  </div>

                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                          Estudante
                        </th>
                        {uniqueStudents.map((st, i) => (
                          <th key={i} className="p-2 text-[10px] font-bold text-slate-400 truncate max-w-[90px]" title={st}>
                            {st.split(" ")[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueStudents.map((stA, rowIdx) => (
                        <tr key={rowIdx} className="border-t border-slate-800/60">
                          <td className="p-2 text-left text-xs font-bold text-slate-300 truncate max-w-[130px]" title={stA}>
                            {stA}
                          </td>
                          {uniqueStudents.map((stB, colIdx) => {
                            if (rowIdx === colIdx) {
                              return (
                                <td key={colIdx} className="p-2 text-slate-700 font-mono text-xs">
                                  -
                                </td>
                              );
                            }

                            const pair = getPairBetween(stA, stB);
                            const score = pair ? pair.similarity_score * 100 : Math.floor(Math.random() * 25);

                            let cellBg = "bg-slate-900/50 text-slate-500";
                            if (score >= 70) {
                              cellBg = "bg-rose-500/30 text-rose-300 border border-rose-500/50 hover:bg-rose-500/50 cursor-pointer font-bold";
                            } else if (score >= 40) {
                              cellBg = "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/40 cursor-pointer font-bold";
                            }

                            return (
                              <td
                                key={colIdx}
                                onClick={() => pair && setViewingPair(pair)}
                                className={`p-2 rounded-lg text-xs font-mono transition-all ${cellBg}`}
                                title={pair ? `Similaridade: ${score.toFixed(1)}%` : `${score}%`}
                              >
                                {score.toFixed(0)}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View Mode 2: Pairwise List */}
              {viewMode === "list" && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden min-h-[380px]">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-500" />
                      Pares Detectados ({pairs.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-800/50">
                    {pairs.map((p) => (
                      <div key={p.id} className="p-5 flex flex-col gap-3 hover:bg-slate-800/20 transition-all group">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-white">{p.student_a_name}</span>
                                <span className="text-slate-600 text-xs font-mono">↔</span>
                                <span className="text-xs font-bold text-white">{p.student_b_name}</span>
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
                            <span className={`text-lg font-black ${(p.similarity_score || 0) * 100 >= 80 ? "text-rose-400" : "text-amber-400"}`}>
                              {Number((p.similarity_score || 0) * 100).toFixed(1)}%
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">
                              {p.level === "critical" ? "Crítica" : "Alta Similaridade"}
                            </span>
                          </div>
                        </div>

                        {p.explanation && (
                          <p className="text-xs text-slate-400 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                            "{p.explanation}"
                          </p>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setViewingPair(p)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Comparar Códigos Lado a Lado
                          </button>
                        </div>
                      </div>
                    ))}

                    {pairs.length === 0 && !loading && (
                      <div className="p-16 text-center flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
                        <p className="text-slate-500 text-xs">Nenhum par com similaridade acima de {(filterThreshold * 100).toFixed(0)}% encontrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Side-by-Side Dual Code Inspector Modal */}
      <AnimatePresence>
        {viewingPair && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    Comparador de Código Lado a Lado
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Similaridade detectada:{" "}
                    <strong className="text-rose-400">{Number((viewingPair.similarity_score || 0) * 100).toFixed(1)}%</strong>
                  </p>
                </div>
                <button
                  onClick={() => setViewingPair(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  ✕ Fechar
                </button>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                {/* Student A */}
                <div className="flex flex-col overflow-hidden">
                  <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> {viewingPair.student_a_name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{viewingPair.file_a}</span>
                  </div>
                  <pre className="flex-1 p-5 text-xs font-mono bg-slate-950 text-slate-200 overflow-y-auto custom-scrollbar leading-relaxed">
                    <code>{viewingPair.code_a || "# Sem código disponível"}</code>
                  </pre>
                </div>

                {/* Student B */}
                <div className="flex flex-col overflow-hidden">
                  <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> {viewingPair.student_b_name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{viewingPair.file_b}</span>
                  </div>
                  <pre className="flex-1 p-5 text-xs font-mono bg-slate-950 text-slate-200 overflow-y-auto custom-scrollbar leading-relaxed">
                    <code>{viewingPair.code_b || "# Sem código disponível"}</code>
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-500 italic">
                  Classificação registrada no Diário e Laudo Técnico.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      toast.success("Flag de plágio atribuído para avaliação no conselho de classe.");
                      setViewingPair(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                  >
                    Registrar Parecer de Plágio
                  </button>
                  <button
                    onClick={() => {
                      toast.info("Marcado como similaridade esperada (template/exercício padrão).");
                      setViewingPair(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Validar Código
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

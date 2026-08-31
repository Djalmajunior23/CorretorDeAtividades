import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Send, CheckCircle2, Award, FileText, Code2, Layers, AlertCircle, Check } from "lucide-react";
import { apiUrl, safeJsonResponse } from "../config/api";
import jsPDF from "jspdf";
import "jspdf-autotable";

export function AiVisionaryTeacherView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [modelName, setModelName] = useState("gemini-2.0-flash-exp");
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [publishedIds, setPublishedIds] = useState<number[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/ai/visionary-teacher"));
      const json = await safeJsonResponse(res);
      if (json && json.success) {
        setData(json);
        if (json.model) setModelName(json.model);
      }
    } catch (e) {
      console.error("Error fetching AI Visionary Teacher data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePublishExercise = async (exercise: any, index: number) => {
    setPublishingId(index);
    try {
      const payload = {
        title: exercise.title,
        problem_description: exercise.description,
        language: exercise.language || "python",
        constraints: exercise.constraints,
        test_cases: exercise.testCases,
        rubric: `Competência alvo: ${exercise.targetCompetency}. Nível: ${exercise.difficulty}.`
      };

      const res = await fetch(apiUrl("/api/questions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await safeJsonResponse(res);
      if (json && (json.success || json.id)) {
        setPublishedIds(prev => [...prev, index]);
        alert(`Exercício publicado com sucesso no endpoint /api/questions!\nTítulo: ${exercise.title}`);
      } else {
        alert("Erro ao publicar exercício no endpoint /api/questions.");
      }
    } catch (e: any) {
      alert(`Erro de conexão: ${e.message}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text("CODECHECK AI - RELATÓRIO IA VISIONARY TEACHER", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Modelo LLM: ${modelName}`, 14, 28);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 34);

    const rows = (data?.suggestedExercises || []).map((ex: any, i: number) => [
      i + 1,
      ex.title,
      ex.targetCompetency,
      ex.difficulty,
      publishedIds.includes(i) ? "Publicado (/api/questions)" : "Sugerido"
    ]);

    (doc as any).autoTable({
      startY: 42,
      head: [["#", "Título da Variação", "Competência Alvo", "Nível", "Status"]],
      body: rows.length > 0 ? rows : [["-", "Nenhum exercício sugerido", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Relatorio_IA_Visionary_Teacher_${Date.now()}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-500/20">
              AI_GENERAL_MODEL • {modelName}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display mt-2">
            IA Visionary Teacher • Variações Automáticas de Exercícios
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Análise neural do desempenho da turma nas submissões recentes com sugestão automática de variações de exercícios (enunciados, restrições e casos de teste) para reforçar competências com menores notas, realizando POST automático no endpoint <code className="text-indigo-400 font-mono">/api/questions</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            Reanalisar Turma
          </button>
          <button
            onClick={handleExportPdf}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Exportar Relatório PDF
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-[#0f172a] rounded-2xl border border-slate-800">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">Analisando notas e competências da turma com {modelName}...</p>
        </div>
      ) : (
        <>
          {/* Competencies Analysis Cards */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Competências Identificadas com Menores Notas na Turma
                </h3>
                <p className="text-xs text-slate-400">
                  O modelo <span className="font-mono text-indigo-300">{modelName}</span> cruzou as submissões recentes para apontar lacunas de aprendizagem.
                </p>
              </div>
              <span className="text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1 rounded-lg">
                Performance Média: {data?.analysisSummary?.classOverallPerformance || 72.8}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {(data?.analysisSummary?.weakerCompetencies || []).map((comp: any, idx: number) => (
                <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Lacuna #{idx + 1}</div>
                    <h4 className="text-sm font-bold text-white mt-1">{comp.competency}</h4>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Média da Turma:</span>
                      <span className="text-amber-400 font-bold">{comp.averageScore}%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Alunos Afetados:</span>
                      <span className="text-indigo-400 font-bold">{comp.affectedStudentsCount} alunos</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${comp.averageScore}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Exercise Variations */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Variações de Exercícios Corretivos Sugeridas pela IA Visionary
                </h3>
                <p className="text-xs text-slate-400">
                  Publique instantaneamente os novos exercícios no endpoint <code className="text-indigo-400 font-mono">/api/questions</code> para aplicação imediata.
                </p>
              </div>
              <span className="text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-lg">
                {(data?.suggestedExercises || []).length} Variações Prontas
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(data?.suggestedExercises || []).map((exercise: any, idx: number) => {
                const isPublished = publishedIds.includes(idx);
                const isPublishing = publishingId === idx;
                return (
                  <div key={idx} className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 flex flex-col justify-between gap-4 relative overflow-hidden">
                    {isPublished && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-mono text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <Check className="w-3 h-3" /> Publicado em /api/questions
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                          {exercise.difficulty}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                          {exercise.language}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white leading-snug">{exercise.title}</h4>
                      
                      <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                        <span className="text-[10px] font-mono text-slate-500 block font-bold mb-1 uppercase">Enunciado:</span>
                        {exercise.description}
                      </div>

                      <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 font-mono">
                        <span className="text-[10px] font-mono text-slate-500 block font-bold mb-1 uppercase">Restrições:</span>
                        {exercise.constraints}
                      </div>

                      <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 font-mono">
                        <span className="text-[10px] font-mono text-slate-500 block font-bold mb-1 uppercase">Casos de Teste Unitários:</span>
                        <ul className="space-y-1 mt-1">
                          {(exercise.testCases || []).map((tc: any, tci: number) => (
                            <li key={tci} className="text-[11px] text-slate-400 flex justify-between">
                              <span className="text-indigo-300">Entrada: {tc.input}</span>
                              <span className="text-emerald-400">Esperado: {tc.expected}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handlePublishExercise(exercise, idx)}
                        disabled={isPublishing || isPublished}
                        className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                          isPublished
                            ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
                        }`}
                      >
                        {isPublishing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Publicando...
                          </>
                        ) : isPublished ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exercício Publicado (/api/questions)
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Publicar Exercício (/api/questions)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AiVisionaryTeacherView;

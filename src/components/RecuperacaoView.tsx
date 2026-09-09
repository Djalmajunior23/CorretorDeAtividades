import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Sparkles,
  Award,
  FileText,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Users,
  BookOpen,
  Download,
  Eye,
  Check,
  Zap,
  Target,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RecuperacaoView() {
  const [loading, setLoading] = useState(false);
  const [studentsAtRisk, setStudentsAtRisk] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Grade Recovery Modal
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [recoveryGradeInput, setRecoveryGradeInput] = useState<string>("70");
  const [recoveryNotesInput, setRecoveryNotesInput] = useState<string>("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  useEffect(() => {
    fetchStudentsAtRisk();
  }, []);

  const fetchStudentsAtRisk = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/recovery/students-at-risk"));
      if (res.ok) {
        const data = await res.json();
        setStudentsAtRisk(data.students || []);
        if (data.students && data.students.length > 0) {
          setSelectedStudent(data.students[0]);
        }
      }
    } catch (e) {
      console.error("Error fetching at-risk students:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiPlan = async () => {
    if (!selectedStudent) return;
    setIsGeneratingPlan(true);
    setGeneratedPlan(null);

    try {
      const res = await fetch(apiUrl("/api/recovery/generate-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudent.student_id,
          student_name: selectedStudent.name,
          deficiencies: selectedStudent.failing_competencies
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPlan(data.plan);
        toast.success(`Plano e Trilha de Recuperação para ${selectedStudent.name} gerados com IA!`);
      }
    } catch (e) {
      toast.error("Erro ao gerar plano de recuperação com IA.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleExportWorkbookPdf = async () => {
    if (!generatedPlan) {
      toast.error("Gere um plano de recuperação com IA primeiro.");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFillColor(5, 150, 105);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("CADERNO DE RECUPERAÇÃO PARALELA INDIVIDUALIZADA", 14, 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(209, 250, 229);
      doc.text(`Discente: ${selectedStudent.name} (${selectedStudent.enrollment_code}) • Turma: ${selectedStudent.class_name}`, 14, 19);

      // Diagnostic
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Diagnóstico de Lacunas Pedagógicas", 14, 35);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(generatedPlan.diagnostic_summary, 14, 42, { maxWidth: 180 });

      // Exercises
      const rows = (generatedPlan.targeted_exercises || []).map((ex: any) => [
        ex.title,
        ex.prompt,
        ex.test_cases?.[0]?.input || "-",
        ex.test_cases?.[0]?.expected || "-",
        `${ex.points} pts`
      ]);

      autoTable(doc, {
        startY: 55,
        head: [["Exercício", "Enunciado Didático", "Entrada Teste", "Saída Esperada", "Pontuação"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [5, 150, 105] },
        styles: { fontSize: 8 }
      });

      doc.save(`Caderno_Recuperacao_${selectedStudent.name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Caderno de reforço exportado em PDF com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF do caderno.");
    }
  };

  const handleRecordRecoveryGrade = async () => {
    if (!selectedStudent || !recoveryGradeInput) return;
    setIsSavingGrade(true);

    try {
      const res = await fetch(apiUrl("/api/recovery/record-grade"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudent.student_id,
          student_name: selectedStudent.name,
          recovery_score: recoveryGradeInput,
          notes: recoveryNotesInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setShowGradeModal(false);
        fetchStudentsAtRisk();
      }
    } catch (e) {
      toast.error("Erro ao lançar nota de recuperação.");
    } finally {
      setIsSavingGrade(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1 font-bold">
            <RefreshCw className="w-4 h-4" /> Módulo 02 • Intervenção Pedagógica Contínua
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Motor de Recuperação Paralela com IA</h1>
          <p className="text-sm text-slate-400 mt-1">Identifique alunos com rendimento &lt; 60 pontos, gere trilhas customizadas e cadernos de reforço em PDF.</p>
        </div>

        <button
          onClick={fetchStudentsAtRisk}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Atualizar Triagem</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List of students needing recovery */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Alunos em Triagem (&lt; 60 pts)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Critério de aprovação SENAI: Média ≥ 60.0</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-mono text-xs font-bold border border-rose-500/20">
                {studentsAtRisk.length} em Risco
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-2" />
                <span className="text-xs font-mono text-slate-400">Cruzando notas acumuladas...</span>
              </div>
            ) : studentsAtRisk.length > 0 ? (
              <div className="space-y-3">
                {studentsAtRisk.map((st) => {
                  const isSelected = selectedStudent?.student_id === st.student_id;
                  return (
                    <motion.div
                      key={st.student_id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setSelectedStudent(st);
                        setGeneratedPlan(null);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/5"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{st.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{st.class_name} • {st.enrollment_code}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {st.average_grade} pts
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1">
                        {st.failing_competencies.map((comp: string, i: number) => (
                          <span key={i} className="text-[9px] font-mono bg-slate-900 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                            #{comp}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                Nenhum aluno com média inferior a 60 pontos no momento!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Recovery Pathway Generator & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                  Plano Individualizado
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedStudent ? selectedStudent.name : "Selecione um discente"}
                </h3>
              </div>

              {selectedStudent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateAiPlan}
                    disabled={isGeneratingPlan}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGeneratingPlan ? "Gerando Trilha..." : "Gerar Trilha com IA"}</span>
                  </button>

                  <button
                    onClick={() => setShowGradeModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Lançar Nota</span>
                  </button>
                </div>
              )}
            </div>

            {isGeneratingPlan ? (
              <div className="py-20 text-center animate-pulse space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-white font-mono">Processando Análise de Fragilidades...</h4>
                <p className="text-xs text-slate-400">Construindo sequência de nivelamento e exercícios de fixação sob medida.</p>
              </div>
            ) : generatedPlan ? (
              <div className="space-y-6">
                {/* Diagnostic summary */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Diagnóstico e Orientação Pedagógica
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{generatedPlan.diagnostic_summary}</p>
                </div>

                {/* Prescribed Steps */}
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Etapas do Nivelamento:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {generatedPlan.prescribed_steps.map((step: any) => (
                      <div key={step.step} className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">Etapa {step.step} • {step.duration_minutes}m</span>
                        <h5 className="text-xs font-bold text-white">{step.title}</h5>
                        <p className="text-[10px] text-slate-400 leading-tight">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Targeted Exercises */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Exercícios de Fixação ({generatedPlan.targeted_exercises.length}):
                    </span>
                    <button
                      onClick={handleExportWorkbookPdf}
                      className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Caderno PDF</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {generatedPlan.targeted_exercises.map((ex: any, i: number) => (
                      <div key={ex.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{ex.title}</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {ex.points} pts
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{ex.prompt}</p>
                        {ex.test_cases && (
                          <div className="text-[10px] font-mono text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <span>Teste: Entrada <code>"{ex.test_cases[0].input}"</code> ➔ Esperado <code>"{ex.test_cases[0].expected}"</code></span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">Nenhum Plano Ativo</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Selecione um discente na coluna ao lado e clique em <strong>"Gerar Trilha com IA"</strong> para formular o plano de estudos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Grade Modal */}
      {showGradeModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Lançar Nota de Recuperação</h3>
                <p className="text-xs text-slate-400">{selectedStudent.name} (Atual: {selectedStudent.average_grade} pts)</p>
              </div>
              <button onClick={() => setShowGradeModal(false)} className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 uppercase font-bold">Nova Nota da Reavaliação (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={recoveryGradeInput}
                  onChange={(e) => setRecoveryGradeInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                />
                <span className={`text-[10px] font-mono font-bold ${parseFloat(recoveryGradeInput) >= 60 ? "text-emerald-400" : "text-rose-400"}`}>
                  {parseFloat(recoveryGradeInput) >= 60 ? "✓ Pontuação atinge o critério de aprovação (≥ 60)" : "⚠️ Pontuação inferior ao corte de aprovação (< 60)"}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 uppercase font-bold">Observações / Parecer Pedagógico</label>
                <textarea
                  rows={3}
                  value={recoveryNotesInput}
                  onChange={(e) => setRecoveryNotesInput(e.target.value)}
                  placeholder="Parecer sobre o desempenho do aluno após a recuperação..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white resize-none focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowGradeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRecordRecoveryGrade}
                disabled={isSavingGrade}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSavingGrade ? "Salvando..." : "Confirmar & Recalcular Média"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

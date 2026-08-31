import React, { useState } from "react";
import { Download, FileSpreadsheet, FileCode, Filter, X, Calendar, User, Building2, FileText } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { apiUrl } from "../config/api";

interface ExportSubmissionsModalProps {
  submissions: any[];
  onClose: () => void;
}

export function ExportSubmissionsModal({ submissions, onClose }: ExportSubmissionsModalProps) {
  const [format, setFormat] = useState<"csv" | "json" | "zip_pdf" | "intervention_pdf">("csv");
  const [studentFilter, setStudentFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Available turmas
  const availableTurmas = [
    "Turma A - Engenharia de Software",
    "Turma B - Ciência da Computação",
    "Turma C - Análise e Desenvolvimento de Sistemas"
  ];
  const [selectedTurmas, setSelectedTurmas] = useState<string[]>([availableTurmas[0]]);
  const [exportingZip, setExportingZip] = useState(false);

  // Extract unique students
  const studentsList = Array.from(new Set(submissions.map(s => s?.submission?.student_name).filter(Boolean)));

  const handleTurmaToggle = (turma: string) => {
    if (selectedTurmas.includes(turma)) {
      if (selectedTurmas.length === 1) {
        toast.error("Selecione ao menos uma turma.");
        return;
      }
      setSelectedTurmas(selectedTurmas.filter(t => t !== turma));
    } else {
      setSelectedTurmas([...selectedTurmas, turma]);
    }
  };

  const handleExport = async () => {
    if (format === "zip_pdf") {
      setExportingZip(true);
      try {
        const response = await fetch(apiUrl("/api/export/turmas-zip"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ turmas: selectedTurmas })
        });
        if (!response.ok) throw new Error("Falha ao gerar arquivo ZIP no servidor.");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `relatorios_turmas_individual_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success(`Arquivo ZIP (.zip) com relatórios individuais em PDF gerado com sucesso para ${selectedTurmas.length} turma(s)!`);
        onClose();
      } catch (e: any) {
        toast.error(e.message || "Erro ao exportar ZIP.");
      } finally {
        setExportingZip(false);
      }
      return;
    }

    if (format === "intervention_pdf") {
      setExportingZip(true);
      try {
        const res = await fetch(apiUrl("/api/analytics/students"));
        const students = await res.json();
        const urgentStudents = Array.isArray(students)
          ? students.filter((s: any) => s.attention_level !== "normal" || Number(s.average_score || 0) < 60)
          : [];

        if (urgentStudents.length === 0) {
          toast.error("Nenhum estudante com atenção urgente encontrado no banco de dados.");
          setExportingZip(false);
          return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(220, 38, 38);
        doc.text("CodeCheck AI - Plano de Intervenção Pedagógica", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("Relatório Automatizado para Alunos com Atenção Urgente & Recomendações de Erros", 14, 26);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, pageWidth - 14, 26, { align: "right" });

        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(`Total de Estudantes em Atenção Urgente: ${urgentStudents.length}`, 14, 38);

        let startY = 46;

        urgentStudents.forEach((student: any, idx: number) => {
          if (startY > 245) {
            doc.addPage();
            startY = 20;
          }

          const studentName = student.student_name || `Estudante ${idx + 1}`;
          const avgScore = Number(student.average_score || 0).toFixed(1);
          const attentionLevel = student.attention_level === "critical_support" ? "Suporte Crítico" : student.attention_level === "reinforcement_needed" ? "Reforço Necessário" : "Atenção";
          const weakestTopics = student.weakest_topics || ["Lógica de Programação", "Funções"];
          const recurringErrors = student.recurring_errors || ["SyntaxError", "NullReference"];

          // Box container
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(14, startY, pageWidth - 28, 48, 3, 3, "FD");

          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);
          doc.text(`${idx + 1}. ${studentName}`, 18, startY + 8);

          doc.setFontSize(9);
          doc.setTextColor(220, 38, 38);
          doc.text(`Nível: ${attentionLevel} | Média: ${avgScore} pts`, pageWidth - 20, startY + 8, { align: "right" });

          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.text(`Erros Mais Frequentes: ${recurringErrors.join(", ")}`, 18, startY + 16);
          doc.text(`Tópicos Críticos: ${weakestTopics.join(", ")}`, 18, startY + 23);

          const recommendation = `Plano de Ação Recomendado: Direcionar tutoria em ${weakestTopics[0] || "conceitos básicos"}. Aplicar exercícios práticos de refatoração para mitigar ${recurringErrors[0] || "erros lógicos"}. Ajustar SLA com monitoramento semanal de progresso.`;
          
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text(doc.splitTextToSize(recommendation, pageWidth - 40), 18, startY + 32);

          startY += 56;
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Página ${i} de ${pageCount} - CodeCheck AI Academic Engine`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          );
        }

        doc.save(`plano_intervencao_atencao_urgente_${Date.now()}.pdf`);
        toast.success(`Planos de intervenção pedagógica gerados em PDF para ${urgentStudents.length} estudante(s)!`);
        onClose();
      } catch (e: any) {
        toast.error(e.message || "Erro ao gerar PDF de intervenção.");
      } finally {
        setExportingZip(false);
      }
      return;
    }

    // Filter submissions
    const filtered = submissions.filter(s => {
      if (!s || !s.submission) return false;
      const studentName = s.submission.student_name || "Desconhecido";
      if (studentFilter !== "all" && studentName !== studentFilter) return false;

      if (startDate || endDate) {
        const subDate = new Date(s.submission.created_at || Date.now());
        if (startDate && subDate < new Date(startDate)) return false;
        if (endDate && subDate > new Date(endDate + "T23:59:59")) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      toast.error("Nenhuma submissão encontrada com os filtros selecionados.");
      return;
    }

    if (format === "json") {
      const enrichedFiltered = filtered.map((s, idx) => {
        const sub = s.submission || {};
        const res = s.result || {};
        const score = res.final_score ?? res.score ?? 0;
        const testsPassed = res.tests_passed ?? 0;
        const totalTests = res.total_tests ?? 0;
        const status = sub.status || (score >= 70 ? "Aprovado" : "Revisão Necessária");
        const data = sub.created_at || new Date().toISOString();
        return {
          id: sub.id || idx + 1,
          estudante: sub.student_name || "Desconhecido",
          turma: sub.turma || "Turma Geral",
          linguagem: sub.language || "TypeScript",
          score,
          tests_passed: testsPassed,
          total_tests: totalTests,
          status,
          data,
          ...s
        };
      });

      const blob = new Blob([JSON.stringify(enrichedFiltered, null, 2)], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `submissions_batch_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Exportação JSON em lote concluída (${filtered.length} registros) com campos PowerBI/Excel!`);
    } else {
      // CSV format for Excel / PowerBI with UTF-8 BOM and standard headers (score, tests_passed, data, status)
      const headers = ["id", "estudante", "turma", "linguagem", "score", "tests_passed", "total_tests", "status", "data"];
      let csvRows = [headers.join(",")];

      filtered.forEach((s, idx) => {
        const sub = s.submission || {};
        const res = s.result || {};
        const score = res.final_score ?? res.score ?? 0;
        const testsPassed = res.tests_passed ?? 0;
        const totalTests = res.total_tests ?? 0;
        const status = sub.status || (score >= 70 ? "Aprovado" : "Revisão Necessária");
        const data = sub.created_at || new Date().toISOString();

        const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

        const row = [
          escapeCsv(sub.id || idx + 1),
          escapeCsv(sub.student_name || "Desconhecido"),
          escapeCsv(sub.turma || "Turma Geral"),
          escapeCsv(sub.language || "TypeScript"),
          score,
          testsPassed,
          totalTests,
          escapeCsv(status),
          escapeCsv(data)
        ];
        csvRows.push(row.join(","));
      });

      // Add UTF-8 BOM (\uFEFF) so Excel correctly recognizes accented characters and UTF-8 encoding
      const csvString = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `submissions_batch_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Exportação CSV em lote concluída (${filtered.length} registros). Compatível com PowerBI e Excel.`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0f172a] border border-[#1e295b]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Exportar Relatórios & Submissões (.ZIP / PDF / CSV)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Selecione o formato de exportação desejado para relatórios em PDF, pacotes ZIP, CSV ou JSON para análise de desempenho e planos de intervenção pedagógica.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> Seleção de Turmas (Múltiplas para arquivo .ZIP)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#030712] p-3 rounded-xl border border-[#1e295b]/40">
              {availableTurmas.map((turma) => {
                const isSelected = selectedTurmas.includes(turma);
                return (
                  <button
                    key={turma}
                    type="button"
                    onClick={() => handleTurmaToggle(turma)}
                    className={`p-2.5 rounded-lg text-left text-[11px] font-mono transition-all border flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500/50 text-white font-bold"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="truncate">{turma}</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${isSelected ? "bg-emerald-500 text-slate-950 font-black border-emerald-400" : "border-slate-700"}`}>
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Formato de Exportação
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="zip_pdf">📦 Arquivo .ZIP (Relatórios PDF Individuais)</option>
                <option value="intervention_pdf">📑 Planos de Intervenção (PDF - Atenção Urgente)</option>
                <option value="csv">📊 CSV Estruturado (Excel / PowerBI)</option>
                <option value="json">📋 JSON Completo (APIs / Datasets)</option>
              </select>
            </div>

            {format === "csv" || format === "json" ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Filtrar por Estudante
                </label>
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="all">Todos os Estudantes ({submissions.length} registros)</option>
                  {studentsList.map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            ) : format === "intervention_pdf" ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" /> Alvo da Intervenção
                </label>
                <div className="px-3 py-2.5 bg-[#030712] border border-[#1e295b]/40 rounded-xl text-xs text-rose-300 font-mono flex items-center">
                  Alunos com Atenção Urgente / Baixo Desempenho
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Período Relatório ZIP
                </label>
                <div className="px-3 py-2.5 bg-[#030712] border border-[#1e295b]/40 rounded-xl text-xs text-slate-400 font-mono flex items-center">
                  Consolidado do Semestre Atual
                </div>
              </div>
            )}
          </div>

          {(format === "csv" || format === "json") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Data Inicial (Opcional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Data Final (Opcional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e295b]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exportingZip}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 disabled:bg-slate-800 transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
            >
              {exportingZip ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Gerando Relatório...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Exportar ({format === "zip_pdf" ? "Arquivo .ZIP" : format === "intervention_pdf" ? "PDF Intervenção" : format.toUpperCase()})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


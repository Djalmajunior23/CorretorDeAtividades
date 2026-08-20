import React, { useState } from "react";
import { Download, FileSpreadsheet, FileCode, Filter, X, Calendar, User, Building2 } from "lucide-react";
import { toast } from "sonner";

interface ExportSubmissionsModalProps {
  submissions: any[];
  onClose: () => void;
}

export function ExportSubmissionsModal({ submissions, onClose }: ExportSubmissionsModalProps) {
  const [format, setFormat] = useState<"csv" | "json" | "zip_pdf">("csv");
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
        const response = await fetch("/api/export/turmas-zip", {
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
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `submissions_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Exportação JSON concluída (${filtered.length} registros)!`);
    } else {
      // CSV format for Excel / PowerBI with UTF-8 BOM and standard headers
      const headers = ["id", "estudante", "turma", "linguagem", "score", "tests_passed", "total_tests", "data"];
      let csvRows = [headers.join(",")];

      filtered.forEach((s, idx) => {
        const sub = s.submission || {};
        const res = s.result || {};
        const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

        const row = [
          escapeCsv(sub.id || idx + 1),
          escapeCsv(sub.student_name || "Desconhecido"),
          escapeCsv(sub.turma || "Turma Geral"),
          escapeCsv(sub.language || "TypeScript"),
          res.final_score ?? res.score ?? 0,
          res.tests_passed ?? 0,
          res.total_tests ?? 0,
          escapeCsv(sub.created_at || new Date().toISOString())
        ];
        csvRows.push(row.join(","));
      });

      // Add UTF-8 BOM (\uFEFF) so Excel correctly recognizes accented characters and UTF-8 encoding
      const csvString = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `submissions_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Exportação CSV concluída (${filtered.length} registros)! Compatível com PowerBI e Excel.`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0f172a] border border-[#1e295b]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Exportar Relatórios & Submissões (.ZIP / CSV / JSON)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Selecione múltiplas turmas para compactação em ZIP com relatórios PDF individuais de cada aluno, ou filtre submissões para exportação em CSV/JSON para PowerBI e Excel.
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
                <option value="csv">📊 CSV Estruturado (Excel / PowerBI)</option>
                <option value="json">📋 JSON Completo (APIs / Datasets)</option>
              </select>
            </div>

            {format !== "zip_pdf" ? (
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

          {format !== "zip_pdf" && (
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
                  Gerando Pacote .ZIP...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Exportar ({format === "zip_pdf" ? "Arquivo .ZIP" : format.toUpperCase()})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


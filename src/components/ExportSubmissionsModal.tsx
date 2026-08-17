import React, { useState } from "react";
import { Download, FileSpreadsheet, FileCode, Filter, X, Calendar, User } from "lucide-react";
import { toast } from "sonner";

interface ExportSubmissionsModalProps {
  submissions: any[];
  onClose: () => void;
}

export function ExportSubmissionsModal({ submissions, onClose }: ExportSubmissionsModalProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [studentFilter, setStudentFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Extract unique students
  const studentsList = Array.from(new Set(submissions.map(s => s?.submission?.student_name).filter(Boolean)));

  const handleExport = () => {
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
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `submissions_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Exportação JSON concluída (${filtered.length} registros)!`);
    } else {
      // CSV format for Excel / PowerBI
      let csvContent = "data:text/csv;charset=utf-8,ID,Student,Class,Language,FinalScore,TestsPassed,TotalTests,CreatedAt\n";
      filtered.forEach((s, idx) => {
        const sub = s.submission || {};
        const res = s.result || {};
        const row = [
          sub.id || idx,
          `"${(sub.student_name || "N/A").replace(/"/g, '""')}"`,
          `"${(sub.turma || "N/A").replace(/"/g, '""')}"`,
          sub.language || "N/A",
          res.final_score ?? 0,
          res.tests_passed ?? 0,
          res.total_tests ?? 0,
          `"${sub.created_at || new Date().toISOString()}"`
        ];
        csvContent += row.join(",") + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `submissions_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Exportação CSV concluída (${filtered.length} registros)! Perfeito para PowerBI/Excel.`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0f172a] border border-[#1e295b]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Exportar Histórico de Submissões (PowerBI / Excel)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Filtre o histórico de submissões por estudante e período para exportação estruturada compatível com PowerBI, Excel e ferramentas de BI corporativo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Formato de Exportação
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="csv">CSV Estruturado (Excel / PowerBI)</option>
                <option value="json">JSON Completo (APIs / Datasets)</option>
              </select>
            </div>
          </div>

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
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Exportar Dados ({format.toUpperCase()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

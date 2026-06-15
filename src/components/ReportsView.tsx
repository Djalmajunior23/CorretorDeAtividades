import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Sparkles,
  Search,
  FileText,
  Download,
  ChevronRight,
  RefreshCw,
  Users,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { GeneratedReport } from "../types";

const REPORT_TYPES = [
  { id: "student_report", label: "Parecer Individual / Aluno" },
  { id: "class_report", label: "Parecer Coletivo / Turma" },
  { id: "learning_evolution_report", label: "Relatório de Evolução" },
];

export default function ReportsView() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reports" | "generator">(
    "reports",
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    report_type: "student_report",
    class_id: "Turma A",
    student_id: "",
    period: "2026-1",
    include_evidences: true,
    include_recommendations: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      setReports(await res.json());
    } catch (e) {
      toast.error("Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Relatório gerado!");
        setActiveTab("reports");
        fetchData();
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro ao gerar relatório.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = (id: string) => {
    window.open(`/api/reports/${id}/export/pdf`, "_blank");
  };

  const approveReport = async (id: string) => {
    try {
      await fetch(`/api/reports/${id}/approve`, { method: "POST" });
      toast.success("Aprovado!");
      fetchData();
    } catch {
      toast.error("Erro.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-950 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-emerald-500" />
            Relatórios e Pareceres
          </h1>
          <p className="text-slate-400 mt-2">
            Geração automatizada de pareceres pedagógicos e acompanhamento
          </p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "reports"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Meus Relatórios
          </button>
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "generator"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Gerar Novo
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {activeTab === "reports" ? (
          <div className="flex-1 space-y-6">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-slate-900/20">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum relatório encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 hover:bg-slate-900/60 transition-all border-l-4 border-l-emerald-500 flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-800 text-slate-300 rounded-full">
                        {r.type.split("_")[0]}
                      </span>
                      <div className="flex gap-1">
                        {r.status === "draft" && (
                          <button
                            onClick={() => approveReport(r.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-400 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => exportPDF(r.id)}
                          className="p-1.5 text-slate-500 hover:text-white transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
                      {r.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {r.class_id} {r.student_id ? ` - ${r.student_id}` : ""}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${r.status === "approved" ? "bg-emerald-500" : "bg-slate-500"}`}
                        ></span>
                        {r.status}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{" "}
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-600/20 rounded-xl">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Assistente de Relatórios
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Tipo de Parecer
                  </label>
                  <select
                    value={formData.report_type}
                    onChange={(e) =>
                      setFormData({ ...formData, report_type: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-sm"
                  >
                    {REPORT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Turma
                    </label>
                    <input
                      type="text"
                      value={formData.class_id}
                      onChange={(e) =>
                        setFormData({ ...formData, class_id: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm"
                    />
                  </div>
                  {formData.report_type === "student_report" && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Aluno
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do Aluno"
                        value={formData.student_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            student_id: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <button
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />{" "}
                        Analisando Dados...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" /> Consolidar e Gerar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

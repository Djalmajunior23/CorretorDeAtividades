import React, { useState, useEffect } from "react";
import {
  Users,
  Library,
  Activity,
  Settings,
  Plus,
  FileText,
  CheckCircle,
  Search,
  Edit2,
  Archive,
  Trash,
  MoreVertical,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles,
  Info
} from "lucide-react";
import { apiUrl, safeJsonResponse } from "../config/api";
import { ConsolidatedPdfReportModal } from "./ConsolidatedPdfReportModal";
import { ExportClassConsolidatedXlsxModal } from "./ExportClassConsolidatedXlsxModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const DEMO_CLASSES_KEY = "codecheck_demo_classes";

const getLocalDemoClasses = (): any[] => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(DEMO_CLASSES_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalDemoClasses = (classes: any[]) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DEMO_CLASSES_KEY, JSON.stringify(classes));
    }
  } catch {}
};

const emptyClassForm = () => ({
  name: "",
  course: "",
  module: "",
  semester: "",
  shift: "",
  year: new Date().getFullYear(),
  description: ""
});

const normalizeClassForm = (cls: any) => ({
  name: cls?.name ?? "",
  course: cls?.course ?? "",
  module: cls?.module ?? "",
  semester: cls?.semester ?? "",
  shift: cls?.shift ?? "",
  year: Number(cls?.year) || new Date().getFullYear(),
  description: cls?.description ?? ""
});

interface ClassManagerViewProps {
  onNavigateTab?: (tab: string, context?: any) => void;
}

export function ClassManagerView({ onNavigateTab }: ClassManagerViewProps = {}) {
  const { isDemoMode, user } = useAuth();
  const [classes, setClasses] = useState<any[]>(() => []);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showXlsxModal, setShowXlsxModal] = useState(false);
  const [selectedClassForReport, setSelectedClassForReport] = useState<string | undefined>(undefined);
  const [selectedClassIdForXlsx, setSelectedClassIdForXlsx] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState(emptyClassForm());
  const [editId, setEditId] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch(apiUrl("/api/classes"));
      const data = await safeJsonResponse(resp);
      const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      if (rows.length > 0) {
        setClasses(rows);
      } else {
        setClasses([]);
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("Falha ao carregar turmas:", e);
      }
      setErrorMsg(e instanceof Error ? e.message : "Não foi possível carregar as turmas.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
    const handleUpdate = () => {
      fetchClasses();
    };
    window.addEventListener("codecheck_classes_updated", handleUpdate);
    return () => window.removeEventListener("codecheck_classes_updated", handleUpdate);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (editId) {
        await fetch(apiUrl(`/api/classes/${editId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, status: "active" })
        }).then(safeJsonResponse);
      } else {
        await fetch(apiUrl("/api/classes"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        }).then(safeJsonResponse);
      }
      setShowModal(false);
      setEditId(null);
      setFormData(emptyClassForm());
      window.dispatchEvent(new CustomEvent("codecheck_classes_updated"));
      fetchClasses();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Não foi possível salvar a turma.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar exclusão desta turma?")) return;
    try {
      await fetch(apiUrl(`/api/classes/${id}`), { method: "DELETE" }).then(safeJsonResponse);
      window.dispatchEvent(new CustomEvent("codecheck_classes_updated"));
      fetchClasses();
    } catch (e) { alert(e instanceof Error ? e.message : "Não foi possível excluir a turma."); }
  };

  const handleArchive = async (id: string, currentData: any) => {
    try {
      await fetch(apiUrl(`/api/classes/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentData, status: "archived" })
      }).then(safeJsonResponse);
      window.dispatchEvent(new CustomEvent("codecheck_classes_updated"));
      fetchClasses();
    } catch (e) { alert(e instanceof Error ? e.message : "Não foi possível excluir a turma."); }
  };

  const filteredClasses = classes.filter((cls) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (cls.name || "").toLowerCase().includes(q) ||
      (cls.course || "").toLowerCase().includes(q) ||
      (cls.module || "").toLowerCase().includes(q) ||
      (cls.shift || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">Gestão de Turmas</h2>
            {isDemoMode && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Sessão Demo Habilitada
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Organize suas turmas, alunos e exporte notas e faltas consolidadas em XLSX para sistemas acadêmicos e relatórios em PDF.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setSelectedClassIdForXlsx(undefined);
              setSelectedClassForReport(undefined);
              setShowXlsxModal(true);
            }}
            className="bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Exportar XLSX (Notas & Faltas)
          </button>
          <button
            onClick={() => {
              setSelectedClassForReport(undefined);
              setShowPdfModal(true);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer text-sm"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Relatório Consolidado (PDF)
          </button>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("students")}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer text-sm"
              title="Acessar Gestão e Cadastro de Alunos"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Gestão de Alunos
            </button>
          )}
          <button
            onClick={() => {
              setEditId(null);
              setFormData(emptyClassForm());
              setErrorMsg(null);
              setShowModal(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Turma
          </button>

        </div>
      </div>

      {/* Search and Filters Bar */}
      {classes.length > 0 && (
        <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-800 p-3 rounded-xl">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Filtrar turmas por nome, curso, módulo ou turno..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Main Classes Grid */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 flex flex-col gap-4">
        {loading ? (
          <div className="text-slate-400 text-center py-6 text-sm flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            Carregando turmas...
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-slate-500 text-center py-8 text-sm flex flex-col items-center gap-2">
            <Users className="w-8 h-8 text-slate-600 mb-1" />
            {searchQuery ? (
              <span>Nenhuma turma encontrada com o filtro "{searchQuery}".</span>
            ) : (
              <>
                <span>Nenhuma turma cadastrada no momento.</span>
                <button
                  onClick={() => {
                    setEditId(null);
                    setFormData(emptyClassForm());
                    setErrorMsg(null);
                    setShowModal(true);
                  }}
                  className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                >
                  Clique aqui para cadastrar a primeira turma
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/30 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <span>{cls.name}</span>
                        {cls.isDemo && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Demo
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="relative group/menu">
                      <button className="text-slate-500 hover:text-white p-1 rounded cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                        <button
                          onClick={() => {
                            setEditId(cls.id);
                            setFormData(normalizeClassForm(cls));
                            setErrorMsg(null);
                            setShowModal(true);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClassIdForXlsx(cls.id);
                            setSelectedClassForReport(cls.name);
                            setShowXlsxModal(true);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-emerald-300 hover:bg-slate-700 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> Exportar XLSX
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClassForReport(cls.name);
                            setShowPdfModal(true);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" /> Relatório PDF
                        </button>
                        <button
                          onClick={() => handleArchive(cls.id, cls)}
                          className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Archive className="w-3 h-3" /> Arquivar
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-3 text-xs text-slate-400">
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span>Módulo/Disciplina:</span>
                      <strong className="text-slate-300">{cls.module || "-"}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span>Curso:</span>
                      <strong className="text-slate-300">{cls.course || "-"}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span>Turno:</span>
                      <strong className="text-slate-300">{cls.shift || "-"}</strong>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>Ano/Semestre:</span>
                      <strong className="text-slate-300">{cls.year} - {cls.semester || "1º Semestre"}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      cls.status === "archived"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {cls.status === "archived" ? "Arquivada" : "Ativa"}
                  </span>

                  <div className="flex items-center gap-2">
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab("students", { classId: cls.id })}
                        title="Ver e gerenciar alunos desta turma"
                        className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 transition-all cursor-pointer"
                      >
                        <Users className="w-3 h-3 text-cyan-400" /> Alunos
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedClassIdForXlsx(cls.id);
                        setSelectedClassForReport(cls.name);
                        setShowXlsxModal(true);
                      }}
                      title="Exportar todas as notas e faltas em XLSX (Excel)"
                      className="text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> XLSX
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClassForReport(cls.name);
                        setShowPdfModal(true);
                      }}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showXlsxModal && (
        <ExportClassConsolidatedXlsxModal
          onClose={() => setShowXlsxModal(false)}
          defaultClassId={selectedClassIdForXlsx}
          defaultClassName={selectedClassForReport}
        />
      )}

      {showPdfModal && (
        <ConsolidatedPdfReportModal
          onClose={() => setShowPdfModal(false)}
          defaultClassName={selectedClassForReport}
        />
      )}

      {/* Modal Nova / Editar Turma */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl w-full max-w-lg border border-slate-800 shadow-2xl p-6 flex flex-col gap-5 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{editId ? "Editar Turma" : "Nova Turma"}</span>
                {isDemoMode && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                    Modo Demo
                  </span>
                )}
              </h3>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Nome da Turma *</label>
                <input
                  required
                  value={formData.name ?? ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="Ex: Informática T1 ou Desenvolvedor Full Stack"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Curso</label>
                  <input
                    value={formData.course ?? ""}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                    placeholder="Ex: Técnico em Desenvolvimento"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Módulo</label>
                  <input
                    value={formData.module ?? ""}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                    placeholder="Ex: Módulo 1 ou Banco de Dados"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Turno</label>
                  <select
                    value={formData.shift ?? ""}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="">Selecione</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Noturno">Noturno</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Ano</label>
                  <input
                    type="number"
                    value={formData.year ?? new Date().getFullYear()}
                    onChange={(e) =>
                      setFormData({ ...formData, year: Number(e.target.value) || new Date().getFullYear() })
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Semestre</label>
                  <input
                    value={formData.semester ?? ""}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                    placeholder="Ex: 1º"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Descrição</label>
                <textarea
                  rows={3}
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="Observações opcionais sobre a turma..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setErrorMsg(null);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold bg-emerald-500 text-slate-900 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                      Salvando...
                    </>
                  ) : editId ? (
                    "Atualizar Turma"
                  ) : (
                    "Salvar Turma"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

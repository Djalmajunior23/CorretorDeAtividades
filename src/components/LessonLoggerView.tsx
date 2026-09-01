import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Users,
  FileText,
  Plus,
  Trash2,
  Search,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Eye,
  X
} from "lucide-react";
import { apiUrl } from "../config/api";
import { toast } from "sonner";

interface LessonLog {
  id: string;
  theme: string;
  date: string;
  class_name: string;
  notes: string;
  created_at: string;
}

interface ClassItem {
  id: string;
  name: string;
}

export function LessonLoggerView() {
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("");

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [theme, setTheme] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [className, setClassName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Modal state
  const [viewingLog, setViewingLog] = useState<LessonLog | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const localSaved = localStorage.getItem("codecheck_lesson_logs");
      let localLogs = localSaved ? JSON.parse(localSaved) : [];

      const [logsRes, classesRes] = await Promise.all([
        fetch(apiUrl(`/api/lesson-logger${filterClass ? `?class_name=${encodeURIComponent(filterClass)}` : ""}`)),
        fetch(apiUrl("/api/classes"))
      ]);

      let combinedLogs = localLogs;
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const remoteLogs = Array.isArray(logsData) ? logsData : [];
        const map = new Map();
        for (const r of localLogs) map.set(r.id, r);
        for (const r of remoteLogs) map.set(r.id, r);
        combinedLogs = Array.from(map.values());
      }

      setLogs(combinedLogs);
      localStorage.setItem("codecheck_lesson_logs", JSON.stringify(combinedLogs));

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        const rows = Array.isArray(classesData) ? classesData : Array.isArray(classesData?.data) ? classesData.data : [];
        setClasses(rows);
        if (rows.length > 0 && !className) {
          setClassName(rows[0].name);
        }
      }
    } catch (err: any) {
      console.error("Error fetching lesson logs:", err);
      const localSaved = localStorage.getItem("codecheck_lesson_logs");
      if (localSaved) {
        try {
          setLogs(JSON.parse(localSaved));
        } catch (e) {}
      }
      toast.success("Histórico carregado do armazenamento local.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterClass]);

  const handleEditClick = (log: LessonLog) => {
    setEditingId(log.id);
    setTheme(log.theme);
    setDate(log.date || new Date().toISOString().split("T")[0]);
    setClassName(log.class_name);
    setNotes(log.notes || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTheme("");
    setNotes("");
    setDate(new Date().toISOString().split("T")[0]);
    if (classes.length > 0) {
      setClassName(classes[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim() || !className.trim()) {
      toast.error("Preencha o tema da aula e selecione a turma.");
      return;
    }

    setIsSubmitting(true);
    const recordId = editingId || crypto.randomUUID();
    const payload = {
      id: recordId,
      theme: theme.trim(),
      date,
      class_name: className,
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };

    // Save locally immediately
    const existingLocal = localStorage.getItem("codecheck_lesson_logs");
    const localArr = existingLocal ? JSON.parse(existingLocal) : [];
    if (editingId) {
      const idx = localArr.findIndex((p: any) => p.id === editingId);
      if (idx !== -1) {
        localArr[idx] = payload;
      } else {
        localArr.unshift(payload);
      }
    } else {
      localArr.unshift(payload);
    }
    localStorage.setItem("codecheck_lesson_logs", JSON.stringify(localArr));
    setLogs(prev => {
      if (editingId) {
        return prev.map(p => p.id === editingId ? payload : p);
      }
      return [payload, ...prev.filter(p => p.id !== recordId)];
    });

    try {
      const url = editingId ? apiUrl(`/api/lesson-logger/${editingId}`) : apiUrl("/api/lesson-logger");
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payload.id,
          theme: payload.theme,
          date: payload.date,
          class_name: payload.class_name,
          notes: payload.notes
        })
      });

      if (res.ok) {
        toast.success(editingId ? "Aula alterada e salva com sucesso!" : "Aula registrada e salva com sucesso!");
        handleCancelEdit();
        fetchData();
      } else {
        toast.success(editingId ? "Aula alterada e salva localmente!" : "Aula salva no armazenamento local com sucesso!");
        handleCancelEdit();
      }
    } catch (err: any) {
      toast.success(editingId ? "Aula alterada localmente com sucesso!" : "Aula salva com sucesso localmente!");
      handleCancelEdit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este registro de aula de forma definitiva?")) return;
    
    // Remove locally
    const existingLocal = localStorage.getItem("codecheck_lesson_logs");
    if (existingLocal) {
      try {
        const localArr = JSON.parse(existingLocal);
        const filtered = localArr.filter((l: any) => l.id !== id);
        localStorage.setItem("codecheck_lesson_logs", JSON.stringify(filtered));
      } catch (e) {}
    }
    setLogs(prev => prev.filter(l => l.id !== id));

    try {
      const res = await fetch(apiUrl(`/api/lesson-logger/${id}`), {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Registro de aula removido com sucesso.");
      } else {
        toast.success("Registro removido localmente.");
      }
    } catch (err: any) {
      toast.success("Registro removido localmente.");
    }
  };

  const filteredLogs = logs.filter(l => {
    const q = searchQuery.toLowerCase();
    return (
      (l.theme && l.theme.toLowerCase().includes(q)) ||
      (l.class_name && l.class_name.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-1">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">Módulo de Aulas & Registro</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registro, Edição e Histórico de Aulas</h1>
          <p className="text-xs text-gray-500 mt-1">
            Cadastre, edite, exclua e visualize o conteúdo de aulas ministradas. Sincronização automática entre banco de dados e armazenamento local.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Total Registrado: {logs.length} aulas
          </div>
        </div>
      </div>

      {/* Main Grid: Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              {editingId ? <Edit2 className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-teal-600" />}
              <h2 className="text-base font-bold text-gray-900">
                {editingId ? "Editar Registro de Aula" : "Nova Aula / Registro"}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-gray-500 hover:text-gray-800 font-bold underline"
              >
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Turma Vinculada *</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-teal-500"
                required
              >
                {classes.length === 0 ? (
                  <option value="Turma de Desenvolvimento Web 1A">Turma de Desenvolvimento Web 1A</option>
                ) : (
                  classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Data da Aula *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Tema da Aula *</label>
              <input
                type="text"
                placeholder="Ex: Introdução a Funções e Escopo em Python"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Conteúdo / Observações Detalhadas</label>
              <textarea
                rows={4}
                placeholder="Detalhes sobre o conteúdo abordado, dúvidas frequentes dos alunos ou materiais recomendados..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                editingId ? "bg-amber-600 hover:bg-amber-700" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isSubmitting ? "Salvando..." : editingId ? "Salvar Alterações da Aula" : "Salvar Registro de Aula"}
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar no histórico de aulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-teal-500"
              >
                <option value="">Todas as Turmas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-xs">Carregando registros de aulas...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center space-y-3 shadow-sm">
                <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-gray-700">Nenhum registro de aula encontrado.</p>
                <p className="text-xs text-gray-500">Utilize o formulário ao lado para cadastrar sua primeira aula na turma.</p>
              </div>
            ) : (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className={`bg-white p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                    editingId === log.id ? "border-amber-400 ring-2 ring-amber-100" : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-mono font-bold rounded-full uppercase">
                        {log.class_name}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        {log.date}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 tracking-tight">
                      {log.theme}
                    </h3>

                    {log.notes && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed line-clamp-2">
                        {log.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setViewingLog(log)}
                      className="px-3 py-2 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Visualizar conteúdo completo da aula salva"
                    >
                      <Eye className="w-3.5 h-3.5 text-teal-600" /> Visualizar
                    </button>
                    <button
                      onClick={() => handleEditClick(log)}
                      className="px-3 py-2 bg-gray-50 hover:bg-amber-500/10 border border-gray-200 hover:border-amber-300 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Alterar / Editar aula"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" /> Alterar
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200 cursor-pointer"
                      title="Excluir aula"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Visualizar Conteúdo Completo da Aula Salva */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Detalhes da Aula Salva</h3>
                  <span className="text-xs font-mono text-teal-700 font-semibold uppercase">{viewingLog.class_name}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingLog(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-1">Data da Aula</span>
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" /> {viewingLog.date}
                  </span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-1">ID do Registro</span>
                  <span className="text-xs font-mono font-bold text-gray-700 truncate block">
                    {viewingLog.id}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase text-gray-400 font-bold mb-1">Tema da Aula</h4>
                <p className="text-base font-bold text-gray-900 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  {viewingLog.theme}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase text-gray-400 font-bold mb-1">Conteúdo Ministrado & Observações</h4>
                <div className="text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200 leading-relaxed whitespace-pre-line min-h-[140px]">
                  {viewingLog.notes ? viewingLog.notes : "Nenhuma anotação adicional registrada para esta aula."}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  const logToEdit = viewingLog;
                  setViewingLog(null);
                  handleEditClick(logToEdit);
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" /> Alterar esta Aula
              </button>
              <button
                onClick={() => setViewingLog(null)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

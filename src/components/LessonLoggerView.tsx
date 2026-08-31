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
  AlertCircle
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
  const [theme, setTheme] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [className, setClassName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, classesRes] = await Promise.all([
        fetch(apiUrl(`/api/lesson-logger${filterClass ? `?class_name=${encodeURIComponent(filterClass)}` : ""}`)),
        fetch(apiUrl("/api/classes"))
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(Array.isArray(logsData) ? logsData : []);
      }

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
      toast.error("Erro ao carregar histórico de aulas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim() || !className.trim()) {
      toast.error("Preencha o tema da aula e selecione a turma.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/lesson-logger"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: theme.trim(),
          date,
          class_name: className,
          notes: notes.trim()
        })
      });

      if (res.ok) {
        toast.success("Aula registrada com sucesso na tabela do banco de dados!");
        setTheme("");
        setNotes("");
        setDate(new Date().toISOString().split("T")[0]);
        fetchData();
      } else {
        const errData = await res.json();
        toast.error("Erro ao salvar aula: " + (errData.error || "Erro desconhecido"));
      }
    } catch (err: any) {
      toast.error("Erro de conexão ao salvar aula: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este registro de aula?")) return;
    try {
      const res = await fetch(apiUrl(`/api/lesson-logger/${id}`), {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Registro de aula removido com sucesso.");
        setLogs(prev => prev.filter(l => l.id !== id));
      } else {
        toast.error("Falha ao excluir registro.");
      }
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const filteredLogs = logs.filter(l => {
    const q = searchQuery.toLowerCase();
    return (
      l.theme.toLowerCase().includes(q) ||
      l.class_name.toLowerCase().includes(q) ||
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registro e Histórico de Aulas</h1>
          <p className="text-xs text-gray-500 mt-1">
            Cadastre o tema, data, turma e observações. Os dados são salvos na tabela dedicada vinculada às turmas e exibidos no histórico organizado abaixo.
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
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Plus className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-gray-900">Nova Aula / Registro</h2>
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
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Observações / Anotações</label>
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
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Salvando no Banco..." : "Salvar Registro de Aula"}
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
                placeholder="Buscar no histórico..."
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
                  className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-teal-300 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                      <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed">
                        <strong>Observações:</strong> {log.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200"
                      title="Excluir Registro"
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
    </div>
  );
}

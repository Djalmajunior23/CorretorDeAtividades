import React, { useState, useEffect } from "react";
import { Users, Library, Activity, Settings, Plus, FileText, CheckCircle, Search, Edit2, Archive, Trash, MoreVertical, Download } from "lucide-react";
import { apiUrl, safeJsonResponse } from "../config/api";
import { ConsolidatedPdfReportModal } from "./ConsolidatedPdfReportModal";

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

export function ClassManagerView() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedClassForReport, setSelectedClassForReport] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState(emptyClassForm());
  const [editId, setEditId] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const resp = await fetch(apiUrl("/api/classes"));
      const data = await resp.json();
      const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setClasses(rows);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await fetch(apiUrl(`/api/classes/${editId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, status: "active" })
        });
      } else {
        await fetch(apiUrl("/api/classes"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      setEditId(null);
      setFormData(emptyClassForm());
      fetchClasses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar exclusão desta turma?")) return;
    try {
      await fetch(apiUrl(`/api/classes/${id}`), { method: "DELETE" });
      fetchClasses();
    } catch (e) {}
  };

  const handleArchive = async (id: string, currentData: any) => {
    try {
      await fetch(apiUrl(`/api/classes/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentData, status: "archived" })
      });
      fetchClasses();
    } catch (e) {}
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">Gestão de Turmas</h2>
          <p className="text-sm text-slate-400 mt-1">
            Organize suas turmas, alunos e exporte relatórios pedagógicos consolidados em PDF com análise de erros e recomendações coletivas.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => { setEditId(null); setFormData(emptyClassForm()); setShowModal(true); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Turma
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 flex flex-col gap-4">
        {loading ? (
          <div className="text-slate-400 text-center py-6 text-sm">Carregando turmas...</div>
        ) : classes.length === 0 ? (
          <div className="text-slate-500 text-center py-8 text-sm">Nenhuma turma cadastrada. Clique em "Nova Turma" para começar.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/30 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg">{cls.name}</h3>
                    <div className="relative group/menu">
                      <button className="text-slate-500 hover:text-white p-1 rounded">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                        <button onClick={() => { setEditId(cls.id); setFormData(normalizeClassForm(cls)); setShowModal(true); }} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 cursor-pointer">
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        <button onClick={() => { setSelectedClassForReport(cls.name); setShowPdfModal(true); }} className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-slate-700 flex items-center gap-2 cursor-pointer">
                          <FileText className="w-3 h-3" /> Relatório PDF
                        </button>
                        <button onClick={() => handleArchive(cls.id, cls)} className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-slate-700 flex items-center gap-2 cursor-pointer">
                          <Archive className="w-3 h-3" /> Arquivar
                        </button>
                        <button onClick={() => handleDelete(cls.id)} className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-700 flex items-center gap-2 cursor-pointer">
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
                      <strong className="text-slate-300">{cls.year} - {cls.semester}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${cls.status === 'archived' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {cls.status === 'archived' ? 'Arquivada' : 'Ativa'}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedClassForReport(cls.name);
                      setShowPdfModal(true);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Relatório PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPdfModal && (
        <ConsolidatedPdfReportModal
          onClose={() => setShowPdfModal(false)}
          defaultClassName={selectedClassForReport}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl w-full max-w-lg border border-slate-800 shadow-2xl p-6 flex flex-col gap-5">
            <h3 className="text-xl font-bold text-white">{editId ? "Editar Turma" : "Nova Turma"}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Nome da Turma</label>
                <input required value={formData.name ?? ""} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" placeholder="Ex: Informática T1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Curso</label>
                  <input value={formData.course ?? ""} onChange={e => setFormData({...formData, course: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Módulo</label>
                  <input value={formData.module ?? ""} onChange={e => setFormData({...formData, module: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Turno</label>
                  <select value={formData.shift ?? ""} onChange={e => setFormData({...formData, shift: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white">
                    <option value="">Selecione</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Noturno">Noturno</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Ano</label>
                  <input type="number" value={formData.year ?? new Date().getFullYear()} onChange={e => setFormData({...formData, year: Number(e.target.value) || new Date().getFullYear()})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Semestre</label>
                  <input value={formData.semester ?? ""} onChange={e => setFormData({...formData, semester: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" placeholder="Ex: 1º" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Descrição</label>
                <textarea rows={3} value={formData.description ?? ""} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-sm font-bold bg-emerald-500 text-slate-900 rounded-lg hover:bg-emerald-600">Salvar Turma</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

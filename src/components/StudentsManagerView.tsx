import React, { useState, useEffect } from "react";
import { Users, Upload, FileText, Download, Plus, MoreVertical, Edit2, Archive, Trash } from "lucide-react";

export function StudentsManagerView() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [formData, setFormData] = useState({ class_id: "", name: "", enrollment_code: "", email: "", notes: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importClass, setImportClass] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clsResp, stdResp] = await Promise.all([
        fetch("/api/classes"),
        fetch(`/api/students${selectedClass ? `?class_id=${selectedClass}` : ''}`)
      ]);
      setClasses(await clsResp.json() || []);
      setStudents(await stdResp.json() || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await fetch(`/api/students/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, status: "active" }) });
      } else {
        await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      }
      setShowModal(false); setEditId(null);
      setFormData({ class_id: "", name: "", enrollment_code: "", email: "", notes: "" });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleImport = async () => {
    if (!importClass || !importText) return alert("Preencha turma e CSV.");
    try {
      const res = await fetch("/api/students/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: importClass, csv_data: importText })
      });
      const data = await res.json();
      alert(`${data.imported || 0} alunos importados com sucesso!`);
      setShowImport(false);
      setImportText("");
      fetchData();
    } catch (e) { alert("Erro na importação."); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar exclusão deste aluno?")) return;
    try { await fetch(`/api/students/${id}`, { method: "DELETE" }); fetchData(); } catch (e) {}
  };

  const handleArchive = async (id: string, currentData: any) => {
    try { await fetch(`/api/students/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...currentData, status: "archived" }) }); fetchData(); } catch (e) {}
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">Gestão de Alunos</h2>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre alunos, importe listas via automação CSV e acompanhe o histórico.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-xl flex items-center gap-2 transition-all">
            <Upload className="w-4 h-4" /> Importar CSV
          </button>
          <button onClick={() => { setEditId(null); setShowModal(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4" /> Novo Aluno
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-800/60">
          <label className="text-sm text-slate-400">Filtrar por Turma:</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white w-64">
            <option value="">Todas as Turmas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-slate-400 text-center py-6 text-sm">Carregando alunos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-medium">
                  <th className="pb-3 pt-2 px-4">Nome</th>
                  <th className="pb-3 pt-2 px-4">Matrícula</th>
                  <th className="pb-3 pt-2 px-4">Turma</th>
                  <th className="pb-3 pt-2 px-4">E-mail</th>
                  <th className="pb-3 pt-2 px-4">Status</th>
                  <th className="pb-3 pt-2 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    <td className="py-3 px-4 font-medium text-white">{s.name}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">{s.enrollment_code || "-"}</td>
                    <td className="py-3 px-4 text-slate-400">{s.class_name || "Sem turma"}</td>
                    <td className="py-3 px-4 text-slate-400">{s.email || "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${s.status === 'archived' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {s.status === 'archived' ? 'Arquivado' : 'Ativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => { setEditId(s.id); setFormData({ ...s }); setShowModal(true); }} className="text-emerald-400/70 hover:text-emerald-400 p-1 mr-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleArchive(s.id, s)} className="text-amber-400/70 hover:text-amber-400 p-1 mr-1">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-rose-400/70 hover:text-rose-400 p-1">
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">Nenhum aluno encontrado para este filtro.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showImport && (
        <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl w-full max-w-xl border border-slate-800 shadow-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-white">Importação Massiva (CSV)</h3>
            <p className="text-xs text-slate-400">Insira os dados separados por vírgula no padrão: <code>nome,matricula,email</code></p>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Turma Destino</label>
              <select value={importClass} onChange={e => setImportClass(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white">
                <option value="">Selecione a turma...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <textarea 
              rows={8} 
              className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-300"
              placeholder="nome,matricula,email\nJoão Silva,2025001,joao@email.com\nMaria Souza,2025002,maria@email.com"
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            
            <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-800">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white">Cancelar</button>
              <button onClick={handleImport} className="px-5 py-2 text-sm font-bold bg-emerald-500 text-slate-900 rounded-lg hover:bg-emerald-600">Importar Dados</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl w-full max-w-lg border border-slate-800 shadow-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-white">{editId ? 'Editar Aluno' : 'Cadastrar Aluno'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Nome Completo</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Turma</label>
                <select value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white">
                  <option value="">Selecione...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Matrícula</label>
                  <input value={formData.enrollment_code} onChange={e => setFormData({...formData, enrollment_code: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">E-mail</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Observações Pedagógicas</label>
                <textarea rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

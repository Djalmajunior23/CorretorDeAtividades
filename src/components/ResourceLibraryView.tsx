import React, { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  Search,
  Upload,
  Star,
  Trash2,
  Download,
  MoreVertical,
  Plus,
  RefreshCw,
  Library,
  Tag,
  Clock,
  Filter,
  Copy,
  Archive,
  X,
  PlusCircle,
  FileCode,
  CheckCircle2,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ResourceLibraryItem } from "../types";

export default function ResourceLibraryView() {
  const [resources, setResources] = useState<ResourceLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedResourceType, setSelectedResourceType] = useState("");

  // Modals for Create and Edit
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceLibraryItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("atividade");
  const [formTopic, setFormTopic] = useState("Lógica de Programação");
  const [formLanguage, setFormLanguage] = useState("javascript");
  const [formTags, setFormTags] = useState("");
  const [formContent, setFormContent] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeFilter, selectedResourceType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/library?`;
      if (selectedResourceType) {
        url += `type=${selectedResourceType}&`;
      }
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch (e) {
      toast.error("Erro ao carregar recursos da biblioteca.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Por favor, preencha o título do recurso");
      return;
    }

    try {
      const payload = {
        title: formTitle,
        description: formDescription,
        type: formType,
        topic: formTopic,
        language: formLanguage,
        tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
        content: formContent,
        is_favorite: false
      };

      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Recurso adicionado à biblioteca com sucesso.");
        setIsCreateOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error("Erro ao salvar recurso.");
      }
    } catch {
      toast.error("Erro ao salvar recurso.");
    }
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const payload = {
        title: formTitle,
        description: formDescription,
        type: formType,
        topic: formTopic,
        language: formLanguage,
        tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
        content: formContent,
        is_favorite: editingItem.is_favorite,
        status: editingItem.status
      };

      const res = await fetch(`/api/library/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Recurso atualizado com sucesso.");
        setIsEditOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error("Erro ao atualizar recurso.");
      }
    } catch {
      toast.error("Erro ao atualizar recurso.");
    }
  };

  const handleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/library/${id}/favorite`, { method: "POST" });
      if (res.ok) {
        toast.success("Favoritado atualizado");
        fetchData();
      }
    } catch {
      toast.error("Erro ao gerenciar favorito.");
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/library/${id}/archive`, { method: "POST" });
      if (res.ok) {
        toast.success("Recurso arquivado na biblioteca");
        fetchData();
      }
    } catch {
      toast.error("Erro ao arquivar recurso.");
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/library/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        toast.success("Recurso duplicado com sucesso!");
        fetchData();
      }
    } catch {
      toast.error("Erro ao duplicar recurso.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja remover este recurso? (Soft Delete)")) return;
    try {
      const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Recurso removido com sucesso.");
        fetchData();
      }
    } catch {
      toast.error("Erro ao excluir recurso.");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (item: ResourceLibraryItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormType(item.type);
    setFormTopic(item.topic || "");
    setFormLanguage(item.language || "javascript");
    setFormTags(item.tags ? item.tags.join(", ") : "");
    setFormContent(item.content || "");
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormType("atividade");
    setFormTopic("Lógica de Programação");
    setFormLanguage("javascript");
    setFormTags("");
    setFormContent("");
    setEditingItem(null);
  };

  const filteredResources = resources.filter((r) => {
    if (activeFilter === "favorites" && !r.is_favorite) return false;
    if (activeFilter === "archived" && r.status !== "archived") return false;
    if (activeFilter !== "archived" && r.status === "archived") return false;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
            Módulo Bibliotecário Nacional
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Library className="w-8 h-8 text-emerald-400" />
            Biblioteca do Professor
          </h1>
          <p className="text-slate-400 mt-2">
            Crie, edite, organize, reescreva e aplique materiais estrutruados de forma centralizada.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-lg cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Novo Recurso
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left pane filters */}
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">
                Filtro de Texto
              </label>
              <div className="relative mt-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar título..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">
                Visualização
              </label>
              <div className="mt-1.5 space-y-1.5">
                <button
                  onClick={() => { setActiveFilter("all"); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all ${activeFilter === "all" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:bg-white/5 border border-transparent"}`}
                >
                  Ativos Universais
                </button>
                <button
                  onClick={() => { setActiveFilter("favorites"); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-between ${activeFilter === "favorites" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:bg-white/5 border border-transparent"}`}
                >
                  <span className="flex items-center gap-2">
                    <Star className={`w-3.5 h-3.5 ${activeFilter === "favorites" ? "fill-amber-400" : ""}`} /> 
                    Favoritos Reutilizáveis
                  </span>
                </button>
                <button
                  onClick={() => { setActiveFilter("archived"); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-between ${activeFilter === "archived" ? "bg-slate-800 text-slate-300 border border-slate-750" : "text-slate-400 hover:bg-white/5 border border-transparent"}`}
                >
                  <span className="flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5" /> 
                    Recursos Arquivados
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">
                Tipologia de Arquivo
              </label>
              <select
                value={selectedResourceType}
                onChange={(e) => { setSelectedResourceType(e.target.value); }}
                className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:border-emerald-500 outline-none"
              >
                <option value="">-- Todos os Tipos --</option>
                <option value="atividade">Atividades Práticas</option>
                <option value="rubrica">Rubricas de Avaliação</option>
                <option value="questao">Questões e Gapes</option>
                <option value="feedback">Feedbacks Pré-estruturados</option>
                <option value="relatório">Relatórios e Pareceres</option>
                <option value="material">Materiais de Aula (Slides/Documentação)</option>
                <option value="simulado">Simulados Curriculares / SAEP</option>
                <option value="arquivo">Arquivos de Apoio / Código</option>
              </select>
            </div>

            <button
              onClick={fetchData}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-300 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Filtrar e Atualizar
            </button>
          </div>
        </div>

        {/* Resources Cards list */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Buscando repositórios pedagógicos...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-[#0f172a]/20">
              <Library className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-300 font-bold">Nenhum recurso encontrado na biblioteca</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Adicione materiais estruturados clicando no botão de Novo Recurso para reutilizá-los a qualquer momento durante feedbacks ou novos exames.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-mono font-bold rounded-lg hover:text-emerald-400 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Criar Primeiro Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredResources.map((r) => (
                <div
                  key={r.id}
                  onClick={() => openEditModal(r)}
                  className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 hover:bg-slate-900/60 hover:border-slate-700 transition-all cursor-pointer group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleFavorite(r.id, e)}
                        title="Favoritar"
                        className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg transition-all"
                      >
                        <Star className={`w-4 h-4 ${r.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(r.id, e)}
                        title="Duplicar"
                        className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {r.status !== 'archived' && (
                        <button
                          onClick={(e) => handleArchive(r.id, e)}
                          title="Arquivar"
                          className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-all"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(r.id, e)}
                        title="Excluir"
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-200 group-hover:text-white transition-all text-sm leading-snug line-clamp-2">
                    {r.title}
                  </h3>
                  
                  {r.description && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-900 flex flex-wrap gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded-md border border-emerald-500/10 uppercase tracking-wider">
                      {r.type}
                    </span>
                    {r.language && (
                      <span className="text-[9px] font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 uppercase">
                        {r.language}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-3 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="max-w-[120px] truncate text-slate-500 font-bold uppercase">
                      {r.topic || "Geral"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE RESOURCE */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider text-emerald-400">
                  Adicionar Item à Biblioteca
                </h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white transition-all cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateResource} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Título do Material <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ex: Rubrica Completa de JavaScript"
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Tipologia de Conteúdo
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:border-emerald-500 outline-none"
                    >
                      <option value="atividade">Atividade Prática</option>
                      <option value="rubrica">Rubrica de Avaliação</option>
                      <option value="questao">Questão / Exercício</option>
                      <option value="feedback">Feedback Pré-estruturado</option>
                      <option value="relatório">Relatórios e Pareceres</option>
                      <option value="material">Material Pedagogico / Slides</option>
                      <option value="simulado">Simulados Técnicos</option>
                      <option value="arquivo">Arquivos de Apoio / Código</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Grande Tema Pedagógico / Tópico
                    </label>
                    <input
                      type="text"
                      value={formTopic}
                      onChange={(e) => setFormTopic(e.target.value)}
                      placeholder="Ex: Estruturas de Dados"
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Linguagem Tecnológica
                    </label>
                    <select
                      value={formLanguage}
                      onChange={(e) => setFormLanguage(e.target.value)}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:border-emerald-500 outline-none"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="sql">Structured Query Language (SQL)</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="html">HTML / CSS</option>
                      <option value="generic">Nenhum / Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Tags (Separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="teoria, recursão, iniciante"
                    className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:border-emerald-500 outline-none placeholder:text-slate-750"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block font-bold">
                    Resumo ou Descrição Rápida
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    placeholder="Uma descrição simples sobre o objetivo pedagógico do recurso..."
                    className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Conteúdo Estruturado / Corpo de Código / Texto Principal
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={5}
                    placeholder="Insira aqui o código, enunciado teórico ou rubrica detalhada..."
                    className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 bg-slate-900 border border-slate-850 text-slate-300 hover:bg-slate-800 transition-all font-mono font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Salvar Recurso
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT RESOURCE */}
      <AnimatePresence>
        {isEditOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider text-emerald-400">
                  Editar Recurso da Biblioteca
                </h2>
                <button onClick={() => { setIsEditOpen(false); resetForm(); }} className="text-slate-400 hover:text-white transition-all cursor-pointer border-none bg-transparent">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateResource} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Título do Material <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block font-bold">
                      Tipologia de Conteúdo
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:border-emerald-500 outline-none"
                    >
                      <option value="atividade">Atividade Prática</option>
                      <option value="rubrica">Rubrica de Avaliação</option>
                      <option value="questao">Questão / Exercício</option>
                      <option value="feedback">Feedback Pré-estruturado</option>
                      <option value="relatório">Relatórios e Pareceres</option>
                      <option value="material">Material Pedagogico / Slides</option>
                      <option value="simulado">Simulados Técnicos</option>
                      <option value="arquivo">Arquivos de Apoio / Código</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Grande Tema Pedagógico / Tópico
                    </label>
                    <input
                      type="text"
                      value={formTopic}
                      onChange={(e) => setFormTopic(e.target.value)}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block block">
                      Linguagem Tecnológica
                    </label>
                    <select
                      value={formLanguage}
                      onChange={(e) => setFormLanguage(e.target.value)}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:border-emerald-500 outline-none"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="sql">Structured Query Language (SQL)</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="html">HTML / CSS</option>
                      <option value="generic">Nenhum / Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Tags (Separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block block">
                    Resumo ou Descrição Rápida
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Conteúdo Estruturado / Corpo de Código / Texto Principal
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={5}
                    className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setIsEditOpen(false); resetForm(); }}
                    className="px-4 py-2 bg-slate-900 border border-slate-850 text-slate-300 hover:bg-slate-800 transition-all font-mono font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Salvar Modificações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

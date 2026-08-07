import React, { useState, useEffect } from "react";
import DeadlineRemindersView from "./DeadlineRemindersView";
import {
  Copy,
  Archive,
  BookOpen,
  Search,
  Flag,
  Plus,
  Loader2,
  ListTree,
  Sparkles,
} from "lucide-react";

import { getApiUrl } from "../utils/api";
import { apiUrl, safeJsonResponse } from "../config/api";

export default function ActivityBankView({ featureFlags = {} }: any) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "python",
    rubric: "",
    class_id: "",
    deadline: "",
    competence: "",
    attachment_filename: ""
  });

  // Filters
  const [filterLang, setFilterLang] = useState("");
  const [filterDiff, setFilterDiff] = useState("");

  const loadBank = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/activities"));
      if (res.ok) {
        const data = await res.json();
        setActivities(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await fetch(apiUrl("/api/classes"));
      if (res.ok) {
        const data = await res.json();
        setClasses(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBank();
    loadClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch(apiUrl("/api/activities"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (resp.ok) {
        setShowModal(false);
        setFormData({
          title: "",
          description: "",
          language: "python",
          rubric: "",
          class_id: "",
          deadline: "",
          competence: "",
          attachment_filename: ""
        });
        loadBank();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredActs = activities.filter((a) => {
    if (filterLang && a.language !== filterLang) return false;
    const diff = a.level || a.difficulty;
    if (filterDiff && diff !== filterDiff) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">
            Banco de Questões Inteligente
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Repositório de atividades reutilizáveis avaliadas por competências
            (Fase 04).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {featureFlags.ENABLE_AI_QUESTION_SUGGESTIONS && (
            <button className="px-3 py-2 bg-[#1e293b]/50 hover:bg-[#1e293b] text-sky-400 shadow shadow-sky-500/10 font-mono text-xs rounded-xl flex items-center gap-2 border border-sky-500/30">
              <Sparkles className="w-4 h-4" />
              Sugestões IA
            </button>
          )}
          {featureFlags.ENABLE_LEARNING_PATHS && (
            <button className="px-3 py-2 bg-[#1e293b]/50 hover:bg-[#1e293b] text-emerald-400 shadow shadow-emerald-500/10 font-mono text-xs rounded-xl flex items-center gap-2 border border-emerald-500/30">
              <ListTree className="w-4 h-4" />
              Trilhas
            </button>
          )}
          <button
            onClick={loadBank}
            className="px-4 py-2 bg-[#1e293b] hover:bg-slate-700 text-white font-mono text-xs rounded-xl flex items-center gap-2 border border-slate-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Recarregar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            Nova Atividade
          </button>
        </div>
      </div>
      
      <DeadlineRemindersView activities={activities} />

      <div className="flex gap-4 p-4 rounded-xl border border-[#1e295b]/30 bg-[#0f172a]">
        <div className="flex flex-col flex-1 gap-1">
          <label className="text-xs uppercase font-mono text-slate-500">
            Linguagem
          </label>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">Todas</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="c">C/C++</option>
          </select>
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <label className="text-xs uppercase font-mono text-slate-500">
            Nível / Dificuldade
          </label>
          <select
            value={filterDiff}
            onChange={(e) => setFilterDiff(e.target.value)}
            className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">Todas</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!loading && filteredActs.length === 0 ? (
          <div className="p-12 text-center bg-[#0f172a] rounded-2xl border border-dashed border-[#1e295b]/50 flex flex-col items-center">
            <BookOpen className="w-10 h-10 text-slate-600 mb-3" />
            <span className="text-sm font-mono text-slate-400">
              Nenhuma atividade encontrada ou banco vazio.
            </span>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-emerald-500/20"
            >
              <Plus className="w-3 h-3" /> Nova Atividade Manual
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActs.map((act) => (
              <div
                key={act.id}
                className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col gap-3 group relative overflow-hidden transition-all hover:border-emerald-500/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-white line-clamp-2">
                    {act.title}
                  </h3>
                  <div
                    className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wide shrink-0 ${act.status === "active" || act.status === "published" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/20 text-amber-400 border border-amber-500/20"}`}
                  >
                    {act.status === "active" || act.status === "published" ? "PUBLICADA" : "RASCUNHO"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                  {act.theme && (
                    <span className="bg-[#030712] px-2 py-1 rounded text-slate-300">
                      Tema: <span className="text-sky-400">{act.theme}</span>
                    </span>
                  )}
                  {act.language && (
                    <span className="bg-[#030712] px-2 py-1 rounded text-slate-300">
                      Lang:{" "}
                      <span className="text-rose-400 uppercase font-bold">
                        {act.language}
                      </span>
                    </span>
                  )}
                  {(act.level || act.difficulty) && (
                    <span className="bg-[#030712] px-2 py-1 rounded text-slate-300">
                      Nível:{" "}
                      <span className="text-amber-400">
                        {act.level || act.difficulty}
                      </span>
                    </span>
                  )}
                </div>

                {/* Relational details for Class, Deadline, and Attachment Zone */}
                {(act.class_name || act.deadline || act.attachment_filename) && (
                  <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-[#030712]/50 border border-slate-800/80 text-[10px]">
                    {act.class_name && (
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Turma:</span>
                        <span className="text-emerald-400 font-bold">{act.class_name}</span>
                      </div>
                    )}
                    {act.deadline && (
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Prazo / Entrega:</span>
                        <span className="text-sky-400 font-mono font-bold">
                          {act.deadline.includes("-") ? act.deadline.split("-").reverse().join("/") : act.deadline}
                        </span>
                      </div>
                    )}
                    {act.attachment_filename && (
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Anexo:</span>
                        <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded text-[9px] truncate max-w-[124px]" title={act.attachment_filename}>
                          {act.attachment_filename}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(act.competence || act.problem_description) && (
                  <div className="text-[11px] text-slate-400 bg-[#030712]/50 p-2.5 rounded-lg border border-[#1e295b]/20 flex flex-col gap-1">
                    <span className="text-slate-500 block uppercase font-mono text-[9px] tracking-wider">
                      Descrição / Objetivos / Competências
                    </span>
                    <p className="line-clamp-3 text-slate-300 text-xs">
                      {act.problem_description || act.competence || "Sem objetivos adicionais."}
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-[#1e295b]/30 flex items-center justify-end gap-2">
                  <button
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                    title="Arquivar"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl w-full max-w-2xl border border-slate-800 shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h3 className="text-xl font-bold text-white">Criar Nova Atividade</h3>
            <p className="text-xs text-slate-400">
              Cadastre atividades vinculando linguagens, objetivos de competência, prazos de entrega e turmas específicas.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Título da Atividade</label>
                  <input 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" 
                    placeholder="Ex: Exercício prático de Loops"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Linguagem de Programação</label>
                  <select 
                    value={formData.language} 
                    onChange={e => setFormData({...formData, language: e.target.value})} 
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="c">C/C++</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Vincular a uma Turma</label>
                  <select 
                    required
                    value={formData.class_id} 
                    onChange={e => setFormData({...formData, class_id: e.target.value})} 
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="">Selecione a turma...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Prazo / Data de Entrega</label>
                  <input 
                    type="date"
                    required
                    value={formData.deadline} 
                    onChange={e => setFormData({...formData, deadline: e.target.value})} 
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Descrição / Enunciado do Exercício</label>
                <textarea 
                  required
                  rows={3} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" 
                  placeholder="Escreva as instruções, requisitos de entrada e de saída detalhadamente..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Critério de Avaliação / Rubrica Pedagógica</label>
                <textarea 
                  required
                  rows={2} 
                  value={formData.rubric} 
                  onChange={e => setFormData({...formData, rubric: e.target.value})} 
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" 
                  placeholder="Critérios: Código roda perfeitamente (40%), Atende requisitos (40%), Estilo (20%)..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Mapeamento de Competência / Objetivos</label>
                  <input 
                    value={formData.competence} 
                    onChange={e => setFormData({...formData, competence: e.target.value})} 
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" 
                    placeholder="Ex: Raciocínio Lógico-Matemático, Algoritmos"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Anexar Arquivo de Apoio</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-700 rounded-lg cursor-pointer bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm transition-all w-full">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span className="truncate">{formData.attachment_filename || "Selecionar arquivo (PDF, ZIP, PNG)..."}</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({ ...formData, attachment_filename: file.name });
                          }
                        }}
                      />
                    </label>
                    {formData.attachment_filename && (
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, attachment_filename: ""})} 
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 text-sm font-bold bg-emerald-500 text-slate-900 rounded-lg hover:bg-emerald-600 transition-all font-display"
                >
                  Salvar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

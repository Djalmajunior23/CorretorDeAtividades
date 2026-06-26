import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  ChevronRight,
  FileText,
  Download,
  Trash2,
  Archive,
  RefreshCw,
  LayoutGrid,
  Zap,
  BrainCircuit,
  ClipboardList,
  Target,
  FlaskConical,
  Database,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Languages,
  Layers,
  Check,
  Eye,
  History,
  Settings,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { EducationalTemplate, GeneratedMaterial } from "../types";
import { apiUrl, safeJsonResponse } from "../config/api";

const TEMPLATE_TYPES = [
  { id: "exercise_list", label: "Lista de Exercícios" },
  { id: "practical_activity", label: "Atividade Prática" },
  { id: "lab_script", label: "Roteiro de Laboratório" },
  { id: "lesson_plan", label: "Plano de Aula" },
  { id: "reinforcement_plan", label: "Plano de Reforço" },
  { id: "recovery_plan", label: "Plano de Recuperação" },
  { id: "mock_exam", label: "Simulado" },
  { id: "revision_guide", label: "Guia de Revisão" },
];

const TOPICS = [
  "Lógica de Programação",
  "Algoritmos",
  "Portugol",
  "Python",
  "Java",
  "JavaScript",
  "HTML/CSS",
  "Banco de Dados",
  "SQL",
  "POO",
];

export default function MateriaisDidaticosView() {
  const [templates, setTemplates] = useState<EducationalTemplate[]>([]);
  const [materials, setMaterials] = useState<GeneratedMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"materials" | "generator">(
    "materials",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EducationalTemplate | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<GeneratedMaterial | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    template_type: "exercise_list",
    topic: "Lógica de Programação",
    difficulty: "iniciante",
    target_audience: "Ensino Técnico",
    quantity: 10,
    include_answer_key: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, mRes] = await Promise.all([
        fetch(apiUrl("/api/educational-templates")),
        fetch(apiUrl("/api/materials")),
      ]);
      setTemplates(await tRes.json());
      setMaterials(await mRes.json());
    } catch (e) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const generateMaterial = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(apiUrl("/api/materials/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Material gerado com sucesso!");
        setActiveTab("materials");
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      toast.error("Erro ao gerar material.");
    } finally {
      setIsGenerating(false);
    }
  };

  const approveMaterial = async (id: string) => {
    try {
      await fetch(apiUrl(`/api/materials/${id}/approve`), { method: "POST" });
      toast.success("Material aprovado.");
      fetchData();
    } catch (e) {
      toast.error("Erro ao aprovar.");
    }
  };

  const exportPDF = (id: string) => {
    window.open(apiUrl(`/api/materials/${id}/export/pdf`), "_blank");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-950 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-500" />
            Materiais Didáticos
          </h1>
          <p className="text-slate-400 mt-2">
            Criação e gestão de conteúdos educacionais com IA
          </p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "materials"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Meus Materiais
          </button>
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "generator"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Gerador IA
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {activeTab === "materials" ? (
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-slate-500">Buscando materiais...</p>
                </div>
              ) : materials.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-slate-900/20">
                  <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500">
                    Você ainda não gerou nenhum material didático.
                  </p>
                  <button
                    onClick={() => setActiveTab("generator")}
                    className="mt-4 text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-2 mx-auto"
                  >
                    Começar a gerar <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                materials.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 hover:bg-slate-900/60 transition-all border-t-4 border-t-indigo-500 flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">
                        {m.type.replace("_", " ")}
                      </span>
                      <div className="flex gap-1">
                        {m.status === "draft" && (
                          <button
                            onClick={() => approveMaterial(m.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-all"
                            title="Aprovar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => exportPDF(m.id)}
                          className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded transition-all"
                          title="Exportar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-6 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Criado em {new Date(m.created_at).toLocaleDateString()}
                    </p>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${m.status === "approved" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"}`}
                        ></span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                          {m.status}
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedMaterial(m)}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
                      >
                        Ver Material{" "}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-600/20 rounded-xl">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Configurar IA
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Tipo de Material
                    </label>
                    <select
                      value={formData.template_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          template_type: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm"
                    >
                      {TEMPLATE_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Tópico / Conteúdo
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) =>
                        setFormData({ ...formData, topic: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm"
                    >
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Dificuldade
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            difficulty: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm"
                      >
                        <option value="iniciante">Iniciante</option>
                        <option value="intermediário">Intermediário</option>
                        <option value="avançado">Avançado</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantity: parseInt(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={generateMaterial}
                      disabled={isGenerating}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Gerando conteúdo estruturado...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Gerar com Inteligência Artificial
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-900/30 border border-white/5 rounded-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-200">Personalização</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    A IA utiliza as diretrizes do template para estruturar
                    tópicos teóricos, exemplos de código e questões práticas
                    baseadas no seu público-alvo.
                  </p>
                </div>
                <div className="p-6 bg-slate-900/30 border border-white/5 rounded-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Download className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-slate-200">
                      Pronto para Uso
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Todo material gerado entra em modo rascunho para que você
                    possa revisar antes de exportar em PDF para seus alunos.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-indigo-500/10 rounded-3xl p-8 border-dashed">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 px-1">
                  Templates Recomendados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {templates
                    .filter((t) => t.is_system_template)
                    .slice(0, 4)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <FileCode className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white line-clamp-1">
                              {t.title}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {t.type}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-6 w-full max-w-3xl my-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{selectedMaterial.title}</h2>
                <div className="flex gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">
                    {selectedMaterial.type.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-800 text-slate-300 rounded-full">
                    {selectedMaterial.topic}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="text-slate-400 hover:text-white"
              >
                <Trash2 className="w-5 h-5 hidden" /> {/* Dummy space if needed */}
                ✕
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedMaterial.content?.content && (
                <div>
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Conteúdo</h3>
                  <div className="text-slate-300 text-sm whitespace-pre-wrap">{selectedMaterial.content.content}</div>
                </div>
              )}
              
              {selectedMaterial.content?.objectives && selectedMaterial.content.objectives.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Objetivos</h3>
                  <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1">
                    {selectedMaterial.content.objectives.map((obj: string, i: number) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedMaterial.content?.activities && selectedMaterial.content.activities.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Atividades</h3>
                  <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1">
                    {selectedMaterial.content.activities.map((act: string, i: number) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedMaterial.content?.questions && selectedMaterial.content.questions.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Questões</h3>
                  <div className="space-y-4">
                    {selectedMaterial.content.questions.map((q: any, i: number) => (
                      <div key={i} className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                        <p className="text-sm font-medium text-white mb-2">{i + 1}. {q.text || q.statement}</p>
                        {q.options && (
                          <ul className="list-[lower-alpha] pl-5 text-slate-400 text-sm mt-2">
                            {q.options.map((opt: string, j: number) => (
                              <li key={j} className={opt === q.correct || String.fromCharCode(65+j) === q.correct ? "text-emerald-400 font-medium" : ""}>{opt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMaterial.content?.answer_key && (
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Gabarito</h3>
                  <div className="text-slate-300 text-sm whitespace-pre-wrap">
                    {Array.isArray(selectedMaterial.content.answer_key) 
                      ? selectedMaterial.content.answer_key.join('\n')
                      : selectedMaterial.content.answer_key}
                  </div>
                </div>
              )}

              {selectedMaterial.content?.teacher_notes && (
                <div>
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Observações para o Professor</h3>
                  <div className="text-slate-300 text-sm whitespace-pre-wrap bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">{selectedMaterial.content.teacher_notes}</div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedMaterial(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm font-medium transition-all"
              >
                Fechar
              </button>
              <button
                onClick={() => exportPDF(selectedMaterial.id)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Sparkles,
  Filter,
  Eye,
  Terminal,
  Code2,
  ChevronRight,
  BrainCircuit,
  Archive,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  GraduationCap,
  History,
  FileCode,
  Play,
  Upload,
  Settings,
  MoreVertical,
  Download,
  Trash2,
  RefreshCw,
  LayoutGrid,
  Zap,
  ShieldCheck,
  Table as TableIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface SmartLab {
  id: string;
  title: string;
  description: string;
  topic: string;
  language: string;
  difficulty: string;
  class_name: string;
  statement: string;
  rubric: any;
  test_cases: any;
  status: string;
  created_at: string;
}

interface Template {
  id: string;
  title: string;
  category: string;
  language: string;
  topic: string;
  difficulty: string;
  statement: string;
  default_rubric: any;
}

export default function SmartLabsView() {
  const [labs, setLabs] = useState<SmartLab[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "labs" | "templates" | "submissions" | "settings" | "history"
  >("labs");
  const [selectedLab, setSelectedLab] = useState<SmartLab | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentClass, setCurrentClass] = useState("Turma A - Engenharia");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [labsRes, tempsRes] = await Promise.all([
        fetch("/api/smart-labs"),
        fetch("/api/smart-labs/templates"),
      ]);
      setLabs(await labsRes.json());
      setTemplates(await tempsRes.json());
    } catch (e) {
      toast.error("Erro ao carregar dados dos laboratórios.");
    } finally {
      setLoading(false);
    }
  };

  const createLabFromTemplate = async (template: Template) => {
    try {
      const res = await fetch("/api/smart-labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.title,
          description: `Novo laboratório baseado em: ${template.title}`,
          topic: template.topic,
          language: template.language,
          difficulty: template.difficulty,
          class_name: currentClass,
          statement: template.statement,
          rubric: template.default_rubric,
          test_cases: [],
          learning_objectives: [],
        }),
      });
      if (res.ok) {
        toast.success("Laboratório criado a partir do template!");
        fetchData();
        setActiveTab("labs");
      }
    } catch (e) {
      toast.error("Erro ao criar laboratório.");
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-display flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-indigo-400" />
            Laboratórios Inteligentes
          </h2>
          <p className="text-slate-400 mt-1">
            Ambiente seguro para experimentação, correção e feedback
            automatizado.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all border border-slate-700/50"
          >
            <Settings className="w-4 h-4" /> Configurações de Turma
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/20 text-sm"
          >
            <Plus className="w-4 h-4" /> Novo Laboratório
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800">
        <TabButton
          active={activeTab === "labs"}
          onClick={() => setActiveTab("labs")}
          label="Meus Labs"
          icon={FlaskConical}
        />
        <TabButton
          active={activeTab === "templates"}
          onClick={() => setActiveTab("templates")}
          label="Templates Prontos"
          icon={LayoutGrid}
        />
        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          label="Histórico de Submissões"
          icon={History}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9">
          {activeTab === "labs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {labs.map((lab) => (
                <LabCard
                  key={lab.id}
                  lab={lab}
                  onClick={() => setSelectedLab(lab)}
                />
              ))}
              {labs.length === 0 && !loading && (
                <div className="col-span-full py-32 flex flex-col items-center text-center opacity-50">
                  <FlaskConical className="w-16 h-16 text-slate-700 mb-4" />
                  <h3 className="text-xl font-bold text-white">
                    Nenhum laboratório ativo
                  </h3>
                  <p className="text-slate-500 max-w-xs mt-2">
                    Crie seu primeiro lab ou utilize um de nossos templates
                    pedagógicos.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "templates" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((temp) => (
                <div
                  key={temp.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <LayoutGrid className="w-12 h-12" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded mb-3 inline-block">
                    {temp.category}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {temp.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-6">
                    {temp.statement}
                  </p>
                  <button
                    onClick={() => createLabFromTemplate(temp)}
                    className="w-full py-3 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Usar Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">
              Categorias Principais
            </h3>
            <div className="space-y-2">
              <CategoryItem
                icon={Terminal}
                label="Lógica de Programação"
                count={12}
                color="text-amber-400"
              />
              <CategoryItem
                icon={Code2}
                label="Python & Backend"
                count={8}
                color="text-blue-400"
              />
              <CategoryItem
                icon={FileCode}
                label="Web Avançada"
                count={5}
                color="text-emerald-400"
              />
              <CategoryItem
                icon={ShieldCheck}
                label="Segurança da Info"
                count={3}
                color="text-rose-400"
              />
              <CategoryItem
                icon={TableIcon}
                label="Banco de Dados"
                count={6}
                color="text-indigo-400"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 border border-indigo-500/10 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Dica do Professor
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "Use os laboratórios para atividades de nivelamento. Ative o 'Modo
              Reforço' no analytics para identificar alunos que travam na lógica
              básica."
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedLab && (
          <LabDetailView
            lab={selectedLab}
            onClose={() => {
              setSelectedLab(null);
              fetchData();
            }}
          />
        )}
        {showSettingsModal && (
          <ClassSettingsModal
            className={currentClass}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LabCard({ lab, onClick }: { lab: SmartLab; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 cursor-pointer hover:border-emerald-500/30 transition-all group relative"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded font-bold uppercase tracking-wider">
            {lab.language}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              lab.difficulty === "easy"
                ? "bg-emerald-500/10 text-emerald-400"
                : lab.difficulty === "medium"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {lab.difficulty}
          </span>
        </div>
        <div className="p-2 bg-slate-800 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors tracking-tight">
        {lab.title}
      </h3>
      <p className="text-sm text-slate-500 font-medium mb-6">
        {lab.class_name}
      </p>

      <div className="flex gap-4 items-center pt-6 border-t border-slate-800/50">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] text-white font-bold"
            >
              S{i}
            </div>
          ))}
        </div>
        <span className="text-xs text-slate-500">12 entregas pendentes</span>
      </div>
    </motion.div>
  );
}

function LabDetailView({
  lab,
  onClose,
}: {
  lab: SmartLab;
  onClose: () => void;
}) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [correcting, setCorrecting] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [lab.id]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/smart-labs/${lab.id}/submissions`);
      setSubmissions(await res.json());
    } catch (e) {
      toast.error("Erro ao carregar submissões.");
    } finally {
      setLoading(false);
    }
  };

  const runCorrection = async (subId: string) => {
    setCorrecting(subId);
    try {
      const res = await fetch(`/api/smart-labs/submissions/${subId}/correct`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Correção concluída com sucesso!");
        fetchSubmissions();
      }
    } catch (e) {
      toast.error("Erro na correção.");
    } finally {
      setCorrecting(null);
    }
  };

  const exportReport = async (type: "csv" | "xlsx") => {
    window.open(`/api/smart-labs/${lab.id}/report/${type}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-y-0 right-0 w-full lg:w-2/3 bg-[#030712] border-l border-slate-800 z-50 flex flex-col shadow-2xl p-0"
    >
      <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {lab.title}
            </h3>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase">
              {lab.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono italic">
            {lab.topic} • {lab.language} • {lab.class_name}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-8">
            <section>
              <div className="flex justify-between items-end mb-4">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                  Lista de Entregas
                </h4>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all">
                    <Upload className="w-3 h-3" /> Importar Códigos
                  </button>
                  <button
                    onClick={() => exportReport("csv")}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all"
                  >
                    <Download className="w-3 h-3" /> Exportar Planilha
                  </button>
                </div>
              </div>

              <div className="overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40">
                      <th className="p-4 font-bold text-slate-400 capitalize">
                        Aluno
                      </th>
                      <th className="p-4 font-bold text-slate-400 capitalize">
                        Arquivo
                      </th>
                      <th className="p-4 font-bold text-slate-400 capitalize text-center">
                        Nota
                      </th>
                      <th className="p-4 font-bold text-slate-400 capitalize">
                        Status
                      </th>
                      <th className="p-4 font-bold text-slate-400 capitalize text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {submissions.map((sub) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-800/20 transition-all group"
                      >
                        <td className="p-4 font-bold text-white tracking-tight">
                          {sub.student_name}
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[10px]">
                          {sub.filename}
                        </td>
                        <td className="p-4 text-center">
                          {sub.score !== null ? (
                            <span
                              className={`font-black text-sm ${sub.score >= 70 ? "text-emerald-400" : sub.score >= 50 ? "text-amber-400" : "text-rose-400"}`}
                            >
                              {sub.score}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              sub.status === "corrected"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {sub.status === "corrected"
                              ? "Corrigido"
                              : "Pendente"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => runCorrection(sub.id)}
                              disabled={correcting === sub.id}
                              className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all"
                            >
                              {correcting === sub.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </button>
                            <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all">
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {submissions.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-slate-600 italic"
                        >
                          Nenhuma submissão importada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                Configuração do Lab
              </h5>
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <h6 className="text-xs font-bold text-white mb-2">
                    Enunciado
                  </h6>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-4">
                    {lab.statement}
                  </p>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <h6 className="text-xs font-bold text-white mb-2">
                    Rubrica (Peso)
                  </h6>
                  <div className="space-y-1">
                    {Object.entries(lab.rubric || {}).map(([k, v]: any) => (
                      <div key={k} className="flex justify-between text-[10px]">
                        <span className="text-slate-500 capitalize">{k}</span>
                        <span className="text-white font-bold">{v}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4" /> Editar Definições
                </button>
              </div>
            </div>

            <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-3xl p-6">
              <h5 className="text-sm font-bold text-emerald-400 mb-2">
                Sugestão de Aula
              </h5>
              <p className="text-[11px] text-emerald-200/60 leading-relaxed">
                Este laboratório foca em {lab.topic}. Uma abordagem recomendada
                é iniciar com um exemplo "live coding" e depois liberar os
                alunos para experimentação individual no sandbox.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ClassSettingsModal({
  className,
  onClose,
}: {
  className: string;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState<any>({
    requireComments: false,
    requireIndentation: true,
    maxLinesLimit: 200,
    requireNoSingleLetterVars: true,
    requireFunctions: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/classes/${encodeURIComponent(className)}/linting-settings`)
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [className]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/classes/${encodeURIComponent(className)}/linting-settings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        },
      );
      if (res.ok) {
        toast.success("Configurações de linting salvas para esta turma!");
        onClose();
      }
    } catch (e) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-lg p-10 overflow-hidden shadow-2xl relative"
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Configurações de Linting
          </h3>
          <p className="text-sm text-slate-500 mt-1">{className}</p>
        </div>

        <div className="space-y-6">
          <ToggleRow
            label="Exigir Comentários"
            desc="Garante que funções e blocos complexos estejam documentados."
            value={settings.requireComments}
            onChange={(v) => setSettings({ ...settings, requireComments: v })}
          />
          <ToggleRow
            label="Indentação Obrigatória"
            desc="Valida a estrutura visual e legibilidade do código."
            value={settings.requireIndentation}
            onChange={(v) =>
              setSettings({ ...settings, requireIndentation: v })
            }
          />
          <ToggleRow
            label="Proibir Variáveis de Letra Única"
            desc="Exceto em loops, obriga o uso de nomes descritivos."
            value={settings.requireNoSingleLetterVars}
            onChange={(v) =>
              setSettings({ ...settings, requireNoSingleLetterVars: v })
            }
          />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-white">
                Limite de Linhas
              </label>
              <span className="text-xs font-mono text-indigo-400">
                {settings.maxLinesLimit} linhas
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={settings.maxLinesLimit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxLinesLimit: parseInt(e.target.value),
                })
              }
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Salvar Regras
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl group hover:border-indigo-500/30 transition-all cursor-pointer"
      onClick={() => onChange(!value)}
    >
      <div className="flex flex-col gap-1 max-w-[80%]">
        <span className="text-sm font-bold text-white">{label}</span>
        <span className="text-[10px] text-slate-500 leading-tight">{desc}</span>
      </div>
      <div
        className={`w-10 h-5 rounded-full transition-all relative ${value ? "bg-indigo-600" : "bg-slate-800"}`}
      >
        <div
          className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${value ? "left-6" : "left-1"}`}
        />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 flex items-center gap-2 text-xs font-bold transition-all border-b-2 ${
        active
          ? "border-indigo-500 text-white bg-indigo-500/5"
          : "border-transparent text-slate-500 hover:text-slate-300"
      }`}
    >
      <Icon
        className={`w-4 h-4 ${active ? "text-indigo-400" : "text-slate-600"}`}
      />
      {label}
    </button>
  );
}

function CategoryItem({ icon: Icon, label, count, color }: any) {
  return (
    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-all group cursor-pointer">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${color}`}
        >
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">
          {label}
        </span>
      </div>
      <span className="text-[10px] font-mono text-slate-600">{count}</span>
    </div>
  );
}

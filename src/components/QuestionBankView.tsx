import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Sparkles,
  Filter,
  Eye,
  Database,
  Code2,
  ChevronRight,
  Target,
  BarChart3,
  Archive,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Settings2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl, safeJsonResponse } from "../config/api";

export default function QuestionBankView() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [genParams, setGenParams] = useState({
    topic: "Lógica de Programação",
    language: "python",
    difficulty: "easy",
    question_type: "code_challenge",
    quantity: 3,
  });

  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: "",
    language: "python",
    difficulty: "Iniciante",
    starter_code: "",
    test_cases: [],
    rubric: {}
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/questions"));
      const data = await res.json();
      setQuestions(data);
    } catch (e) {
      toast.error("Erro ao carregar banco de questões.");
    } finally {
      setLoading(false);
    }
  };

  const normalizeGeneratedQuestions = (response: any) => {
    if (Array.isArray(response?.questions)) return response.questions;
    if (Array.isArray(response?.data?.questions)) return response.data.questions;
    if (response?.data?.question) return [response.data.question];
    if (response?.question) return [response.question];
    return [];
  };

  const generateWithIA = async () => {
    if (!genParams.topic) {
      toast.error("Informe o tema da questão.");
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        topic: genParams.topic,
        language: genParams.language || "python",
        difficulty: genParams.difficulty || "Iniciante",
        question_type: genParams.question_type || "prática",
        quantity: genParams.quantity || 3,
      };

      const res = await fetch(apiUrl("/api/questions/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      const generatedQuestions = normalizeGeneratedQuestions(data);

      if (generatedQuestions.length === 0) {
        toast.error("Nenhuma questão foi gerada. Tente novamente ou altere os parâmetros.");
        return;
      }

      toast.success(`${generatedQuestions.length} questões geradas com sucesso!`);
      setShowGenModal(false);
      setQuestions(prev => [...generatedQuestions, ...prev]);
      fetchQuestions();
    } catch (e: any) {
      toast.error("Erro ao gerar questões com IA.");
    } finally {
      setGenerating(false);
    }
  };

  const createQuestion = async () => {
    if (!newQuestion.title || !newQuestion.description || !newQuestion.language || !newQuestion.difficulty) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(apiUrl("/api/questions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });
      if (res.ok) {
        toast.success("Questão criada com sucesso!");
        setShowCreateModal(false);
        fetchQuestions();
      } else {
        toast.error("Erro ao criar questão.");
      }
    } catch (e) {
      toast.error("Erro de conexão ao criar questão.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-display">
            Banco Inteligente de Questões
          </h2>
          <p className="text-slate-400 mt-1">
            Crie, organize e gere atividades de programação com Copiloto IA.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/20"
          >
            <Sparkles className="w-4 h-4" /> Gerar com IA
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-700/50"
          >
            <Plus className="w-4 h-4" /> Nova Questão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filters and Categories */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
              Filtrar por Tema
            </h3>
            <div className="flex flex-col gap-2">
              {[
                "Lógica de Programação",
                "Variáveis",
                "Condicionais",
                "Repetição",
                "Vetores",
                "Funções",
                "Banco de Dados",
              ].map((topic) => (
                <button
                  key={topic}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-left transition-all group"
                >
                  <span className="text-xs text-slate-300 group-hover:text-white font-medium">
                    {topic}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
              Linguagens
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Python", "C", "Java", "SQL", "JavaScript", "Portugol"].map(
                (lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-400 font-bold hover:border-emerald-500/50 cursor-pointer transition-all"
                  >
                    {lang}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Question List */}
        <div className="lg:col-span-9 space-y-4">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-600 font-mono text-xs">
              Acessando cofre de questões...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestion(q)}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          q.difficulty === "easy"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : q.difficulty === "medium"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-bold uppercase tracking-wider">
                        {q.language}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors">
                    {q.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8">
                    {q.description || q.statement}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {q.topic}
                      </span>
                    </div>
                    {q.created_by_ai && (
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] text-indigo-400 font-mono italic">
                          AI Generated
                        </span>
                      </div>
                    )}
                  </div>

                  {q.status === "draft" && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-bl-xl">
                      Rascunho
                    </div>
                  )}
                </div>
              ))}
              {questions.length === 0 && (
                <div className="md:col-span-2 py-20 flex flex-col items-center justify-center text-center bg-slate-900/10 border border-slate-800 rounded-3xl">
                  <Database className="w-12 h-12 text-slate-800 mb-4" />
                  <h3 className="text-lg font-bold text-white">Banco Vazio</h3>
                  <p className="text-slate-500 text-sm max-w-xs mt-1">
                    Implemente suas primeiras questões ou use a IA para popular
                    o cofre.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-xl p-8 overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />

            <div className="flex items-center gap-3 mb-8 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Gerar Questões IA
                </h3>
                <p className="text-sm text-slate-400">
                  Configure os parâmetros pedagógicos para a geração.
                </p>
              </div>
            </div>

            <div className="space-y-6 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Tema Principal
                  </label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    value={genParams.topic}
                    onChange={(e) =>
                      setGenParams({ ...genParams, topic: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Linguagem
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none appearance-none"
                    value={genParams.language}
                    onChange={(e) =>
                      setGenParams({ ...genParams, language: e.target.value })
                    }
                  >
                    <option value="python">Python</option>
                    <option value="c">C</option>
                    <option value="sql">SQL</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Dificuldade
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none appearance-none"
                    value={genParams.difficulty}
                    onChange={(e) =>
                      setGenParams({ ...genParams, difficulty: e.target.value })
                    }
                  >
                    <option value="easy">Iniciante</option>
                    <option value="medium">Intermediário</option>
                    <option value="hard">Avançado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    value={genParams.quantity}
                    onChange={(e) =>
                      setGenParams({
                        ...genParams,
                        quantity: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowGenModal(false)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={generateWithIA}
                  disabled={generating}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 group"
                >
                  {generating ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <BrainCircuit className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  )}
                  {generating ? "Gerando Questões..." : "Gerar com IA"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Criar Manual */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-2xl p-8 overflow-y-auto max-h-[90vh] shadow-2xl relative custom-scrollbar"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Criar Questão</h3>
                <p className="text-sm text-slate-400">Adicione uma nova questão manualmente.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Título *</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Enunciado *</label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  value={newQuestion.description}
                  onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">Linguagem *</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none appearance-none"
                    value={newQuestion.language}
                    onChange={(e) => setNewQuestion({ ...newQuestion, language: e.target.value })}
                  >
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="sql">SQL</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">Dificuldade *</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none appearance-none"
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Código Base (Starter Code)</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  value={newQuestion.starter_code}
                  onChange={(e) => setNewQuestion({ ...newQuestion, starter_code: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setShowCreateModal(false)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all">Cancelar</button>
                <button onClick={createQuestion} disabled={creating} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all">
                  {creating ? "Criando..." : "Salvar Questão"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Visualização Detalhada */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl"
          >
            <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-950/40">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase tracking-widest">
                    {selectedQuestion.language}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold uppercase tracking-widest">
                    {selectedQuestion.difficulty}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {selectedQuestion.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest font-bold">
                  {selectedQuestion.topic}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <section>
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  Enunciado
                </h5>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 border border-slate-800/50 rounded-2xl">
                  {selectedQuestion.statement}
                </p>
              </section>

              <div className="grid grid-cols-2 gap-8">
                <section>
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Critérios (Rubrica)
                  </h5>
                  <div className="space-y-2">
                    {Object.entries(selectedQuestion.rubric || {}).map(
                      ([key, val]: any) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl"
                        >
                          <span className="text-xs text-slate-400 capitalize">
                            {key}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {val}%
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </section>
                <section>
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Solução de Referência
                  </h5>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-mono text-emerald-400 overflow-x-auto">
                    <code>
                      {selectedQuestion.reference_solution ||
                        "// Sem código exemplo"}
                    </code>
                  </pre>
                </section>
              </div>

              <section>
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  Casos de Teste
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedQuestion.test_cases?.map((t: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-600 font-bold uppercase">
                          Entrada
                        </span>
                        <code className="text-xs text-slate-400 p-1.5 bg-slate-900 rounded mt-1">
                          {t.input}
                        </code>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-600 font-bold uppercase">
                          Saída Esperada
                        </span>
                        <code className="text-xs text-emerald-400/80 p-1.5 bg-slate-900 rounded mt-1">
                          {t.output}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
                  <Archive className="w-4 h-4" /> Arquivar Questão
                </button>
                <button className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
                  <Settings2 className="w-4 h-4" /> Editar com IA
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all border border-emerald-400/20">
                  <CheckCircle2 className="w-4 h-4" /> Aprovar e Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { 
  MessageSquare, 
  Copy, 
  Check, 
  Plus, 
  Share2, 
  Search, 
  Sparkles, 
  Award, 
  BookOpen, 
  Filter, 
  CheckCircle2,
  ExternalLink,
  Tag
} from "lucide-react";
import { ReusableFeedbackBankService, FeedbackSnippet } from "../services/reusableFeedbackBankService";

interface ReusableFeedbackBankViewProps {
  onNavigate?: (tab: string) => void;
}

export default function ReusableFeedbackBankView({ onNavigate }: ReusableFeedbackBankViewProps = {}) {
  const [snippets, setSnippets] = useState<FeedbackSnippet[]>(() => {
    return ReusableFeedbackBankService.getSnippets();
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New snippet modal state
  const [isCreating, setIsCreating] = useState(false);
  const [newShortcut, setNewShortcut] = useState("@");
  const [newTitle, setNewTitle] = useState("");
  const [newCompetency, setNewCompetency] = useState("Construir algoritmos com laços de repetição");
  const [newCriterion, setNewCriterion] = useState("Lógica e Estrutura");
  const [newCategory, setNewCategory] = useState<FeedbackSnippet["category"]>("LOGICA");
  const [newObservation, setNewObservation] = useState("");
  const [newEvidencePrompt, setNewEvidencePrompt] = useState("");
  const [newGuidance, setNewGuidance] = useState("");

  const handleCopy = (snippet: FeedbackSnippet) => {
    const fullText = ReusableFeedbackBankService.composeFullFeedback(snippet);
    navigator.clipboard.writeText(fullText);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newObservation || !newGuidance) {
      alert("Por favor, preencha todos os campos pedagógicos.");
      return;
    }

    const created = ReusableFeedbackBankService.addSnippet({
      shortcutTag: newShortcut.startsWith("@") ? newShortcut : `@${newShortcut}`,
      title: newTitle,
      competency: newCompetency,
      criterion: newCriterion,
      category: newCategory,
      observationTemplate: newObservation,
      evidencePrompt: newEvidencePrompt || "Trecho de código identificado na linha X.",
      guidanceNextAction: newGuidance,
      isSharedWithPeers: true
    });

    setSnippets(ReusableFeedbackBankService.getSnippets(selectedCategory));
    setIsCreating(false);
    setNewTitle("");
    setNewObservation("");
    setNewGuidance("");
  };

  const filteredSnippets = snippets.filter(s => {
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    if (!searchQuery) return true;
    return s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.shortcutTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.observationTemplate.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1829] to-[#040817] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              BANCO DE FEEDBACK CONTEXTUALIZADO
            </span>
            <span className="text-xs text-slate-400 font-mono">• {snippets.length} modelos prontos</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-cyan-400" />
            Biblioteca de Feedback & Atalhos de Correção
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Insira pareceres ricos estruturados em Observação ➔ Evidência ➔ Próxima Ação utilizando atalhos rápidos (@tag) para elevar a produtividade docente.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Novo Modelo de Feedback
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#090e21] border border-slate-800">
        <div className="flex items-center gap-2">
          {["all", "LOGICA", "BOAS_PRATICAS", "BANCO_DADOS", "SEGURANCA"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {cat === "all" ? "Todos os Tipos" : cat}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por @tag ou palavra-chave..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSnippets.map((snippet) => (
          <div
            key={snippet.id}
            className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col justify-between gap-4 hover:border-slate-700 transition-all shadow-md"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {snippet.shortcutTag}
                  </span>
                  <span className="text-xs font-bold text-white">{snippet.title}</span>
                </div>
                {snippet.isSharedWithPeers && (
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <Share2 className="w-3 h-3" />
                    Compartilhado
                  </span>
                )}
              </div>

              {/* Structured 3-part layout */}
              <div className="flex flex-col gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">1. Observação:</span>
                  <p className="text-slate-200">{snippet.observationTemplate}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-amber-400">2. Evidência no Código:</span>
                  <p className="text-slate-300 italic">{snippet.evidencePrompt}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">3. Próxima Ação Recomendada:</span>
                  <p className="text-emerald-300">{snippet.guidanceNextAction}</p>
                </div>
              </div>
            </div>

            {/* Card Footer: Copy & Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs font-mono">
              <span className="text-[10px] text-slate-500">Usado {snippet.usageCount} vezes</span>
              <button
                onClick={() => handleCopy(snippet)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  copiedId === snippet.id
                    ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                {copiedId === snippet.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto Completo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleCreateSnippet}
            className="bg-[#090e21] border border-cyan-500/30 rounded-2xl max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Cadastrar Novo Modelo de Feedback
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300">Atalho / Tag:</label>
                <input
                  type="text"
                  placeholder="@offbyone"
                  value={newShortcut}
                  onChange={(e) => setNewShortcut(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300">Categoria:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="LOGICA">Lógica</option>
                  <option value="BOAS_PRATICAS">Boas Práticas</option>
                  <option value="BANCO_DADOS">Banco de Dados</option>
                  <option value="SEGURANCA">Segurança</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-300">Título do Modelo:</label>
              <input
                type="text"
                placeholder="Ex: Falha de Limite Exclusivo no range()"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-300">1. Observação Pedagógica:</label>
              <textarea
                rows={2}
                placeholder="Descreva o que foi observado no código..."
                value={newObservation}
                onChange={(e) => setNewObservation(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-300">2. Evidência no Código (Prompt):</label>
              <input
                type="text"
                placeholder="Ex: A função range(start, stop) exclui o valor final."
                value={newEvidencePrompt}
                onChange={(e) => setNewEvidencePrompt(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-300">3. Próxima Ação / Orientação ao Aluno:</label>
              <textarea
                rows={2}
                placeholder="Instruções claras de como corrigir ou o que estudar..."
                value={newGuidance}
                onChange={(e) => setNewGuidance(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs font-mono"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase"
              >
                Salvar Modelo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

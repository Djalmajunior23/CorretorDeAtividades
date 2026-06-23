import React, { useState } from "react";
import { Sparkles, Loader2, Save, Send } from "lucide-react";
import { apiUrl, safeJsonResponse } from "../config/api";

export default function GeneratorView() {
  const [formData, setFormData] = useState({
    theme: "",
    language: "python",
    difficulty: "Iniciante",
    competence: "",
    type: "Desafio Prático",
    context: "",
    testCasesCount: 4,
  });

  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/codecheck/activities/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedData(data);
      } else {
        alert("Erro ao gerar atividade: " + (data.error || "Desconhecido"));
      }
    } catch (e: any) {
      alert("Falha de conexão: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBank = async () => {
    if (!generatedData) return;
    setSaving(true);
    try {
      const payload = {
        ...generatedData,
        theme: formData.theme,
        language: formData.language,
        difficulty: formData.difficulty,
        competence: formData.competence,
        status: "draft",
      };

      const res = await fetch(apiUrl("/api/codecheck/activities"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Atividade salva no banco de questões com sucesso (Rascunho)!");
        setGeneratedData(null); // reset
      } else {
        alert("Erro ao salvar: " + (data.error || "Desconhecido"));
      }
    } catch (e: any) {
      alert("Falha de conexão: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulário de Configuração */}
        <div className="lg:col-span-4 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4 h-fit">
          <div className="border-b border-[#1e295b]/20 pb-3">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Parâmetros da IA
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure o escopo de geração do enunciado avaliativo.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Tema / Assunto
              </label>
              <input
                value={formData.theme}
                onChange={(e) =>
                  setFormData({ ...formData, theme: e.target.value })
                }
                placeholder="Ex: Laços de Repetição, Matrizes..."
                className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Linguagem-Alvo
                </label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none uppercase font-mono"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="agnostic">Agnóstica</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Dificuldade
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({ ...formData, difficulty: e.target.value })
                  }
                  className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Competência Pedagógica
              </label>
              <input
                value={formData.competence}
                onChange={(e) =>
                  setFormData({ ...formData, competence: e.target.value })
                }
                placeholder="Ex: Lógica estruturada, Tratamento de erros..."
                className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none placeholder-slate-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Contexto Realista
              </label>
              <textarea
                value={formData.context}
                onChange={(e) =>
                  setFormData({ ...formData, context: e.target.value })
                }
                placeholder="Em qual situação de mercado isso se aplica? Ex: Calcular troco em um e-commerce..."
                rows={3}
                className="w-full bg-[#030712] border border-[#1e295b]/40 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none placeholder-slate-600 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#030712] font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer font-mono uppercase tracking-wider text-xs disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? "Sintetizando..." : "Gerar com Código IA"}
            </button>
          </div>
        </div>

        {/* Pré-visualização da Geração */}
        <div className="lg:col-span-8 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-0 flex flex-col h-full overflow-hidden">
          {!generatedData ? (
            <div className="flex-1 flex items-center justify-center flex-col p-12 text-center text-slate-400">
              <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="font-bold text-slate-300 font-mono">
                Aguardando Parâmetros
              </h3>
              <p className="text-sm mt-2 max-w-md">
                Preencha o formulário e clique em gerar para que a inteligência
                artificial construa uma atividade completa com enunciado,
                rubricas e master-tests.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-thin">
              <div className="p-6 border-b border-[#1e295b]/30 bg-[#030712]/30 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                <div>
                  <h2 className="text-lg font-bold text-white font-display leading-none">
                    {generatedData.title || "Título Gerado"}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    {(generatedData.tags || []).map((t: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full border border-sky-500/20 bg-sky-500/10 text-[10px] text-sky-400 font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleSaveToBank}
                  disabled={saving}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all border border-slate-700"
                >
                  {saving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Salvar Rascunho
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6 relative">
                {/* Enunciado */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Enunciado / Problema
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed bg-[#030712] p-4 rounded-xl border border-[#1e295b]/30 break-words whitespace-pre-wrap">
                    {generatedData.problem_description}
                  </p>
                </div>

                {/* IO */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#030712] p-4 rounded-xl border border-[#1e295b]/30">
                    <h4 className="text-[11px] font-mono uppercase text-emerald-400 font-bold mb-1 border-b border-emerald-500/20 pb-1">
                      Formato de Entrada
                    </h4>
                    <p className="text-[13px] text-slate-300 mt-2">
                      {generatedData.inputs_desc}
                    </p>
                  </div>
                  <div className="bg-[#030712] p-4 rounded-xl border border-[#1e295b]/30">
                    <h4 className="text-[11px] font-mono uppercase text-rose-400 font-bold mb-1 border-b border-rose-500/20 pb-1">
                      Formato de Saída
                    </h4>
                    <p className="text-[13px] text-slate-300 mt-2">
                      {generatedData.outputs_desc}
                    </p>
                  </div>
                </div>

                {/* Solution */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Gabarito Esperado ({formData.language.toUpperCase()})
                  </h4>
                  <pre className="text-xs font-mono text-emerald-300 bg-[#070a1a] p-4 rounded-xl border border-[#1e295b]/50 overflow-x-auto">
                    {generatedData.solution_code}
                  </pre>
                </div>

                {/* Rubrica */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Rubrica de Avaliação Sugerida
                  </h4>
                  <p className="text-xs text-slate-400 bg-[#030712] p-4 rounded-xl border border-[#1e295b]/30 border-l-4 border-l-purple-500">
                    {generatedData.rubric_suggested}
                  </p>
                </div>

                {/* Casos de Teste */}
                <div className="border-t border-[#1e295b]/30 pt-6">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between">
                    Casos de Teste (Runner)
                    <span className="bg-[#1e293b] px-2 py-0.5 rounded text-white">
                      {generatedData.test_cases?.length || 0} Registrados
                    </span>
                  </h4>

                  <div className="flex flex-col gap-3">
                    {generatedData.test_cases?.map((tc: any, i: number) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-3 rounded-xl border ${tc.is_hidden ? "border-amber-500/30 lg-amber-500/5" : "border-[#1e295b]/40"} bg-[#0a0f24]`}
                      >
                        <div
                          className={`mt-1 shrink-0 px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider ${tc.is_hidden ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}
                        >
                          {tc.is_hidden ? "Oculto" : "Público"}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4 text-xs font-mono">
                          <div>
                            <span className="text-slate-500 block mb-0.5">
                              Input:
                            </span>
                            <span className="text-slate-200">
                              {tc.input_data}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">
                              Output:
                            </span>
                            <span className="text-slate-200">
                              {tc.expected_output}
                            </span>
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
      </div>
    </div>
  );
}

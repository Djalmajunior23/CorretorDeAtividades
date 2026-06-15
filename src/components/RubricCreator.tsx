import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, AlertCircle, Save } from "lucide-react";

interface Criterion {
  name: string;
  weight: number;
}

export const RubricCreator = ({
  onSave,
}: {
  onSave: (rubric: any) => void;
}) => {
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([
    { name: "Lógica de Programação", weight: 40 },
    { name: "Estrutura e Organização", weight: 30 },
    { name: "Legibilidade", weight: 30 },
  ]);
  const [loading, setLoading] = useState(false);

  const total = criteria.reduce((sum, c) => sum + c.weight, 0);

  const addCriterion = () => {
    setCriteria([...criteria, { name: "", weight: 10 }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, field: string, value: any) => {
    const newCriteria = [...criteria];
    (newCriteria[index] as any)[field] =
      field === "weight" ? parseInt(value) || 0 : value;
    setCriteria(newCriteria);
  };

  const handleSave = async () => {
    if (total !== 100) return;
    if (!title) return;

    setLoading(true);
    const criteriaObj = criteria.reduce((acc: any, curr) => {
      acc[curr.name] = curr.weight;
      return acc;
    }, {});

    try {
      const res = await fetch("/api/pedagogical/rubrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, criteria: criteriaObj }),
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data);
      }
    } catch (e) {
      console.error("Error saving rubric", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e295b]/30 shadow-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold font-mono text-sm uppercase tracking-wider flex items-center gap-2">
          <Save className="w-4 h-4 text-emerald-400" />
          Configurar Nova Rubrica
        </h3>
        <div
          className={`flex items-center gap-2 text-[10px] font-mono font-bold px-2 py-1 rounded ${total === 100 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
        >
          {total === 100 ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          SOMA: {total}%
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">
          Título da Rubrica
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Padrão Desenvolvimento Web"
          className="bg-[#030712] border border-[#1e295b]/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">
          Critérios de Avaliação
        </label>
        {criteria.map((c, i) => (
          <div key={i} className="flex gap-3">
            <input
              type="text"
              value={c.name}
              onChange={(e) => updateCriterion(i, "name", e.target.value)}
              placeholder="Nome do critério"
              className="flex-1 bg-[#030712] border border-[#1e295b]/20 rounded-xl px-3 py-2 text-xs text-slate-200"
            />
            <div className="w-24 relative">
              <input
                type="number"
                value={c.weight}
                onChange={(e) => updateCriterion(i, "weight", e.target.value)}
                className="w-full bg-[#030712] border border-[#1e295b]/20 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-600">
                %
              </span>
            </div>
            <button
              onClick={() => removeCriterion(i)}
              className="p-2.5 hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-2">
        <button
          onClick={addCriterion}
          className="flex-1 px-4 py-2.5 border border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-400 rounded-xl text-[10px] font-bold font-mono uppercase transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-3 h-3" />
          Adicionar Critério
        </button>
        <button
          disabled={total !== 100 || !title || loading}
          onClick={handleSave}
          className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-900 rounded-xl font-bold font-mono text-[10px] uppercase transition-all shadow-lg"
        >
          {loading ? "Salvando..." : "Salvar Rubrica"}
        </button>
      </div>
    </div>
  );
};

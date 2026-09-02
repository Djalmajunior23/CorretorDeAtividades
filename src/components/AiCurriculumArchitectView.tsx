import React, { useState } from "react";
import { Sparkles, RefreshCw, BookOpen, Layers, CheckCircle2, FileText, Download, Award, Clock } from "lucide-react";
import { apiUrl, safeJsonResponse } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function AiCurriculumArchitectView() {
  const [loading, setLoading] = useState(false);
  const [courseTitle, setCourseTitle] = useState("Desenvolvimento Full-Stack com IA Aplicada");
  const [domain, setDomain] = useState("Engenharia de Software & IA");
  const [weeks, setWeeks] = useState(8);
  const [level, setLevel] = useState("Intermediário");
  const [workload, setWorkload] = useState(80);
  const [mandatoryCompetencies, setMandatoryCompetencies] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [modelName, setModelName] = useState("gemini-2.0-flash-exp");

  
  const MOCK_CLASSES = [
    { id: "c1", name: "Técnico em Sistemas - 1A" },
    { id: "c2", name: "Análise de Dados - 2B" },
    { id: "c3", name: "Segurança Info - 3C" },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/ai/curriculum-architect"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle, domain, weeks, level, workload, mandatoryCompetencies, selectedClasses })
      });
      const json = await safeJsonResponse(res);
      if (json && json.success) {
        setCurriculumData(json.curriculum);
        if (json.model) setModelName(json.model);
      }
    } catch (e) {
      console.error("Error generating curriculum", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!curriculumData) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text("CODECHECK AI - EMENTA CURRICULAR GERADA POR IA", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Curso: ${curriculumData.courseTitle}`, 14, 28);
    doc.text(`Área: ${curriculumData.domain} | Nível: ${curriculumData.level}`, 14, 34);
    doc.text(`Modelo LLM: ${modelName} | Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 40);

    const rows = (curriculumData.weeklyModules || []).map((m: any) => [
      `Semana ${m.weekNumber}`,
      m.title,
      m.objectives,
      m.labChallenge
    ]);

    autoTable(doc, {
      startY: 48,
      head: [["Período", "Título do Módulo", "Objetivos Pedagógicos", "Desafio Prático (Lab)"]],
      body: rows.length > 0 ? rows : [["-", "Nenhum módulo", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Ementa_Curricular_${Date.now()}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-500/20">
              AI_GENERAL_MODEL • {modelName}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display mt-2">
            Arquiteto Curricular IA • Ementas & Planos de Ensino
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Gere ementas pedagógicas completas, módulos semanais, objetivos de aprendizagem e desafios de laboratório alinhados aos padrões institucionais utilizando inteligência artificial generativa.
          </p>
        </div>

        {curriculumData && (
          <button
            onClick={handleExportPdf}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar Ementa PDF
          </button>
        )}
      </div>

      {/* Configuration Form */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6">
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Título do Curso</label>
              <input
                type="text"
                value={courseTitle}
                onChange={e => setCourseTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Engenharia de Dados & SQL"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Área / Domínio</label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Ciência da Computação"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Duração (Semanas)</label>
              <select
                value={weeks}
                onChange={e => setWeeks(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={4}>4 Semanas (Intensivo)</option>
                <option value={8}>8 Semanas (Padrão)</option>
                <option value={12}>12 Semanas (Semestral)</option>
                <option value={16}>16 Semanas (Extendido)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Carga Horária (h)</label>
              <input
                type="number"
                value={workload}
                onChange={e => setWorkload(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ex: 80"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Competências Obrigatórias por Ciclo</label>
              <textarea
                value={mandatoryCompetencies}
                onChange={e => setMandatoryCompetencies(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none h-[72px]"
                placeholder="Ex: Lógica de Programação, Estruturas de Dados, Versionamento Git..."
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Mapeamento com Turmas Ativas</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MOCK_CLASSES.map(cls => {
                  const isSelected = selectedClasses.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        setSelectedClasses(prev => 
                          prev.includes(cls.id) 
                            ? prev.filter(id => id !== cls.id)
                            : [...prev, cls.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors flex items-center gap-1.5 ${
                        isSelected 
                          ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" 
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-500'}`}>
                        {isSelected && <CheckCircle2 className="w-2.5 h-2.5" />}
                      </div>
                      {cls.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 w-full md:w-auto"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Gerando Ementa & Mapeamentos..." : "Gerar Ementa com IA"}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Curriculum Results */}
      {curriculumData && (
        <div className="space-y-6 animate-fade-in">
          {/* Overview Card */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                  {curriculumData.domain} • Nível {curriculumData.level} • {curriculumData.durationWeeks || weeks} Semanas • {workload}h
                </span>
                <h3 className="text-xl font-bold text-white font-display mt-2">{curriculumData.courseTitle}</h3>
                {selectedClasses.length > 0 && (
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    <span className="font-bold">Turmas Mapeadas:</span> {MOCK_CLASSES.filter(c => selectedClasses.includes(c.id)).map(c => c.name).join(', ')}
                  </div>
                )}
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Aprovado pela IA Curricular
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              {curriculumData.overview}
            </p>

            <div>
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Competências Alvo Desenvolvidas:</h4>
              <div className="flex flex-wrap gap-2">
                {(curriculumData.targetCompetencies || []).map((comp: string, i: number) => (
                  <span key={i} className="text-xs font-mono bg-slate-900 text-indigo-300 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-400" /> {comp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Modules */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Módulos Semanais do Plano de Ensino
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(curriculumData.weeklyModules || []).map((module: any, idx: number) => (
                <div key={idx} className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 uppercase">
                        Semana {module.weekNumber}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 4h Lab / 4h Teoria
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">{module.title}</h4>

                    <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-500 block font-bold mb-1 uppercase">Objetivos Pedagógicos:</span>
                      {module.objectives}
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-mono">
                      <span className="text-[10px] font-mono text-slate-500 block font-bold mb-1 uppercase text-indigo-300">Desafio Prático de Laboratório:</span>
                      {module.labChallenge}
                    </div>

                    <div className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      <strong className="text-slate-300">Critério de Avaliação:</strong> {module.assessmentCriteria}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiCurriculumArchitectView;

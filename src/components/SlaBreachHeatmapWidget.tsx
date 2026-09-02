import React, { useState } from "react";
import { 
  Clock, 
  AlertTriangle, 
  Sliders, 
  CheckCircle2, 
  Info, 
  Calendar, 
  Filter, 
  ArrowUpRight,
  ShieldAlert,
  Zap,
  FileSpreadsheet,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { exportSlaViolationsHistoryXLSX } from "../utils/dataExport";
import { apiUrl, safeJsonResponse } from "../config/api";

interface ClassSlaConfig {
  className: string;
  defaultSlaHours: number;
  breachRate: string;
  riskLevel: "baixo" | "medio" | "alto";
}

export function SlaBreachHeatmapWidget() {
  const [selectedClass, setSelectedClass] = useState<string>("Todas");
  const [exporting, setExporting] = useState<boolean>(false);
  const [classConfigs, setClassConfigs] = useState<ClassSlaConfig[]>([
    { className: "Turma A - Desenvolvimento Web", defaultSlaHours: 48, breachRate: "12%", riskLevel: "baixo" },
    { className: "Turma B - Algoritmos Avançados", defaultSlaHours: 24, breachRate: "42%", riskLevel: "alto" },
    { className: "Turma C - Banco de Dados", defaultSlaHours: 36, breachRate: "28%", riskLevel: "medio" },
    { className: "Turma D - Engenharia de Software", defaultSlaHours: 48, breachRate: "18%", riskLevel: "baixo" }
  ]);
  
  const [editingClass, setEditingClass] = useState<ClassSlaConfig | null>(null);
  const [newSlaValue, setNewSlaValue] = useState<number>(24);

  const handleExportXLSX = async () => {
    setExporting(true);
    try {
      // Tentar buscar do backend
      const res = await fetch(apiUrl("/api/sla/violations-history"));
      let violations = [];
      if (res.ok) {
        const data = await safeJsonResponse(res);
        if (data?.violations) violations = data.violations;
      }

      // Filtrar se turma estiver selecionada
      if (selectedClass !== "Todas" && violations.length > 0) {
        violations = violations.filter((v: any) => v.class_name.includes(selectedClass) || selectedClass.includes(v.class_name));
      }

      exportSlaViolationsHistoryXLSX({
        violations: violations.length > 0 ? violations : undefined,
        institution: "SENAI - Serviço Nacional de Aprendizagem Industrial",
        filterClass: selectedClass,
        fileName: `Relatorio_Violacoes_SLA_${selectedClass.replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`
      });

      toast.success("📊 Relatório XLSX de violações de SLA exportado com sucesso com campos de Tempo de Resposta, Limite SLA e Status de Alerta!");
    } catch (e: any) {
      toast.error(`Erro ao exportar XLSX: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Days of the week and Time slots for heatmap
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const timeSlots = ["08:00 - 10:00", "10:00 - 12:00", "14:00 - 16:00", "16:00 - 18:00", "19:00 - 21:00", "21:00 - 23:00"];

  // Mock heatmap breach intensity data (0 to 10 scale or percentage)
  // [dayIndex][timeIndex]
  const heatmapGrid: Record<string, number[][]> = {
    "Todas": [
      [2, 3, 5, 4, 8, 9],
      [1, 2, 4, 6, 9, 8],
      [3, 4, 6, 8, 7, 6],
      [2, 3, 3, 5, 8, 9],
      [1, 1, 2, 4, 6, 5],
      [0, 1, 2, 3, 4, 4]
    ],
    "Turma A - Desenvolvimento Web": [
      [1, 1, 2, 2, 3, 4],
      [1, 1, 2, 3, 4, 3],
      [2, 2, 3, 4, 3, 3],
      [1, 2, 2, 3, 4, 4],
      [1, 1, 1, 2, 3, 2],
      [0, 0, 1, 1, 2, 2]
    ],
    "Turma B - Algoritmos Avançados": [
      [4, 6, 8, 7, 9, 10],
      [3, 5, 7, 9, 10, 9],
      [5, 7, 9, 10, 8, 8],
      [4, 6, 6, 8, 9, 10],
      [2, 3, 4, 6, 8, 7],
      [1, 2, 3, 5, 6, 6]
    ],
    "Turma C - Banco de Dados": [
      [2, 3, 4, 4, 6, 7],
      [2, 3, 4, 5, 7, 6],
      [3, 4, 5, 6, 6, 5],
      [2, 3, 3, 4, 6, 7],
      [1, 2, 2, 3, 5, 4],
      [0, 1, 1, 2, 3, 3]
    ],
    "Turma D - Engenharia de Software": [
      [1, 2, 3, 2, 4, 5],
      [1, 2, 3, 3, 5, 4],
      [2, 2, 3, 4, 4, 3],
      [1, 2, 2, 3, 4, 5],
      [1, 1, 1, 2, 3, 3],
      [0, 0, 1, 1, 2, 2]
    ]
  };

  const currentGrid = heatmapGrid[selectedClass] || heatmapGrid["Todas"];

  const getCellColor = (val: number) => {
    if (val >= 8) return "bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/30 border-rose-400";
    if (val >= 5) return "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 border-amber-400";
    if (val >= 3) return "bg-yellow-500/40 text-yellow-200 border-yellow-500/30";
    if (val >= 1) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/20";
    return "bg-slate-950/60 text-slate-600 border-slate-800/60";
  };

  const handleSaveSlaAdjustment = () => {
    if (!editingClass) return;
    setClassConfigs(classConfigs.map(c => 
      c.className === editingClass.className 
        ? { ...c, defaultSlaHours: newSlaValue, riskLevel: newSlaValue < 24 ? "alto" : newSlaValue < 40 ? "medio" : "baixo" } 
        : c
    ));
    toast.success(`SLA ajustado com sucesso para ${editingClass.className}: ${newSlaValue} horas.`);
    setEditingClass(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">Mapa de Calor de Estouro de SLA (Prazos)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Visualize em quais horários e dias da semana as turmas mais estouram os prazos de submissão</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportXLSX}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Exportar histórico consolidado de violações de SLA de todos os alunos em planilha XLSX"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{exporting ? "Gerando..." : "Exportar Violações XLSX"}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-xs text-white font-mono focus:outline-none cursor-pointer"
            >
              <option value="Todas" className="bg-slate-950 text-white">Todas as Turmas (Consolidado)</option>
              {classConfigs.map((c) => (
                <option key={c.className} value={c.className} className="bg-slate-950 text-white">
                  {c.className}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info Banner / Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {classConfigs.map((cls) => (
          <div 
            key={cls.className} 
            onClick={() => {
              setEditingClass(cls);
              setNewSlaValue(cls.defaultSlaHours);
            }}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate max-w-[170px]" title={cls.className}>{cls.className}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                cls.riskLevel === "alto" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                cls.riskLevel === "medio" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}>
                SLA: {cls.defaultSlaHours}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Taxa de estouro: <strong className="text-white">{cls.breachRate}</strong></span>
              <span className="text-[11px] text-indigo-400 font-mono group-hover:underline flex items-center gap-1">
                Ajustar <Sliders className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap Matrix */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Matriz de Ocorrências de Estouro ({selectedClass})
          </span>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-950 border border-slate-800"></span> Baixo</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/30"></span> Moderado</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"></span> Alto</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500"></span> Crítico</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-mono text-slate-500 border-b border-slate-800">Horário \ Dia</th>
                {days.map((day) => (
                  <th key={day} className="p-3 text-center text-xs font-mono text-slate-300 font-bold border-b border-slate-800">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, timeIdx) => (
                <tr key={slot} className="border-b border-slate-900">
                  <td className="p-3 text-xs font-mono text-slate-400 font-bold whitespace-nowrap">
                    {slot}
                  </td>
                  {days.map((_, dayIdx) => {
                    const val = currentGrid[dayIdx]?.[timeIdx] || 0;
                    return (
                      <td key={dayIdx} className="p-2 text-center">
                        <div 
                          title={`${days[dayIdx]} às ${slot}: Indice de estouro ${val}/10`}
                          className={`w-full py-3 rounded-xl border flex items-center justify-center text-xs font-mono transition-all hover:scale-105 cursor-pointer ${getCellColor(val)}`}
                          onClick={() => {
                            toast.info(`Foco em ${days[dayIdx]} (${slot}): ${val * 3.5}% das submissões estouraram o SLA.`);
                          }}
                        >
                          {val}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal / Drawer */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h4 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                Ajustar Limite SLA por Turma
              </h4>
              <button 
                onClick={() => setEditingClass(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs text-slate-400 font-mono">Turma Selecionada:</span>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white font-mono">
                {editingClass.className}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs text-slate-400 font-mono">Novo Prazo Padrão de SLA (Horas):</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="12"
                  max="120"
                  step="6"
                  value={newSlaValue}
                  onChange={(e) => setNewSlaValue(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <span className="px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-mono text-sm font-bold min-w-[70px] text-center">
                  {newSlaValue}h
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Aumentar o prazo reduz o volume de falsos positivos de estouro de SLA para turmas com carga horária intensiva.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditingClass(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSlaAdjustment}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-mono font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Salvar Novo SLA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

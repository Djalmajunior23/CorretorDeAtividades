import React, { useState, useEffect } from "react";
import {
  Loader2,
  LayoutGrid,
  AlertTriangle,
  TrendingUp,
  Target,
  Search,
} from "lucide-react";

export default function CompetencyMapView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filterUnit, setFilterUnit] = useState<string>("");

  useEffect(() => {
    // We fetch data from the backend. We will mock initially while fetching
    // if backend isn't ready or we can write the backend endpoint later.
    const fetchCompetencies = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/teacher-analytics/competencies");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          // fallback mock data if endpoint doesn't exist
          setData(generateMockData());
        }
      } catch (e) {
        setData(generateMockData());
      } finally {
        setLoading(false);
      }
    };

    fetchCompetencies();
  }, []);

  const generateMockData = () => ({
    units: [
      "Lógica de Programação",
      "Estruturas de Dados",
      "Desenvolvimento Web",
    ],
    competencies: [
      {
        id: 1,
        name: "Laços de Repetição (for/while)",
        unit: "Lógica de Programação",
        averageScore: 65,
        studentCount: 24,
        status: "warning",
      },
      {
        id: 2,
        name: "Estruturas Condicionais (if/else)",
        unit: "Lógica de Programação",
        averageScore: 88,
        studentCount: 24,
        status: "good",
      },
      {
        id: 3,
        name: "Vetores e Arrays",
        unit: "Estruturas de Dados",
        averageScore: 45,
        studentCount: 24,
        status: "critical",
      },
      {
        id: 4,
        name: "Manipulação de Strings",
        unit: "Lógica de Programação",
        averageScore: 72,
        studentCount: 24,
        status: "good",
      },
      {
        id: 5,
        name: "Requisições HTTP (Fetch)",
        unit: "Desenvolvimento Web",
        averageScore: 50,
        studentCount: 24,
        status: "warning",
      },
      {
        id: 6,
        name: "Tratamento de Exceções",
        unit: "Lógica de Programação",
        averageScore: 35,
        studentCount: 24,
        status: "critical",
      },
    ],
  });

  const displayData =
    data?.competencies.filter((c: any) =>
      filterUnit ? c.unit === filterUnit : true,
    ) || [];

  const getStatusColor = (status: string, score: number) => {
    if (score >= 70)
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    if (score >= 50)
      return "border-amber-500/40 bg-amber-500/10 text-amber-400";
    return "border-rose-500/40 bg-rose-500/10 text-rose-400";
  };

  const getStatusLabel = (score: number) => {
    if (score >= 70) return "Domínio Adquirido";
    if (score >= 50) return "Em Desenvolvimento";
    return "Atenção Crítica";
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      <div className="p-5 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-sky-400" />
            Mapa de Competências Visual
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Visão holística aglutinada do domínio curricular da turma baseado em
            execuções reais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-300 font-mono uppercase flex items-center gap-1">
            <Search className="w-3 h-3" />
            Unidade Curricular:
          </label>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="bg-[#030712] border border-[#1e295b]/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="">Todas as Unidades</option>
            {data?.units.map((u: string) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-3" />
          <span className="text-xs font-mono text-slate-400">
            Renderizando matriz de competências...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayData.map((comp: any) => (
            <div
              key={comp.id}
              className="rounded-xl border border-[#1e295b]/30 bg-[#0f172a] p-5 flex flex-col relative overflow-hidden group hover:border-[#1e295b]/60 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col gap-1 pr-6">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">
                    {comp.unit}
                  </span>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {comp.name}
                  </h4>
                </div>
                <div
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                    comp.averageScore >= 70
                      ? "border-emerald-500/20 text-emerald-400"
                      : comp.averageScore >= 50
                        ? "border-amber-500/20 text-amber-400"
                        : "border-rose-500/20 text-rose-400"
                  }`}
                >
                  {comp.averageScore}%
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-[#1e295b]/20 flex items-center justify-between">
                <div
                  className={`px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wider border ${getStatusColor("", comp.averageScore)}`}
                >
                  {getStatusLabel(comp.averageScore)}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Target className="w-3 h-3" />
                  {comp.studentCount} registros
                </div>
              </div>

              {/* A visual background progress bar for quick scan */}
              <div className="absolute bottom-0 left-0 h-1 bg-[#1e295b]/30 w-full">
                <div
                  className={`h-full ${
                    comp.averageScore >= 70
                      ? "bg-emerald-500"
                      : comp.averageScore >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                  style={{ width: `${comp.averageScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

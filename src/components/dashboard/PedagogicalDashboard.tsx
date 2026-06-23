
import React, { useState, useEffect } from "react";
import { apiUrl, safeJsonResponse } from "../../config/api";
import { 
  PlusCircle, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  BookOpen, 
  Brain, 
  ChevronRight,
  TrendingDown,
  Activity,
  Award
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from "recharts";

export default function PedagogicalDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState("Turma de Desenvolvimento Web 1A");
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSummary, resClasses] = await Promise.all([
            fetch(apiUrl("/api/pedagogical/dashboard-summary")),
            fetch(apiUrl("/api/class-comparison-analytics"))
        ]);

        if (resSummary.ok) setData(await resSummary.json());
        if (resClasses.ok) setClasses(await resClasses.json());
      } catch (e) {
        console.error("Error loading pedagogical dash", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchIntelligence = async () => {
      if (!selectedClass) return;
      try {
        const res = await fetch(apiUrl(`/api/pedagogical/class-intelligence/${encodeURIComponent(selectedClass)}`));
        if (res.ok) setIntelligence(await res.json());
      } catch (e) {
        console.error("Error loading intelligence", e);
      }
    };
    fetchIntelligence();
  }, [selectedClass]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-pulse">
        <Activity className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Processando Motor Pedagógico...</p>
      </div>
    );
  }

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

  const topicsData = [
    { name: "Sintaxe", value: 85 },
    { name: "Lógica", value: 65 },
    { name: "Vetores", value: 45 },
    { name: "Funções", value: 30 },
    { name: "IO/Files", value: 90 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Indicators and Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-2xl border border-[#1e295b]/30">
          <div className="flex flex-col gap-1">
              <h2 className="text-white font-bold text-lg">Diagnóstico Pedagógico</h2>
              <p className="text-xs text-slate-500 font-mono">Visão consolidada de desempenho e intervenção sugerida.</p>
          </div>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 bg-[#030712] border border-[#1e295b]/40 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer min-w-[280px]"
          >
            {classes.map((c, i) => (
                <option key={i} value={c.class_name}>{c.class_name}</option>
            ))}
          </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          label="Corrigidas" 
          val={data?.corrigidas || 0} 
          icon={CheckCircle} 
          trend="+12%" 
          positive={true} 
        />
        <StatCard 
          label="Média Geral" 
          val={`${data?.media_geral || 0}%`} 
          icon={Award} 
          trend="-2%" 
          positive={false} 
        />
        <StatCard 
          label="Em Risco" 
          val={data?.alunos_risco || 0} 
          icon={AlertTriangle} 
          trend="-5" 
          positive={true} 
        />
        <StatCard 
          label="Top Linguagem" 
          val={data?.top_linguagem || "N/A"} 
          icon={Zap} 
        />
        <StatCard 
          label="Ponto Crítico" 
          val="Recursão" 
          icon={Target} 
          color="text-rose-400"
        />
        <StatCard 
          label="Evolução" 
          val={data?.evolucao_turma || "0%"} 
          icon={TrendingUp} 
          positive={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topic Heatmap / Distribuition */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0f172a] border border-[#1e295b]/30 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Domínio por Conteúdo (Heatmap)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">BASEADO EM 1.2K SUBMISSÕES</span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  fontFamily="JetBrains Mono"
                  width={100}
                />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   content={({active, payload}) => {
                     if (active && payload && payload.length) {
                       return (
                         <div className="bg-slate-900 border border-slate-800 p-2 rounded shadow-2xl">
                           <p className="text-xs font-mono text-emerald-400">{payload[0].value}% de Aproveitamento</p>
                         </div>
                       )
                     }
                     return null;
                   }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {topicsData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value > 80 ? '#10b981' : entry.value > 50 ? '#6366f1' : '#ef4444'} 
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0f172a] border border-[#1e295b]/30 shadow-xl flex flex-col gap-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            Insights e Sugestões IA
          </h3>

          <div className="space-y-4">
            {intelligence?.recommendations?.map((rec: string, i: number) => (
               <RecommendationItem 
                 key={i}
                 type={rec.toLowerCase().includes("atencão") || rec.toLowerCase().includes("revisar") ? "warning" : "info"} 
                 title="Sugestão de Intervenção" 
                 desc={rec}
               />
            ))}
            {!intelligence?.recommendations && (
                <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-mono">Processando novos dados...</p>
                </div>
            )}
          </div>

          <button className="mt-auto px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2">
            <span>Gerar Atividade de Recuperação</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, val, icon: Icon, trend, positive, color = "text-emerald-400" }: any) {
  return (
    <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e295b]/20 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Icon className={`w-4 h-4 ${color}`} />
        {trend && (
          <span className={`text-[10px] font-bold font-mono ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">{label}</span>
        <span className="text-xl font-black text-white tracking-tight">{val}</span>
      </div>
    </div>
  )
}

function RecommendationItem({ type, title, desc }: any) {
  const styles = {
    warning: "border-amber-500/20 bg-amber-500/5 text-amber-200",
    success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200",
    info: "border-indigo-500/20 bg-indigo-500/5 text-indigo-200"
  };

  const icons = {
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 mt-1 shrink-0" />,
    success: <CheckCircle className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />,
    info: <Zap className="w-4 h-4 text-indigo-500 mt-1 shrink-0" />
  };

  return (
    <div className={`p-4 rounded-xl border ${styles[type as keyof typeof styles]} flex gap-3`}>
      {icons[type as keyof typeof icons]}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold leading-none">{title}</span>
        <p className="text-[10px] leading-relaxed opacity-70">{desc}</p>
      </div>
    </div>
  )
}

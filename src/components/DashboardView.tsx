import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Users, Terminal, Award, AlertTriangle, FileText, 
  HelpCircle, Clock, CheckCircle2, ArrowRight, Zap, RefreshCw,
  Bell, ChevronRight, BarChart3, ShieldCheck
} from "lucide-react";

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [loading, setLoading] = useState(false);

  // Hardcoded or dynamically updated stats aligned to "Teacher Productivity"
  const [stats, setStats] = useState({
    toCorrectCount: 14,
    activeClasses: 4,
    criticalCompetencies: 3,
    pendingRecoveries: 5,
    weeklyPlanningCount: 8,
    pendingReports: 2,
    alertsCount: 4
  });

  const alerts = [
    { id: 1, type: "danger", title: "Carga Horária Crítica", desc: "A Turma Desarrollo Web 1A está com desvio de -8h no cronograma planejado.", time: "há 10 min" },
    { id: 2, type: "warning", title: "Competência Descoberta", desc: "Competência 'Estruturas de Dados Dinâmicas' prevista para esta semana não foi associada a nenhuma avaliação.", time: "há 1 hora" },
    { id: 3, type: "info", title: "Recuperação Iniciada", desc: "3 alunos ingressaram automaticamente no módulo de recuperação em Lógica de Programação.", time: "há 2 horas" },
    { id: 4, type: "success", title: "Parecer Técnico Concluído", desc: "O feedback consolidado da Unidade Curricular de Banco de Dados foi gerado via IA.", time: "há 4 horas" }
  ];

  const classList = [
    { name: "Turma de Desenvolvimento Web 1A", uc: "Lógica e Algoritmos", progress: 68, activeStudents: 24, nextAssessment: "Simulado SAEP Técnica" },
    { name: "Análise de Sistemas 2B", uc: "Bancos de Dados Relacionais", progress: 42, activeStudents: 18, nextAssessment: "Projeto Prático Integrador" },
    { name: "Sistemas Embarcados 1C", uc: "Arquitetura e I/O", progress: 85, activeStudents: 15, nextAssessment: "Prova de Recuperação Alternativa" },
    { name: "Programação Mobile 4A", uc: "Desenvolvimento Android Native", progress: 15, activeStudents: 20, nextAssessment: "Teste de Competência Inicial" }
  ];

  const pendingGrades = [
    { student: "Carlos Henrique Souza", activity: "Algoritmos de Ordenação", lang: "python", date: "Hoje, 14:32" },
    { student: "Beatriz Oliveira Costa", activity: "Modelagem Entidade Relacionamento", lang: "sql", date: "Hoje, 12:11" },
    { student: "Daniel Santos Ramos", activity: "Manipulação de Pontes e Vetores", lang: "c", date: "Ontem, 18:40" }
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto flex flex-col gap-8 text-slate-100"
    >
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
            Plataforma Centralizada de Produtividade Docente
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display mt-1">
            Cockpit de Gestão e Comando
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe cronogramas, feedbacks pendentes, matrizes operacionais de competência e alertas em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sincronizar Dados
          </button>
          
          <div className="flex items-center gap-2 bg-[#10b981]/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">MODO DOCENTE ATIVO</span>
          </div>
        </div>
      </div>

      {/* Grid of operational summaries */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: To correct */}
        <div 
          onClick={() => onNavigate("corrector")} 
          className="group rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-widest">Pendente</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white leading-none tracking-tight">{stats.toCorrectCount}</span>
            <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide font-mono">Submissões a Corrigir</h4>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Trabalhos aguardando execução estruturada ou rubrica de correção.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono mt-4 opacity-0 group-hover:opacity-100 transition-all">
            Ir para Correções
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Competency gaps */}
        <div 
          onClick={() => onNavigate("competencies")} 
          className="group rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/10">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-widest">Alerta</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white leading-none tracking-tight">{stats.criticalCompetencies}</span>
            <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide font-mono">Competências Críticas</h4>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Assuntos do programa pedagógico apresentando defasagem estatística.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono mt-4 opacity-0 group-hover:opacity-100 transition-all">
            Ver Competências
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Pending recovery */}
        <div 
          onClick={() => onNavigate("recuperacao")} 
          className="group rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/10">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-widest">Ativo</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white leading-none tracking-tight">{stats.pendingRecoveries}</span>
            <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide font-mono">Planos de Recuperação</h4>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Estudantes recebendo instrução adaptativa e replanejamento complementar.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono mt-4 opacity-0 group-hover:opacity-100 transition-all">
            Ver Recuperações
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Classes actives */}
        <div 
          onClick={() => onNavigate("turmas")} 
          className="group rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-widest">Ativas</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white leading-none tracking-tight">{stats.activeClasses}</span>
            <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide font-mono">Turmas Associadas</h4>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Consolidação de frequência, diários letivos e aproveitamento semanal.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono mt-4 opacity-0 group-hover:opacity-100 transition-all">
            Ir para Turmas
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* Main Row: Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Recent Active Classes and Planning overview */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Status das Unidades Curriculares</h3>
                <p className="text-xs text-slate-400">Turmas, cumprimento de carga horária e planos de aula estruturados.</p>
              </div>
              <button 
                onClick={() => onNavigate("planejamento")}
                className="text-xs font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Gerenciar Planejamento
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {classList.map((cls, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-white">{cls.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                        {cls.uc}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {cls.activeStudents} Alunos Ativos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Progresso UC</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${cls.progress}%` }} />
                        </div>
                        <span className="text-xs font-mono font-semibold text-white">{cls.progress}%</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Próxima Meta</span>
                      <span className="text-xs text-slate-300 font-semibold">{cls.nextAssessment}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Próximos Conteúdos Planejados (Semana)</h3>
                <p className="text-xs text-slate-400 font-mono">Sincronizado diretamente com a Matriz Curricular Integrada.</p>
              </div>
              <span className="text-xs text-slate-500 font-mono font-bold">8 Aulas Previstas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Turma Web 1A</span>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">Amanhã, 08:30</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">Recursividade Aplicada e Call Stack</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Apresentar conceitos de recursão pura vs cauda. Utilizar simulação interativa integrada.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-900 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>CH: 4 horas</span>
                  <span className="text-emerald-400 font-mono text-[9px] font-bold">● VINCULADO AO DIÁRIO</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded uppercase">Análise 2B</span>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">15/Jun, 19:15</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">Modelagem Relacional de Dados</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Formas normais complementares e integridade referencial prática com simulador local SQL.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-900 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>CH: 3 horas</span>
                  <span className="text-emerald-400 font-mono text-[9px] font-bold">● VINCULADO AO DIÁRIO</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Alerts and Pending Queue */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Alerts card */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              Notificações e Alertas
            </h3>
            <p className="text-xs text-slate-400 mb-4">Intercorrências detectadas pela IA no planejamento ou turmas.</p>

            <div className="flex flex-col gap-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3.5 rounded-xl border flex gap-3 ${
                    alert.type === "danger" 
                      ? "bg-rose-500/5 border-rose-500/20 text-rose-200" 
                      : alert.type === "warning" 
                      ? "bg-amber-500/5 border-amber-500/20 text-amber-200" 
                      : alert.type === "info" 
                      ? "bg-cyan-500/5 border-cyan-500/20 text-cyan-200" 
                      : "bg-emerald-500/5 border-emerald-500/10 text-emerald-200"
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    alert.type === "danger" ? "text-rose-400" : alert.type === "warning" ? "text-amber-400" : alert.type === "info" ? "text-cyan-400" : "text-emerald-400"
                  }`} />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold leading-normal">{alert.title}</span>
                      <span className="text-[9px] text-slate-500 font-mono text-right font-normal shrink-0">{alert.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick grade queue */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-1">Últimas Submissões</h3>
            <p className="text-xs text-slate-400 mb-4">Envios recentes aguardando validação de critérios.</p>

            <div className="flex flex-col gap-3">
              {pendingGrades.map((grade, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200">{grade.student}</span>
                    <span className="text-[10px] text-slate-500">{grade.activity}</span>
                    <span className="text-[9px] font-mono font-bold text-amber-500 uppercase">{grade.lang} (Aguardando)</span>
                  </div>
                  <button 
                    onClick={() => onNavigate("corrector")}
                    className="p-1 px-3 bg-slate-800 text-slate-300 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-mono font-bold rounded-lg cursor-pointer border border-slate-700/60"
                  >
                    COREGIR
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}

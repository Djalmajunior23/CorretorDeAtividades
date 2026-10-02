import React, { useState } from "react";
import { 
  Zap, 
  Terminal, 
  Settings, 
  History, 
  Database, 
  CheckCircle, 
  XOctagon, 
  Layers,
  Activity,
  BookOpen,
  BarChart3,
  BarChart2,
  Sparkles,
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Award,
  Users,
  RefreshCw,
  FileText,
  FlaskConical,
  FileSearch,
  ClipboardList,
  Library,
  FileCheck,
  HelpCircle,
  Cpu,
  TrendingUp,
  Brain,
  Eye,
  Network,
  Swords,
  GitPullRequest,
  Bug,
  Building2,
  ShieldAlert,
  Flame,
  GraduationCap,
  Volume2,
  Radio,
  ShieldCheck,
  GitBranch,
  Lightbulb,
  Target,
  Sliders,
  GitCompare,
  ArrowRightLeft,
  EyeOff,
  MessageSquare,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  currentTab?: string;
  setTab?: (tab: string) => void;
  dbConnected?: boolean;
  featureFlags?: any;
  onOpenExportModal?: () => void;
  onOpenCommandPalette?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  desc: string;
  visible?: boolean;
  isNew?: boolean;
}

interface NavPillar {
  id: string;
  title: string;
  icon: any;
  color: string;
  items: NavItem[];
}

export default function Sidebar({ 
  currentTab = "dashboard", 
  setTab = () => {}, 
  dbConnected = true,
  featureFlags = {},
  onOpenExportModal = () => {},
  onOpenCommandPalette = () => {}
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openPillars, setOpenPillars] = useState<Record<string, boolean>>({
    ensino: true,
    atividades: true,
    correcao: true,
    aprendizagem: true,
    gestao: true,
    administracao: true
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("codecheck_favorites");
      return saved ? JSON.parse(saved) : ["dashboard", "teacher_review_queue", "guided_refactoring", "activity_validator"];
    } catch {
      return ["dashboard", "teacher_review_queue", "guided_refactoring", "activity_validator"];
    }
  });

  const togglePillar = (pillarId: string) => {
    setOpenPillars(prev => ({ ...prev, [pillarId]: !prev[pillarId] }));
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem("codecheck_favorites", JSON.stringify(next));
      return next;
    });
  };

  // 6 Core Pedagogical Pillars Configuration
  const pillars: NavPillar[] = [
    {
      id: "ensino",
      title: "1. Ensino & Sala de Aula",
      icon: BookOpen,
      color: "text-emerald-400",
      items: [
        { id: "class_operations_central", label: "Central de Operações da Turma", icon: Activity, desc: "Cockpit Operacional, Entregas & Falhas", isNew: true },
        { id: "teacher_my_day", label: "Meu Dia Docente", icon: Briefcase, desc: "Agenda Diária, Materiais & Retomada 1-Clique", isNew: true },
        { id: "teacher_action_queue", label: "Fila Inteligente de Trabalho", icon: ClipboardList, desc: "Triagem de Correções, Dúvidas & Reforços", isNew: true },
        { id: "smart_lesson_planner", label: "Preparação da Próxima Aula", icon: Sparkles, desc: "Roteiro em 5 Blocos Baseado em Evidências", isNew: true },
        { id: "quick_understanding_check", label: "Verificação Rápida (Exit Ticket)", icon: HelpCircle, desc: "Checkpoints de Entendimento & Predição de Código", isNew: true },
        { id: "assisted_class_diary", label: "Registro de Aula Assistido", icon: BookOpen, desc: "Diário Homologado com Evidências de Bancada", isNew: true },
        { id: "dashboard", label: "Dashboard Docente", icon: Briefcase, desc: "Central de Comando & Métricas" },
        { id: "notas", label: "Caderneta & Gestão de Notas", icon: Award, desc: "Lançamento de Notas, Médias & Boletim Oficial", isNew: true },
        { id: "live_lab_companion", label: "Modo Bancada (Ao Vivo)", icon: Radio, desc: "Mapa de Mesas & Dúvidas em Tempo Real" },
        { id: "teacher_superpowers", label: "Superpoderes Docentes", icon: Sparkles, desc: "Ações 1-Clique, Omnikit & Autopilot" },
        { id: "diary", label: "Diário de Classe", icon: BookOpen, desc: "Registro Inteligente de Frequência & Aulas" },
        { id: "planejamento", label: "Planejamento Semestral", icon: Layers, desc: "Ecosistema Curricular & Cronograma" },
        { id: "turmas", label: "Turmas & Alunos", icon: Users, desc: "Gestão Corporativa de Turmas" },
        { id: "materiais", label: "Materiais & Apoio", icon: Library, desc: "Repositório Didático & Apostilas" }
      ]
    },
    {
      id: "atividades",
      title: "2. Atividades & Avaliações",
      icon: Target,
      color: "text-cyan-400",
      items: [
        { id: "student_experience_preview", label: "Prévia como Aluno", icon: Eye, desc: "Experiência do Estudante & Ensaio", isNew: true },
        { id: "activity_validator", label: "Validador Pré-Publicação", icon: ShieldCheck, desc: "QA Automatizado do Gabarito & Rubrica", isNew: true },
        { id: "pedagogical_authoring", label: "Estúdio de Autoria", icon: BookOpen, desc: "Criação de Atividades, SA & Desafios" },
        { id: "question_bank", label: "Banco de Questões", icon: Database, desc: "Questões & Desafios com IA" },
        { id: "parametric_exam", label: "Provas Paramétricas Anti-Cola", icon: ShieldCheck, desc: "Variantes A/B/C/D & Dossiê PDF" },
        { id: "item_bank_studio", label: "Banco de Itens (TRI)", icon: Layers, desc: "Engenharia de Provas & Distratores" }
      ]
    },
    {
      id: "correcao",
      title: "3. Correção & Auditoria",
      icon: Terminal,
      color: "text-amber-400",
      items: [
        { id: "blind_grading_studio", label: "Correção sem Identificação", icon: EyeOff, desc: "Avaliação Duplo-Cega por Pseudônimos", isNew: true },
        { id: "reusable_feedback_bank", label: "Banco de Feedback @Tags", icon: MessageSquare, desc: "Biblioteca de Snippets por Competência", isNew: true },
        { id: "teacher_review_queue", label: "Central de Revisão Docente", icon: ShieldCheck, desc: "Fila de Triagem, Recursos & Homologação", isNew: true },
        { id: "batch", label: "Correção em Lote (ZIP/CSV)", icon: Layers, desc: "Processamento Massivo com Mapeamento" },
        { id: "similarity", label: "Similaridade & Plágio", icon: FileSearch, desc: "Análise Estática & Comparação Forense" },
        { id: "avaliacoes", label: "Histórico de Avaliações", icon: FileText, desc: "Submissões, Notas & Pareceres" },
        { id: "diagram_assessment", label: "Diagramas & Modelagem", icon: Network, desc: "Auditoria DER, DDL & UML" }
      ]
    },
    {
      id: "aprendizagem",
      title: "4. Aprendizagem & Evolução",
      icon: Brain,
      color: "text-indigo-400",
      items: [
        { id: "guided_refactoring", label: "Ciclo de Refação Orientada", icon: RefreshCw, desc: "Scaffolding, Dicas & Justificativa", isNew: true },
        { id: "student_portal", label: "Portal do Aluno", icon: GraduationCap, desc: "Ambiente do Estudante & Submissões" },
        { id: "pedagogical_tracks", label: "Trilhas de Aprendizagem", icon: ClipboardList, desc: "Planos de Estudos & Nivelamento" },
        { id: "competencies", label: "Competências & Habilidades", icon: Award, desc: "Matriz Curricular SENAI" },
        { id: "skill_tree", label: "Skill Tree & Portfólio", icon: Network, desc: "Grafo Curricular & Portfólio Tech" },
        { id: "socratic_tutor", label: "Tutor Socrático Adaptativo", icon: Lightbulb, desc: "Mentoria Guiada em 4 Degraus" }
      ]
    },
    {
      id: "gestao",
      title: "5. Gestão & Diagnóstico",
      icon: BarChart3,
      color: "text-fuchsia-400",
      items: [
        { id: "pedagogical_config_hierarchy", label: "Configurações em Cascata", icon: Sliders, desc: "Instituição ➔ Turma ➔ Atividade", isNew: true },
        { id: "unified_notification_center", label: "Centro de Notificações", icon: Bell, desc: "Avisos Multi-Canal & Privacidade", isNew: true },
        { id: "grade_rule_simulator", label: "Simulador de Regras de Notas", icon: Sliders, desc: "What-If de Pesos, Recuperação & Descarte", isNew: true },
        { id: "cohort_comparison", label: "Comparação entre Ofertas", icon: GitCompare, desc: "Análise Longitudinal & Discrepâncias de Rubricas", isNew: true },
        { id: "teacher_handover", label: "Passagem de Turma (Dossiê)", icon: ArrowRightLeft, desc: "Transição Pedagógica Segura com Selo SHA-256", isNew: true },
        { id: "diagnostic_intervention", label: "Diagnóstico & Intervenção", icon: Activity, desc: "Clusters de Erros & Reforço 1-Clique", isNew: true },
        { id: "educational_analytics", label: "Analytics Educacional", icon: TrendingUp, desc: "Indicadores de Aprendizagem & Risco" },
        { id: "reports", label: "Pareceres & Relatórios", icon: FileCheck, desc: "Documentos Oficiais & Exportação PDF/XLSX" },
        { id: "saep_readiness", label: "Simulador SAEP / ENADE", icon: GraduationCap, desc: "Matriz CHA, TRI & Plano de Ação" }
      ]
    },
    {
      id: "administracao",
      title: "6. Administração & Infraestrutura",
      icon: Settings,
      color: "text-rose-400",
      items: [
        { id: "sql_dialect_lab", label: "Laboratório SQL Multi-Dialeto", icon: Database, desc: "PostgreSQL, MySQL & SQLite Isolados", isNew: true },
        { id: "peer_review", label: "Revisão por Pares (Peer Review)", icon: Users, desc: "Avaliação Duplo-Cega & Moderação", isNew: true },
        { id: "system_health", label: "Saúde do Sistema & Observabilidade", icon: Activity, desc: "Telemetria Real de BD, IA & Sandbox" },
        { id: "git_autograde", label: "GitHub & GitLab CI/CD", icon: GitBranch, desc: "Webhooks & Auto-Grading Remoto" },
        { id: "settings", label: "Configurações de Segurança", icon: Settings, desc: "Chaves de Criptografia & Cofre AES-GCM" }
      ]
    }
  ];

  // Flat all items helper for search and favorites
  const allNavItems = pillars.flatMap(p => p.items);
  const favoriteItems = allNavItems.filter(item => favorites.includes(item.id));

  return (
    <aside className={`${isCollapsed ? "w-20" : "w-72"} transition-all duration-300 bg-[#040815] border-r border-slate-800/80 flex flex-col h-full select-none z-50 shrink-0 shadow-2xl`}>
      {/* Brand Header */}
      <div className="h-20 border-b border-slate-800/80 px-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white font-display tracking-wide">CodeCheck 2026</span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Zero Trust • ASVS 5.0
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all mx-auto cursor-pointer"
          title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Global Quick Search / Shortcut Palette Button */}
      {!isCollapsed && (
        <div className="p-3 border-b border-slate-800/60 flex flex-col gap-2">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono transition-all"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Buscar módulo...</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">Ctrl+K</kbd>
          </button>

          {/* Quick Filter inside Sidebar */}
          <input
            type="text"
            placeholder="Filtrar menus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      )}

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 scrollbar-thin">
        {/* FAVORITES SECTION (Pinned Quick Access) */}
        {!isCollapsed && favoriteItems.length > 0 && !searchQuery && (
          <div className="flex flex-col gap-1 pb-3 border-b border-slate-800/60">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-400 flex items-center gap-1.5 px-2 mb-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              Favoritos Fixados
            </span>
            <div className="flex flex-col gap-1">
              {favoriteItems.map(item => {
                const Icon = item.icon;
                const isSelected = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all text-left group ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                        : "text-slate-300 hover:bg-slate-900/60 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-slate-400 group-hover:text-amber-300"}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <Star
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 hover:scale-125 transition-transform"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6 PILLARS ACCORDION */}
        {pillars.map(pillar => {
          const PillarIcon = pillar.icon;
          const isOpen = openPillars[pillar.id] ?? true;

          const filteredItems = pillar.items.filter(item => {
            if (!searchQuery) return true;
            return item.label.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase());
          });

          if (filteredItems.length === 0) return null;

          return (
            <div key={pillar.id} className="flex flex-col gap-1">
              {!isCollapsed && (
                <button
                  onClick={() => togglePillar(pillar.id)}
                  className="flex items-center justify-between px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <PillarIcon className={`w-3.5 h-3.5 ${pillar.color}`} />
                    <span className="text-[11px] font-bold text-slate-300">{pillar.title}</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                </button>
              )}

              {(isOpen || isCollapsed || searchQuery) && (
                <div className="flex flex-col gap-1 pl-1">
                  {filteredItems.map(item => {
                    const ItemIcon = item.icon;
                    const isSelected = currentTab === item.id;
                    const isFav = favorites.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        title={item.desc}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left group cursor-pointer ${
                          isSelected
                            ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm font-semibold"
                            : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <ItemIcon className={`w-4 h-4 shrink-0 ${isSelected ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                          {!isCollapsed && (
                            <span className="truncate font-sans text-xs flex items-center gap-1.5">
                              <span>{item.label}</span>
                              {item.isNew && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-500/30 text-cyan-300 border border-cyan-500/40">
                                  NOVO
                                </span>
                              )}
                            </span>
                          )}
                        </span>

                        {!isCollapsed && (
                          <Star
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className={`w-3.5 h-3.5 shrink-0 transition-all ${
                              isFav
                                ? "text-amber-400 fill-amber-400"
                                : "text-transparent group-hover:text-slate-600 hover:text-amber-400"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80 bg-[#030612] flex flex-col gap-2 text-xs font-mono">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] text-slate-500">PostgreSQL + Sandbox</span>
            <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400 mx-auto animate-pulse" title="Host Online" />
        )}
      </div>
    </aside>
  );
}

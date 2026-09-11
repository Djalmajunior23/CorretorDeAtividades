import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Zap, 
  Terminal, 
  Settings, 
  Database, 
  Layers, 
  Activity, 
  BookOpen, 
  BarChart3, 
  Sparkles, 
  Briefcase, 
  Award, 
  Users, 
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
  ArrowRight,
  Command,
  CornerDownLeft,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  onOpenExportModal?: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  category: "Ensino & Gestão" | "Inteligência Artificial" | "Laboratórios & Prática" | "DevSecOps & Arquitetura" | "Ações Rápidas";
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  action?: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  onNavigate,
  onOpenExportModal
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    // Ações Rápidas
    {
      id: "action-export-bi",
      label: "Exportar Histórico de Submissões (BI / Excel)",
      category: "Ações Rápidas",
      desc: "Download instantâneo de todas as notas e laudos em CSV/XLSX",
      icon: Database,
      keywords: ["exportar", "bi", "excel", "csv", "download", "notas", "relatorio"],
      action: () => {
        if (onOpenExportModal) onOpenExportModal();
        onClose();
      }
    },
    {
      id: "action-corrector",
      label: "Iniciar Playground de Correção IA",
      category: "Ações Rápidas",
      desc: "Executar código com sandbox e rubricas automáticas",
      icon: Terminal,
      keywords: ["corrigir", "playground", "executar", "sandbox", "python", "javascript"],
      action: () => {
        onNavigate("corrector");
        onClose();
      }
    },
    {
      id: "action-assistant",
      label: "Abrir Copiloto Pedagógico IA",
      category: "Ações Rápidas",
      desc: "Chat socrático para planos de aula e avaliação de ementas",
      icon: Sparkles,
      keywords: ["ia", "assistente", "copiloto", "socratico", "plano de aula"],
      action: () => {
        onNavigate("assistant");
        onClose();
      }
    },
    // Ensino & Gestão
    { id: "dashboard", label: "Dashboard Executivo", category: "Ensino & Gestão", desc: "Central de Comando Docente", icon: Briefcase, keywords: ["dashboard", "inicio", "resumo", "metricas"] },
    { id: "planejamento", label: "Planejamento Semestral", category: "Ensino & Gestão", desc: "Ecosistema Semestral F12", icon: Layers, keywords: ["plano", "semestre", "cronograma", "calendario"] },
    { id: "aulas", label: "Registro de Aulas", category: "Ensino & Gestão", desc: "Histórico e Diário de Aulas", icon: FileText, keywords: ["aula", "frequencia", "conteudo", "registro"] },
    { id: "diary", label: "Diário de Classe Inteligente", category: "Ensino & Gestão", desc: "Diário de Aula com IA & Presença", icon: BookOpen, keywords: ["diario", "classe", "chamada", "frequencia"] },
    { id: "turmas", label: "Gestão de Turmas", category: "Ensino & Gestão", desc: "Turmas e Matrizes Curriculares", icon: Users, keywords: ["turmas", "classes", "grupos", "cursos"] },
    { id: "students", label: "Gestão de Alunos", category: "Ensino & Gestão", desc: "Importação CSV e Cadastro", icon: Users, keywords: ["alunos", "estudantes", "csv", "matricula"] },
    { id: "notas", label: "Gestão de Notas e Médias", category: "Ensino & Gestão", desc: "Lançamento em lote e Médias Finais", icon: Award, keywords: ["notas", "medias", "boletim", "avaliacoes"] },
    { id: "evidences", label: "Evidências Pedagógicas", category: "Ensino & Gestão", desc: "Histórico Imutável de Laudos e Submissões", icon: FileCheck, keywords: ["evidencias", "laudos", "historico", "auditoria"] },
    { id: "activities", label: "Central de Atividades", category: "Ensino & Gestão", desc: "Controle de Entregas & Criação", icon: Zap, keywords: ["atividades", "exercicios", "tarefas", "entregas"] },
    { id: "question_bank", label: "Banco de Questões", category: "Ensino & Gestão", desc: "Repositório com Gerador IA", icon: Database, keywords: ["banco", "questoes", "provas", "gerador"] },
    { id: "pedagogical_tracks", label: "Trilhas Pedagógicas & Intervenção", category: "Ensino & Gestão", desc: "Planos de Ação e Recuperação", icon: ClipboardList, keywords: ["trilhas", "planos", "intervencao", "recuperacao"] },
    { id: "pedagogical_executive", label: "Painel Executivo da Coordenação", category: "Ensino & Gestão", desc: "Indicadores Globais de Aprendizagem", icon: BarChart3, keywords: ["coordenacao", "executivo", "indicadores"] },
    { id: "reports", label: "Pareceres & Relatórios Oficiais", category: "Ensino & Gestão", desc: "Geração de PDFs para Conselho de Classe", icon: FileCheck, keywords: ["relatorios", "parecer", "conselho", "pdf"] },
    { id: "competencies", label: "Mapeamento de Competências", category: "Ensino & Gestão", desc: "Matriz Curricular SENAI (CHA)", icon: Award, keywords: ["competencias", "senai", "cha", "habilidades"] },
    { id: "skill_tree", label: "Skill Tree & Portfólio Tech", category: "Ensino & Gestão", desc: "Grafo Curricular & Portfólio dos Alunos", icon: Network, keywords: ["skill", "tree", "portfolio", "grafo", "conquistas"] },

    // Inteligência Artificial
    { id: "multi_agent", label: "Multi-Agent IA Review", category: "Inteligência Artificial", desc: "Banca Socrática com Agentes Especializados", icon: Cpu, keywords: ["multi-agent", "agentes", "socratico", "ia"] },
    { id: "ai_powerhouse", label: "Super IA do Professor", category: "Inteligência Artificial", desc: "Banca Socrática, Aulas & Forense", icon: Sparkles, keywords: ["powerhouse", "super ia", "forense", "perguntas"] },
    { id: "predictive_analytics", label: "Analytics Preditivo de Evasão", category: "Inteligência Artificial", desc: "Algoritmo de Retenção e Alerta de Risco", icon: TrendingUp, keywords: ["preditivo", "evasao", "risco", "retencao"] },
    { id: "ai_vision_model", label: "Visão IA (LLaVA / OCR)", category: "Inteligência Artificial", desc: "Correção Visual de Provas e Diagramas", icon: Eye, keywords: ["visao", "ocr", "imagem", "manuscrito", "llava"] },
    { id: "ai_visionary_teacher", label: "IA Visionary Teacher", category: "Inteligência Artificial", desc: "Variações Automáticas de Exercícios", icon: Sparkles, keywords: ["visionary", "variacoes", "anti-cola"] },
    { id: "ai_curriculum_architect", label: "Arquiteto Escolar IA", category: "Inteligência Artificial", desc: "Ementas, Matrizes e SLAs Educacionais", icon: BookOpen, keywords: ["arquiteto", "ementa", "matriz", "sla"] },
    { id: "advanced_ai", label: "Hub de IA Avançada", category: "Inteligência Artificial", desc: "Redes Neurais, NLP & Computação Cognitiva", icon: Brain, keywords: ["advanced", "hub", "nlp", "transformers"] },

    // Laboratórios & Prática
    { id: "batch", label: "Correção em Lote ZIP", category: "Laboratórios & Prática", desc: "Processamento Massivo de Arquivos", icon: Layers, keywords: ["lote", "zip", "massivo", "turma"] },
    { id: "similarity", label: "Detector de Similaridade & Plágio", category: "Laboratórios & Prática", desc: "Algoritmo Forense de Código", icon: FileSearch, keywords: ["similaridade", "plagio", "copia", "forense"] },
    { id: "smart_labs", label: "Laboratórios Inteligentes", category: "Laboratórios & Prática", desc: "Experimentação & Sandboxes", icon: FlaskConical, keywords: ["labs", "experimentos", "pratica"] },
    { id: "collab_sandbox", label: "Sandbox Colaborativa Live", category: "Laboratórios & Prática", desc: "Pair Programming em Tempo Real", icon: Users, keywords: ["collab", "sandbox", "pair", "live"] },
    { id: "code_arena", label: "Code Arena & Duelos 1v1", category: "Laboratórios & Prática", desc: "Gamificação e Desafios de Código", icon: Swords, keywords: ["arena", "duelos", "ranking", "elo"] },
    { id: "tech_interview", label: "Mock Tech Interview & STAR", category: "Laboratórios & Prática", desc: "Simulador de Entrevistas Técnicas", icon: Briefcase, keywords: ["interview", "entrevista", "star", "empregabilidade"] },
    { id: "viva_voce", label: "AI Viva-Voce (Arguição Oral)", category: "Laboratórios & Prática", desc: "Defesa Técnica por Reconhecimento de Voz", icon: Volume2, keywords: ["viva voce", "voz", "oral", "defesa"] },
    { id: "wasm_sandbox", label: "Wasm Micro-VM Sandbox", category: "Laboratórios & Prática", desc: "Compilação e Execução Direta no Browser", icon: Cpu, keywords: ["wasm", "webassembly", "vm", "isolado"] },
    { id: "iot_industry", label: "Indústria 4.0 & IoT Lab", category: "Laboratórios & Prática", desc: "Simulador MQTT e Hardware-in-the-Loop", icon: Radio, keywords: ["iot", "industria", "mqtt", "hardware"] },

    // DevSecOps & Arquitetura
    { id: "diagram_assessment", label: "Diagramas DER, UML & BPMN", category: "DevSecOps & Arquitetura", desc: "Auditoria Relacional e Normalização 3NF", icon: Network, keywords: ["diagramas", "der", "uml", "3nf", "banco"] },
    { id: "pr_review", label: "AI Code Review & GitOps PR", category: "DevSecOps & Arquitetura", desc: "Clean Code, Diffs e Boas Práticas", icon: GitPullRequest, keywords: ["pr", "pull request", "review", "gitops"] },
    { id: "mutation_lab", label: "Mutation Testing Lab", category: "DevSecOps & Arquitetura", desc: "Testes de Mutação e TDD Rigoroso", icon: Bug, keywords: ["mutation", "mutacao", "tdd", "testes"] },
    { id: "arch_board", label: "Banca de Arquitetura & ADR", category: "DevSecOps & Arquitetura", desc: "Decisões Arquiteturais e Trade-offs", icon: Building2, keywords: ["arquitetura", "adr", "tradeoffs", "board"] },
    { id: "devsecops_lab", label: "DevSecOps Threat Lab (STRIDE)", category: "DevSecOps & Arquitetura", desc: "Modelagem de Ameaças & Red/Blue Team", icon: ShieldAlert, keywords: ["devsecops", "stride", "seguranca", "threat"] },
    { id: "chaos_simulator", label: "Chaos Engineering Lab", category: "DevSecOps & Arquitetura", desc: "Simulação de Falhas e Circuit Breakers", icon: Flame, keywords: ["chaos", "stress", "resiliencia", "falhas"] },
    { id: "a11y_inspector", label: "Inspetor de Acessibilidade (WCAG 2.2)", category: "DevSecOps & Arquitetura", desc: "Contraste, Leitores e Inclusão Digital", icon: Eye, keywords: ["a11y", "acessibilidade", "wcag", "contraste"] },
    { id: "saep_readiness", label: "Simulador SAEP / ENADE", category: "DevSecOps & Arquitetura", desc: "Matriz CHA, TRI & Prontidão SENAI", icon: GraduationCap, keywords: ["saep", "enade", "tri", "senai"] },
    { id: "agile_squad", label: "Virtual Agile Scrum Squad", category: "DevSecOps & Arquitetura", desc: "Scrum Master AI, Backlog & Sprints", icon: Users, keywords: ["scrum", "agile", "squad", "sprint"] },
    { id: "system_health", label: "Cockpit de Saúde do Sistema", category: "DevSecOps & Arquitetura", desc: "Latência Neon, Status Sandbox & 404 Logs", icon: Activity, keywords: ["saude", "health", "status", "latencia", "postgresql"] },
    { id: "settings", label: "Configurações do Docente", category: "DevSecOps & Arquitetura", desc: "Regras de Linting, Flags e SLAs", icon: Settings, keywords: ["configuracoes", "settings", "lint", "flags"] }
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.desc.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          if (selected.action) {
            selected.action();
          } else {
            onNavigate(selected.id);
            onClose();
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onNavigate, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#030712]/80 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-[#0a0f24] border border-slate-700/80 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden z-10 flex flex-col max-h-[75vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#070c1e] gap-3">
              <Search className="w-5 h-5 text-emerald-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ferramenta, relatório, ação rápida ou aluno... (ex: notas, DER, bi, similaridade)"
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-slate-500"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                  ESC
                </kbd>
                <button
                  onClick={onClose}
                  className="p-1 text-slate-500 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Command List */}
            <div
              ref={listRef}
              className="overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800"
            >
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Nenhuma ferramenta ou comando encontrado para "{query}".
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isSelected = idx === selectedIndex;

                  return (
                    <div
                      key={cmd.id}
                      onClick={() => {
                        if (cmd.action) {
                          cmd.action();
                        } else {
                          onNavigate(cmd.id);
                          onClose();
                        }
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-white shadow-sm"
                          : "hover:bg-slate-900/60 text-slate-300 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected
                              ? "bg-emerald-500 text-[#030712]"
                              : "bg-slate-800/80 text-slate-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0 truncate">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold truncate ${
                                isSelected ? "text-emerald-300" : "text-slate-200"
                              }`}
                            >
                              {cmd.label}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono shrink-0">
                              {cmd.category}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 truncate mt-0.5">
                            {cmd.desc}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-3 shrink-0">
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                            <span>Acessar</span>
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer status & shortcuts guide */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#070c1e] border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">↓</kbd>
                  Navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">↵</kbd>
                  Selecionar
                </span>
              </div>
              <div className="text-slate-400">
                {filteredCommands.length} resultado(s) disponível(is)
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CommandPaletteModal;

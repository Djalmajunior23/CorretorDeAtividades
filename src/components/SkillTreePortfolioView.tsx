import React, { useState, useEffect } from "react";
import {
  Network,
  Award,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  Download,
  Eye,
  Code2,
  Users,
  Search,
  Filter,
  Star,
  Zap,
  TrendingUp,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number;
  prerequisites: string[];
  class_mastery_pct: number;
  skills: string[];
}

export default function SkillTreePortfolioView() {
  const [activeTab, setActiveTab] = useState<"tree" | "portfolio">("tree");
  const [skillTree, setSkillTree] = useState<SkillNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [loadingTree, setLoadingTree] = useState<boolean>(true);

  // Portfolio State
  const [selectedStudentId, setSelectedStudentId] = useState<string>("std-01");
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState<boolean>(false);
  const [languageFilter, setLanguageFilter] = useState<string>("all");

  useEffect(() => {
    fetchSkillTree();
    fetchStudentPortfolio(selectedStudentId);
  }, []);

  const fetchSkillTree = async () => {
    setLoadingTree(true);
    try {
      const res = await fetch(apiUrl("/api/skills/tree"));
      if (res.ok) {
        const data = await res.json();
        setSkillTree(data.nodes || []);
        if (data.nodes && data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      }
    } catch (e) {
      console.error("Skill tree error:", e);
    } finally {
      setLoadingTree(false);
    }
  };

  const fetchStudentPortfolio = async (studentId: string) => {
    setLoadingPortfolio(true);
    try {
      const res = await fetch(apiUrl(`/api/skills/student-portfolio/${studentId}`));
      if (res.ok) {
        const data = await res.json();
        setPortfolioData(data);
      }
    } catch (e) {
      console.error("Student portfolio error:", e);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleExportPortfolioPdf = async () => {
    if (!portfolioData) return;
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("CODECHECK AI • PORTFÓLIO TÉCNICO DE COMPETÊNCIAS", 14, 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`Discente: ${portfolioData.student_name} (${portfolioData.enrollment_code}) • Média: ${portfolioData.overall_average}%`, 14, 19);

      // Summary
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Projetos e Atividades Aprovadas (Nota >= 60)", 14, 35);

      const rows = (portfolioData.approved_projects || []).map((p: any) => [
        p.title,
        p.language.toUpperCase(),
        `${p.grade}/100`,
        p.teacher_feedback
      ]);

      autoTable(doc, {
        startY: 40,
        head: [["Projeto / Algoritmo", "Linguagem", "Nota", "Parecer Docente"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 }
      });

      doc.save(`Portfolio_${portfolioData.student_name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Portfólio exportado em PDF com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF do portfólio.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1 font-bold">
            <Network className="w-4 h-4" /> Módulo 03 • Mapeamento Curricular & Vitrine
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Árvore de Competências & Portfólio Digital</h1>
          <p className="text-sm text-slate-400 mt-1">Acompanhe o grafo de pré-requisitos técnicos e gere portfólios profissionais com projetos aprovados (≥ 60).</p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-[#030712] p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab("tree")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "tree"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Skill Tree (Grafo)</span>
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "portfolio"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Portfólio do Aluno</span>
          </button>
        </div>
      </div>

      {activeTab === "tree" ? (
        /* ========================================================
           SKILL TREE GRAPH VIEW
           ======================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Tree Nodes */}
          <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" /> Trilha Formativa & Domínio da Turma
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Navegue pelos nós sequenciais para inspecionar pré-requisitos e taxa de retenção.</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 font-bold">
                8 Competências Mapeadas
              </span>
            </div>

            {loadingTree ? (
              <div className="py-20 text-center animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-3" />
                <span className="text-xs font-mono text-slate-400">Renderizando nós da Skill Tree...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {skillTree.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isMastered = node.class_mastery_pct >= 70;
                  return (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedNode(node)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "bg-cyan-500/10 border-cyan-500 shadow-lg shadow-cyan-500/10"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                            Nível {node.level} • {node.category}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{node.name}</h4>
                        </div>
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                          isMastered 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}>
                          {isMastered ? <CheckCircle2 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-1">
                          <span className="text-slate-400">Domínio da Turma:</span>
                          <span className={`font-bold ${node.class_mastery_pct >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                            {node.class_mastery_pct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${node.class_mastery_pct >= 70 ? "bg-emerald-400" : "bg-amber-400"}`}
                            style={{ width: `${node.class_mastery_pct}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Node Details Inspector */}
          <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between gap-6">
            <div>
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                  Inspector de Competência
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedNode ? selectedNode.name : "Selecione uma Competência"}
                </h3>
              </div>

              {selectedNode ? (
                <div className="space-y-4 mt-4">
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <span className="text-slate-400 block">Categoria Curricular:</span>
                    <span className="text-slate-200 font-bold font-mono">{selectedNode.category}</span>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                      Habilidades Técnicas Avaliadas:
                    </span>
                    <ul className="space-y-1.5">
                      {selectedNode.skills.map((s, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                    <span className="text-slate-400 block">Pré-requisitos Necessários:</span>
                    <span className="text-slate-200">
                      {selectedNode.prerequisites.length > 0 
                        ? selectedNode.prerequisites.join(", ") 
                        : "Nenhum (Nó Raiz / Fundamento)"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-12 text-center">Clique em qualquer nó da árvore para ver o detalhamento pedagógico.</p>
              )}
            </div>

            <button
              onClick={() => toast.info(`Relatório pedagógico de ${selectedNode?.name} pronto para sincronização.`)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs uppercase font-mono tracking-wider transition-all cursor-pointer"
            >
              Exportar Matriz desta Competência
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================
           STUDENT TECHNICAL PORTFOLIO SHOWCASE
           ======================================================== */
        <div className="space-y-6">
          {/* Top Bar: Student Selector & PDF Export */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Selecionar Discente</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    fetchStudentPortfolio(e.target.value);
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 font-mono outline-none cursor-pointer"
                >
                  <option value="std-01">Carlos Henrique Souza (Matrícula: SENAI-2026-01)</option>
                  <option value="std-02">Ana Rodrigues Silva (Matrícula: SENAI-2026-02)</option>
                  <option value="std-03">Beatriz Oliveira Costa (Matrícula: SENAI-2026-03)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Filtrar Linguagem</span>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 font-mono outline-none cursor-pointer"
                >
                  <option value="all">Todas as Linguagens</option>
                  <option value="python">Python</option>
                  <option value="sql">SQL</option>
                  <option value="typescript">TypeScript</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExportPortfolioPdf}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Portfólio PDF</span>
            </button>
          </div>

          {loadingPortfolio ? (
            <div className="py-20 text-center animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-3" />
              <span className="text-xs font-mono text-slate-400">Carregando acervo de projetos aprovados...</span>
            </div>
          ) : portfolioData ? (
            <>
              {/* Badges Earned Section */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" /> Conquistas & Badges Pedagógicos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {(portfolioData.badges || []).map((badge: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3 hover:border-amber-500/30 transition-all">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-amber-300">{badge.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved Projects Showcase Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" /> Códigos Aprovados com Excelência (Nota ≥ 60)
                  </h3>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    {portfolioData.approved_projects?.length || 0} Projetos Aprovados
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(portfolioData.approved_projects || [])
                    .filter((p: any) => languageFilter === "all" || p.language === languageFilter)
                    .map((project: any) => (
                      <div key={project.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold uppercase border border-cyan-500/20">
                              {project.language}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
                              Nota: {project.grade}/100 (Aprovado)
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white">{project.title}</h4>

                          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 overflow-x-auto max-h-48 text-xs font-mono text-slate-300">
                            <pre><code>{project.code}</code></pre>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-xs text-slate-300">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block mb-1">
                            Parecer do Professor:
                          </span>
                          <p className="italic text-slate-300">"{project.teacher_feedback}"</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

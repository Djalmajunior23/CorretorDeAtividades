import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Users,
  Award,
  Download,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Code2,
  Network,
  Shield,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import {
  CapstoneProjectService,
  PBLProjectSpec,
  TeamAllocationResult,
  PBLProjectEvaluation
} from "../services/capstoneProjectService";

const SECTORS = [
  "Indústria 4.0 & Manufatura Inteligente",
  "FinTech & Sistemas de Pagamento",
  "HealthTech & Prontuário Eletrônico",
  "Smart Cities & Mobilidade Urbana",
  "AgTech & Monitoramento de Safra",
  "Logística & Rastreamento IoT"
];

export default function CapstoneProjectArchitectView() {
  const [theme, setTheme] = useState("Sistema de Telemetria e Manutenção Preditiva de Motores Industriais");
  const [sector, setSector] = useState(SECTORS[0]);
  const [preferredStack, setPreferredStack] = useState("React 19, TypeScript, Node.js, PostgreSQL, Docker");
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [activeSpec, setActiveSpec] = useState<PBLProjectSpec | null>(null);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  // Squad Role Allocator state
  const [teamName, setTeamName] = useState("Squad Alpha • SENAI");
  const [teamAllocation, setTeamAllocation] = useState<TeamAllocationResult | null>(null);

  // 360° Rubric Evaluation state
  const [archScore, setArchScore] = useState(85);
  const [codeScore, setCodeScore] = useState(88);
  const [testScore, setTestScore] = useState(80);
  const [collabScore, setCollabScore] = useState(90);
  const [defenseScore, setDefenseScore] = useState(85);
  const [evaluationResult, setEvaluationResult] = useState<PBLProjectEvaluation | null>(null);

  const handleGenerateSpec = async () => {
    if (!theme.trim()) {
      toast.error("Informe o tema do Projeto Integrador.");
      return;
    }
    setIsGeneratingSpec(true);
    setEvaluationResult(null);

    try {
      const res = await fetch("/api/capstone/generate-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          industrySector: sector,
          preferredStack
        })
      });
      const data = await res.json();
      if (data.success && data.spec) {
        setActiveSpec(data.spec);
        toast.success("Especificação técnica de Projeto Capstone gerada com sucesso!");
        handleAllocateSquad(data.spec);
      } else {
        throw new Error(data.error || "Falha ao gerar projeto.");
      }
    } catch {
      const fallbackSpec = await CapstoneProjectService.generateProjectSpec({
        theme,
        industrySector: sector,
        preferredStack
      });
      setActiveSpec(fallbackSpec);
      handleAllocateSquad(fallbackSpec);
      toast.info("Especificação gerada via motor heurístico PBL.");
    } finally {
      setIsGeneratingSpec(false);
    }
  };

  const handleAllocateSquad = (spec: PBLProjectSpec) => {
    const defaultStudents = [
      { id: "stu_1", name: "Lucas Silveira", dominantSkills: ["Node.js", "SQL"], skillLevel: "Avançado" as const, interestArea: "Backend" as const },
      { id: "stu_2", name: "Ana Beatriz Rocha", dominantSkills: ["React", "UI/UX"], skillLevel: "Avançado" as const, interestArea: "Frontend" as const },
      { id: "stu_3", name: "Gabriel Martins", dominantSkills: ["Docker", "Linux"], skillLevel: "Intermediário" as const, interestArea: "DevOps" as const },
      { id: "stu_4", name: "Mariana Costa", dominantSkills: ["TypeScript", "Vitest"], skillLevel: "Intermediário" as const, interestArea: "Liderança" as const },
      { id: "stu_5", name: "Rodrigo Almeida", dominantSkills: ["Scrum", "User Stories"], skillLevel: "Intermediário" as const, interestArea: "Liderança" as const }
    ];

    const allocation = CapstoneProjectService.allocateTeamRoles({
      teamName,
      projectId: spec.projectId,
      projectTitle: spec.title,
      members: defaultStudents
    });
    setTeamAllocation(allocation);
  };

  const handleRunEvaluation = () => {
    if (!activeSpec) return;
    const evalRes = CapstoneProjectService.evaluateCapstoneProject({
      projectId: activeSpec.projectId,
      teamName,
      architectureScore: archScore,
      codeQualityScore: codeScore,
      testCoverageScore: testScore,
      collaborationScore: collabScore,
      defenseScore: defenseScore
    });
    setEvaluationResult(evalRes);
    toast.success("Avaliação 360° calculada com sucesso!");
  };

  const handleExportPdf = async () => {
    if (!activeSpec) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/capstone/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: activeSpec })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dossie_capstone_${activeSpec.projectId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Dossiê Capstone PBL baixado em PDF!");
      }
    } catch (e: any) {
      toast.error(`Erro ao exportar PDF: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#030712] text-slate-100">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border border-indigo-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              Metodologia Ativa PBL (Project-Based Learning)
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Layers className="w-8 h-8 text-indigo-400" />
              Capstone Project Architect & PBL Dispatcher
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Gere projetos integradores com histórias de usuário no formato <span className="text-indigo-400 font-semibold">Gherkin</span>, diagramas de arquitetura, alocação inteligente de papéis em squads ágeis e avaliação por rubricas 360°.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeSpec && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
              >
                {isExportingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar Dossiê do Projeto PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Specification Creator Card */}
      <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Gerador de Especificação de Projeto Integrador
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tema / Título do Desafio</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Plataforma de Telemetria e Monitoramento de Motores"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Setor da Indústria</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {SECTORS.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            Stack Recomendada: <span className="text-indigo-300 font-mono">{preferredStack}</span>
          </div>

          <button
            onClick={handleGenerateSpec}
            disabled={isGeneratingSpec}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-indigo-500/20"
          >
            {isGeneratingSpec ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Gerar Projeto Capstone Completo
          </button>
        </div>
      </div>

      {/* Generated Project Content Workspace */}
      {activeSpec && (
        <div className="space-y-6">
          {/* Challenge & Tech Stack Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Desafio Real do Mercado</span>
                <span className="text-xs text-slate-400 font-mono">ID: {activeSpec.projectId}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{activeSpec.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{activeSpec.challengeStatement}</p>
              
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-slate-200">Arquitetura do Sistema:</div>
                <p>{activeSpec.systemArchitectureDescription}</p>
              </div>
            </div>

            <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Segurança & Stack Homologada
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Frontend:</span>
                  <div className="text-slate-200">{activeSpec.recommendedTechStack.frontend}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Backend:</span>
                  <div className="text-slate-200">{activeSpec.recommendedTechStack.backend}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Banco de Dados:</span>
                  <div className="text-slate-200">{activeSpec.recommendedTechStack.database}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">DevOps & CI/CD:</span>
                  <div className="text-slate-200">{activeSpec.recommendedTechStack.devops}</div>
                </div>
              </div>
            </div>
          </div>

          {/* User Stories (Gherkin Accordion) */}
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Histórias de Usuário & Critérios de Aceite (Gherkin BDD)
            </h3>

            <div className="space-y-3">
              {activeSpec.userStories.map((us) => {
                const isExpanded = expandedStory === us.id;
                return (
                  <div key={us.id} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                    <button
                      onClick={() => setExpandedStory(isExpanded ? null : us.id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
                          {us.id}
                        </span>
                        <span className="text-sm font-bold text-white">{us.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{us.estimatedStoryPoints} SP</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800 bg-[#040815] space-y-3">
                        <div className="text-xs text-slate-300">
                          <span className="font-semibold text-slate-200">Narrativa:</span> Como um <span className="text-indigo-300">{us.asA}</span>, eu quero <span className="text-indigo-300">{us.iWantTo}</span>, para que <span className="text-indigo-300">{us.soThat}</span>.
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase">Gherkin BDD Spec:</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(us.gherkinAcceptance);
                                toast.success("Gherkin copiado!");
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copiar
                            </button>
                          </div>
                          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                            {us.gherkinAcceptance}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Squad Role Allocation */}
          {teamAllocation && (
            <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Alocação de Papéis da Squad ({teamAllocation.teamName})
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">Sinergia da Squad: {teamAllocation.teamSynergyScore}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                {teamAllocation.allocatedMembers.map((mem) => (
                  <div key={mem.studentId} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-indigo-400">{mem.assignedRole}</div>
                    <div className="text-sm font-extrabold text-white">{mem.studentName}</div>
                    <ul className="text-[11px] text-slate-400 space-y-1 pt-1">
                      {mem.responsibilities.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 360° Rubric Evaluation Panel */}
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Banca de Avaliação 360° do Projeto Capstone
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { label: "Arquitetura & Clean Arch (25%)", val: archScore, set: setArchScore },
                { label: "Qualidade do Código (25%)", val: codeScore, set: setCodeScore },
                { label: "Cobertura de Testes (20%)", val: testScore, set: setTestScore },
                { label: "Colaboração & Squad (15%)", val: collabScore, set: setCollabScore },
                { label: "Defesa Técnica (15%)", val: defenseScore, set: setDefenseScore }
              ].map((dim, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>{dim.label}</span>
                    <span className="text-indigo-400 font-bold">{dim.val}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dim.val}
                    onChange={(e) => dim.set(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunEvaluation}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
              >
                Calcular Parecer Final 360°
              </button>
            </div>

            {evaluationResult && (
              <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Resultado da Banca</span>
                    <h4 className="text-xl font-bold text-white">{evaluationResult.gradeCategory}</h4>
                  </div>
                  <div className="text-3xl font-black text-emerald-400">{evaluationResult.finalScore}/100</div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{evaluationResult.feedbackSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

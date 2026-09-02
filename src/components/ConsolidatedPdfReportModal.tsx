import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Brain, 
  ListChecks, 
  Users, 
  Edit3, 
  Eye, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  ChevronRight,
  HelpCircle,
  Maximize2,
  Sliders,
  Award,
  BookOpen,
  Wand2,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";
import { exportConsolidatedClassPedagogicalReportPDF, ConsolidatedClassReportData } from "../utils/pdfExport";
import { exportClassConsolidatedXLSX } from "../utils/dataExport";

interface ConsolidatedPdfReportModalProps {
  onClose: () => void;
  defaultClassId?: string;
  defaultClassName?: string;
}

type TabMode = "config" | "edit" | "preview";

export function ConsolidatedPdfReportModal({ 
  onClose,
  defaultClassId,
  defaultClassName
}: ConsolidatedPdfReportModalProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("preview");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedTurma, setSelectedTurma] = useState(defaultClassName || "Turma A - Engenharia de Software");
  const [semester, setSemester] = useState("2026/1");
  const [courseName, setCourseName] = useState("Desenvolvimento de Sistemas / Engenharia de Software");
  const [teacherName, setTeacherName] = useState("Docente Titular / Colegiado de Curso");
  const [includeStudentBreakdown, setIncludeStudentBreakdown] = useState(true);
  const [includeCollectiveRecommendations, setIncludeCollectiveRecommendations] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [classAverageGrade, setClassAverageGrade] = useState<number>(78.5);

  // Default LLM recommendations
  const defaultRecommendations = [
    "Oficina Prática de Refatoração & Clean Code: Realizar 2 horas de laboratório dedicadas à modularização de funções extensas e redução da complexidade ciclomática média da turma.",
    "Nivelamento de Sintaxe e Linter Integrado: Padronizar o linter oficial do SENAI no ambiente de desenvolvimento com regras automáticas de verificação de escopos e delimitadores.",
    "Sessão Coletiva de Live Debugging: Apresentar códigos reais anonimizados com erros recorrentes de tipagem e tratamento de exceções para correção comentada em plenária.",
    "Laboratório Guiado de Tratamento de Exceções: Implementar desafios práticos focados em blocos try/catch robustos, validação de payload e logging diagnóstico de erros.",
    "Plantão de Monitoria e Mentoria Dirigida: Convocar os estudantes com aproveitamento inferior a 70% para plantão de monitoria antes do fechamento das avaliações somativas."
  ];

  const [collectiveRecs, setCollectiveRecs] = useState<string[]>(defaultRecommendations);
  const [executiveSummary, setExecutiveSummary] = useState<string>(
    "Diagnóstico pedagógico consolidado para a turma. O desempenho geral reflete boa assimilação dos fundamentos de programação, com oportunidades pontuais de intervenção em complexidade de código e tratamento defensivo de exceções antes das avaliações finais."
  );
  const [hasCustomEdits, setHasCustomEdits] = useState(false);
  const [newRecInput, setNewRecInput] = useState("");

  useEffect(() => {
    let isMounted = true;
    
    // Fetch registered classes
    fetch(apiUrl("/api/classes"))
      .then(res => res.json())
      .then(data => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setClasses(data);
          if (!defaultClassName) {
            setSelectedTurma(data[0].name || "Turma A - Engenharia de Software");
          }
        }
      })
      .catch(() => {
        setClasses([
          { id: "1", name: "Turma A - Engenharia de Software", module: "Módulo 2", semester: "2026/1" },
          { id: "2", name: "Turma B - Ciência da Computação", module: "Módulo 1", semester: "2026/1" },
          { id: "3", name: "Turma C - Análise e Desenvolvimento de Sistemas", module: "Módulo 3", semester: "2026/1" },
          { id: "4", name: "Turma D - Desenvolvimento Web Full Stack", module: "Módulo 2", semester: "2026/1" }
        ]);
      });

    // Fetch Analytics data
    setLoadingAnalytics(true);
    fetch(apiUrl("/api/class-error-analytics"))
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setAnalyticsData(data);
          if (data?.totals?.averageClassScore) {
            setClassAverageGrade(data.totals.averageClassScore);
          }
          setLoadingAnalytics(false);
        }
      })
      .catch(err => {
        console.error("Error fetching class analytics:", err);
        if (isMounted) {
          setLoadingAnalytics(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [defaultClassName]);

  const getReportPayload = (): ConsolidatedClassReportData => {
    const commonErrors = analyticsData?.mostCommonErrors || [
      { name: "Missing Semicolon / Encerramento de Instrução", category: "Sintaxe", count: 58, percentage: 68, severity: "Alta", pedagogicalAction: "Configurar linter com auto-fix e revisão de sintaxe básica." },
      { name: "Cyclomatic Complexity > 10 (Estruturas Aninhadas)", category: "Complexidade", count: 48, percentage: 56, severity: "Alta", pedagogicalAction: "Oficina prática de refatoração, decomposição de métodos e Clean Code." },
      { name: "Unclosed Scope / Parênteses e Chaves não fechadas", category: "Sintaxe", count: 44, percentage: 51, severity: "Média", pedagogicalAction: "Uso do Bracket Pair Colorizer e leitura guiada de escopos." },
      { name: "Undefined Variable / Falha de Tipagem TypeScript", category: "Tipagem", count: 40, percentage: 47, severity: "Média", pedagogicalAction: "Exercícios de tipagem estrita e inicialização de variáveis." },
      { name: "Unhandled Exceptions / Catch Vazio", category: "Resiliência", count: 29, percentage: 34, severity: "Média", pedagogicalAction: "Demonstração de tratamento de exceções e logging defensivo." }
    ];

    const studentsAttention = analyticsData?.studentsNeedingAttention || [
      { name: "Lucas Gabriel da Silva", submissionsCount: 6, averageGrade: 45, frequentError: "Sintaxe & Complexidade", status: "Alto Risco" },
      { name: "Beatriz Souza Oliveira", submissionsCount: 5, averageGrade: 62, frequentError: "Complexidade Ciclomática", status: "Atenção" },
      { name: "Matheus Henrique Santos", submissionsCount: 7, averageGrade: 68, frequentError: "Tipagem TypeScript", status: "Atenção" },
      { name: "Ana Clara Pereira", submissionsCount: 8, averageGrade: 88, frequentError: "Clean Code", status: "Apto" },
      { name: "Gabriel Menezes Costa", submissionsCount: 9, averageGrade: 94, frequentError: "Nenhum Relevante", status: "Apto" },
      { name: "Juliana Rodrigues Lima", submissionsCount: 6, averageGrade: 76, frequentError: "Delimitadores", status: "Apto" }
    ];

    return {
      turmaName: selectedTurma,
      semester: semester,
      courseName: courseName,
      unitName: "SENAI • Unidade de Educação Profissional e Tecnológica",
      teacherName: teacherName,
      emissionDate: new Date().toLocaleDateString('pt-BR'),
      totalStudents: 24,
      totalSubmissions: 142,
      averageGrade: classAverageGrade,
      completionRate: 89,
      reprobationRiskRate: classAverageGrade < 60 ? 28 : 12,
      averageComplexity: 7.4,
      executiveSummary: executiveSummary.trim() || undefined,
      frequentErrors: commonErrors,
      collectiveRecommendations: includeCollectiveRecommendations ? collectiveRecs.filter(r => r.trim().length > 0) : [],
      studentRankings: includeStudentBreakdown ? studentsAttention : []
    };
  };

  const handleUpdateRecommendation = (index: number, value: string) => {
    const updated = [...collectiveRecs];
    updated[index] = value;
    setCollectiveRecs(updated);
    setHasCustomEdits(true);
  };

  const handleRemoveRecommendation = (index: number) => {
    const updated = collectiveRecs.filter((_, i) => i !== index);
    setCollectiveRecs(updated);
    setHasCustomEdits(true);
    toast.info("Recomendação removida.");
  };

  const handleAddRecommendation = () => {
    if (!newRecInput.trim()) {
      toast.warning("Digite o texto da nova recomendação pedagógica.");
      return;
    }
    setCollectiveRecs([...collectiveRecs, newRecInput.trim()]);
    setNewRecInput("");
    setHasCustomEdits(true);
    toast.success("Nova recomendação adicionada!");
  };

  const handleResetToAIDefaults = () => {
    setCollectiveRecs(defaultRecommendations);
    setExecutiveSummary(
      "Diagnóstico pedagógico consolidado para a turma. O desempenho geral reflete boa assimilação dos fundamentos de programação, com oportunidades pontuais de intervenção em complexidade de código e tratamento defensivo de exceções antes das avaliações finais."
    );
    setHasCustomEdits(false);
    toast.success("Recomendações e parecer restaurados para as sugestões padrão da IA.");
  };

  const handleGenerateFocusSuggestions = (focusType: 'clean-code' | 'reinforcement' | 'algorithms') => {
    let newSuggestions: string[] = [];
    if (focusType === 'clean-code') {
      newSuggestions = [
        "Workshop Intensivo de Clean Code & Refatoração: Aplicação das regras de Uncle Bob com foco em funções pequenas e nomenclatura expressiva.",
        "Padronização de Guia de Estilo (Linter SENAI): Configuração de regras rígidas de aninhamento máximo (máx. 3 níveis) e limite de linhas por função.",
        "Revisão por Pares (Peer Review): Implementar sessões semanais de avaliação cruzada de código entre os estudantes antes da submissão final."
      ];
    } else if (focusType === 'reinforcement') {
      newSuggestions = [
        "Plano de Recuperação Paralela: Aulas práticas de nivelamento em sintaxe básica, condicionais e laços para alunos com nota inferior a 60%.",
        "Monitoria Guiada com Estudos de Caso: Resolução comentada de exercícios passo a passo nos laboratórios de informática do SENAI.",
        "Reentrega Assistida de Atividades: Permitir refatoração e reenvio de projetos com acompanhamento individualizado do professor."
      ];
    } else {
      newSuggestions = [
        "Laboratório de Estruturas de Dados e Algoritmos: Exercícios práticos focados em busca binária, ordenação e redução de complexidade temporal O(n).",
        "Testes Unitários Automatizados: Ensinar os alunos a criarem asserções para validar casos de borda e entradas inesperadas.",
        "Desafios em Tempo Real (Live Coding): Propor dinâmicas rápidas de resolução de problemas algorítmicos em duplas durante as aulas."
      ];
    }

    setCollectiveRecs(newSuggestions);
    setHasCustomEdits(true);
    toast.success("Novas recomendações geradas com foco temático selecionado!");
  };

  const handleExportXlsx = () => {
    setGenerating(true);
    try {
      const payload = getReportPayload();
      const studentsSource = (payload.studentRankings && payload.studentRankings.length > 0)
        ? payload.studentRankings
        : [
            { name: "Lucas Gabriel da Silva", averageGrade: 45, frequentError: "Sintaxe & Complexidade" },
            { name: "Beatriz Souza Oliveira", averageGrade: 62, frequentError: "Complexidade Ciclomática" },
            { name: "Matheus Henrique Santos", averageGrade: 68, frequentError: "Tipagem TypeScript" },
            { name: "Ana Clara Pereira", averageGrade: 88, frequentError: "Clean Code" },
            { name: "Gabriel Menezes Costa", averageGrade: 94, frequentError: "Nenhum Relevante" },
            { name: "Juliana Rodrigues Lima", averageGrade: 76, frequentError: "Delimitadores" }
          ];

      const mappedStudents = studentsSource.map((std: any, idx: number) => ({
        id: `std_${idx}`,
        matricula: `MAT-${idx + 101}`,
        name: std.name,
        averageGrade: std.averageGrade,
        gradeDecimal: Math.round((std.averageGrade / 10) * 10) / 10,
        totalHours: 80,
        attendedHours: std.averageGrade >= 70 ? 76 : 60,
        missedHours: std.averageGrade >= 70 ? 4 : 20,
        attendancePercentage: std.averageGrade >= 70 ? 95 : 75,
        academicStatus: std.averageGrade >= 70 ? "Aprovado por Média" : "Em Recuperação",
        attendanceStatus: "Apto",
        finalResult: std.averageGrade >= 70 ? "APROVADO" : "EM RECUPERAÇÃO",
        notes: `Intervenção: ${std.frequentError || "Acompanhamento geral"}`
      }));

      exportClassConsolidatedXLSX({
        classInfo: {
          name: payload.turmaName,
          course: payload.courseName,
          semester: payload.semester,
          teacherName: payload.teacherName,
          totalWorkloadHours: 80
        },
        students: mappedStudents,
        fileName: `Notas_Faltas_Consolidadas_${payload.turmaName.replace(/[^a-zA-Z0-9_-]/g, "_")}`
      });

      toast.success(`Planilha XLSX consolidada da ${selectedTurma} gerada e baixada com sucesso!`);
    } catch (e: any) {
      console.error("Error exporting XLSX from modal:", e);
      toast.error("Erro ao gerar a planilha XLSX consolidada.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    setGenerating(true);
    try {
      const payload = getReportPayload();
      exportConsolidatedClassPedagogicalReportPDF(payload);
      toast.success(`Relatório Pedagógico Consolidado da ${selectedTurma} gerado e baixado com sucesso em PDF!`);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao compilar relatório PDF consolidado.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintPreview = () => {
    const payload = getReportPayload();
    const commonErrors = payload.frequentErrors;
    const studentsAttention = payload.studentRankings || [];
    const recs = payload.collectiveRecommendations;

    const reportHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Pedagógico Consolidado da Turma - ${payload.turmaName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 14mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          box-sizing: border-box;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          color: #0f172a; 
          margin: 0; 
          padding: 10px;
          line-height: 1.45; 
          background: #ffffff; 
          font-size: 11px;
        }
        header { 
          border-bottom: 3px solid #10b981; 
          padding-bottom: 12px; 
          margin-bottom: 16px; 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
        }
        h1 { color: #0f172a; font-size: 16px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; }
        .subtitle { font-size: 11px; color: #475569; font-weight: 600; }
        .meta { font-size: 10px; color: #334155; text-align: right; line-height: 1.4; }
        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; page-break-inside: avoid; }
        .grid-stats { display: flex; gap: 10px; margin-bottom: 16px; page-break-inside: avoid; }
        .stat-card { flex: 1; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 6px; text-align: center; }
        .stat-card h4 { margin: 0; font-size: 18px; color: #0f172a; font-weight: 800; }
        .stat-card p { margin: 3px 0 0 0; font-size: 9px; color: #475569; text-transform: uppercase; font-weight: bold; }
        h3 { color: #0f172a; font-size: 13px; margin-top: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; font-weight: 700; page-break-after: avoid; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; page-break-inside: auto; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #0f172a; color: white; font-weight: 600; }
        tr:nth-child(even) { background: #f8fafc; }
        .tag { display: inline-block; padding: 2px 5px; font-size: 8.5px; border-radius: 4px; font-weight: bold; }
        .tag-high { background: #fee2e2; color: #991b1b; }
        .tag-med { background: #fef3c7; color: #92400e; }
        .tag-low { background: #dcfce7; color: #166534; }
        ul { padding-left: 18px; margin: 6px 0; }
        li { font-size: 10.5px; margin-bottom: 5px; color: #334155; }
        .signature-section { margin-top: 24px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-box { text-align: center; width: 42%; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 9.5px; color: #475569; }
        footer { margin-top: 25px; font-size: 8.5px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; page-break-inside: avoid; }
        @media print {
          body { margin: 0; padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <header>
        <div>
          <h1>SENAI • CodeCheck AI — Relatório Pedagógico Consolidado</h1>
          <div class="subtitle">Conselho de Classe • Análise Diagnóstica da Turma & Recomendações de Correção Coletiva</div>
        </div>
        <div class="meta">
          <strong>Turma:</strong> ${payload.turmaName}<br>
          <strong>Semestre:</strong> ${payload.semester}<br>
          <strong>Emissão:</strong> ${payload.emissionDate}
        </div>
      </header>

      ${payload.executiveSummary ? `
      <div class="summary-box">
        <strong style="color: #0f172a; font-size: 11px;">Síntese Executiva / Parecer Pedagógico do Docente:</strong>
        <p style="margin: 4px 0 0 0; font-size: 10.5px; color: #334155;">
          ${payload.executiveSummary}
        </p>
      </div>
      ` : ''}

      <div class="grid-stats">
        <div class="stat-card">
          <h4 style="color: #10b981;">${Math.round(payload.averageGrade)}%</h4>
          <p>Média da Turma</p>
        </div>
        <div class="stat-card">
          <h4 style="color: #2563eb;">${payload.completionRate}%</h4>
          <p>Taxa de Conclusão</p>
        </div>
        <div class="stat-card">
          <h4 style="color: ${payload.reprobationRiskRate && payload.reprobationRiskRate > 20 ? '#dc2626' : '#d97706'};">${payload.reprobationRiskRate}%</h4>
          <p>Risco de Reprovação</p>
        </div>
        <div class="stat-card">
          <h4 style="color: #0f172a;">${payload.totalStudents}</h4>
          <p>Alunos Avaliados</p>
        </div>
      </div>

      <h3>1. Diagnóstico dos Erros Mais Frequentes da Turma</h3>
      <table>
        <thead>
          <tr>
            <th>Tipo de Ocorrência / Regra</th>
            <th>Categoria</th>
            <th>Ocorrências</th>
            <th>% da Turma</th>
            <th>Severidade</th>
            <th>Ação Pedagógica Recomendada</th>
          </tr>
        </thead>
        <tbody>
          ${commonErrors.map((err: any) => `
          <tr>
            <td><strong>${err.name}</strong></td>
            <td>${err.category || 'Geral'}</td>
            <td>${err.count}</td>
            <td>${err.percentage || '45'}%</td>
            <td><span class="tag ${err.severity === 'Alta' ? 'tag-high' : 'tag-med'}">${err.severity || 'Média'}</span></td>
            <td>${err.pedagogicalAction || 'Reforçar exercícios práticos em aula'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      ${recs && recs.length > 0 ? `
      <h3>2. Recomendações Pedagógicas de Correção Coletiva e Intervenção em Sala</h3>
      <ul>
        ${recs.map((rec: string) => `<li>${rec}</li>`).join('')}
      </ul>
      ` : ''}

      ${includeStudentBreakdown && studentsAttention.length > 0 ? `
      <h3>3. Acompanhamento e Desempenho Individual dos Estudantes</h3>
      <table>
        <thead>
          <tr>
            <th>Estudante</th>
            <th>Submissões</th>
            <th>Média de Notas</th>
            <th>Ponto de Atenção Recorrente</th>
            <th>Situação / Conselho</th>
          </tr>
        </thead>
        <tbody>
          ${studentsAttention.map((st: any) => `
          <tr>
            <td><strong>${st.name}</strong></td>
            <td>${st.submissionsCount || 5}</td>
            <td><strong>${Math.round(st.averageGrade)}%</strong></td>
            <td>${st.frequentError || 'Sintaxe / Complexidade'}</td>
            <td><span class="tag ${st.status === 'Alto Risco' ? 'tag-high' : st.status === 'Atenção' ? 'tag-med' : 'tag-low'}">${st.status || 'Apto'}</span></td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <div class="signature-section">
        <div class="sig-box">
          Assinatura do Docente Responsável
        </div>
        <div class="sig-box">
          Coordenação Pedagógica / Conselho
        </div>
      </div>

      <footer>
        Documento gerado automaticamente pelo Sistema CodeCheck AI • SENAI • Válido para deliberações oficiais de Conselho de Classe.
      </footer>
    </body>
    </html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframe.src = url;
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      };
    }
  };

  const payload = getReportPayload();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="w-full max-w-5xl bg-[#0b1120] border border-slate-700/60 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 shadow-inner">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-wider">
                  Relatório Pedagógico Consolidado
                </h3>
                {hasCustomEdits && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    <Edit3 className="w-2.5 h-2.5" /> Editado pelo Docente
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Pré-visualização e Edição de Recomendações LLM antes do PDF</p>
            </div>
          </div>

          {/* Tab Navigation Switches */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "preview" 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Pré-Visualização
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "edit" 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar Recomendações
              {hasCustomEdits && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "config" 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Parâmetros
            </button>
          </div>

          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white font-mono text-sm px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#060b14]">
          {/* TAB 1: PREVIEW INTERFACE (Document View) */}
          {activeTab === "preview" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-[#070e1b]">
              <div className="w-full max-w-3xl bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 p-6 sm:p-10 relative flex flex-col font-sans">
                {/* Visual watermark badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {hasCustomEdits ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Recomendações Customizadas
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Sugestões IA (Original)
                    </span>
                  )}
                  <button
                    onClick={() => setActiveTab("edit")}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md border border-slate-300 font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-emerald-700" /> Editar
                  </button>
                </div>

                {/* Document Header */}
                <div className="border-b-2 border-emerald-600 pb-3 mb-4">
                  <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
                    SENAI • CodeCheck AI — Relatório Pedagógico Consolidado
                  </h2>
                  <div className="text-xs text-slate-600 font-medium">
                    Conselho de Classe • Análise Diagnóstica da Turma & Recomendações Coletivas
                  </div>
                </div>

                {/* Document Meta Grid */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Turma Selecionada</span>
                    <strong className="text-slate-800">{selectedTurma}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Período / Semestre</span>
                    <strong className="text-slate-800">{semester} • Emissão: {payload.emissionDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Curso / Matriz</span>
                    <span className="text-slate-700">{courseName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Alunos & Submissões</span>
                    <span className="text-slate-700">{payload.totalStudents} Alunos Matriculados • {payload.totalSubmissions} Códigos Analisados</span>
                  </div>
                </div>

                {/* Executive Summary Box */}
                {executiveSummary && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 mb-4 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-emerald-900 font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-emerald-700" /> Síntese Executiva / Parecer Pedagógico do Docente
                      </span>
                      <button
                        onClick={() => setActiveTab("edit")}
                        className="text-[10px] text-emerald-800 hover:underline font-bold"
                      >
                        Editar Parecer
                      </button>
                    </div>
                    <p className="text-slate-700 leading-relaxed italic">
                      "{executiveSummary}"
                    </p>
                  </div>
                )}

                {/* KPIs Cards */}
                <div className="grid grid-cols-4 gap-2.5 mb-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Média Turma</div>
                    <div className="text-base font-extrabold text-emerald-600">{Math.round(classAverageGrade)}%</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Conclusão</div>
                    <div className="text-base font-extrabold text-blue-600">{payload.completionRate}%</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Risco Reprov.</div>
                    <div className="text-base font-extrabold text-amber-600">{payload.reprobationRiskRate}%</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Complexidade</div>
                    <div className="text-base font-extrabold text-slate-800">{payload.averageComplexity}</div>
                  </div>
                </div>

                {/* Section 1: Erros Mais Frequentes */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 uppercase flex items-center justify-between">
                    <span>1. Diagnóstico dos Erros Mais Frequentes da Turma</span>
                    <span className="text-[10px] text-slate-500 lowercase font-normal">telemetria de código</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-1.5 text-left border border-slate-300">Padrão / Regra</th>
                          <th className="p-1.5 text-left border border-slate-300">Categoria</th>
                          <th className="p-1.5 text-center border border-slate-300">Ocorrências</th>
                          <th className="p-1.5 text-center border border-slate-300">% Turma</th>
                          <th className="p-1.5 text-center border border-slate-300">Severidade</th>
                          <th className="p-1.5 text-left border border-slate-300">Ação Recomendada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payload.frequentErrors.map((err, i) => (
                          <tr key={i} className={i % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                            <td className="p-1.5 border border-slate-200 font-bold">{err.name}</td>
                            <td className="p-1.5 border border-slate-200 text-slate-600">{err.category}</td>
                            <td className="p-1.5 border border-slate-200 text-center font-mono">{err.count}</td>
                            <td className="p-1.5 border border-slate-200 text-center font-mono">{err.percentage}%</td>
                            <td className="p-1.5 border border-slate-200 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                err.severity === 'Alta' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {err.severity}
                              </span>
                            </td>
                            <td className="p-1.5 border border-slate-200 text-slate-700">{err.pedagogicalAction}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Recomendações Pedagógicas Coletivas (Live edited) */}
                {includeCollectiveRecommendations && (
                  <div className="mb-5 bg-slate-50/80 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 
                        2. Recomendações Pedagógicas de Correção Coletiva ({collectiveRecs.length})
                      </h3>
                      <button
                        onClick={() => setActiveTab("edit")}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Editar Itens
                      </button>
                    </div>

                    {collectiveRecs.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-slate-800 pl-1">
                        {collectiveRecs.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Nenhuma recomendação cadastrada no momento.</p>
                    )}
                  </div>
                )}

                {/* Section 3: Quadro Individual de Alunos */}
                {includeStudentBreakdown && payload.studentRankings && payload.studentRankings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 uppercase flex items-center justify-between">
                      <span>3. Acompanhamento Individual dos Alunos</span>
                      <span className="text-[10px] text-slate-500 font-normal">quadro de notas e risco</span>
                    </h3>
                    <table className="w-full text-[10px] border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-1.5 text-left border border-slate-300">Estudante</th>
                          <th className="p-1.5 text-center border border-slate-300">Submissões</th>
                          <th className="p-1.5 text-center border border-slate-300">Média de Notas</th>
                          <th className="p-1.5 text-left border border-slate-300">Ponto de Atenção Recorrente</th>
                          <th className="p-1.5 text-center border border-slate-300">Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payload.studentRankings.map((st, i) => (
                          <tr key={i} className={i % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                            <td className="p-1.5 border border-slate-200 font-bold">{st.name}</td>
                            <td className="p-1.5 border border-slate-200 text-center font-mono">{st.submissionsCount}</td>
                            <td className="p-1.5 border border-slate-200 text-center font-bold font-mono">
                              {Math.round(st.averageGrade)}%
                            </td>
                            <td className="p-1.5 border border-slate-200 text-slate-700">{st.frequentError}</td>
                            <td className="p-1.5 border border-slate-200 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                st.status === 'Alto Risco' 
                                  ? 'bg-red-100 text-red-800' 
                                  : st.status === 'Atenção' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {st.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Signature Box Preview */}
                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between text-center text-[10px] text-slate-600">
                  <div className="w-5/12 border-t border-slate-400 pt-1">
                    <strong>{teacherName}</strong>
                    <div className="text-[9px] text-slate-400">Docente Responsável</div>
                  </div>
                  <div className="w-5/12 border-t border-slate-400 pt-1">
                    <strong>Coordenação Pedagógica / Conselho</strong>
                    <div className="text-[9px] text-slate-400">SENAI Unidade de Ensino</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT RECOMMENDATIONS & EXECUTIVE SUMMARY */}
          {activeTab === "edit" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Top Banner with AI Quick Prompts */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Personalização Docente das Recomendações LLM
                    </h4>
                    <p className="text-xs text-slate-300">
                      Modifique livremente os textos gerados pela IA, adicione metas específicas ou altere o foco pedagógico.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetToAIDefaults}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    title="Restaurar para as sugestões originais geradas pelo modelo"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Restaurar Padrão IA
                  </button>
                </div>
              </div>

              {/* Quick AI Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" /> Aplicar Foco Temático com IA:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleGenerateFocusSuggestions('clean-code')}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 text-left transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white block group-hover:text-purple-300 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-purple-400" /> Foco: Clean Code & Refatoração
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">Modularização e redução de complexidade ciclomática</span>
                  </button>

                  <button
                    onClick={() => handleGenerateFocusSuggestions('reinforcement')}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white block group-hover:text-emerald-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" /> Foco: Recuperação & Nivelamento
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">Reforço de sintaxe e monitoria dirigida para alunos em risco</span>
                  </button>

                  <button
                    onClick={() => handleGenerateFocusSuggestions('algorithms')}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 text-left transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white block group-hover:text-blue-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Foco: Algoritmos & Testes
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">Testes unitários automatizados e casos de borda</span>
                  </button>
                </div>
              </div>

              {/* Executive Summary Editor */}
              <div className="space-y-2 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-emerald-400" /> Parecer Geral / Síntese Executiva do Docente:
                  </label>
                  <span className="text-[11px] text-slate-400">{executiveSummary.length} caracteres</span>
                </div>
                <textarea
                  value={executiveSummary}
                  onChange={(e) => {
                    setExecutiveSummary(e.target.value);
                    setHasCustomEdits(true);
                  }}
                  rows={3}
                  placeholder="Escreva a síntese pedagógica para o conselho de classe..."
                  className="w-full bg-[#030712] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
              </div>

              {/* List of Editable Recommendations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-emerald-400" /> Recomendações Pedagógicas Coletivas ({collectiveRecs.length}):
                  </label>
                  <span className="text-[11px] text-slate-400">Edição individual em tempo real</span>
                </div>

                <div className="space-y-2.5">
                  {collectiveRecs.map((rec, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 focus-within:border-emerald-500/50 transition-all flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                        {index + 1}
                      </span>
                      
                      <div className="flex-1">
                        <textarea
                          value={rec}
                          onChange={(e) => handleUpdateRecommendation(index, e.target.value)}
                          rows={2}
                          className="w-full bg-transparent border-0 text-xs text-slate-100 focus:outline-none resize-y leading-relaxed font-sans"
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveRecommendation(index)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0 cursor-pointer"
                        title="Excluir recomendação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new recommendation input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newRecInput}
                    onChange={(e) => setNewRecInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRecommendation();
                      }
                    }}
                    placeholder="Adicionar nova diretriz pedagógica personalizada..."
                    className="flex-1 bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleAddRecommendation}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURATION & METRICS */}
          {activeTab === "config" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Class selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Turma Alvo para Consolidação
                </label>
                <select
                  value={selectedTurma}
                  onChange={(e) => setSelectedTurma(e.target.value)}
                  className="bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  {classes.length > 0 ? (
                    classes.map((c, i) => (
                      <option key={c.id || i} value={c.name}>
                        {c.name} {c.module ? `(${c.module})` : ""}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Turma A - Engenharia de Software">Turma A - Engenharia de Software</option>
                      <option value="Turma B - Ciência da Computação">Turma B - Ciência da Computação</option>
                      <option value="Turma C - Análise e Desenvolvimento de Sistemas">Turma C - Análise e Desenvolvimento de Sistemas</option>
                    </>
                  )}
                </select>
              </div>

              {/* Period & Course */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Período Semestral
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="bg-[#030712] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="2026/1">2026/1 (1º Semestre)</option>
                    <option value="2025/2">2025/2 (2º Semestre)</option>
                    <option value="2025/1">2025/1 (1º Semestre)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Média Estimada da Turma
                  </label>
                  <div className="bg-[#030712] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-mono font-bold flex items-center justify-between">
                    <span>{classAverageGrade}%</span>
                    <span className="text-[10px] text-slate-400 font-normal">Telemetria IA</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">Nome do Curso</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">Docente / Colegiado</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Sections to include */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-200 block">Seções a Incluir no Relatório:</label>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">Diagnóstico de Erros Frequentes</span>
                      <span className="text-[11px] text-slate-400">Sintaxe, complexidade ciclomática, escopos e linter</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">Obrigatório</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <ListChecks className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">Recomendações de Correção Coletiva</span>
                      <span className="text-[11px] text-slate-400">Diretrizes de intervenção editadas pelo professor</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeCollectiveRecommendations}
                    onChange={(e) => setIncludeCollectiveRecommendations(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">Quadro Individual de Alunos</span>
                      <span className="text-[11px] text-slate-400">Tabela com notas individuais e identificação de alunos em risco</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeStudentBreakdown}
                    onChange={(e) => setIncludeStudentBreakdown(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer w-full sm:w-auto text-center"
            >
              Fechar
            </button>
            {activeTab !== "preview" && (
              <button
                onClick={() => setActiveTab("preview")}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-emerald-500/30 cursor-pointer w-full sm:w-auto"
              >
                <Eye className="w-3.5 h-3.5" /> Ver Pré-visualização
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportXlsx}
              disabled={generating || loadingAnalytics}
              className="px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Exportar notas e faltas consolidadas em formato Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportar XLSX
            </button>

            <button
              onClick={handlePrintPreview}
              disabled={generating || loadingAnalytics}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" /> Imprimir
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={generating || loadingAnalytics}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial"
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Baixar Relatório PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

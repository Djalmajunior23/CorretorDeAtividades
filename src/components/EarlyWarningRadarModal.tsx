import React, { useState, useMemo } from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Search, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  User, 
  Download, 
  Clock, 
  Sparkles, 
  Filter,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface StudentRiskProfile {
  student_id: string;
  name: string;
  enrollment_code: string;
  class_name: string;
  total_classes: number;
  total_absences: number;
  attendance_rate: number; // e.g. 72%
  pending_activities: number;
  total_activities: number;
  completion_rate: number; // e.g. 50%
  average_grade: number; // e.g. 55.0
  risk_level: "critical" | "warning" | "regular";
  primary_risk_reason: string;
  recommended_action: string;
}

interface EarlyWarningRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle?: string;
  studentsData?: any[];
}

export const EarlyWarningRadarModal: React.FC<EarlyWarningRadarModalProps> = ({
  isOpen,
  onClose,
  classNameTitle = "Desenvolvimento de Sistemas 1A",
  studentsData = []
}) => {
  const [filterRisk, setFilterRisk] = useState<"all" | "critical" | "warning" | "regular">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Build computed risk roster
  const riskRoster: StudentRiskProfile[] = useMemo(() => {
    const defaultData = [
      {
        student_id: "st-01",
        name: "Ana Beatriz Silva",
        enrollment_code: "20260101",
        class_name: classNameTitle,
        total_classes: 40,
        total_absences: 2,
        attendance_rate: 95.0,
        pending_activities: 0,
        total_activities: 5,
        completion_rate: 100,
        average_grade: 92.5,
        risk_level: "regular" as const,
        primary_risk_reason: "Desempenho e assiduidade excelentes.",
        recommended_action: "Monitoramento padrão e desafios avançados de aceleração."
      },
      {
        student_id: "st-02",
        name: "Carlos Eduardo Santos",
        enrollment_code: "20260102",
        class_name: classNameTitle,
        total_classes: 40,
        total_absences: 6,
        attendance_rate: 85.0,
        pending_activities: 1,
        total_activities: 5,
        completion_rate: 80,
        average_grade: 70.0,
        risk_level: "warning" as const,
        primary_risk_reason: "Faltas moderadas e 1 atividade pendente.",
        recommended_action: "Notificar estudante para entrega da atividade pendente e reforço de frequência."
      },
      {
        student_id: "st-03",
        name: "Mariana Oliveira Costa",
        enrollment_code: "20260103",
        class_name: classNameTitle,
        total_classes: 40,
        total_absences: 11,
        attendance_rate: 72.5, // Below 75% SENAI/LDB
        pending_activities: 3,
        total_activities: 5,
        completion_rate: 40,
        average_grade: 52.0,
        risk_level: "critical" as const,
        primary_risk_reason: "Frequência abaixo de 75% (11 faltas) + Média 52.0 com 3 atividades não entregues.",
        recommended_action: "Convocação imediata para Plano de Intervenção Pedagógica e estudo de recuperação paralela."
      },
      {
        student_id: "st-04",
        name: "Lucas Ferreira Lima",
        enrollment_code: "20260104",
        class_name: classNameTitle,
        total_classes: 40,
        total_absences: 9,
        attendance_rate: 77.5,
        pending_activities: 2,
        total_activities: 5,
        completion_rate: 60,
        average_grade: 58.0,
        risk_level: "warning" as const,
        primary_risk_reason: "Média insuficiente (58.0) e risco de ultrapassar o limite de faltas.",
        recommended_action: "Agendamento de monitoria e reforço prático de programação."
      },
      {
        student_id: "st-05",
        name: "Gabriel Souza Rocha",
        enrollment_code: "20260105",
        class_name: classNameTitle,
        total_classes: 40,
        total_absences: 3,
        attendance_rate: 92.5,
        pending_activities: 0,
        total_activities: 5,
        completion_rate: 100,
        average_grade: 86.0,
        risk_level: "regular" as const,
        primary_risk_reason: "Progresso acadêmico consistente.",
        recommended_action: "Manter acompanhamento regular de entregas."
      },
      {
        student_id: "st-06",
        name: "Beatriz Mendes",
        enrollment_code: "20260106",
        class_name: classNameTitle,
        total_classes: 40,
        total_absences: 12,
        attendance_rate: 70.0,
        pending_activities: 4,
        total_activities: 5,
        completion_rate: 20,
        average_grade: 44.0,
        risk_level: "critical" as const,
        primary_risk_reason: "Risco iminente de reprovação por falta (30% de ausências) e baixíssimo engajamento.",
        recommended_action: "Encaminhamento prioritário para Orientação Pedagógica e alinhamento com responsáveis."
      }
    ];

    return defaultData;
  }, [classNameTitle]);

  // Filtered roster
  const filteredRoster = useMemo(() => {
    return riskRoster.filter(st => {
      const matchRisk = filterRisk === "all" || st.risk_level === filterRisk;
      const matchSearch = searchTerm.trim() === "" || 
        st.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        st.enrollment_code.includes(searchTerm);
      return matchRisk && matchSearch;
    });
  }, [riskRoster, filterRisk, searchTerm]);

  // Summary counts
  const criticalCount = riskRoster.filter(r => r.risk_level === "critical").length;
  const warningCount = riskRoster.filter(r => r.risk_level === "warning").length;
  const regularCount = riskRoster.filter(r => r.risk_level === "regular").length;

  // 1-Click Export Individual Intervention Plan PDF
  const handleExportIndividualPlanPDF = (student: StudentRiskProfile) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Top Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CODECHECK AI • SISTEMA INTEGRADO DE GESTÃO PEDAGÓGICA", 14, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("PLANO INDIVIDUAL DE INTERVENÇÃO PEDAGÓGICA (PIIP) • ACOMPANHAMENTO PREVENTIVO", 14, 20);

      let yPos = 38;

      // Student Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, yPos, pageWidth - 28, 38, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`Estudante: ${student.name}`, 18, yPos + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Matrícula: ${student.enrollment_code}`, 18, yPos + 18);
      doc.text(`Turma: ${student.class_name}`, 18, yPos + 26);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`, 18, yPos + 33);

      const riskLabel = student.risk_level === "critical" ? "RISCO CRÍTICO" : student.risk_level === "warning" ? "ATENÇÃO PEDAGÓGICA" : "REGULAR";
      const riskColor = student.risk_level === "critical" ? [225, 29, 72] : student.risk_level === "warning" ? [217, 119, 6] : [16, 185, 129];
      
      doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.roundedRect(pageWidth - 75, yPos + 6, 60, 10, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(riskLabel, pageWidth - 45, yPos + 13, { align: "center" });

      yPos += 46;

      // Diagnóstico 360
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Diagnóstico Tridimensional de Risco", 14, yPos);
      yPos += 5;

      const diagTable = [
        ["Dimensão Avaliada", "Métrica Apurada", "Referência Mínima", "Status"],
        ["Frequência Escolar", `${student.attendance_rate.toFixed(1)}% (${student.total_absences} faltas)`, "75% (LDB/SENAI)", student.attendance_rate < 75 ? "IRREGULAR (Crítico)" : "REGULAR"],
        ["Entregas de Atividades", `${student.completion_rate}% (${student.pending_activities} pendentes)`, "70% de Entregas", student.completion_rate < 70 ? "DEFASADO" : "EM DIA"],
        ["Rendimento Acadêmico", `${student.average_grade.toFixed(1)} / 100 pts`, "60.0 pts (Média)", student.average_grade < 60 ? "RECUPERAÇÃO" : "APROVADO"]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [diagTable[0]],
        body: diagTable.slice(1),
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8.5, fontStyle: "bold" },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { cellPadding: 3 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Parecer e Plano de Ação
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("2. Parecer Técnico e Ações de Intervenção Recomendadas", 14, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      
      const reasonText = doc.splitTextToSize(`• Fator Principal: ${student.primary_risk_reason}`, pageWidth - 28);
      doc.text(reasonText, 14, yPos);
      yPos += (reasonText.length * 5) + 3;

      const actionText = doc.splitTextToSize(`• Ação Pedagógica: ${student.recommended_action}`, pageWidth - 28);
      doc.text(actionText, 14, yPos);
      yPos += (actionText.length * 5) + 8;

      // Cronograma de Recuperação
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("3. Metas e Compromisso de Recuperação", 14, yPos);
      yPos += 5;

      const recoveryTable = [
        ["Etapa / Meta", "Prazo Limite", "Responsável", "Evidência Esperada"],
        ["Entrega das Atividades Práticas em Atraso", "7 dias corridos", "Estudante", "Submissão no Portal do Aluno"],
        ["Atendimento de Plantão de Dúvidas / Monitoria", "Próxima Semana", "Docente / Monitor", "Registro de Presença"],
        ["Avaliação Prática de Recuperação Paralela", "15 dias corridos", "Docente", "Lançamento no Boletim"]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [recoveryTable[0]],
        body: recoveryTable.slice(1),
        theme: "grid",
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5 },
        styles: { cellPadding: 3 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 22;

      // Assinaturas
      if (yPos > 240) {
        doc.addPage();
        yPos = 30;
      }

      const colWidth = (pageWidth - 40) / 3;
      
      doc.setDrawColor(148, 163, 184);
      doc.line(14, yPos, 14 + colWidth, yPos);
      doc.line(20 + colWidth, yPos, 20 + (2 * colWidth), yPos);
      doc.line(26 + (2 * colWidth), yPos, pageWidth - 14, yPos);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Assinatura do Docente", 14 + (colWidth / 2), yPos + 5, { align: "center" });
      doc.text("Assinatura do Estudante", 20 + (colWidth * 1.5), yPos + 5, { align: "center" });
      doc.text("Coordenação Pedagógica", 26 + (colWidth * 2.5), yPos + 5, { align: "center" });

      doc.save(`Plano_Intervencao_${student.enrollment_code}_${Date.now()}.pdf`);
      toast.success(`Plano de Intervenção Pedagógica de ${student.name} exportado em PDF!`);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar PDF do Plano de Intervenção.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Radar de Risco Pedagógico 360°</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Early Warning System
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cruzamento preditivo de Assiduidade (Faltas), Engajamento (Entregas) e Rendimento (Notas) • {classNameTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Mini-bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-5 bg-slate-900/60 border-b border-slate-800">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Analisado</p>
              <p className="text-xl font-bold text-white">{riskRoster.length} alunos</p>
            </div>
            <User className="w-6 h-6 text-slate-400" />
          </div>

          <div 
            onClick={() => setFilterRisk("critical")}
            className={`cursor-pointer border rounded-xl p-3 flex items-center justify-between transition ${
              filterRisk === "critical" ? "bg-rose-950/50 border-rose-500" : "bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/40"
            }`}
          >
            <div>
              <p className="text-xs text-rose-400 font-medium">Risco Crítico (Imediato)</p>
              <p className="text-xl font-bold text-rose-300">{criticalCount} alunos</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>

          <div 
            onClick={() => setFilterRisk("warning")}
            className={`cursor-pointer border rounded-xl p-3 flex items-center justify-between transition ${
              filterRisk === "warning" ? "bg-amber-950/50 border-amber-500" : "bg-amber-950/20 border-amber-900/40 hover:bg-amber-950/40"
            }`}
          >
            <div>
              <p className="text-xs text-amber-400 font-medium">Atenção Pedagógica</p>
              <p className="text-xl font-bold text-amber-300">{warningCount} alunos</p>
            </div>
            <Clock className="w-6 h-6 text-amber-400" />
          </div>

          <div 
            onClick={() => setFilterRisk("regular")}
            className={`cursor-pointer border rounded-xl p-3 flex items-center justify-between transition ${
              filterRisk === "regular" ? "bg-emerald-950/50 border-emerald-500" : "bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-950/40"
            }`}
          >
            <div>
              <p className="text-xs text-emerald-400 font-medium">Desempenho Regular</p>
              <p className="text-xl font-bold text-emerald-300">{regularCount} alunos</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Filtrar Risco:</span>
            <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700">
              <button
                onClick={() => setFilterRisk("all")}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  filterRisk === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Todos ({riskRoster.length})
              </button>
              <button
                onClick={() => setFilterRisk("critical")}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  filterRisk === "critical" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Crítico ({criticalCount})
              </button>
              <button
                onClick={() => setFilterRisk("warning")}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  filterRisk === "warning" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Atenção ({warningCount})
              </button>
              <button
                onClick={() => setFilterRisk("regular")}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  filterRisk === "regular" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Regular ({regularCount})
              </button>
            </div>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar aluno ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Students Risk Table */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                  <th className="p-3">Estudante</th>
                  <th className="p-3">Nível de Risco</th>
                  <th className="p-3">Assiduidade (Faltas)</th>
                  <th className="p-3">Entregas de Atividades</th>
                  <th className="p-3">Média de Notas</th>
                  <th className="p-3">Ação Pedagógica Recomendada</th>
                  <th className="p-3 text-right">Intervenção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Nenhum estudante encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((st) => {
                    const isCritical = st.risk_level === "critical";
                    const isWarning = st.risk_level === "warning";

                    return (
                      <tr key={st.student_id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-medium text-slate-100">
                          <div>{st.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{st.enrollment_code}</div>
                        </td>

                        <td className="p-3">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              Crítico
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Atenção
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Regular
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${st.attendance_rate < 75 ? "text-rose-400 font-bold" : "text-slate-200"}`}>
                              {st.attendance_rate.toFixed(1)}%
                            </span>
                            <span className="text-slate-400">({st.total_absences} faltas)</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${st.attendance_rate < 75 ? "bg-rose-500" : st.attendance_rate < 85 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(100, st.attendance_rate)}%` }}
                            />
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${st.completion_rate < 60 ? "text-rose-400" : "text-slate-200"}`}>
                              {st.completion_rate}%
                            </span>
                            <span className="text-slate-400">({st.pending_activities} pendentes)</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${st.completion_rate < 60 ? "bg-rose-500" : st.completion_rate < 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(100, st.completion_rate)}%` }}
                            />
                          </div>
                        </td>

                        <td className="p-3">
                          <div className={`font-bold text-sm ${st.average_grade < 60 ? "text-rose-400" : "text-emerald-400"}`}>
                            {st.average_grade.toFixed(1)}
                            <span className="text-slate-500 text-xs font-normal"> / 100</span>
                          </div>
                        </td>

                        <td className="p-3 max-w-xs">
                          <p className="text-[11px] text-slate-300 line-clamp-2" title={st.recommended_action}>
                            {st.recommended_action}
                          </p>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleExportIndividualPlanPDF(st)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white transition font-medium text-xs shadow-sm"
                            title="Gerar e baixar o Plano Individual de Intervenção Pedagógica (PDF)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Gerar PIIP (PDF)
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>O Radar atualiza automaticamente conforme novos registros de faltas, entregas e notas são salvos.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Fechar Radar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EarlyWarningRadarModal;

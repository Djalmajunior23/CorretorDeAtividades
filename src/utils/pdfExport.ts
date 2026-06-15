import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface ReportData {
  jobTitle: string;
  createdAt: string;
  total: number;
  processed: number;
  success: number;
  failed: number;
  items: Array<{
    studentName: string;
    fileName: string;
    score: number;
    status: string;
    feedback?: string;
  }>;
}

export const exportBatchReportToPDF = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(22, 163, 74); // Emerald 600
  doc.text("CodeCheck AI", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Relatório de Correção em Lote", 14, 28);
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, pageWidth - 14, 28, { align: "right" });

  // Job Info
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(data.jobTitle, 14, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(`Data de Criação: ${new Date(data.createdAt).toLocaleString()}`, 14, 52);

  // Statistics Grid (Custom Drawing)
  const gridY = 65;
  const colWidth = (pageWidth - 28) / 4;

  const drawStat = (label: string, value: string | number, x: number, color: [number, number, number]) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, gridY, colWidth - 2, 20, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 4, gridY + 8);
    doc.setFontSize(12);
    doc.setTextColor(...color);
    doc.text(value.toString(), x + 4, gridY + 16);
  };

  drawStat("Recibidos", data.total, 14, [30, 41, 59]);
  drawStat("Processados", data.processed, 14 + colWidth, [30, 41, 59]);
  drawStat("Sucesso", data.success, 14 + colWidth * 2, [22, 163, 74]);
  drawStat("Falhas", data.failed, 14 + colWidth * 3, [225, 29, 72]);

  // Table
  const tableData = data.items.map(item => [
    item.studentName || "N/A",
    item.fileName,
    `${item.score}/100`,
    item.status === 'COMPLETED' ? 'Validado' : item.status === 'FAILED' ? 'Erro' : 'Pendente'
  ]);

  (doc as any).autoTable({
    startY: 95,
    head: [['Aluno', 'Arquivo Original', 'Nota', 'Status']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: 10 },
    styles: { font: 'helvetica', fontSize: 9 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - CodeCheck AI Academic Engine v1.0`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${data.jobTitle.replace(/\s+/g, '_').toLowerCase()}_report.pdf`);
};

export const exportClassReportToPDF = (data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text("Relatório Pedagógico da Turma", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, pageWidth - 14, 22, { align: "right" });

  // Stats Grid
  const stats = [
    { label: "Média Geral", value: `${data.average_score}%` },
    { label: "Conclusão", value: `${data.completion_rate}%` },
    { label: "Risco Reprob.", value: `${data.reprobation_risk_rate}%` },
    { label: "Desvio Padrão", value: data.std_deviation }
  ];

  const gridY = 35;
  const colWidth = (pageWidth - 28) / 4;
  stats.forEach((stat, i) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14 + (i * colWidth), gridY, colWidth - 2, 20, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, 14 + (i * colWidth) + 4, gridY + 8);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(stat.value.toString(), 14 + (i * colWidth) + 4, gridY + 16);
  });

  // Competencies
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("Fortalezas da Turma", 14, 70);
  
  (doc as any).autoTable({
    startY: 75,
    body: data.strong_competencies.map((c: string) => [c]),
    head: [['Competências em Destaque']],
    headStyles: { fillColor: [16, 185, 129] },
    margin: { bottom: 10 }
  });

  doc.setFontSize(14);
  doc.text("Lacunas e Dificuldades", 14, (doc as any).lastAutoTable.finalY + 15);
  
  (doc as any).autoTable({
    startY: (doc as any).lastAutoTable.finalY + 20,
    body: data.weak_competencies.map((c: string) => [c]),
    head: [['Dificuldades Detectadas']],
    headStyles: { fillColor: [245, 158, 11] },
  });

  doc.save("relatorio_turma_academic.pdf");
};

export const exportStudentReportToPDF = (studentName: string, data: any, opinion?: string | null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229);
  doc.text(`Parecer: ${studentName}`, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, pageWidth - 14, 22, { align: "right" });

  if (opinion) {
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Parecer Pedagógico IA", 14, 40);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const splitOpinion = doc.splitTextToSize(opinion, pageWidth - 28);
    doc.text(splitOpinion, 14, 48);
  }

  const startY = opinion ? (48 + (doc.splitTextToSize(opinion, pageWidth - 28).length * 5) + 15) : 40;

  doc.setFontSize(14);
  doc.text("Competências Técnicas", 14, startY);
  
  (doc as any).autoTable({
    startY: startY + 5,
    body: data.competencies.map((c: any) => [c.name, `${c.score}%`]),
    head: [['Competência', 'Aproveitamento']],
    headStyles: { fillColor: [79, 70, 229] },
  });

  doc.save(`relatorio_${studentName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

export const exportGenericResultToPDF = (title: string, result: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229);
  doc.text(title, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Gerado via CodeCheck AI em ${new Date().toLocaleString()}`, 14, 28);

  let currentY = 40;

  Object.entries(result).forEach(([key, value]) => {
    if (key === "error") return;

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    const label = key.replace(/_/g, ' ').toUpperCase();
    doc.text(label, 14, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    
    let textValue = "";
    if (Array.isArray(value)) {
      textValue = value.map(v => `• ${v}`).join("\n");
    } else {
      textValue = String(value);
    }

    const lines = doc.splitTextToSize(textValue, pageWidth - 28);
    doc.text(lines, 14, currentY);
    currentY += (lines.length * 5) + 10;

    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

import { jsPDF } from "jspdf";

export interface CouncilStudentData {
  id: string;
  name: string;
  enrollmentCode: string;
  className: string;
  courseName: string;
  semester: string;
  shift: string;
  averageScore: number;
  attendanceRate: number;
  timelinessRate: number;
  completedActivitiesCount: number;
  totalActivitiesCount: number;
  competencies: Array<{ name: string; score: number; status: "SUPERIOR" | "ADEQUADO" | "EM_DESENVOLVIMENTO" }>;
  aiSynthesis: string;
  teacherObservation?: string;
  recommendation: "APROVAR" | "RECUPERACAO_PARALELA" | "CONSELHO_ESPECIAL";
}

export class ClassCouncilDossierService {
  /**
   * Gera o Dossiê Individual Oficial do Conselho de Classe (PDF Padrão A4 - 1 Página).
   */
  static generateDossierPdf(data: CouncilStudentData): jsPDF {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const emissionDate = new Date().toLocaleDateString("pt-BR");

    // 1. Cabeçalho Institucional SENAI
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("SENAI - DOSSIÊ PEDAGÓGICO DO CONSELHO DE CLASSE", 14, 11);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`CodeCheck AI • Emissão Oficial: ${emissionDate} • Documento Homologado`, 14, 18);

    // 2. Título do Documento
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`Relatório Individual de Desempenho e Competências`, 14, 33);

    // 3. Bloco de Identificação do Estudante
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(14, 37, 182, 24, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("Estudante:", 18, 44);
    doc.text("Matrícula:", 120, 44);
    doc.text("Curso:", 18, 51);
    doc.text("Turma / Módulo:", 120, 51);
    doc.text("Turno / Ano:", 18, 57);
    doc.text("Status Pedagógico:", 120, 57);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(data.name, 38, 44);
    doc.text(data.enrollmentCode, 137, 44);
    doc.text(data.courseName, 31, 51);
    doc.text(`${data.className} (${data.semester})`, 148, 51);
    doc.text(`${data.shift} - 2026`, 40, 57);

    // Status Badge text
    const recColor = data.recommendation === "APROVAR" ? [16, 185, 129] : [245, 158, 11];
    doc.setTextColor(recColor[0], recColor[1], recColor[2]);
    doc.text(data.recommendation === "APROVAR" ? "Apto / Aprovado" : "Em Recuperação Paralela", 154, 57);

    // 4. Indicadores Métricos Centrais
    let y = 68;
    const cardWidth = 43;
    const cardHeight = 18;

    // Card 1: Média Geral
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, cardWidth, cardHeight, 2, 2, "FD");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("MÉDIA GERAL", 18, y + 6);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(data.averageScore >= 70 ? 16 : 220, data.averageScore >= 70 ? 185 : 38, data.averageScore >= 70 ? 129 : 38);
    doc.text(`${data.averageScore.toFixed(1)} / 100`, 18, y + 14);

    // Card 2: Frequência
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(60, y, cardWidth, cardHeight, 2, 2, "FD");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("FREQUÊNCIA", 64, y + 6);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${data.attendanceRate}%`, 64, y + 14);

    // Card 3: Pontualidade de Entregas
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(106, y, cardWidth, cardHeight, 2, 2, "FD");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("ENTREGAS NO PRAZO", 110, y + 6);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${data.timelinessRate}%`, 110, y + 14);

    // Card 4: Atividades Realizadas
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(152, y, cardWidth, cardHeight, 2, 2, "FD");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("ATIVIDADES FEITAS", 156, y + 6);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${data.completedActivitiesCount} / ${data.totalActivitiesCount}`, 156, y + 14);

    // 5. Matriz de Competências Técnicas (CHA)
    y += 24;
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("1. Avaliação de Competências Técnicas do Perfil Profissional", 14, y);

    y += 5;
    data.competencies.slice(0, 4).forEach((comp) => {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`• ${comp.name}`, 16, y);

      // Barra de progresso da competência
      const barX = 135;
      const barW = 40;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, y - 3, barW, 3.5, 1, 1, "F");

      const fillW = (barW * Math.min(100, comp.score)) / 100;
      doc.setFillColor(comp.score >= 70 ? 16 : 245, comp.score >= 70 ? 185 : 158, comp.score >= 70 ? 129 : 11);
      doc.roundedRect(barX, y - 3, fillW, 3.5, 1, 1, "F");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(`${comp.score}%`, 180, y);
      y += 6;
    });

    // 6. Parecer Diagnóstico da IA e Equipe Docente
    y += 3;
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("2. Parecer e Diagnóstico da Equipe Pedagógica (Homologado)", 14, y);

    y += 5;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const synthText = doc.splitTextToSize(data.aiSynthesis, 182);
    doc.text(synthText, 14, y);

    y += synthText.length * 4.2 + 4;

    // 7. Observações e Encaminhamentos do Professor
    if (data.teacherObservation) {
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("3. Encaminhamentos Deliberados pelo Conselho", 14, y);
      y += 5;
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const obsText = doc.splitTextToSize(data.teacherObservation, 182);
      doc.text(obsText, 14, y);
      y += obsText.length * 4.2 + 6;
    } else {
      y += 4;
    }

    // 8. Bloco de Assinaturas (Docente e Coordenação)
    const sigY = 262;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(20, sigY, 90, sigY);
    doc.line(120, sigY, 190, sigY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text("Professor(a) Responsável", 32, sigY + 4);
    doc.text("Coordenação Pedagógica SENAI", 130, sigY + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Assinatura Homologada via CodeCheck AI", 27, sigY + 8);
    doc.text("Registro Acadêmico Oficial", 142, sigY + 8);

    return doc;
  }
}

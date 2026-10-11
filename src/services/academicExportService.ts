export interface AcademicExportRow {
  studentId: string;
  name: string;
  enrollmentCode: string;
  email: string;
  className: string;
  n1: number;
  n2: number;
  recoveryGrade?: number;
  finalAverage: number;
  totalAbsences: number;
  academicConcept: "A" | "B" | "C" | "D";
  status: "APROVADO" | "RECUPERACAO" | "RETIDO";
}

export type AcademicExportFormat = "totvs" | "moodle" | "sge";

export class AcademicExportService {
  /**
   * Converte estudantes e notas em linhas padronizadas para exportação acadêmica.
   */
  static generateRows(
    students: Array<{ id: string; name: string; enrollment_code?: string; email?: string; class_name?: string }>,
    gradesMap: Record<string, { n1?: number; n2?: number; rec?: number; absences?: number }>
  ): AcademicExportRow[] {
    return students.map((s) => {
      const g = gradesMap[s.id] || {};
      const n1 = typeof g.n1 === "number" ? g.n1 : 75;
      const n2 = typeof g.n2 === "number" ? g.n2 : 80;
      const rec = g.rec !== undefined ? g.rec : undefined;
      const baseAvg = (n1 + n2) / 2;
      const finalAverage = rec !== undefined ? Math.max(baseAvg, rec) : baseAvg;
      const totalAbsences = typeof g.absences === "number" ? g.absences : 2;

      let academicConcept: "A" | "B" | "C" | "D" = "B";
      if (finalAverage >= 90) academicConcept = "A";
      else if (finalAverage >= 70) academicConcept = "B";
      else if (finalAverage >= 50) academicConcept = "C";
      else academicConcept = "D";

      let status: "APROVADO" | "RECUPERACAO" | "RETIDO" = "APROVADO";
      if (totalAbsences > 20) {
        status = "RETIDO";
      } else if (finalAverage >= 60) {
        status = "APROVADO";
      } else if (finalAverage >= 40) {
        status = "RECUPERACAO";
      } else {
        status = "RETIDO";
      }

      return {
        studentId: s.id,
        name: s.name,
        enrollmentCode: s.enrollment_code || `MAT-${s.id.slice(0, 6)}`,
        email: s.email || `${s.name.toLowerCase().replace(/\s+/g, ".")}@aluno.senai.br`,
        className: s.class_name || "Turma Geral",
        n1,
        n2,
        recoveryGrade: rec,
        finalAverage: Number(finalAverage.toFixed(1)),
        totalAbsences,
        academicConcept,
        status
      };
    });
  }

  /**
   * Exporta no layout oficial Totvs Educacional (Separador ponto e vírgula com cabeçalho padrão RM).
   */
  static toTotvsCsv(rows: AcademicExportRow[]): string {
    const headers = [
      "COD_ALUNO",
      "MATRICULA_SENAI",
      "NOME_COMPLETO",
      "TURMA",
      "ETAPA_1_AVALIACAO",
      "ETAPA_2_PROJETO",
      "RECUPERACAO_PARALELA",
      "MEDIA_FINAL_CALCULADA",
      "FALTAS_HORAS",
      "CONCEITO_FINAL",
      "SITUACAO_ACADEMICA"
    ];

    const lines = rows.map((r) => [
      `"${r.studentId}"`,
      `"${r.enrollmentCode}"`,
      `"${r.name}"`,
      `"${r.className}"`,
      r.n1.toFixed(1),
      r.n2.toFixed(1),
      r.recoveryGrade !== undefined ? r.recoveryGrade.toFixed(1) : '""',
      r.finalAverage.toFixed(1),
      r.totalAbsences,
      `"${r.academicConcept}"`,
      `"${r.status}"`
    ].join(";"));

    return [headers.join(";"), ...lines].join("\r\n");
  }

  /**
   * Exporta no layout Moodle Gradebook CSV (padrão de importação de notas Moodle SENAI).
   */
  static toMoodleCsv(rows: AcademicExportRow[]): string {
    const headers = [
      "Nome",
      "Sobrenome",
      "Número de identificação",
      "Endereço de email",
      "Atividade Avaliativa 1 (Pontos)",
      "Atividade Prática 2 (Pontos)",
      "Recuperação Paralela (Pontos)",
      "Total do curso (Nota Final)"
    ];

    const lines = rows.map((r) => {
      const parts = r.name.trim().split(/\s+/);
      const firstName = parts[0] || "Estudante";
      const lastName = parts.slice(1).join(" ") || "SENAI";

      return [
        `"${firstName}"`,
        `"${lastName}"`,
        `"${r.enrollmentCode}"`,
        `"${r.email}"`,
        r.n1.toFixed(1),
        r.n2.toFixed(1),
        r.recoveryGrade !== undefined ? r.recoveryGrade.toFixed(1) : '""',
        r.finalAverage.toFixed(1)
      ].join(",");
    });

    return [headers.join(","), ...lines].join("\r\n");
  }

  /**
   * Exporta no layout SGE (Sistema de Gestão Escolar) SENAI.
   */
  static toSgeCsv(rows: AcademicExportRow[]): string {
    const headers = [
      "RA",
      "ALUNO",
      "TURMA",
      "NOTA_1",
      "NOTA_2",
      "REC_PARALELA",
      "MEDIA",
      "FREQ_PERCENTUAL",
      "CONCEITO",
      "RESULTADO"
    ];

    const lines = rows.map((r) => {
      const freq = Math.max(75, 100 - (r.totalAbsences * 2)).toFixed(1);
      return [
        `"${r.enrollmentCode}"`,
        `"${r.name}"`,
        `"${r.className}"`,
        r.n1.toFixed(1),
        r.n2.toFixed(1),
        r.recoveryGrade !== undefined ? r.recoveryGrade.toFixed(1) : '""',
        r.finalAverage.toFixed(1),
        `"${freq}%"`,
        `"${r.academicConcept}"`,
        `"${r.status}"`
      ].join(";");
    });

    return [headers.join(";"), ...lines].join("\r\n");
  }

  /**
   * Helper para trigger de download de arquivo no navegador.
   */
  static downloadFile(content: string, filename: string, mimeType = "text/csv;charset=utf-8;"): void {
    if (typeof window === "undefined") return;
    const blob = new Blob(["\uFEFF" + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

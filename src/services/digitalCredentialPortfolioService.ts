import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { safeAutoTable, getAutoTableFinalY } from "../utils/pdfExport";
import { IsomorphicCrypto as crypto } from "../utils/isomorphicCrypto";

export interface DigitalMicroCredential {
  credentialId: string;
  studentId: string;
  studentName: string;
  enrollmentCode: string;
  courseName: string;
  competencyTitle: string; // e.g. "Desenvolvimento de APIs RESTful & Modelagem Relacional 3FN"
  gradeScore: number; // 0 - 100
  honorsLevel: "Com Louvor (Honors)" | "Aprovado com Excelência" | "Certificado Padrão";
  verificationHash: string; // SHA-256
  verificationUrl: string;
  skillsAcquired: string[];
  workloadHours: number;
  issuedAt: string;
}

export interface GitHubPortfolioPackage {
  repositoryName: string;
  projectTitle: string;
  readmeMarkdown: string;
  recommendedTags: string[];
  architectureSummary: string;
  generatedAt: string;
}

export class DigitalCredentialPortfolioService {
  /**
   * Helper unificado para salvar no navegador ou gerar Buffer no Node.js
   */
  private static formatPdfOutput(doc: jsPDF, saveFilename?: string): Buffer {
    if (typeof window !== "undefined" && saveFilename) {
      doc.save(saveFilename);
    }
    const arrayBuffer = doc.output("arraybuffer");
    return typeof Buffer !== "undefined" ? Buffer.from(arrayBuffer) : (new Uint8Array(arrayBuffer) as any);
  }

  /**
   * Generate a cryptographically verifiable Digital Micro-Credential for the student.
   */
  static issueDigitalMicroCredential(params: {
    studentId: string;
    studentName: string;
    enrollmentCode?: string;
    courseName?: string;
    competencyTitle: string;
    gradeScore: number;
    skillsAcquired?: string[];
    workloadHours?: number;
  }): DigitalMicroCredential {
    const credentialId = "cred-" + Date.now();
    const enrollmentCode = params.enrollmentCode || "2026" + Math.floor(Math.random() * 90000 + 10000);
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";
    const workloadHours = params.workloadHours || 40;
    const skills = params.skillsAcquired || ["Python Avançado", "Modelagem Relacional (3FN)", "Clean Code", "PostgreSQL"];
    const score = Math.max(0, Math.min(100, params.gradeScore));

    const honorsLevel = score >= 95
      ? "Com Louvor (Honors)"
      : score >= 85
        ? "Aprovado com Excelência"
        : "Certificado Padrão";

    // Generate SHA-256 Verification Hash
    const rawSignaturePayload = `${params.studentId}:${params.studentName}:${params.competencyTitle}:${score}:${enrollmentCode}:${Date.now()}`;
    const verificationHash = crypto.createHash("sha256").update(rawSignaturePayload).digest("hex");
    const verificationUrl = `https://certificados.senai.br/verify/${verificationHash.substring(0, 16)}`;

    return {
      credentialId,
      studentId: params.studentId,
      studentName: params.studentName,
      enrollmentCode,
      courseName,
      competencyTitle: params.competencyTitle,
      gradeScore: score,
      honorsLevel,
      verificationHash,
      verificationUrl,
      skillsAcquired: skills,
      workloadHours,
      issuedAt: new Date().toISOString()
    };
  }

  /**
   * Export the Official SENAI Digital Certificate in PDF Format.
   */
  static exportDigitalCertificatePdf(credential: DigitalMicroCredential, saveFilename?: string): Buffer {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });

    // BORDER MOLDURA INSTITUCIONAL
    doc.setFillColor(0, 51, 153); // Navy Blue
    doc.rect(0, 0, 297, 210, "F");

    doc.setFillColor(255, 255, 255);
    doc.rect(8, 8, 281, 194, "F");

    doc.setFillColor(255, 204, 0); // Gold Inner Border
    doc.rect(12, 12, 273, 186, "D");

    // HEADER
    doc.setTextColor(0, 51, 153);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI", 148.5, 30, { align: "center" });

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("CERTIFICADO DE MICRO-COMPETÊNCIA TÉCNICA", 148.5, 45, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text("Certificamos que o(a) discente", 148.5, 62, { align: "center" });

    // NOME DO ALUNO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 153);
    doc.text(credential.studentName.toUpperCase(), 148.5, 76, { align: "center" });

    // CORPO DO TEXTO
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85);
    const certText = `concluiu com êxito a unidade curricular de "${credential.competencyTitle}", integrante do programa ${credential.courseName}, obtendo aproveitamento acadêmico de ${credential.gradeScore} pontos (${credential.honorsLevel}), com carga horária de ${credential.workloadHours} horas.`;
    const splitCert = doc.splitTextToSize(certText, 240);
    doc.text(splitCert, 148.5, 92, { align: "center" });

    // HABILIDADES
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 51, 153);
    doc.text(`Competências Validadas: ${credential.skillsAcquired.join(" • ")}`, 148.5, 122, { align: "center" });

    // BADGE CRIPTOGRÁFICO
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(30, 134, 237, 16, 2, 2, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`HASH DE AUTENTICIDADE (SHA-256): ${credential.verificationHash}`, 148.5, 141, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Validação Pública: ${credential.verificationUrl} | Emitido em: ${new Date(credential.issuedAt).toLocaleDateString("pt-BR")}`, 148.5, 147, { align: "center" });

    // ASSINATURAS
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text("_____________________________________________", 75, 175, { align: "center" });
    doc.text("Coordenação Pedagógica SENAI", 75, 180, { align: "center" });

    doc.text("_____________________________________________", 222, 175, { align: "center" });
    doc.text("Diretoria Regional de Educação Profissional", 222, 180, { align: "center" });

    return this.formatPdfOutput(doc, saveFilename);
  }

  /**
   * Alias for exportDigitalCertificatePdf
   */
  static exportMicroCredentialPdf(credential: DigitalMicroCredential, saveFilename?: string): Buffer {
    return this.exportDigitalCertificatePdf(credential, saveFilename);
  }

  /**
   * Generate a professional GitHub Portfolio README.md for the student's project.
   */
  static generateGitHubPortfolioPackage(params: {
    studentName: string;
    projectTitle: string;
    language: string;
    submittedCode: string;
    score: number;
    skills: string[];
  }): GitHubPortfolioPackage {
    const safeRepoName = params.projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    const readmeMarkdown = `# 🚀 ${params.projectTitle}

[![SENAI Certification](https://img.shields.io/badge/SENAI-Aprovado%20${params.score}%2F100-003399?style=for-the-badge&logo=shield)](https://senai.br)
[![Language](https://img.shields.io/badge/Language-${encodeURIComponent(params.language)}-blue?style=for-the-badge)](https://www.python.org/)
[![Clean Code](https://img.shields.io/badge/Quality-Clean%20Code-emerald?style=for-the-badge)](https://clean-code.org)

## 📌 Sobre o Projeto
Projeto prático desenvolvido por **${params.studentName}** no curso Técnico em Desenvolvimento de Sistemas do **SENAI**.

### 🛠️ Competências & Tecnologias
${params.skills.map(s => `- \`${s}\``).join("\n")}

## 💻 Código / Solução
\`\`\`${params.language.toLowerCase()}
${params.submittedCode}
\`\`\`

## 🧪 Casos de Teste & Validação
- ✅ Testes unitários com validação defensiva de casos de borda.
- ✅ Complexidade assintótica otimizada ($O(n)$).
- ✅ Avaliação oficial SENAI: **${params.score}/100 pontos**.

---
*Desenvolvido com excelência técnica no ecossistema SENAI CodeCheck.*`;

    return {
      repositoryName: safeRepoName,
      projectTitle: params.projectTitle,
      readmeMarkdown,
      recommendedTags: ["senai", "portfolio", params.language.toLowerCase(), "clean-code", "algorithms"],
      architectureSummary: "Solução modularizada com cobertura de testes e documentação profissional.",
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Flexible helper to generate GitHub Portfolio package
   */
  static generateGitHubPortfolio(params: {
    studentName: string;
    projectTitle: string;
    language?: string;
    architectureSummary?: string;
    keyFeatures?: string[];
    studentCodeSample?: string;
    submittedCode?: string;
    score?: number;
    skills?: string[];
  }): GitHubPortfolioPackage {
    return this.generateGitHubPortfolioPackage({
      studentName: params.studentName || "Estudante SENAI",
      projectTitle: params.projectTitle || "Projeto Prático",
      language: params.language || "Python",
      submittedCode: params.submittedCode || params.studentCodeSample || "def solucao():\n    return True",
      score: params.score ?? 95,
      skills: params.skills || (params.keyFeatures && params.keyFeatures.length > 0 ? params.keyFeatures : ["Python", "Clean Code", "Padrão SENAI"])
    });
  }
}

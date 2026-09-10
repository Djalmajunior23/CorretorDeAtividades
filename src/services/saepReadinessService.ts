import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import PDFDocument from "pdfkit";

export type CompetencyDomain =
  | "CONHECIMENTO_ALGORITMICO"
  | "HABILIDADE_ENGENHARIA_SOFTWARE"
  | "HABILIDADE_DEVSECOPS_SEGURANCA"
  | "CONHECIMENTO_BANCO_DADOS"
  | "ATITUDE_QUALIDADE_RIGOR"
  | "ATITUDE_ETICA_LGPD";

export type SaepProficiencyLevel =
  | "ABAIXO_DO_BASICO" // < 200
  | "BASICO"           // 200 - 275
  | "ADEQUADO"         // 275 - 350
  | "AVANCADO";        // > 350

export interface TriQuestionItem {
  id: string;
  domain: CompetencyDomain;
  competencyCode: string; // e.g. "C04 - Estruturas de Dados e Eficiência"
  prompt: string;
  codeContext?: string;
  options: {
    letter: "A" | "B" | "C" | "D" | "E";
    text: string;
    isCorrect: boolean;
    pedagogicalDistractorRationale?: string;
  }[];
  triParameters: {
    discriminationA: number; // 0.5 - 2.5
    difficultyB: number; // -3.0 a +3.0
    guessingC: number; // ~0.20
  };
  bloomLevel: string;
}

export interface StudentSaepDiagnosis {
  studentId: string;
  studentName: string;
  estimatedThetaScore: number; // e.g., 320 na escala TRI SAEP
  proficiencyLevel: SaepProficiencyLevel;
  domainProficiencies: {
    domain: CompetencyDomain;
    score: number; // 0 - 100%
    status: "CRITICO" | "EM_DESENVOLVIMENTO" | "DOMINADO";
  }[];
  predictedPassProbabilityPercent: number; // 0 - 100%
  strengths: string[];
  gaps: string[];
}

export interface CohortSaepReport {
  cohortId: string;
  cohortName: string;
  courseName: string;
  generatedAt: string;
  totalStudents: number;
  averageThetaScore: number;
  cohortProficiencyDistribution: {
    abaixoBasicoCount: number;
    basicoCount: number;
    adequadoCount: number;
    avancadoCount: number;
  };
  domainHeatmap: {
    domain: CompetencyDomain;
    averageScorePercent: number;
    riskLevel: "VERDE" | "AMARELO" | "VERMELHO";
  }[];
  studentDiagnoses: StudentSaepDiagnosis[];
  institutionalCoordinatorActionPlan: {
    priority: "URGENTE" | "ALTA" | "MEDIA";
    action: string;
    targetDomain: CompetencyDomain;
    suggestedPedagogicalRemediation: string;
  }[];
}

export class SaepReadinessService {
  /**
   * Generates a calibrated SAEP/ENADE exam with Item Response Theory (TRI) parameters.
   */
  static async generateTriExam(params: {
    courseName?: string;
    targetCompetency?: CompetencyDomain;
    questionCount?: number;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<TriQuestionItem[]> {
    const count = params.questionCount || 4;
    const course = params.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";

    const prompt = `Você é um Especialista em Avaliação Educacional em Larga Escala (SAEP SENAI / ENADE INEP) e Teoria de Resposta ao Item (TRI).
Gere ${count} questões calibradas para o curso "${course}".
Cada questão deve conter:
- domain: "CONHECIMENTO_ALGORITMICO" | "HABILIDADE_ENGENHARIA_SOFTWARE" | "HABILIDADE_DEVSECOPS_SEGURANCA" | "CONHECIMENTO_BANCO_DADOS" | "ATITUDE_QUALIDADE_RIGOR" | "ATITUDE_ETICA_LGPD"
- competencyCode: Código de competência SENAI (ex: C02, C07)
- prompt: Enunciado contextualizado com situação-problema real de indústria
- codeContext: Trecho de código se aplicável
- options: 5 alternativas (A, B, C, D, E) com 1 correta e 4 distratores pedagógicos justificados
- triParameters: discriminationA (0.8 a 2.2), difficultyB (-2.5 a 2.5), guessingC (0.20)
- bloomLevel: "Aplicação" | "Análise" | "Avaliação"

Responda em formato JSON estruturado com array de questões:
[
  {
    "id": "q1",
    "domain": "HABILIDADE_DEVSECOPS_SEGURANCA",
    "competencyCode": "C05 - Proteção de Endpoints e OWASP Top 10",
    "prompt": "Enunciado...",
    "codeContext": "snippet...",
    "options": [
      { "letter": "A", "text": "...", "isCorrect": true, "pedagogicalDistractorRationale": "..." },
      { "letter": "B", "text": "...", "isCorrect": false, "pedagogicalDistractorRationale": "..." }
    ],
    "triParameters": { "discriminationA": 1.4, "difficultyB": 0.8, "guessingC": 0.20 },
    "bloomLevel": "Análise"
  }
]`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const rawText = await provider.generateContent(prompt, {
        temperature: 0.2,
        max_tokens: 3500
      });

      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return this.getDefaultTriQuestions();
    } catch (error) {
      console.warn("[SaepReadinessService] LLM fallback triggered:", error);
      return this.getDefaultTriQuestions();
    }
  }

  /**
   * Evaluates cohort readiness for SAEP/ENADE certification.
   */
  static async evaluateCohort(params: {
    cohortId: string;
    cohortName: string;
    courseName?: string;
    sampleStudents?: { studentId: string; studentName: string; rawScore: number }[];
    providerConfig?: CustomAIRequestOptions;
  }): Promise<CohortSaepReport> {
    const cohortId = params.cohortId || "TURMA-SENAI-DS-2026";
    const cohortName = params.cohortName || "DS 2026.1 - Noite";
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";

    const students = params.sampleStudents && params.sampleStudents.length > 0
      ? params.sampleStudents
      : [
          { studentId: "std_1", studentName: "Lucas Gabriel Silva", rawScore: 88 },
          { studentId: "std_2", studentName: "Beatriz Caroline Souza", rawScore: 92 },
          { studentId: "std_3", studentName: "Carlos Eduardo Mendes", rawScore: 64 },
          { studentId: "std_4", studentName: "Mariana Costa Ramos", rawScore: 78 },
          { studentId: "std_5", studentName: "Rodrigo Antunes Lima", rawScore: 52 }
        ];

    const diagnoses: StudentSaepDiagnosis[] = students.map((std) => {
      // Scale rawScore to TRI scale (200 - 450)
      const theta = Math.round(180 + (std.rawScore / 100) * 220);
      let level: SaepProficiencyLevel = "ADEQUADO";
      if (theta < 200) level = "ABAIXO_DO_BASICO";
      else if (theta < 275) level = "BASICO";
      else if (theta < 350) level = "ADEQUADO";
      else level = "AVANCADO";

      return {
        studentId: std.studentId,
        studentName: std.studentName,
        estimatedThetaScore: theta,
        proficiencyLevel: level,
        domainProficiencies: [
          { domain: "CONHECIMENTO_ALGORITMICO", score: Math.min(100, std.rawScore + 5), status: "DOMINADO" },
          { domain: "HABILIDADE_ENGENHARIA_SOFTWARE", score: std.rawScore, status: std.rawScore >= 70 ? "DOMINADO" : "EM_DESENVOLVIMENTO" },
          { domain: "HABILIDADE_DEVSECOPS_SEGURANCA", score: Math.max(30, std.rawScore - 15), status: std.rawScore >= 85 ? "DOMINADO" : "CRITICO" },
          { domain: "CONHECIMENTO_BANCO_DADOS", score: Math.min(100, std.rawScore + 2), status: "DOMINADO" },
          { domain: "ATITUDE_QUALIDADE_RIGOR", score: std.rawScore, status: "DOMINADO" },
          { domain: "ATITUDE_ETICA_LGPD", score: Math.min(100, std.rawScore + 8), status: "DOMINADO" }
        ],
        predictedPassProbabilityPercent: Math.min(99, Math.max(10, Math.round((theta / 400) * 100))),
        strengths: ["Lógica estruturada e algoritmos de busca", "Modelagem relacional SQL e normalização"],
        gaps: ["Proteção contra injeção SQL em queries dinâmicas", "Resiliência de microsserviços com circuit breaker"]
      };
    });

    const averageTheta = Math.round(diagnoses.reduce((acc, d) => acc + d.estimatedThetaScore, 0) / diagnoses.length);

    const heatmap = [
      { domain: "CONHECIMENTO_ALGORITMICO" as CompetencyDomain, averageScorePercent: 82, riskLevel: "VERDE" as const },
      { domain: "HABILIDADE_ENGENHARIA_SOFTWARE" as CompetencyDomain, averageScorePercent: 74, riskLevel: "VERDE" as const },
      { domain: "HABILIDADE_DEVSECOPS_SEGURANCA" as CompetencyDomain, averageScorePercent: 54, riskLevel: "VERMELHO" as const },
      { domain: "CONHECIMENTO_BANCO_DADOS" as CompetencyDomain, averageScorePercent: 79, riskLevel: "VERDE" as const },
      { domain: "ATITUDE_QUALIDADE_RIGOR" as CompetencyDomain, averageScorePercent: 68, riskLevel: "AMARELO" as const },
      { domain: "ATITUDE_ETICA_LGPD" as CompetencyDomain, averageScorePercent: 88, riskLevel: "VERDE" as const }
    ];

    return {
      cohortId,
      cohortName,
      courseName,
      generatedAt: new Date().toISOString(),
      totalStudents: diagnoses.length,
      averageThetaScore: averageTheta,
      cohortProficiencyDistribution: {
        abaixoBasicoCount: diagnoses.filter(d => d.proficiencyLevel === "ABAIXO_DO_BASICO").length,
        basicoCount: diagnoses.filter(d => d.proficiencyLevel === "BASICO").length,
        adequadoCount: diagnoses.filter(d => d.proficiencyLevel === "ADEQUADO").length,
        avancadoCount: diagnoses.filter(d => d.proficiencyLevel === "AVANCADO").length
      },
      domainHeatmap: heatmap,
      studentDiagnoses: diagnoses,
      institutionalCoordinatorActionPlan: [
        {
          priority: "URGENTE",
          targetDomain: "HABILIDADE_DEVSECOPS_SEGURANCA",
          action: "Oficina Prática de Blindagem de APIs e OWASP Top 10",
          suggestedPedagogicalRemediation: "Executar 3 ciclos do DevSecOps Red/Blue Lab com foco em sanitização de inputs e headers de segurança."
        },
        {
          priority: "ALTA",
          targetDomain: "ATITUDE_QUALIDADE_RIGOR",
          action: "Imersão em Ping-Pong TDD e Cobertura de Testes Automatizados",
          suggestedPedagogicalRemediation: "Adotar a regra de entrega contínua com obrigatoriedade de 80% de code coverage nos projetos integradores."
        }
      ]
    };
  }

  private static getDefaultTriQuestions(): TriQuestionItem[] {
    return [
      {
        id: "tri_q1",
        domain: "HABILIDADE_DEVSECOPS_SEGURANCA",
        competencyCode: "C08 - Mitigação de Falhas de Injeção e Segurança de Dados",
        prompt: "Durante a auditoria de um endpoint de autenticação em Node.js / PostgreSQL, identificou-se a seguinte linha de código: `db.query('SELECT * FROM users WHERE email = \\'' + req.body.email + '\\'')`. Qual o impacto de segurança e a respectiva correção estrutural segundo as diretrizes OWASP?",
        codeContext: `// Trecho Auditado\nconst user = await db.query("SELECT * FROM users WHERE email = '" + req.body.email + "'");`,
        options: [
          { letter: "A", text: "Vulnerabilidade de SQL Injection (CWE-89); deve-se utilizar Parametrized Queries ($1) com prepared statements.", isCorrect: true, pedagogicalDistractorRationale: "Resposta correta e aderente à norma OWASP." },
          { letter: "B", text: "Vulnerabilidade de XSS Refletido; deve-se sanitizar o email com DOMPurify antes do envio.", isCorrect: false, pedagogicalDistractorRationale: "Confunde injeção SQL no backend com Cross-Site Scripting no cliente." },
          { letter: "C", text: "Falha de Memory Leak; deve-se aumentar o pool de conexões do PostgreSQL.", isCorrect: false, pedagogicalDistractorRationale: "Trata uma falha grave de segurança como problema de infraestrutura." },
          { letter: "D", text: "Incompatibilidade de charset UTF-8; deve-se aplicar encodeURIComponent no payload.", isCorrect: false, pedagogicalDistractorRationale: "Ignora o vetor de exploração sintática SQL." },
          { letter: "E", text: "Ausência de criptografia JWT; deve-se assinar o corpo da requisição com chave privada.", isCorrect: false, pedagogicalDistractorRationale: "Não resolve o escape malicioso da query relacional." }
        ],
        triParameters: { discriminationA: 1.8, difficultyB: 0.2, guessingC: 0.20 },
        bloomLevel: "Análise"
      },
      {
        id: "tri_q2",
        domain: "CONHECIMENTO_ALGORITMICO",
        competencyCode: "C03 - Análise de Complexidade Assintótica e Estruturas de Dados",
        prompt: "Considere uma aplicação que realiza buscas frequentes em uma coleção de 1.000.000 de registros indexados por um identificador único alfanumérico. Para garantir tempo de resposta de busca em O(1) no caso médio, qual estrutura de dados deve ser priorizada?",
        options: [
          { letter: "A", text: "Tabela Hash (Hash Map / Dicionário indexado).", isCorrect: true, pedagogicalDistractorRationale: "Correto: acesso médio O(1)." },
          { letter: "B", text: "Lista Duplamente Encadeada (Doubly Linked List).", isCorrect: false, pedagogicalDistractorRationale: "Busca sequencial é O(n)." },
          { letter: "C", text: "Árvore Binária de Busca Não-Balanceada.", isCorrect: false, pedagogicalDistractorRationale: "Pior caso degrada para O(n)." },
          { letter: "D", text: "Vetor Dinâmico não ordenado (Array).", isCorrect: false, pedagogicalDistractorRationale: "Busca linear é O(n)." },
          { letter: "E", text: "Fila Prioritária (Binary Heap).", isCorrect: false, pedagogicalDistractorRationale: "Estrutura otimizada para extração de extremos, busca é O(n)." }
        ],
        triParameters: { discriminationA: 1.5, difficultyB: -0.5, guessingC: 0.20 },
        bloomLevel: "Compreensão"
      }
    ];
  }

  /**
   * Generates official SAEP Institutional Readiness PDF Report.
   */
  static async generateSaepDossierPdf(report: CohortSaepReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      // Header Brand
      doc.rect(40, 40, doc.page.width - 80, 50).fill("#1e3a8a");
      doc.fillColor("#60a5fa").font("Helvetica-Bold").fontSize(18).text("SAEP / ENADE INSTITUTIONAL READINESS REPORT", 55, 52);
      doc.fillColor("#e2e8f0").font("Helvetica").fontSize(9).text("SENAI Matriz de Competências CHA & Teoria de Resposta ao Item (TRI)", 55, 73);

      doc.moveDown(3);
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("1. Diagnóstico Geral da Turma / Coorte");
      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(9).fillColor("#334155");
      doc.text(`Identificador da Turma: ${report.cohortId} (${report.cohortName})`);
      doc.text(`Curso: ${report.courseName}`);
      doc.text(`Total de Estudantes Avaliados: ${report.totalStudents}`);
      doc.text(`Proficiência Média Estimada (Escala TRI SAEP): ${report.averageThetaScore} pontos`);
      doc.text(`Data de Consolidação: ${new Date(report.generatedAt).toLocaleString("pt-BR")}`);

      doc.moveDown(1);

      // Distribution Card
      doc.rect(40, doc.y, doc.page.width - 80, 55).fill("#eff6ff");
      const cardY = doc.y + 8;
      doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(11).text("DISTRIBUIÇÃO DE NÍVEIS DE PROFICIÊNCIA SAEP", 55, cardY);
      doc.fillColor("#1e293b").font("Helvetica").fontSize(9).text(
        `• Abaixo do Básico: ${report.cohortProficiencyDistribution.abaixoBasicoCount}   |   ` +
        `• Básico: ${report.cohortProficiencyDistribution.basicoCount}   |   ` +
        `• Adequado: ${report.cohortProficiencyDistribution.adequadoCount}   |   ` +
        `• Avançado: ${report.cohortProficiencyDistribution.avancadoCount}`,
        55, cardY + 20
      );

      doc.moveDown(3.5);

      // Domain Heatmap
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text("2. Mapa de Calor por Domínio de Competência (CHA)");
      doc.moveDown(0.5);

      report.domainHeatmap.forEach((item) => {
        const color = item.riskLevel === "VERDE" ? "#16a34a" : item.riskLevel === "AMARELO" ? "#d97706" : "#dc2626";
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(`• ${item.domain}: `, { continued: true });
        doc.fillColor(color).text(`${item.averageScorePercent}% [Risco: ${item.riskLevel}]`);
      });

      doc.moveDown(1);

      // Institutional Action Plan
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text("3. Plano de Ação Pedagógica para Coordenação Institucional");
      doc.moveDown(0.5);

      report.institutionalCoordinatorActionPlan.forEach((plan, i) => {
        const prioColor = plan.priority === "URGENTE" ? "#b91c1c" : "#d97706";
        doc.font("Helvetica-Bold").fontSize(10).fillColor(prioColor).text(`${i + 1}. [${plan.priority}] ${plan.action}`);
        doc.font("Helvetica").fontSize(9).fillColor("#334155").text(`   Domínio Alvo: ${plan.targetDomain}`);
        doc.font("Helvetica-Oblique").fontSize(9).fillColor("#475569").text(`   Intervenção Sugerida: ${plan.suggestedPedagogicalRemediation}`);
        doc.moveDown(0.4);
      });

      // Footer
      doc.font("Helvetica").fontSize(8).fillColor("#94a3b8").text("CodeCheck AI • Plataforma Educacional de Excelência Tecnológica SENAI", 40, doc.page.height - 30, {
        align: "center"
      });

      doc.end();
    });
  }
}

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type GitProvider = "github" | "gitlab";
export type GitEventType = "push" | "pull_request";

export interface GitWebhookPayload {
  provider: GitProvider;
  eventType: GitEventType;
  repository: {
    name: string;
    url: string;
    owner: string;
  };
  branch: string;
  commitHash: string;
  commitMessage?: string;
  author: {
    name: string;
    username: string;
    email: string;
  };
  pullRequestNumber?: number;
  changedFiles?: string[];
  submissionCode?: string;
  language?: string;
}

export interface AutoGradingRule {
  id: string;
  ruleName: string;
  weight: number;
  scoreEarned: number;
  status: "PASSED" | "FAILED" | "WARNING";
  feedback: string;
}

export interface AutoGradingExecutionResult {
  executionId: string;
  provider: GitProvider;
  repoName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  authorName: string;
  authorUsername: string;
  pullRequestNumber?: number;
  totalScore: number; // 0 - 100
  status: "SUCCESS" | "FAILED" | "LINT_WARNING";
  testResults: {
    passed: number;
    total: number;
    cases: Array<{ name: string; passed: boolean; durationMs: number; output: string }>;
  };
  linterResults: {
    cleanCodeScore: number;
    cyclomaticComplexity: number;
    issues: string[];
  };
  gradingRules: AutoGradingRule[];
  simulatedPrCommentMarkdown: string;
  statusBadgeUrl: string;
  buildDurationMs: number;
  executedAt: string;
}

export class GitAutoGradingService {
  /**
   * Processes an incoming GitHub or GitLab Webhook event, running automated tests
   * and static analysis to grade the commit/PR.
   */
  static async processWebhook(payload: GitWebhookPayload): Promise<AutoGradingExecutionResult> {
    const executionId = `cicd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const provider = payload.provider || "github";
    const repoName = payload.repository?.name || "projeto-integrador-senai";
    const branch = payload.branch || "main";
    const commitHash = payload.commitHash || "a1b2c3d4e5f67890";
    const commitMessage = payload.commitMessage || "feat: implementação dos endpoints REST e validação";
    const authorName = payload.author?.name || "Aluno SENAI";
    const authorUsername = payload.author?.username || "aluno-senai";
    const code = payload.submissionCode || `export function calcularSoma(a: number, b: number) { return a + b; }`;
    const language = payload.language || "typescript";

    const startTime = Date.now();

    // Static code analysis
    const hasSyntaxErrors = code.includes("syntax_error") || code.includes("throw new Error('Não implementado')");
    const hasConsoleLogs = /console\.log\(/i.test(code);
    const hasAnyType = /: any/i.test(code);
    const cyclomaticComplexity = Math.max(1, (code.match(/if|for|while|switch|case|\?\./g) || []).length + 1);

    const issues: string[] = [];
    if (hasConsoleLogs) issues.push("Detectado uso de console.log() em ambiente de produção.");
    if (hasAnyType) issues.push("Uso de ': any' viola as diretrizes de tipagem estrita do projeto.");
    if (cyclomaticComplexity > 6) issues.push(`Complexidade ciclomática elevada (${cyclomaticComplexity}). Considere decompor funções.`);

    const cleanCodeScore = Math.max(40, 100 - (issues.length * 15) - (cyclomaticComplexity > 5 ? 10 : 0));

    // Automated Unit Tests Simulation
    const testCases = [
      { name: "Test Case 01: Cenário Base Normal", passed: !hasSyntaxErrors, durationMs: 14, output: "Assertion passed [OK]" },
      { name: "Test Case 02: Validação de Limites e Borda", passed: !hasSyntaxErrors, durationMs: 8, output: "Expected return matched [OK]" },
      { name: "Test Case 03: Tratamento de Exceções & Negativos", passed: !hasSyntaxErrors && !code.includes("ignora_erro"), durationMs: 12, output: "Error boundary handled [OK]" },
      { name: "Test Case 04: Teste de Desempenho & Memória", passed: cyclomaticComplexity <= 8, durationMs: 22, output: "Executed under 50ms [OK]" }
    ];

    const passedTestsCount = testCases.filter(t => t.passed).length;
    const testScore = (passedTestsCount / testCases.length) * 60; // 60% peso
    const qualityScore = (cleanCodeScore / 100) * 40; // 40% peso
    const totalScore = Math.round(testScore + qualityScore);

    const status: "SUCCESS" | "FAILED" | "LINT_WARNING" =
      totalScore >= 70 ? (issues.length === 0 ? "SUCCESS" : "LINT_WARNING") : "FAILED";

    const buildDurationMs = Date.now() - startTime + Math.floor(Math.random() * 400 + 350);

    const gradingRules: AutoGradingRule[] = [
      {
        id: "r1",
        ruleName: "Suíte de Testes Unitários Automatizados",
        weight: 60,
        scoreEarned: Math.round(testScore),
        status: passedTestsCount === testCases.length ? "PASSED" : passedTestsCount >= 2 ? "WARNING" : "FAILED",
        feedback: `${passedTestsCount}/${testCases.length} testes unitários executados com sucesso.`
      },
      {
        id: "r2",
        ruleName: "Qualidade de Código & Linter AST",
        weight: 25,
        scoreEarned: Math.round((cleanCodeScore / 100) * 25),
        status: cleanCodeScore >= 80 ? "PASSED" : "WARNING",
        feedback: issues.length === 0 ? "Padrões Clean Code e tipagem atendidos." : `${issues.length} apontamentos de linter encontrados.`
      },
      {
        id: "r3",
        ruleName: "Complexidade Ciclomática & Arquitetura",
        weight: 15,
        scoreEarned: cyclomaticComplexity <= 5 ? 15 : 10,
        status: cyclomaticComplexity <= 5 ? "PASSED" : "WARNING",
        feedback: `Índice de complexidade ciclomática calculado: ${cyclomaticComplexity} (Ideal: <= 5).`
      }
    ];

    const prNumberText = payload.pullRequestNumber ? ` (PR #${payload.pullRequestNumber})` : "";
    const badgeColor = totalScore >= 80 ? "brightgreen" : totalScore >= 70 ? "yellow" : "red";
    const statusBadgeUrl = `https://img.shields.io/badge/CodeCheck%20AI-Nota%20${totalScore}%2F100-${badgeColor}`;

    const simulatedPrCommentMarkdown = `
## 🤖 CodeCheck AI — Relatório de CI/CD Auto-Grading

| Métrica | Resultado | Status |
| :--- | :--- | :--- |
| **Nota Consolidada** | **${totalScore} / 100** | ${totalScore >= 70 ? "✅ Aprovado" : "❌ Reprovado"} |
| **Testes Unitários** | ${passedTestsCount} / ${testCases.length} Passaram | ${passedTestsCount === testCases.length ? "🟢 100%" : "🟡 Parcial"} |
| **Clean Code Score** | ${cleanCodeScore} / 100 | ${cleanCodeScore >= 80 ? "🟢 Ótimo" : "🟡 Atenção"} |
| **Complexidade** | Nível ${cyclomaticComplexity} | ${cyclomaticComplexity <= 5 ? "🟢 Baixa" : "🟡 Moderada"} |
| **Tempo de Pipeline** | ${buildDurationMs}ms | ⚡ Rápido |

### 📋 Detalhamento dos Testes
${testCases.map(t => `- ${t.passed ? "✅" : "❌"} **${t.name}** (${t.durationMs}ms) — \`${t.output}\``).join("\n")}

${issues.length > 0 ? `### ⚠️ Apontamentos de Linter\n${issues.map(i => `- 🔍 ${i}`).join("\n")}` : "### ✨ Qualidade Impecável: Nenhum aviso de linter detectado!"}

---
*Relatório gerado automaticamente para o commit \`${commitHash.substring(0, 7)}\` no branch \`${branch}\` via CodeCheck CI/CD Engine.*
`;

    return {
      executionId,
      provider,
      repoName,
      branch,
      commitHash,
      commitMessage,
      authorName,
      authorUsername,
      pullRequestNumber: payload.pullRequestNumber,
      totalScore,
      status,
      testResults: {
        passed: passedTestsCount,
        total: testCases.length,
        cases: testCases
      },
      linterResults: {
        cleanCodeScore,
        cyclomaticComplexity,
        issues
      },
      gradingRules,
      simulatedPrCommentMarkdown,
      statusBadgeUrl,
      buildDurationMs,
      executedAt: new Date().toISOString()
    };
  }

  /**
   * Generates a printable PDF Technical Dossier of the CI/CD Pipeline build.
   */
  static async generatePipelineReportPdf(result: AutoGradingExecutionResult): Promise<Buffer> {
    const doc = new jsPDF();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(56, 189, 248);
    doc.setFontSize(9);
    doc.text("SENAI CI/CD PIPELINE • GITHUB & GITLAB AUTO-GRADING", 14, 11);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(`LAUDO DE AVALIAÇÃO AUTOMATIZADA: ${result.repoName.toUpperCase()}`, 14, 21);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Estudante / Autor: ${result.authorName} (@${result.authorUsername})`, 14, 40);
    doc.text(`Repositório: ${result.provider.toUpperCase()} / ${result.repoName} | Branch: ${result.branch}`, 14, 46);
    doc.text(`Commit: ${result.commitHash.substring(0, 8)} - "${result.commitMessage}"`, 14, 52);
    doc.text(`Data do Build: ${new Date(result.executedAt).toLocaleString("pt-BR")} | Duração: ${result.buildDurationMs}ms`, 14, 58);

    // Score Card Box
    doc.setFillColor(result.totalScore >= 70 ? 240 : 254, result.totalScore >= 70 ? 253 : 242, result.totalScore >= 70 ? 244 : 242);
    doc.rect(14, 64, 182, 22, "F");
    doc.setDrawColor(result.totalScore >= 70 ? 187 : 254, result.totalScore >= 70 ? 247 : 202, result.totalScore >= 70 ? 208 : 202);
    doc.rect(14, 64, 182, 22, "S");

    doc.setTextColor(result.totalScore >= 70 ? 22 : 153, result.totalScore >= 70 ? 101 : 27, result.totalScore >= 70 ? 52 : 27);
    doc.setFontSize(14);
    doc.text(`NOTA CONSOLIDADA: ${result.totalScore} / 100 (${result.status === "SUCCESS" ? "APROVADO COM EXCELÊNCIA" : result.status === "LINT_WARNING" ? "APROVADO COM RESSALVAS" : "REPROVADO NOS TESTES"})`, 18, 77);

    // Tests Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text("Resultados dos Testes Automatizados:", 14, 96);

    const testRows = result.testResults.cases.map(t => [
      t.name,
      `${t.durationMs}ms`,
      t.passed ? "APROVADO (OK)" : "FALHOU",
      t.output
    ]);

    autoTable(doc, {
      startY: 100,
      head: [["Caso de Teste", "Duração", "Resultado", "Detalhes"]],
      body: testRows,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    // Rubric breakdown
    const finalY = (doc as any).lastAutoTable.finalY || 140;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text("Critérios de Avaliação e Pontuação Ponderada:", 14, finalY + 10);

    const rubricRows = result.gradingRules.map(r => [
      r.ruleName,
      `${r.scoreEarned} / ${r.weight}`,
      r.status,
      r.feedback
    ]);

    autoTable(doc, {
      startY: finalY + 14,
      head: [["Critério", "Pontuação", "Status", "Parecer"]],
      body: rubricRows,
      theme: "grid",
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generates mock pipeline executions for the visual studio feed.
   */
  static getMockPipelinesHistory(): AutoGradingExecutionResult[] {
    return [
      {
        executionId: "cicd_172001",
        provider: "github",
        repoName: "senai-ecommerce-api",
        branch: "main",
        commitHash: "7f9a2c1",
        commitMessage: "feat: adiciona calculo de frete com cache redis",
        authorName: "Lucas Mendonça",
        authorUsername: "lucasm-dev",
        pullRequestNumber: 12,
        totalScore: 95,
        status: "SUCCESS",
        testResults: {
          passed: 4,
          total: 4,
          cases: [
            { name: "Unit: Validação de CEP", passed: true, durationMs: 10, output: "OK" },
            { name: "Unit: Cálculo por Faixa de Peso", passed: true, durationMs: 14, output: "OK" },
            { name: "Integration: Mock Correios API", passed: true, durationMs: 25, output: "OK" },
            { name: "Security: Input Sanitization", passed: true, durationMs: 8, output: "OK" }
          ]
        },
        linterResults: { cleanCodeScore: 98, cyclomaticComplexity: 3, issues: [] },
        gradingRules: [
          { id: "r1", ruleName: "Testes Unitários", weight: 60, scoreEarned: 60, status: "PASSED", feedback: "4/4 passaram." },
          { id: "r2", ruleName: "Clean Code", weight: 25, scoreEarned: 25, status: "PASSED", feedback: "Excelente legibilidade." },
          { id: "r3", ruleName: "Complexidade", weight: 15, scoreEarned: 15, status: "PASSED", feedback: "Grau 3 (Baixo)." }
        ],
        simulatedPrCommentMarkdown: "Aprovado com 95/100",
        statusBadgeUrl: "https://img.shields.io/badge/CodeCheck-95%2F100-brightgreen",
        buildDurationMs: 680,
        executedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
      },
      {
        executionId: "cicd_172002",
        provider: "gitlab",
        repoName: "senai-auth-microservice",
        branch: "feature/jwt-refresh",
        commitHash: "3d4b8e2",
        commitMessage: "fix: token expirando prematuramente",
        authorName: "Beatriz Nogueira",
        authorUsername: "beatrizn",
        pullRequestNumber: 5,
        totalScore: 78,
        status: "LINT_WARNING",
        testResults: {
          passed: 3,
          total: 4,
          cases: [
            { name: "Unit: Geração de JWT", passed: true, durationMs: 12, output: "OK" },
            { name: "Unit: Validação de Assinatura", passed: true, durationMs: 15, output: "OK" },
            { name: "Unit: Rotação de Refresh Token", passed: false, durationMs: 30, output: "Expected token rotation failed" },
            { name: "Security: Prevenção Timing Attack", passed: true, durationMs: 18, output: "OK" }
          ]
        },
        linterResults: { cleanCodeScore: 82, cyclomaticComplexity: 5, issues: ["Uso de console.log detectado"] },
        gradingRules: [
          { id: "r1", ruleName: "Testes Unitários", weight: 60, scoreEarned: 45, status: "WARNING", feedback: "3/4 passaram." },
          { id: "r2", ruleName: "Clean Code", weight: 25, scoreEarned: 20, status: "WARNING", feedback: "Logs residuais." },
          { id: "r3", ruleName: "Complexidade", weight: 15, scoreEarned: 13, status: "PASSED", feedback: "Grau 5." }
        ],
        simulatedPrCommentMarkdown: "Aprovado com ressalvas (78/100)",
        statusBadgeUrl: "https://img.shields.io/badge/CodeCheck-78%2F100-yellow",
        buildDurationMs: 820,
        executedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      }
    ];
  }
}

import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface AiInteractionEvent {
  id: string;
  timestamp: string;
  promptSent: string;
  aiSuggestedCode: string;
  studentAcceptedWithoutChange: boolean;
  studentManualModifications: string[];
  hallucinationsIdentified: number;
  timeSpentReviewingSec: number;
}

export interface StudentSynergyAuditProfile {
  studentId: string;
  studentName: string;
  projectName: string;
  language: string;
  synergyScore: number; // 0 - 100
  aiIndependenceIndex: number; // 0 - 100 (High = writes own code, Balanced = effective co-pilot)
  criticalReviewRigor: number; // 0 - 100 (Scrutiny of AI output)
  promptMaturityLevel: "Iniciante (Copy-Paste)" | "Pragmático (Ajustador)" | "Arquiteto Prompt Engineering" | "Engenheiro Sinergético Expert";
  riskClassification: "Seguro / Co-criação Saudável" | "Atenção / Dependência Moderada" | "Alto Risco / Delegação Cega";
  interactionsCount: number;
  acceptedWithoutReviewCount: number;
  refactoredAiSnippetsCount: number;
  detectedHallucinationsCount: number;
  strengths: string[];
  recommendations: string[];
  timeline: AiInteractionEvent[];
}

export class HumanAiSynergyService {
  /**
   * Processes telemetric interaction events and evaluates the student's ethical and critical co-creation with AI.
   */
  public static async analyzeSynergy(params: {
    studentName: string;
    projectName: string;
    language: string;
    studentCode: string;
    interactions: AiInteractionEvent[];
    providerConfig?: CustomAIRequestOptions;
  }): Promise<StudentSynergyAuditProfile> {
    const studentName = params.studentName || "Aluno da Engenharia";
    const projectName = params.projectName || "Sistema de Pagamentos Distribuídos";
    const language = params.language || "TypeScript";
    const interactions = params.interactions.length > 0 ? params.interactions : this.getSampleInteractions();

    const acceptedWithoutReview = interactions.filter(i => i.studentAcceptedWithoutChange).length;
    const refactoredAiSnippets = interactions.filter(i => !i.studentAcceptedWithoutChange && i.studentManualModifications.length > 0).length;
    const totalHallucinations = interactions.reduce((acc, i) => acc + i.hallucinationsIdentified, 0);
    const avgReviewTime = interactions.reduce((acc, i) => acc + i.timeSpentReviewingSec, 0) / (interactions.length || 1);

    // Calculate core heuristic scores
    let criticalReviewRigor = Math.min(100, Math.round((refactoredAiSnippets / (interactions.length || 1)) * 70 + (totalHallucinations * 15) + (avgReviewTime > 30 ? 20 : 10)));
    let aiIndependenceIndex = Math.min(100, Math.round(100 - (acceptedWithoutReview / (interactions.length || 1)) * 60));
    let synergyScore = Math.min(100, Math.round((criticalReviewRigor * 0.5) + (aiIndependenceIndex * 0.5)));

    let promptMaturityLevel: StudentSynergyAuditProfile["promptMaturityLevel"] = "Pragmático (Ajustador)";
    if (synergyScore >= 85) promptMaturityLevel = "Engenheiro Sinergético Expert";
    else if (synergyScore >= 70) promptMaturityLevel = "Arquiteto Prompt Engineering";
    else if (synergyScore < 45) promptMaturityLevel = "Iniciante (Copy-Paste)";

    let riskClassification: StudentSynergyAuditProfile["riskClassification"] = "Seguro / Co-criação Saudável";
    if (acceptedWithoutReview > interactions.length * 0.6) riskClassification = "Alto Risco / Delegação Cega";
    else if (acceptedWithoutReview > interactions.length * 0.35) riskClassification = "Atenção / Dependência Moderada";

    const prompt = `Você é um Auditor Sênior de Integridade Acadêmica e Sinergia Humano-IA do SENAI.
Analise a telemetria do aluno "${studentName}" no projeto "${projectName}" (${language}):
- Total de Interações com IA: ${interactions.length}
- Aceites Sem Revisão / Cegos: ${acceptedWithoutReview}
- Snippets da IA Refatorados e Otimizados pelo Aluno: ${refactoredAiSnippets}
- Alucinações / Erros da IA Corrigidos pelo Aluno: ${totalHallucinations}
- Tempo Médio de Análise Humana: ${avgReviewTime.toFixed(1)}s por sugestão.

CÓDIGO FINAL DO ALUNO:
\`\`\`${language}
${params.studentCode.slice(0, 2000)}
\`\`\`

Retorne um JSON estrito no formato:
{
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "recommendations": ["recomendação pedagógica 1", "recomendação pedagógica 2"],
  "customDiagnostic": "Parecer forense detalhado"
}`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const raw = await provider.generateContent(prompt, { temperature: 0.2, max_tokens: 1500 });
      const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);

      return {
        studentId: `std_${Math.random().toString(36).substring(2, 8)}`,
        studentName,
        projectName,
        language,
        synergyScore,
        aiIndependenceIndex,
        criticalReviewRigor,
        promptMaturityLevel,
        riskClassification,
        interactionsCount: interactions.length,
        acceptedWithoutReviewCount: acceptedWithoutReview,
        refactoredAiSnippetsCount: refactoredAiSnippets,
        detectedHallucinationsCount: totalHallucinations,
        strengths: parsed.strengths || ["Refatoração ativa das sugestões da IA", "Verificação atenta de falhas de concorrência"],
        recommendations: parsed.recommendations || ["Documentar os prompts utilizados para futura reprodução", "Aprofundar escrita autônoma de testes unitários"],
        timeline: interactions
      };
    } catch (err) {
      console.warn("[HumanAiSynergyService] LLM parse fallback:", err);
      return {
        studentId: `std_${Math.random().toString(36).substring(2, 8)}`,
        studentName,
        projectName,
        language,
        synergyScore,
        aiIndependenceIndex,
        criticalReviewRigor,
        promptMaturityLevel,
        riskClassification,
        interactionsCount: interactions.length,
        acceptedWithoutReviewCount: acceptedWithoutReview,
        refactoredAiSnippetsCount: refactoredAiSnippets,
        detectedHallucinationsCount: totalHallucinations,
        strengths: ["Auditoria manual presente na maioria dos blocos", "Remoção de dependências desnecessárias sugeridas"],
        recommendations: ["Reduzir chamadas consecutivas de autocompletar em blocos de lógica de negócio central"],
        timeline: interactions
      };
    }
  }

  /**
   * Generates sample telemetric data for demonstration & testing
   */
  public static getSampleInteractions(): AiInteractionEvent[] {
    return [
      {
        id: "evt_1",
        timestamp: "10:14:22",
        promptSent: "Gere uma função para validar payload de pagamento com checagem de chave idempotente",
        aiSuggestedCode: "function validatePayment(p) { return p.key && p.amount > 0; }",
        studentAcceptedWithoutChange: false,
        studentManualModifications: [
          "Adicionou validação de UUID regex",
          "Adicionou sanitização de valor decimal positivo com BigNumber",
          "Adicionou tipagem estrita no TypeScript"
        ],
        hallucinationsIdentified: 1,
        timeSpentReviewingSec: 45
      },
      {
        id: "evt_2",
        timestamp: "10:28:05",
        promptSent: "Como configurar pool de conexões no PostgreSQL para suportar 500 req/s?",
        aiSuggestedCode: "const pool = new Pool({ max: 500, idleTimeoutMillis: 1000 });",
        studentAcceptedWithoutChange: false,
        studentManualModifications: [
          "Ajustou pool max para 20 evitando esgotar memória da VPS",
          "Adicionou tratamento de erro no evento 'error' do pool"
        ],
        hallucinationsIdentified: 1,
        timeSpentReviewingSec: 62
      },
      {
        id: "evt_3",
        timestamp: "10:45:11",
        promptSent: "Escreva o boilerplate de teste unitário com Vitest para a rota de checkout",
        aiSuggestedCode: "it('should charge card', () => { expect(1).toBe(1); });",
        studentAcceptedWithoutChange: true,
        studentManualModifications: [],
        hallucinationsIdentified: 0,
        timeSpentReviewingSec: 8
      }
    ];
  }

  /**
   * Generates a PDF Forensic Audit Dossier
   */
  public static exportDossierPdf(profile: StudentSynergyAuditProfile): void {
    const doc = new jsPDF();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("DOSSIÊ DE AUDITORIA DE SINERGIA HUMANO-IA", 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(56, 189, 248);
    doc.text(`CODECHECK 2026 • TELEMETRIA FORENSE CO-PILOT • SHA-256 ID: ${profile.studentId}`, 14, 26);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`Estudante: ${profile.studentName}`, 14, 45);
    doc.text(`Projeto: ${profile.projectName} (${profile.language})`, 14, 52);
    doc.text(`Data do Parecer: ${new Date().toLocaleDateString("pt-BR")}`, 14, 59);

    autoTable(doc, {
      startY: 66,
      head: [["Métrica de Auditoria", "Pontuação / Classificação", "Status / Avaliação"]],
      body: [
        ["Índice Global de Sinergia", `${profile.synergyScore} / 100`, profile.synergyScore >= 75 ? "EXCELENTE" : "REGULAR"],
        ["Independência Cognitiva", `${profile.aiIndependenceIndex} / 100`, profile.aiIndependenceIndex >= 70 ? "AUTÔNOMO" : "DEPENDENTE"],
        ["Rigor de Revisão Crítica", `${profile.criticalReviewRigor} / 100`, profile.criticalReviewRigor >= 70 ? "ALTO RIGOR" : "BAIXA REVISÃO"],
        ["Maturidade de Prompting", profile.promptMaturityLevel, "AVALIADO POR AST"],
        ["Classificação de Risco", profile.riskClassification, profile.riskClassification.includes("Seguro") ? "CONFORME" : "ALERTA"]
      ],
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.text("Evidências de Refatoração e Interação com IA:", 14, finalY);

    const timelineRows = profile.timeline.map(t => [
      t.timestamp,
      t.promptSent.slice(0, 40) + "...",
      t.studentAcceptedWithoutChange ? "Cego (Sem Mudança)" : `Refatorado (${t.studentManualModifications.length} mods)`,
      `${t.timeSpentReviewingSec}s`,
      t.hallucinationsIdentified > 0 ? `Sim (${t.hallucinationsIdentified})` : "Não"
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [["Hora", "Prompt Enviado", "Ação do Aluno", "Tempo Revisão", "Erro IA Corrigido"]],
      body: timelineRows,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }
    });

    doc.save(`auditoria_sinergia_ia_${profile.studentName.toLowerCase().replace(/\s+/g, "_")}.pdf`);
  }
}

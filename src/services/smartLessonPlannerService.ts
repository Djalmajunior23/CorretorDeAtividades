/**
 * ============================================================================
 * SMART LESSON PLANNER SERVICE (PREPARAÇÃO DA PRÓXIMA AULA)
 * ============================================================================
 * Features:
 * 1. Automatic 5-block pedagogical lesson scaffolding:
 *    - Bloco 1: Abertura & Resgate Prévio (Warm-up / Contextualização)
 *    - Bloco 2: Explicação Conceitual Dialogada (Fundamentos & Demonstração)
 *    - Bloco 3: Prática Hands-on / Laboratório (Atividade de Bancada / Codificação)
 *    - Bloco 4: Verificação do Entendimento (Quick Checkpoint / Mini-Quiz)
 *    - Bloco 5: Encerramento & Próximos Passos (Síntese & Feedforward)
 * 2. Grounded on real evidence from previous student submissions & common errors.
 * 3. Transparent evidence attribution & limitation notification if data is scarce.
 * 4. Zero-Auto-Publish guarantee: full teacher autonomy to edit, reorder, and approve.
 * ============================================================================
 */

export interface LessonBlock {
  id: string;
  order: number;
  name: string;
  type: "ABERTURA" | "EXPLICACAO" | "PRATICA" | "VERIFICACAO" | "ENCERRAMENTO";
  durationMinutes: number;
  description: string;
  suggestedActivities: string[];
  recommendedMaterials: {
    title: string;
    type: "SLIDES" | "CODIGO_INICIAL" | "DATASET" | "SIMULADOR" | "DOC";
    url?: string;
  }[];
  groundedEvidenceNote?: string;
}

export interface LessonPlanProposal {
  id: string;
  classId: string;
  className: string;
  topic: string;
  competencyTarget: string;
  totalDurationMinutes: number;
  previouslyTaughtContent: string[];
  blocks: LessonBlock[];
  evidenceFound: {
    source: string;
    summary: string;
    confidenceScore: number; // 0 to 100
    hasSufficientData: boolean;
    dataLimitationWarning?: string;
  };
  status: "RASCUNHO_SUGERIDO" | "REVISADO_DOCENTE" | "APROVADO_OFICIAL";
  createdAtIso: string;
  approvedAtIso?: string;
  teacherNotes?: string;
}

export class SmartLessonPlannerService {
  private static proposals: LessonPlanProposal[] = [
    {
      id: "plan-prop-01",
      classId: "turma-ds-a",
      className: "Desenvolvimento de Sistemas - Turma A",
      topic: "Refinamento de Laços e Funções com Validação de Casos Limite",
      competencyTarget: "Construir algoritmos modulares em Python com tratamento de exceções e limites de iteração",
      totalDurationMinutes: 100,
      previouslyTaughtContent: [
        "Estruturas de Repetição (for/while)",
        "Funções e Passagem de Parâmetros",
        "Sintaxe básica da função range()"
      ],
      evidenceFound: {
        source: "Submissões da Lista 3 (Somatórios e Filtros de Paridade)",
        summary: "35% dos alunos (10/28) cometeram erro de 'Off-by-One' no range() excluindo o último elemento. 21% tiveram dificuldades com listas vazias gerando IndexError.",
        confidenceScore: 92,
        hasSufficientData: true
      },
      status: "RASCUNHO_SUGERIDO",
      createdAtIso: new Date(Date.now() - 3600000 * 3).toISOString(),
      blocks: [
        {
          id: "blk-1",
          order: 1,
          name: "1. Abertura & Resgate de Conhecimento Prévio",
          type: "ABERTURA",
          durationMinutes: 15,
          description: "Desafio relâmpago no projetor: 'Qual o valor impresso neste range(1, 5)?'. Discussão dialogada sobre limites inclusivos e exclusivos.",
          suggestedActivities: ["Mini-quiz de 3 perguntas na bancada", "Recapitulação do conceito de índice em memória"],
          recommendedMaterials: [
            { title: "Slides: Resgate de Laços e Índices", type: "SLIDES" }
          ],
          groundedEvidenceNote: "Focado em sanar a confusão detectada na Lista 3 onde o range parava em N-1."
        },
        {
          id: "blk-2",
          order: 2,
          name: "2. Explicação Conceitual & Live Coding",
          type: "EXPLICACAO",
          durationMinutes: 25,
          description: "Demonstração de código ao vivo mostrando boas práticas de modularização, documentação de docstrings e cláusulas de guarda (guard clauses).",
          suggestedActivities: ["Live coding de função defensiva com verificação de lista vazia", "Diagramação de fluxo de execução"],
          recommendedMaterials: [
            { title: "Exemplo Live Code: busca_segura.py", type: "CODIGO_INICIAL" }
          ],
          groundedEvidenceNote: "Direcionado para o gap de 21% de submissões com exceção não tratada."
        },
        {
          id: "blk-3",
          order: 3,
          name: "3. Prática Guiada & Laboratório de Bancada",
          type: "PRATICA",
          durationMinutes: 40,
          description: "Estudantes resolvem em duplas 3 desafios no CodeCheck com testes automatizados de casos normais e extremos.",
          suggestedActivities: ["Desafio 1: Somatório Inclusivo com Step", "Desafio 2: Filtro de Extremos com Listas Heterogêneas"],
          recommendedMaterials: [
            { title: "Starter Kit do Laboratório 04", type: "CODIGO_INICIAL" },
            { title: "Guia de Testes Unitários com pytest", type: "DOC" }
          ],
          groundedEvidenceNote: "Atividade prática calibrada para consolidar os critérios com menor rendimento anterior."
        },
        {
          id: "blk-4",
          order: 4,
          name: "4. Verificação Rápida do Entendimento",
          type: "VERIFICACAO",
          durationMinutes: 10,
          description: "Exit Ticket digital de 2 questões de predição de saída de código para avaliar absorção imediata.",
          suggestedActivities: ["Predição de output com fatiamento e range reverso"],
          recommendedMaterials: [
            { title: "Formulário de Verificação Rápida #04", type: "SIMULADOR" }
          ]
        },
        {
          id: "blk-5",
          order: 5,
          name: "5. Encerramento & Orientações de Estudo",
          type: "ENCERRAMENTO",
          durationMinutes: 10,
          description: "Síntese dos aprendizados da aula, indicação de materiais de aprofundamento e apresentação do próximo tópico (Dicionários & JSON).",
          suggestedActivities: ["Feedforward para a próxima aula", "Liberação da lista complementar opcional"],
          recommendedMaterials: [
            { title: "Documentação Python Oficial - Seção Estruturas", type: "DOC" }
          ]
        }
      ]
    },
    {
      id: "plan-prop-02",
      classId: "turma-cyber-c",
      className: "Cybersecurity & DevSecOps - Turma C",
      topic: "Prevenção de Ataques de Injeção de Fórmulas e Sanitização de Arquivos",
      competencyTarget: "Implementar rotinas seguras de processamento de arquivos CSV e Excel no backend",
      totalDurationMinutes: 100,
      previouslyTaughtContent: [
        "Fundamentos de OWASP Top 10",
        "Validação de Entrada com Expressões Regulares"
      ],
      evidenceFound: {
        source: "Histórico Inicial da Turma",
        summary: "Turma nova com poucas submissões recentes. A sugestão é baseada exclusivamente na ementa padrão e nos objetivos curriculares.",
        confidenceScore: 55,
        hasSufficientData: false,
        dataLimitationWarning: "Dados de submissão insuficientes nesta turma. O roteiro foi construído a partir da matriz curricular padrão e requer validação criteriosa do docente."
      },
      status: "RASCUNHO_SUGERIDO",
      createdAtIso: new Date(Date.now() - 3600000 * 5).toISOString(),
      blocks: [
        {
          id: "blk-c1",
          order: 1,
          name: "1. Abertura & Demonstração de Impacto",
          type: "ABERTURA",
          durationMinutes: 15,
          description: "Apresentação de caso real de formula injection (CSV Injection) executando comando em planilha sem sanitização.",
          suggestedActivities: ["Discussão orientada sobre vetores de ataque em planilhas"],
          recommendedMaterials: [{ title: "Demonstração CVE CSV Injection", type: "SLIDES" }]
        },
        {
          id: "blk-c2",
          order: 2,
          name: "2. Explicação: Mecanismo de Sanitização de Prefixos",
          type: "EXPLICACAO",
          durationMinutes: 25,
          description: "Explicação detalhada dos prefixos maliciosos (=, +, -, @, \\t, \\r) e inserção de apóstrofo de escape.",
          suggestedActivities: ["Análise de código vulnerável vs código seguro"],
          recommendedMaterials: [{ title: "Guia OWASP ASVS 5.0 - Seção Arquivos", type: "DOC" }]
        },
        {
          id: "blk-c3",
          order: 3,
          name: "3. Prática de Sanitização em Bancada",
          type: "PRATICA",
          durationMinutes: 40,
          description: "Implementação da biblioteca de sanitização de strings e validação com suíte de testes de invasão.",
          suggestedActivities: ["Desafio Red/Blue: Criar payload e implementar barreira"],
          recommendedMaterials: [{ title: "Lab DevSecOps: Sanitizer Starter", type: "CODIGO_INICIAL" }]
        },
        {
          id: "blk-c4",
          order: 4,
          name: "4. Verificação Rápida de Segurança",
          type: "VERIFICACAO",
          durationMinutes: 10,
          description: "Mini-teste de identificação de prefixos perigosos em listas de strings.",
          suggestedActivities: ["Identificação de 4 strings maliciosas"],
          recommendedMaterials: [{ title: "Quick Check DevSec", type: "SIMULADOR" }]
        },
        {
          id: "blk-c5",
          order: 5,
          name: "5. Encerramento & Próximo Módulo",
          type: "ENCERRAMENTO",
          durationMinutes: 10,
          description: "Recapitulação dos controles implementados e ponte com o módulo de Criptografia AES-256-GCM.",
          suggestedActivities: ["Checklist de conformidade de código seguro"],
          recommendedMaterials: [{ title: "Resumo em 1 Página - Defesa de Arquivos", type: "DOC" }]
        }
      ]
    }
  ];

  public static getProposals(): LessonPlanProposal[] {
    return this.proposals;
  }

  public static getProposalById(id: string): LessonPlanProposal | undefined {
    return this.proposals.find(p => p.id === id);
  }

  public static updateProposal(updated: LessonPlanProposal): boolean {
    const index = this.proposals.findIndex(p => p.id === updated.id);
    if (index === -1) return false;
    this.proposals[index] = { ...updated, status: "REVISADO_DOCENTE" };
    return true;
  }

  public static approveProposal(id: string, teacherNotes?: string): boolean {
    const proposal = this.proposals.find(p => p.id === id);
    if (!proposal) return false;
    proposal.status = "APROVADO_OFICIAL";
    proposal.approvedAtIso = new Date().toISOString();
    if (teacherNotes) proposal.teacherNotes = teacherNotes;
    return true;
  }

  public static generateCustomProposal(params: {
    classId: string;
    className: string;
    topic: string;
    competencyTarget: string;
    totalDurationMinutes: number;
    previouslyTaughtContent: string[];
    evidenceSummary?: string;
  }): LessonPlanProposal {
    const total = params.totalDurationMinutes || 100;
    const b1 = Math.round(total * 0.15);
    const b2 = Math.round(total * 0.25);
    const b3 = Math.round(total * 0.40);
    const b4 = Math.round(total * 0.10);
    const b5 = total - (b1 + b2 + b3 + b4);

    const newProposal: LessonPlanProposal = {
      id: `plan-prop-${Date.now()}`,
      classId: params.classId,
      className: params.className,
      topic: params.topic,
      competencyTarget: params.competencyTarget,
      totalDurationMinutes: total,
      previouslyTaughtContent: params.previouslyTaughtContent,
      evidenceFound: {
        source: params.evidenceSummary ? "Diagnóstico Integrado do CodeCheck" : "Ementa Padrão",
        summary: params.evidenceSummary || "Sugestão estruturada a partir dos objetivos pedagógicos informados.",
        confidenceScore: params.evidenceSummary ? 88 : 50,
        hasSufficientData: !!params.evidenceSummary,
        dataLimitationWarning: params.evidenceSummary ? undefined : "Roteiro baseado em modelo referencial; ajuste conforme o ritmo da turma."
      },
      status: "RASCUNHO_SUGERIDO",
      createdAtIso: new Date().toISOString(),
      blocks: [
        {
          id: `blk-${Date.now()}-1`,
          order: 1,
          name: "1. Abertura & Resgate Prévio",
          type: "ABERTURA",
          durationMinutes: b1,
          description: `Introdução ao tema '${params.topic}' resgatando conceitos anteriores.`,
          suggestedActivities: ["Pergunta disparadora em plenária", "Aquecimento rápido"],
          recommendedMaterials: [{ title: `Slides - ${params.topic}`, type: "SLIDES" }]
        },
        {
          id: `blk-${Date.now()}-2`,
          order: 2,
          name: "2. Explicação Conceitual Dialogada",
          type: "EXPLICACAO",
          durationMinutes: b2,
          description: `Apresentação dos fundamentos de '${params.topic}' com live coding demonstrativo.`,
          suggestedActivities: ["Exemplo guiado passo a passo", "Esquematização visual"],
          recommendedMaterials: [{ title: "Exemplo de Código Base", type: "CODIGO_INICIAL" }]
        },
        {
          id: `blk-${Date.now()}-3`,
          order: 3,
          name: "3. Prática Hands-on / Laboratório",
          type: "PRATICA",
          durationMinutes: b3,
          description: `Resolução de desafios práticos em bancada com foco na competência '${params.competencyTarget}'.`,
          suggestedActivities: ["Laboratório de desenvolvimento", "Resolução em duplas"],
          recommendedMaterials: [{ title: "Starter Lab Code", type: "CODIGO_INICIAL" }]
        },
        {
          id: `blk-${Date.now()}-4`,
          order: 4,
          name: "4. Verificação Rápida do Entendimento",
          type: "VERIFICACAO",
          durationMinutes: b4,
          description: "Micro-avaliação formativa (Exit Ticket) para diagnosticar assimilação imediata.",
          suggestedActivities: ["Checkpoint interativo de 2 perguntas"],
          recommendedMaterials: [{ title: "Formulário Checkpoint", type: "SIMULADOR" }]
        },
        {
          id: `blk-${Date.now()}-5`,
          order: 5,
          name: "5. Encerramento & Próximos Passos",
          type: "ENCERRAMENTO",
          durationMinutes: b5,
          description: "Síntese dos tópicos consolidados e orientações para a próxima aula.",
          suggestedActivities: ["Síntese em 3 minutos", "Liberação de material complementar"],
          recommendedMaterials: [{ title: "Guia de Aprofundamento", type: "DOC" }]
        }
      ]
    };

    this.proposals.unshift(newProposal);
    return newProposal;
  }
}

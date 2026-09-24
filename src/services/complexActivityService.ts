import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { aiService } from "../ai/services/AIService";
import { CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import { safeAutoTable, getAutoTableFinalY } from "../utils/pdfExport";

export type BloomLevel = "Lembrar/Entender" | "Aplicação Prática" | "Análise Crítica" | "Avaliação de Soluções" | "Criação de Sistemas";
export type IndustrialSector = "Fintech & Bancário" | "Indústria 4.0 & Manufatura" | "Saúde & Hospitalar" | "E-Commerce de Alto Tráfego" | "Logística & Supply Chain" | "Smart Cities & IoT" | "Geral / Acadêmico";
export type ActivityModality = "Algoritmo / Código" | "Banco de Dados / SQL & DDL" | "Modelagem Conceitual / DER" | "Arquitetura & Engenharia de Software";
export type DifficultyLevel = "Básico / Fundamentos" | "Intermediário" | "Avançado / Industrial" | "Desafio SAEP SENAI";

export interface ComplexActivityTestCase {
  id: number;
  input: string;
  expectedOutput: string;
  description: string;
  isHidden: boolean;
}

export interface ComplexActivityRubric {
  criterion: string;
  weight: number; // 0 - 100
  performanceExpectation: string;
}

export interface ComplexActivity {
  id: string;
  title: string;
  topic: string;
  languageOrDialect: string;
  modality: ActivityModality;
  bloomLevel: BloomLevel;
  difficulty: DifficultyLevel;
  industrialSector: IndustrialSector;
  contextualScenario: string;
  questionCommand: string;
  businessRules: string[];
  edgeCasesAndConstraints: string[];
  testCases: ComplexActivityTestCase[];
  referenceSolution: string;
  rubrics: ComplexActivityRubric[];
  estimatedTimeMinutes: number;
  tags: string[];
  createdAt: string;
}

export interface StudentSimulationPersona {
  persona: "Aluno Excelente (High Performer)" | "Aluno Mediano (Erro Conceitual Típico)" | "Aluno Iniciante (Bloqueio / Dúvidas)";
  simulatedAnswer: string;
  simulatedScore: number;
  identifiedIssueOrAmbiguity: string;
  predictedStudentQuestion: string;
}

export interface PromptTestDriveResult {
  activityTitle: string;
  clarityScore: number; // 0 - 100
  clarityStatus: "ENUNCIADO CLARO & PRONTO" | "REQUER PEQUENOS AJUSTES" | "AMBÍGUO / RISCO ELEVADO";
  simulations: StudentSimulationPersona[];
  potentialAmbiguities: string[];
  suggestedImprovements: string[];
  predictedClassroomQuestions: string[];
  evaluatedAt: string;
}

export interface SaepCompetencyItem {
  id: string;
  capacityType: "Técnica" | "Socioemocional / Metodológica";
  capacityName: string;
  weight: number;
  indicators: {
    insatisfatorio: string; // 0-49%
    basico: string;         // 50-69%
    adequado: string;       // 70-89%
    avancado: string;       // 90-100%
  };
}

export interface SaepRubricMatrix {
  matrixId: string;
  title: string;
  courseName: string;
  unitCurricular: string;
  competencies: SaepCompetencyItem[];
  totalPoints: number;
  generalObservations: string;
  createdAt: string;
}

export interface VoiceFeedbackReport {
  studentName: string;
  activityTitle: string;
  assignedGrade: number;
  tone: "Acolhedor & Técnico" | "Rigoroso & Formativo" | "Motivacional";
  summary: string;
  strengths: string[];
  criticalCorrections: string[];
  actionPlan: string[];
  officialSenaiParecer: string;
  generatedAt: string;
}

export interface AdaptiveTier {
  tierName: "Nivelamento / Scaffold" | "Consolidação Padrão" | "Desafio Avançado";
  targetProfile: string;
  adaptedTitle: string;
  adaptedCommand: string;
  scaffoldingHints: string[];
  keyDifferences: string;
  sampleStarterCode: string;
}

export interface AdaptiveTracksResult {
  baseTopic: string;
  tiers: AdaptiveTier[];
  generatedAt: string;
}

export class ComplexActivityGeneratorService {
  /**
   * 1. Gera uma atividade complexa completa com estudo de caso real, comando e rubricas.
   */
  static async generateComplexActivity(params: {
    topic: string;
    languageOrDialect?: string;
    modality?: ActivityModality;
    bloomLevel?: BloomLevel;
    difficulty?: DifficultyLevel;
    industrialSector?: IndustrialSector;
    customGuidelines?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<ComplexActivity> {
    const id = `act_complex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const topic = (params.topic || "").trim() || "Estruturas de Dados e Algoritmos";
    const language = params.languageOrDialect || "Python";
    const modality = params.modality || "Algoritmo / Código";
    const bloomLevel = params.bloomLevel || "Aplicação Prática";
    const difficulty = params.difficulty || "Intermediário";
    const sector = params.industrialSector || "Fintech & Bancário";
    const customGuidelines = (params.customGuidelines || "").trim();

    const hasAI = !!(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER || params.providerConfig?.apiKey);

    if (hasAI) {
      try {
        const schema = {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Título profissional e contextualizado da atividade" },
            contextualScenario: { type: "STRING", description: "História e estudo de caso real no setor industrial especificado" },
            questionCommand: { type: "STRING", description: "Comando claro, inequívoco e imperativo do que o estudante deve entregar" },
            businessRules: { type: "ARRAY", items: { type: "STRING" }, description: "Lista de 3 a 5 regras de negócio estritas" },
            edgeCasesAndConstraints: { type: "ARRAY", items: { type: "STRING" }, description: "Casos de borda (valores nulos, limites numéricos, complexidade O(n))" },
            testCases: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "INTEGER" },
                  input: { type: "STRING" },
                  expectedOutput: { type: "STRING" },
                  description: { type: "STRING" },
                  isHidden: { type: "BOOLEAN" }
                },
                required: ["id", "input", "expectedOutput", "description", "isHidden"]
              }
            },
            referenceSolution: { type: "STRING", description: "Código-fonte ou script SQL completo, compilável e comentado como gabarito" },
            rubrics: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  criterion: { type: "STRING" },
                  weight: { type: "INTEGER" },
                  performanceExpectation: { type: "STRING" }
                },
                required: ["criterion", "weight", "performanceExpectation"]
              }
            },
            estimatedTimeMinutes: { type: "INTEGER" },
            tags: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: [
            "title", "contextualScenario", "questionCommand", "businessRules",
            "edgeCasesAndConstraints", "testCases", "referenceSolution", "rubrics", "estimatedTimeMinutes"
          ]
        };

        const optConfig = {
          systemInstruction: `Você é o Especialista Chefe em Engenharia Curricular e Avaliações Técnicas do SENAI.
Sua missão é elaborar atividades técnicas de alta complexidade, rigor metodológico e fidelidade industrial.
DIRETRIZES DE CRIAÇÃO:
1. Contextualize o problema no setor '${sector}' com problemas reais que um engenheiro/desenvolvedor sênior enfrenta.
2. O comando deve ser IMPERATIVO, EXATO e SEM AMBIGUIDADES. Especifique assinaturas de funções, formatos de retorno e tipos de dados.
3. Forneça Casos de Teste Unitários consistentes com entradas e saídas esperadas.
4. Forneça o gabarito oficial em ${language} 100% executável e elegante.`,
          providerConfig: params.providerConfig
        };

        const promptText = `
Elabore uma atividade técnica completa e desafiadora:
- Tema / Conteúdo Central: ${topic}
- Linguagem / Tecnologia: ${language}
- Modalidade: ${modality}
- Nível na Taxonomia de Bloom: ${bloomLevel}
- Nível de Dificuldade: ${difficulty}
- Setor Industrial / Contexto de Aplicação: ${sector}
${customGuidelines ? `- Diretrizes Especiais do Professor: ${customGuidelines}` : ""}
`;

        const payload = await aiService.generateStructuredWithRetry<any>(promptText, schema, optConfig);

        if (payload && payload.title && payload.questionCommand) {
          return {
            id,
            title: payload.title,
            topic,
            languageOrDialect: language,
            modality,
            bloomLevel,
            difficulty,
            industrialSector: sector,
            contextualScenario: payload.contextualScenario,
            questionCommand: payload.questionCommand,
            businessRules: Array.isArray(payload.businessRules) ? payload.businessRules : ["Implementar seguindo boas práticas."],
            edgeCasesAndConstraints: Array.isArray(payload.edgeCasesAndConstraints) ? payload.edgeCasesAndConstraints : ["Tratar entradas nulas."],
            testCases: Array.isArray(payload.testCases) ? payload.testCases : [],
            referenceSolution: payload.referenceSolution || "// Gabarito oficial de referência",
            rubrics: Array.isArray(payload.rubrics) ? payload.rubrics : this.getDefaultRubrics(modality),
            estimatedTimeMinutes: Number(payload.estimatedTimeMinutes) || 45,
            tags: Array.isArray(payload.tags) ? payload.tags : [topic, language, sector],
            createdAt: new Date().toISOString()
          };
        }
      } catch (err: any) {
        console.warn("[ComplexActivityGeneratorService] AI generation fallback:", err.message);
      }
    }

    // Heuristics Fallback Generator
    return this.generateHeuristicActivity({
      id,
      topic,
      language,
      modality,
      bloomLevel,
      difficulty,
      sector
    });
  }

  /**
   * 2. Simulador de Test-Drive de Enunciado: simula 3 perfis de alunos e audita clareza.
   */
  static async simulatePromptTestDrive(params: {
    activityTitle: string;
    contextualScenario: string;
    questionCommand: string;
    businessRules: string[];
    languageOrDialect?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<PromptTestDriveResult> {
    const hasAI = !!(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER || params.providerConfig?.apiKey);
    const lang = params.languageOrDialect || "Python";

    if (hasAI) {
      try {
        const schema = {
          type: "OBJECT",
          properties: {
            clarityScore: { type: "INTEGER", description: "Nota de 0 a 100 de clareza pedagógica do enunciado" },
            clarityStatus: { type: "STRING", enum: ["ENUNCIADO CLARO & PRONTO", "REQUER PEQUENOS AJUSTES", "AMBÍGUO / RISCO ELEVADO"] },
            simulations: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  persona: { type: "STRING" },
                  simulatedAnswer: { type: "STRING", description: "Código/resposta que esse aluno típico produziria" },
                  simulatedScore: { type: "INTEGER" },
                  identifiedIssueOrAmbiguity: { type: "STRING", description: "O que o aluno achou confuso ou onde errou" },
                  predictedStudentQuestion: { type: "STRING", description: "Dúvida real que o aluno levantará na aula" }
                },
                required: ["persona", "simulatedAnswer", "simulatedScore", "identifiedIssueOrAmbiguity", "predictedStudentQuestion"]
              }
            },
            potentialAmbiguities: { type: "ARRAY", items: { type: "STRING" } },
            suggestedImprovements: { type: "ARRAY", items: { type: "STRING" } },
            predictedClassroomQuestions: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["clarityScore", "clarityStatus", "simulations", "potentialAmbiguities", "suggestedImprovements", "predictedClassroomQuestions"]
        };

        const optConfig = {
          systemInstruction: `Você é um auditor pedagógico e especialista em psicometria educacional.
Analise a atividade proposta pelo professor e simule como 3 perfis de estudantes (High Performer, Mediano e Iniciante) interpretarão e resolverão a questão.
Aponte riscos de pegadinhas acidentais, ambiguidades em tipos de dados ou requisitos ocultos não especificados.`,
          providerConfig: params.providerConfig
        };

        const promptText = `
Audite o enunciado e faça o Test-Drive com IA:
Título: ${params.activityTitle}
Linguagem: ${lang}
Cenário: ${params.contextualScenario}
Comando: ${params.questionCommand}
Regras: ${JSON.stringify(params.businessRules)}
`;

        const payload = await aiService.generateStructuredWithRetry<any>(promptText, schema, optConfig);
        if (payload && payload.clarityScore !== undefined) {
          return {
            activityTitle: params.activityTitle,
            clarityScore: Number(payload.clarityScore) || 85,
            clarityStatus: payload.clarityStatus || "ENUNCIADO CLARO & PRONTO",
            simulations: Array.isArray(payload.simulations) ? payload.simulations : [],
            potentialAmbiguities: Array.isArray(payload.potentialAmbiguities) ? payload.potentialAmbiguities : [],
            suggestedImprovements: Array.isArray(payload.suggestedImprovements) ? payload.suggestedImprovements : [],
            predictedClassroomQuestions: Array.isArray(payload.predictedClassroomQuestions) ? payload.predictedClassroomQuestions : [],
            evaluatedAt: new Date().toISOString()
          };
        }
      } catch (err: any) {
        console.warn("[ComplexActivityGeneratorService] Test-Drive AI fallback:", err.message);
      }
    }

    // Heuristic Fallback
    return {
      activityTitle: params.activityTitle,
      clarityScore: 88,
      clarityStatus: "ENUNCIADO CLARO & PRONTO",
      simulations: [
        {
          persona: "Aluno Excelente (High Performer)",
          simulatedAnswer: `def solucao(dados):\n    # Valida regras e trata casos de borda\n    if not dados: return 0\n    return sum(x for x in dados if x > 0)`,
          simulatedScore: 100,
          identifiedIssueOrAmbiguity: "Enunciado claro, compreendeu de imediato a restrição de dados.",
          predictedStudentQuestion: "Professor, posso utilizar List Comprehension ou é exigido loop clássico?"
        },
        {
          persona: "Aluno Mediano (Erro Conceitual Típico)",
          simulatedAnswer: `def solucao(dados):\n    # Esqueceu de filtrar valores negativos\n    return sum(dados)`,
          simulatedScore: 70,
          identifiedIssueOrAmbiguity: "Deixou de aplicar a validação de números negativos no somatório.",
          predictedStudentQuestion: "A lista de entrada pode conter valores decimais ou somente inteiros?"
        },
        {
          persona: "Aluno Iniciante (Bloqueio / Dúvidas)",
          simulatedAnswer: `def solucao(dados):\n    # TODO: implementar\n    return None`,
          simulatedScore: 20,
          identifiedIssueOrAmbiguity: "Dificuldade na assinatura da função e iteração sobre a lista.",
          predictedStudentQuestion: "Qual o comando para iterar na lista e como retorno o resultado?"
        }
      ],
      potentialAmbiguities: [
        "Certifique-se de explicitar se entradas vazias devem retornar 0 ou lançar exceção.",
        "Deixe claro se os valores numéricos são inteiros ou de ponto flutuante."
      ],
      suggestedImprovements: [
        "Adicionar um exemplo prático de entrada e saída logo abaixo do comando.",
        "Especificar o comportamento esperado para listas nulas."
      ],
      predictedClassroomQuestions: [
        "O que o programa deve retornar se a lista estiver vazia?",
        "Podemos utilizar bibliotecas externas ou somente funções nativas?"
      ],
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * 3. Gerador de Matrizes de Avaliação & Rubricas no padrão SAEP / SENAI.
   */
  static async generateSaepRubricMatrix(params: {
    title: string;
    courseName?: string;
    unitCurricular?: string;
    focalCompetencies?: string[];
    providerConfig?: CustomAIRequestOptions;
  }): Promise<SaepRubricMatrix> {
    const matrixId = `saep_mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const title = params.title || "Matriz de Avaliação SAEP / SENAI";
    const courseName = params.courseName || "Desenvolvimento de Sistemas";
    const unitCurricular = params.unitCurricular || "Programação e Banco de Dados";

    const hasAI = !!(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER || params.providerConfig?.apiKey);

    if (hasAI) {
      try {
        const schema = {
          type: "OBJECT",
          properties: {
            competencies: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  capacityType: { type: "STRING", enum: ["Técnica", "Socioemocional / Metodológica"] },
                  capacityName: { type: "STRING" },
                  weight: { type: "INTEGER" },
                  indicators: {
                    type: "OBJECT",
                    properties: {
                      insatisfatorio: { type: "STRING" },
                      basico: { type: "STRING" },
                      adequado: { type: "STRING" },
                      avancado: { type: "STRING" }
                    },
                    required: ["insatisfatorio", "basico", "adequado", "avancado"]
                  }
                },
                required: ["id", "capacityType", "capacityName", "weight", "indicators"]
              }
            },
            generalObservations: { type: "STRING" }
          },
          required: ["competencies", "generalObservations"]
        };

        const optConfig = {
          systemInstruction: "Você é o Coordenador Pedagógico Nacional do SENAI especialista nas matrizes de referência do SAEP. Construa matrizes de avaliação técnica e socioemocional ponderadas com descritores de proficiência precisos.",
          providerConfig: params.providerConfig
        };

        const promptText = `
Construa uma Matriz de Avaliação SAEP / SENAI detalhada:
Título: ${title}
Curso: ${courseName}
Unidade Curricular: ${unitCurricular}
Competências de Foco: ${JSON.stringify(params.focalCompetencies || ["Lógica de Programação", "Modelagem de Dados", "Tratamento de Exceções", "Organização e Padrões de Código"])}
`;

        const payload = await aiService.generateStructuredWithRetry<any>(promptText, schema, optConfig);
        if (payload && Array.isArray(payload.competencies) && payload.competencies.length > 0) {
          return {
            matrixId,
            title,
            courseName,
            unitCurricular,
            competencies: payload.competencies,
            totalPoints: 100,
            generalObservations: payload.generalObservations || "Matriz estruturada de acordo com os padrões de desempenho SAEP/SENAI.",
            createdAt: new Date().toISOString()
          };
        }
      } catch (err: any) {
        console.warn("[ComplexActivityGeneratorService] SAEP Matrix AI fallback:", err.message);
      }
    }

    // Heuristic SAEP Matrix Fallback
    return {
      matrixId,
      title,
      courseName,
      unitCurricular,
      competencies: [
        {
          id: "cap-01",
          capacityType: "Técnica",
          capacityName: "Domínio de Lógica Algorítmica e Estruturas de Controle",
          weight: 35,
          indicators: {
            insatisfatorio: "Não implementa o algoritmo ou apresenta erros de compilação impeditivos.",
            basico: "Implementa a lógica principal, mas falha em cobrir casos de borda e validações.",
            adequado: "Resolve o problema com 100% dos testes unitários validados e controle de fluxo correto.",
            avancado: "Implementa solução otimizada com excelente complexidade temporal/espacial e modularização."
          }
        },
        {
          id: "cap-02",
          capacityType: "Técnica",
          capacityName: "Modelagem Relacional, Tipagem e Integridade de Dados",
          weight: 25,
          indicators: {
            insatisfatorio: "Tabelas e variáveis desprovidas de tipos válidos e chaves essenciais omitidas.",
            basico: "Mapeia chaves primárias, contudo comete falhas em chaves estrangeiras ou 3FN.",
            adequado: "Modelagem normalizada (1FN, 2FN, 3FN) e integridade referencial preservada.",
            avancado: "Aplica restrições CHECK, índices de desempenho e scripts DDL perfeitamente executáveis."
          }
        },
        {
          id: "cap-03",
          capacityType: "Técnica",
          capacityName: "Tratamento de Exceções e Resiliência do Sistema",
          weight: 20,
          indicators: {
            insatisfatorio: "O sistema trava sem mensagens de erro claras diante de dados inesperados.",
            basico: "Aplica bloco try/catch genérico sem granularidade ou logs estruturados.",
            adequado: "Trata exceções específicas e valida entradas nulas ou incorretas antes da execução.",
            avancado: "Implementa arquitetura defensiva completa com mensagens pedagógicas e feedback de erro."
          }
        },
        {
          id: "cap-04",
          capacityType: "Socioemocional / Metodológica",
          capacityName: "Organização, Padrões de Código Limpo e Legibilidade",
          weight: 20,
          indicators: {
            insatisfatorio: "Código confuso, indentação inconsistente e nomes de variáveis crípticos.",
            basico: "Código legível, porém com duplicações de trechos e comentários escassos.",
            adequado: "Segue convenções de estilo da linguagem (PEP8, camelCase) com funções coesas.",
            avancado: "Excelente padrão profissional (DRY, SOLID) com documentação clara e concisa."
          }
        }
      ],
      totalPoints: 100,
      generalObservations: "Matriz oficial alinhada às competências da Indústria e SAEP/SENAI.",
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 4. Assistente de Ditado / Voz & Parecer Rápido com IA.
   */
  static async formatVoiceDictatedFeedback(params: {
    studentName: string;
    activityTitle: string;
    rawDictatedNotes: string;
    assignedGrade?: number;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<VoiceFeedbackReport> {
    const studentName = params.studentName || "Estudante";
    const activityTitle = params.activityTitle || "Atividade de Programação";
    const rawNotes = params.rawDictatedNotes || "Bom trabalho geral, revisar apenas os testes.";
    const grade = params.assignedGrade !== undefined ? params.assignedGrade : 75;

    const hasAI = !!(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER || params.providerConfig?.apiKey);

    if (hasAI) {
      try {
        const schema = {
          type: "OBJECT",
          properties: {
            summary: { type: "STRING" },
            strengths: { type: "ARRAY", items: { type: "STRING" } },
            criticalCorrections: { type: "ARRAY", items: { type: "STRING" } },
            actionPlan: { type: "ARRAY", items: { type: "STRING" } },
            officialSenaiParecer: { type: "STRING", description: "Parecer pedagógico institucional formal e acolhedor" }
          },
          required: ["summary", "strengths", "criticalCorrections", "actionPlan", "officialSenaiParecer"]
        };

        const optConfig = {
          systemInstruction: "Você é o tutor orientador do SENAI. Receba anotações faladas ou ditadas pelo professor e transforme em um parecer pedagógico institucional formal, acolhedor, construtivo e motivador.",
          providerConfig: params.providerConfig
        };

        const promptText = `
Aluno(a): ${studentName}
Atividade: ${activityTitle}
Nota Atribuída: ${grade}/100
Anotações/Ditado Bruto do Professor: "${rawNotes}"
`;

        const payload = await aiService.generateStructuredWithRetry<any>(promptText, schema, optConfig);
        if (payload && payload.summary) {
          return {
            studentName,
            activityTitle,
            assignedGrade: grade,
            tone: grade >= 70 ? "Acolhedor & Técnico" : "Rigoroso & Formativo",
            summary: payload.summary,
            strengths: Array.isArray(payload.strengths) ? payload.strengths : ["Empenho na resolução da atividade."],
            criticalCorrections: Array.isArray(payload.criticalCorrections) ? payload.criticalCorrections : ["Ajustar pontos indicados."],
            actionPlan: Array.isArray(payload.actionPlan) ? payload.actionPlan : ["Revisar os conteúdos da unidade."],
            officialSenaiParecer: payload.officialSenaiParecer,
            generatedAt: new Date().toISOString()
          };
        }
      } catch (err: any) {
        console.warn("[ComplexActivityGeneratorService] Voice Feedback AI fallback:", err.message);
      }
    }

    // Heuristic Fallback
    return {
      studentName,
      activityTitle,
      assignedGrade: grade,
      tone: grade >= 70 ? "Acolhedor & Técnico" : "Rigoroso & Formativo",
      summary: `O discente ${studentName} apresentou resolução para ${activityTitle} obtendo aproveitamento de ${grade}/100.`,
      strengths: [
        "Compreensão geral dos objetivos propostos para o exercício.",
        "Estruturação de comandos e sintaxe funcional na linguagem de desenvolvimento."
      ],
      criticalCorrections: [
        `Revisão de pontos destacados pelo docente: ${rawNotes}`
      ],
      actionPlan: [
        "Executar bateria de testes manuais adicionais cobrindo casos limites.",
        "Reforçar as boas práticas de legibilidade e documentação do código."
      ],
      officialSenaiParecer: `Prezado(a) ${studentName}, parabéns pelo esforço dedicado à atividade "${activityTitle}". Sua nota final foi ${grade}/100. Registramos as seguintes orientações do docente: "${rawNotes}". Continue focado(a) em seu aprimoramento técnico contínuo rumo aos padrões de excelência da indústria.`,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 5. Gerador de Trilhas de Reforço Adaptativas (Diferenciação Pedagógica em 3 níveis).
   */
  static async generateAdaptiveTracks(params: {
    topic: string;
    language?: string;
    commonDifficulties?: string[];
    providerConfig?: CustomAIRequestOptions;
  }): Promise<AdaptiveTracksResult> {
    const topic = params.topic || "Estrutura de Repetição e Condicionais";
    const lang = params.language || "Python";
    const difficulties = params.commonDifficulties || ["Casos de borda com valores vazios", "Laços infinitos"];

    const hasAI = !!(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER || params.providerConfig?.apiKey);

    if (hasAI) {
      try {
        const schema = {
          type: "OBJECT",
          properties: {
            tiers: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  tierName: { type: "STRING", enum: ["Nivelamento / Scaffold", "Consolidação Padrão", "Desafio Avançado"] },
                  targetProfile: { type: "STRING" },
                  adaptedTitle: { type: "STRING" },
                  adaptedCommand: { type: "STRING" },
                  scaffoldingHints: { type: "ARRAY", items: { type: "STRING" } },
                  keyDifferences: { type: "STRING" },
                  sampleStarterCode: { type: "STRING" }
                },
                required: ["tierName", "targetProfile", "adaptedTitle", "adaptedCommand", "scaffoldingHints", "keyDifferences", "sampleStarterCode"]
              }
            }
          },
          required: ["tiers"]
        };

        const optConfig = {
          systemInstruction: "Você é um especialista em Design Instrucional e Diferenciação Pedagógica do SENAI. Crie 3 variações pedagógicas perfeitamente graduadas para o mesmo tema: 1) Nivelamento com Scaffold (passo a passo), 2) Consolidação Padrão, 3) Desafio Avançado (otimização e casos complexos).",
          providerConfig: params.providerConfig
        };

        const promptText = `
Crie 3 Trilhas Adaptativas para o tema:
Tema: ${topic}
Linguagem: ${lang}
Dificuldades Detectadas na Turma: ${JSON.stringify(difficulties)}
`;

        const payload = await aiService.generateStructuredWithRetry<any>(promptText, schema, optConfig);
        if (payload && Array.isArray(payload.tiers) && payload.tiers.length === 3) {
          return {
            baseTopic: topic,
            tiers: payload.tiers,
            generatedAt: new Date().toISOString()
          };
        }
      } catch (err: any) {
        console.warn("[ComplexActivityGeneratorService] Adaptive Tracks AI fallback:", err.message);
      }
    }

    // Heuristic Fallback
    return {
      baseTopic: topic,
      tiers: [
        {
          tierName: "Nivelamento / Scaffold",
          targetProfile: "Alunos com dificuldades conceituais ou lacunas básicas de sintaxe.",
          adaptedTitle: `[Nivelamento] Fundamentos Práticos de ${topic}`,
          adaptedCommand: `Complete o algoritmo guiado passo a passo para processar a lista de dados informada, utilizando as dicas estruturadas.`,
          scaffoldingHints: [
            "Passo 1: Crie uma variável acumuladora inicializada com 0.",
            "Passo 2: Percorra cada elemento utilizando um laço 'for'.",
            "Passo 3: Verifique se o elemento atende ao critério antes de somar."
          ],
          keyDifferences: "Estrutura pré-montada com comentários de suporte linha por linha.",
          sampleStarterCode: `def nivelamento(dados):\n    # 1. Inicialize o total\n    total = 0\n    # 2. Percorra os dados\n    for item in dados:\n        pass # TODO: complete aqui\n    return total`
        },
        {
          tierName: "Consolidação Padrão",
          targetProfile: "Alunos com ritmo de aprendizagem regular.",
          adaptedTitle: `[Consolidação] Processamento de Dados com ${topic}`,
          adaptedCommand: `Implemente uma função que receba uma lista de transações e calcule o saldo consolidado, desconsiderando valores nulos.`,
          scaffoldingHints: [
            "Certifique-se de tratar listas vazias retornando 0.",
            "Utilize funções nativas para manter o código limpo."
          ],
          keyDifferences: "Enunciado padrão de mercado com requisitos de validação.",
          sampleStarterCode: `def consolidacao(transacoes):\n    # Implemente a solucao completa aqui\n    pass`
        },
        {
          tierName: "Desafio Avançado",
          targetProfile: "Alunos com alto desempenho e facilidade de resolução.",
          adaptedTitle: `[Desafio SAEP] Otimização de Performance e Concorrência em ${topic}`,
          adaptedCommand: `Desenvolva uma solução de alta performance em O(n) para processar 1 milhão de registros com paralelismo ou geradores sem estouro de memória.`,
          scaffoldingHints: [
            "Evite criar listas intermediárias completas na memória RAM (utilize Generators / Iterators).",
            "Trate cenários concorrentes e casos de overflow numérico."
          ],
          keyDifferences: "Restrição estrita de tempo de execução O(n) e consumo de memória O(1).",
          sampleStarterCode: `def desafio_avancado(stream_dados):\n    # Solucao de alto rendimento com memoria O(1)\n    for registro in stream_dados:\n        yield registro`
        }
      ],
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Exporta a Atividade Complexa em PDF Oficial SENAI com folha de respostas e rubricas.
   */
  static exportActivityToPdf(activity: ComplexActivity, options?: { teacherName?: string; className?: string }): Buffer {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const teacherName = options?.teacherName || "Professor(a) Especialista";
    const className = options?.className || "Turma Regular SENAI";

    // Header Institucional
    doc.setFillColor(0, 71, 143); // Azul SENAI
    doc.rect(0, 0, 210, 22, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("SENAI - SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL", 105, 9, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("AVALIAÇÃO PRÁTICA FORMATIVA & SUMATIVA • BANCO DE ATIVIDADES COMPLEXAS", 105, 16, { align: "center" });

    // Informações da Atividade
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(activity.title, 14, 30);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Disciplina / Tema: ${activity.topic}  |  Linguagem / Dialeto: ${activity.languageOrDialect}  |  Setor: ${activity.industrialSector}`, 14, 36);
    doc.text(`Nível Bloom: ${activity.bloomLevel}  |  Dificuldade: ${activity.difficulty}  |  Tempo Estimado: ${activity.estimatedTimeMinutes} min`, 14, 41);
    doc.text(`Docente Responsável: ${teacherName}  |  Turma: ${className}  |  Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`, 14, 46);

    let startY = 50;

    // 1. Cenário e Estudo de Caso
    safeAutoTable(doc, {
      startY,
      head: [["1. CONTEXTUALIZAÇÃO DO CENÁRIO INDUSTRIAL"]],
      body: [[activity.contextualScenario]],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { textColor: [30, 41, 59], fontSize: 8.5, cellPadding: 3 },
      styles: { overflow: "linebreak" }
    });
    startY = getAutoTableFinalY(doc) + 4;

    // 2. Comando da Questão
    safeAutoTable(doc, {
      startY,
      head: [["2. COMANDO DA QUESTÃO & ENTREGÁVEL EXIGIDO"]],
      body: [[activity.questionCommand]],
      theme: "grid",
      headStyles: { fillColor: [0, 71, 143], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { textColor: [15, 23, 42], fontStyle: "bold", fontSize: 9, cellPadding: 3 },
      styles: { overflow: "linebreak" }
    });
    startY = getAutoTableFinalY(doc) + 4;

    // 3. Regras de Negócio e Casos de Borda
    const rulesBody = activity.businessRules.map(r => [`• ${r}`]);
    const edgeBody = activity.edgeCasesAndConstraints.map(e => [`• ${e}`]);

    safeAutoTable(doc, {
      startY,
      head: [["3. REGRAS DE NEGÓCIO & RESTRIÇÕES TÉCNICAS OBRIGATÓRIAS"]],
      body: [...rulesBody, ...edgeBody],
      theme: "grid",
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { textColor: [30, 41, 59], fontSize: 8, cellPadding: 2.5 }
    });
    startY = getAutoTableFinalY(doc) + 4;

    // 4. Casos de Teste
    if (activity.testCases && activity.testCases.length > 0) {
      const testsRows = activity.testCases.map((tc, idx) => [
        `#${idx + 1}`,
        tc.input || "(padrão)",
        tc.expectedOutput,
        tc.description,
        tc.isHidden ? "Oculto (Validação)" : "Público (Exemplo)"
      ]);

      safeAutoTable(doc, {
        startY,
        head: [["Nº", "Entrada de Teste", "Saída Esperada", "Descrição do Cenário", "Visibilidade"]],
        body: testsRows,
        theme: "striped",
        headStyles: { fillColor: [0, 71, 143], textColor: 255, fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 80 },
          4: { cellWidth: 25 }
        }
      });
      startY = getAutoTableFinalY(doc) + 4;
    }

    // 5. Rubricas de Avaliação
    if (activity.rubrics && activity.rubrics.length > 0) {
      const rubricRows = activity.rubrics.map(r => [
        r.criterion,
        `${r.weight}%`,
        r.performanceExpectation
      ]);

      safeAutoTable(doc, {
        startY,
        head: [["Critério de Avaliação", "Peso", "Padrão de Desempenho Esperado"]],
        body: rubricRows,
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 15 },
          2: { cellWidth: 120 }
        }
      });
      startY = getAutoTableFinalY(doc) + 6;
    }

    // Campo para identificação do aluno
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, startY, 182, 22, 2, 2, "FD");

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Nome do Estudante: ____________________________________________________  Matrícula: ___________________", 18, startY + 8);
    doc.text("Assinatura do Aluno: ___________________________________  Data de Entrega: ____/____/________  Nota: [      /100]", 18, startY + 16);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return pdfBuffer;
  }

  /**
   * Exporta a Matriz SAEP em PDF Oficial.
   */
  static exportSaepMatrixToPdf(matrix: SaepRubricMatrix): Buffer {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // Header Institucional
    doc.setFillColor(0, 71, 143);
    doc.rect(0, 0, 297, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("SENAI • MATRIZ DE REFERÊNCIA & RUBRICAS DE DESEMPENHO SAEP", 148.5, 9, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${matrix.title} | Curso: ${matrix.courseName} | Unidade: ${matrix.unitCurricular}`, 148.5, 15, { align: "center" });

    const rows = (matrix.competencies || []).map(c => {
      const ind: any = c.indicators || (c as any).levels || {};
      const insat = ind.insatisfatorio || ind.insufficient || "Não atende aos requisitos";
      const bas = ind.basico || ind.basic || "Atende parcialmente com suporte";
      const adeq = ind.adequado || ind.adequate || "Atende plenamente com autonomia";
      const avanc = ind.avancado || ind.advanced || "Supera as expectativas e otimiza";
      const weight = c.weight ?? (c as any).weightPercentage ?? 25;
      const type = c.capacityType || (c as any).type || "Técnica";
      const name = c.capacityName || (c as any).name || "Competência";

      return [
        type,
        `${name}\n(Peso: ${weight}%)`,
        insat,
        bas,
        adeq,
        avanc
      ];
    });

    safeAutoTable(doc, {
      startY: 25,
      head: [["Tipo", "Capacidade / Competência", "Insatisfatório (0-49%)", "Básico (50-69%)", "Adequado (70-89%)", "Avançado (90-100%)"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8.5, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 48 },
        3: { cellWidth: 48 },
        4: { cellWidth: 48 },
        5: { cellWidth: 48 }
      }
    });

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Exporta a Atividade em Formato Moodle XML.
   */
  static exportMoodleXml(activity: ComplexActivity): string {
    const sanitize = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="essay">
    <name>
      <text>${sanitize(activity.title)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[
        <h3>${sanitize(activity.title)}</h3>
        <p><strong>Cenário Industrial (${sanitize(activity.industrialSector)}):</strong></p>
        <p>${sanitize(activity.contextualScenario)}</p>
        <hr/>
        <p><strong>Comando da Questão:</strong></p>
        <p><em>${sanitize(activity.questionCommand)}</em></p>
        <p><strong>Regras de Negócio:</strong></p>
        <ul>
          ${activity.businessRules.map(r => `<li>${sanitize(r)}</li>`).join("\n")}
        </ul>
        <p><strong>Casos de Borda e Restrições:</strong></p>
        <ul>
          ${activity.edgeCasesAndConstraints.map(e => `<li>${sanitize(e)}</li>`).join("\n")}
        </ul>
        <p><strong>Casos de Teste Automatizados:</strong></p>
        <ul>
          ${(activity.testCases || []).map(tc => `<li>[${tc.isHidden ? "OCULTO" : "PUBLICO"}] <strong>Entrada:</strong> <code>${sanitize(tc.input)}</code> &rarr; <strong>Esperado:</strong> <code>${sanitize(tc.expectedOutput)}</code> (${sanitize(tc.description)})</li>`).join("\n")}
        </ul>
      ]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>Gabarito de Referência:</p><pre>${sanitize(activity.referenceSolution)}</pre>]]></text>
    </generalfeedback>
    <defaultgrade>100.0000000</defaultgrade>
    <penalty>0.0000000</penalty>
    <responseformat>editor</responseformat>
    <responserequired>1</responserequired>
  </question>
</quiz>`;
  }

  private static getDefaultRubrics(modality: ActivityModality): ComplexActivityRubric[] {
    if (modality.includes("Banco") || modality.includes("DER")) {
      return [
        { criterion: "Normalização Relacional (1FN, 2FN, 3FN)", weight: 35, performanceExpectation: "Tabelas decompostas atomicamente sem dependências parciais ou transitivas." },
        { criterion: "Integridade Referencial & Chaves (PK/FK)", weight: 30, performanceExpectation: "Chaves primárias e estrangeiras mapeadas com cardinalidades exatas." },
        { criterion: "Tipagem de Dados & Constraints SGBD", weight: 20, performanceExpectation: "Uso correto de tipos nativos, NOT NULL, UNIQUE e CHECK." },
        { criterion: "Sintaxe & Executabilidade do Script SQL", weight: 15, performanceExpectation: "Script DDL 100% executável sem erros de compilação." }
      ];
    }
    return [
      { criterion: "Corretude Lógica & Testes Unitários", weight: 40, performanceExpectation: "O algoritmo satisfaz todos os casos de teste e requisitos de negócio." },
      { criterion: "Tratamento de Exceções & Casos de Borda", weight: 25, performanceExpectation: "Trata entradas nulas, vazias e limites de faixa sem exceções não tratadas." },
      { criterion: "Organização, Modularização e Legibilidade", weight: 20, performanceExpectation: "Código estruturado em funções coesas seguindo padrões de estilo." },
      { criterion: "Eficiência e Complexidade Computacional", weight: 15, performanceExpectation: "Execução otimizada em tempo e consumo de memória razoáveis." }
    ];
  }

  private static generateHeuristicActivity(params: {
    id: string;
    topic: string;
    language: string;
    modality: ActivityModality;
    bloomLevel: BloomLevel;
    difficulty: DifficultyLevel;
    sector: IndustrialSector;
  }): ComplexActivity {
    const isSql = params.modality.includes("Banco") || params.language.toLowerCase() === "sql";

    if (isSql) {
      return {
        id: params.id,
        title: `Sistema de Gestão de Contas e Transações - ${params.sector}`,
        topic: params.topic,
        languageOrDialect: params.language,
        modality: params.modality,
        bloomLevel: params.bloomLevel,
        difficulty: params.difficulty,
        industrialSector: params.sector,
        contextualScenario: `Uma instituição financeira de pagamentos instantâneos no setor ${params.sector} necessita de um modelo relacional auditável e de alto desempenho para registro de clientes, contas correntes e transações financeiras com controle de saldo e histórico de operações.`,
        questionCommand: `Modele as tabelas relacionais em 3ª Forma Normal (3FN) e crie o script SQL DDL com CREATE TABLE, chaves primárias, chaves estrangeiras com regras de deleção e constraints de validação de saldo não negativo.`,
        businessRules: [
          "Cada cliente pode possuir uma ou mais contas correntes ativas.",
          "Cada transação deve registrar a conta de origem, conta de destino, valor e data/hora.",
          "O saldo da conta não pode ser menor que o limite de cheque especial permitido (CHECK constraint).",
          "O status da transação deve aceitar apenas os valores: 'PENDENTE', 'CONCLUIDA', 'ESTORNADA'."
        ],
        edgeCasesAndConstraints: [
          "Impedir transações onde a conta de origem e destino sejam idênticas.",
          "Garantir atomicidade e tipos nativos (ex: DECIMAL(15,2) para valores monetários)."
        ],
        testCases: [
          { id: 1, input: "CREATE TABLE conta (...)", expectedOutput: "Tabela criada com PK e CHECK", description: "Validação de criação da tabela de contas", isHidden: false },
          { id: 2, input: "INSERT transação conta_origem=1, conta_dest=1", expectedOutput: "Erro de constraint CHECK", description: "Tentativa de auto-transferência rejeitada", isHidden: true }
        ],
        referenceSolution: `-- Script SQL DDL de Referência
CREATE TABLE tb_cliente (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tb_conta (
    id_conta SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES tb_cliente(id_cliente) ON DELETE RESTRICT,
    numero_conta VARCHAR(20) UNIQUE NOT NULL,
    saldo DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    limite_especial DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_saldo_limite CHECK (saldo >= -limite_especial)
);

CREATE TABLE tb_transacao (
    id_transacao SERIAL PRIMARY KEY,
    id_conta_origem INT NOT NULL REFERENCES tb_conta(id_conta),
    id_conta_destino INT NOT NULL REFERENCES tb_conta(id_conta),
    valor DECIMAL(15, 2) NOT NULL CHECK (valor > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE', 'CONCLUIDA', 'ESTORNADA')),
    data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_contas_distintas CHECK (id_conta_origem <> id_conta_destino)
);`,
        rubrics: this.getDefaultRubrics(params.modality),
        estimatedTimeMinutes: 50,
        tags: [params.topic, params.language, params.sector, "SQL DDL"],
        createdAt: new Date().toISOString()
      };
    }

    return {
      id: params.id,
      title: `Motor de Cálculo de Risco e Liquidação - ${params.sector}`,
      topic: params.topic,
      languageOrDialect: params.language,
      modality: params.modality,
      bloomLevel: params.bloomLevel,
      difficulty: params.difficulty,
      industrialSector: params.sector,
      contextualScenario: `No contexto de uma aplicação de processamento analítico do setor ${params.sector}, é necessário implementar um módulo em ${params.language} capaz de processar um fluxo contínuo de registros, calcular médias ponderadas, filtrar anomalias e retornar o sumário consolidado com segurança e eficiência.`,
      questionCommand: `Implemente a função principal que receba a lista de transações brutas e retorne um dicionário/objeto contendo o total processado, média dos valores válidos e lista de IDs que violaram o limiar de tolerância.`,
      businessRules: [
        "A função deve processar apenas transações com valores positivos.",
        "Transações com valores superiores a 3 desvios padrão ou acima de R$ 50.000 devem ser classificadas como suspeitas.",
        "O retorno deve conter as chaves: 'total_processado', 'media_valida', 'transacoes_suspeitas'."
      ],
      edgeCasesAndConstraints: [
        "Se a lista for vazia ou nula, retornar total 0, média 0.0 e lista de suspeitas vazia.",
        "Complexidade temporal máxima permitida: O(n)."
      ],
      testCases: [
        { id: 1, input: "[{'id': 1, 'valor': 100}, {'id': 2, 'valor': 200}]", expectedOutput: "{'total_processado': 300, 'media_valida': 150.0, 'transacoes_suspeitas': []}", description: "Fluxo padrão sem anomalias", isHidden: false },
        { id: 2, input: "[]", expectedOutput: "{'total_processado': 0, 'media_valida': 0.0, 'transacoes_suspeitas': []}", description: "Lista de entrada vazia", isHidden: false },
        { id: 3, input: "[{'id': 10, 'valor': 60000}]", expectedOutput: "{'total_processado': 60000, 'media_valida': 60000.0, 'transacoes_suspeitas': [10]}", description: "Transação acima do limiar de segurança", isHidden: true }
      ],
      referenceSolution: `def processar_transacoes(transacoes):\n    if not transacoes:\n        return {'total_processado': 0, 'media_valida': 0.0, 'transacoes_suspeitas': []}\n    \n    total = 0\n    validas = 0\n    suspeitas = []\n    \n    for t in transacoes:\n        val = t.get('valor', 0)\n        t_id = t.get('id')\n        if val > 0:\n            total += val\n            validas += 1\n            if val > 50000:\n                suspeitas.append(t_id)\n                \n    media = total / validas if validas > 0 else 0.0\n    return {\n        'total_processado': total,\n        'media_valida': round(media, 2),\n        'transacoes_suspeitas': suspeitas\n    }`,
      rubrics: this.getDefaultRubrics(params.modality),
      estimatedTimeMinutes: 45,
      tags: [params.topic, params.language, params.sector, "Algoritmos"],
      createdAt: new Date().toISOString()
    };
  }
}

export const ComplexActivityService = ComplexActivityGeneratorService;
export default ComplexActivityGeneratorService;

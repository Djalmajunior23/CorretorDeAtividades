import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { safeAutoTable, getAutoTableFinalY } from "../utils/pdfExport";

// =============================================================================
// 1. APOSTILAS & MANUAIS DIDÁTICOS MODULARES (COURSEWARE)
// =============================================================================
export interface CoursewareCodeExample {
  title: string;
  language: string;
  code: string;
  explanation: string;
}

export interface CoursewareChapter {
  id: string;
  chapterNumber: number;
  title: string;
  conceptIntro: string;
  industrialWhyItMatters: string;
  mermaidDiagram?: string;
  theoryMarkdown: string;
  seniorDevTip: string;
  commonSyntaxTrap: string;
  marketRealCase: string;
  codeExamples: CoursewareCodeExample[];
  selfAssessmentQuestions: Array<{ question: string; answer: string }>;
  handsOnExercises: Array<{ title: string; challenge: string; difficulty: "Iniciante" | "Intermediário" | "Avançado" }>;
}

export interface CoursewareBooklet {
  id: string;
  title: string;
  subtitle: string;
  courseName: string;
  subject: string;
  targetAudience: string;
  estimatedReadHours: number;
  chapters: CoursewareChapter[];
  glossary: Array<{ term: string; definition: string }>;
  references: string[];
  createdAt: string;
}

// =============================================================================
// 2. SITUAÇÕES DE APRENDIZAGEM (METODOLOGIA SENAI / CHA)
// =============================================================================
export interface LearningSituationDeliverable {
  id: string;
  name: string;
  description: string;
  expectedFormat: string;
}

export interface SaepRubricCriterion {
  id: string;
  criterion: string;
  weight: number; // e.g. 25 (%)
  indicators: {
    nonDeveloped: string; // < 60
    inDevelopment: string; // 60 - 79
    developed: string; // 80 - 100
  };
}

export interface TeachingPlanStep {
  stepNumber: number;
  title: string;
  description: string;
  resourcesNeeded: string;
  estimatedHours: number;
}

export interface LearningSituation {
  id: string;
  code: string;
  title: string;
  unitCurricular: string;
  workloadHours: number;
  scenarioCompany: string;
  industrialContext: string;
  problemStatement: string;
  challengeDeliverables: LearningSituationDeliverable[];
  chaMatrix: {
    knowledge: string[]; // Conhecimentos
    skills: string[]; // Habilidades
    attitudes: string[]; // Atitudes
  };
  saepRubrics: SaepRubricCriterion[];
  teachingPlanSteps: TeachingPlanStep[];
  createdAt: string;
}

// =============================================================================
// 3. DEBUG LABS & LABORATÓRIOS FORENSES ("ACHE O BUG")
// =============================================================================
export interface ProgressiveHint {
  level: 1 | 2 | 3;
  hint: string;
}

export interface DebugLabScenario {
  id: string;
  title: string;
  language: string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado" | "Especialista";
  domainScenario: string;
  buggyCode: string;
  fixedSolutionCode: string;
  bugCategories: string[]; // e.g. ["Race Condition", "SQL Injection", "Memory Leak", "Off-by-one"]
  failingTestsCode: string;
  passingTestsCode: string;
  progressiveHints: ProgressiveHint[];
  postMortemExplanation: string;
  createdAt: string;
}

// =============================================================================
// 4. ESTUDOS DE CASO & AUTÓPSIAS TÉCNICAS (POST-MORTEM & ADR)
// =============================================================================
export interface CaseStudyTimelineEvent {
  time: string;
  event: string;
  impact: string;
}

export interface AdrEvaluatedOption {
  optionName: string;
  pros: string[];
  cons: string[];
  estimatedCostLatency: string;
}

export interface CaseStudyScenario {
  id: string;
  title: string;
  industryDomain: string;
  incidentSummary: string;
  architectureOverview: string;
  timelineEvents: CaseStudyTimelineEvent[];
  systemLogsSnapshot: string;
  faultyCodeSnippet: string;
  rootCauseAnalysis: string;
  adrProposal: {
    title: string;
    context: string;
    evaluatedOptions: AdrEvaluatedOption[];
    recommendedDecision: string;
    consequences: string;
  };
  studentChallengePrompt: string;
  evaluationQuestions: string[];
  createdAt: string;
}

// =============================================================================
// 5. PESQUISAS GUIADAS & WEBQUESTS ESTRUTURADAS
// =============================================================================
export interface RecommendedSource {
  title: string;
  urlOrRef: string;
  type: "RFC" | "Documentação Oficial" | "Paper Científico" | "Artigo de Engenharia";
  annotation: string;
}

export interface GuidingCriticalQuestion {
  question: string;
  expectedAnalysisDepth: string;
  bloomLevel: string;
}

export interface GuidedResearchQuest {
  id: string;
  title: string;
  mainInquiryQuestion: string;
  pedagogicalGoal: string;
  recommendedSources: RecommendedSource[];
  guidingCriticalQuestions: GuidingCriticalQuestion[];
  finalDeliverableFormat: string;
  antiPlagiarismCriteria: string[];
  evaluationRubric: Array<{ dimension: string; weight: number; description: string }>;
  createdAt: string;
}

// =============================================================================
// 6. PACOTE MESTRE INTEGRADO (1-CLICK MASTER TEACHING PACK)
// =============================================================================
export interface MasterTeachingPack {
  id: string;
  theme: string;
  courseName: string;
  subject: string;
  courseware: CoursewareBooklet;
  learningSituation: LearningSituation;
  debugLab: DebugLabScenario;
  caseStudy: CaseStudyScenario;
  guidedResearch: GuidedResearchQuest;
  createdAt: string;
}

// =============================================================================
// SERVIÇO CENTRAL DE AUTORIA PEDAGÓGICA (PEDAGOGICAL AUTHORING SUITE)
// =============================================================================
export class PedagogicalAuthoringSuiteService {

  // ===========================================================================
  // 1. GERADOR DE APOSTILAS & MANUAIS DIDÁTICOS MODULARES
  // ===========================================================================
  static async generateCoursewareBooklet(params: {
    theme: string;
    courseName?: string;
    subject?: string;
    targetAudience?: string;
    chapterCount?: number;
    language?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<CoursewareBooklet> {
    const id = `cware_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";
    const subject = params.subject || "Engenharia de Software & Práticas Avançadas";
    const targetAudience = params.targetAudience || "Estudantes Técnicos e Desenvolvedores de Software";
    const chapterCount = Math.min(Math.max(params.chapterCount || 3, 1), 6);
    const lang = params.language || "typescript";

    let booklet: CoursewareBooklet | null = null;

    try {
      const prompt = `
Você é o Autor Chefe e Especialista Pedagógico em Tecnologia do SENAI.
Escreva uma APOSTILA DIDÁTICA MODULAR COMPLETA com ${chapterCount} capítulos sobre o tema:
"${params.theme}"

Curso: ${courseName}
Unidade Curricular: ${subject}
Linguagem Principal: ${lang}

Para CADA CAPÍTULO, forneça:
1. Introdução Conceitual clara ("conceptIntro") e Por que isso importa na Indústria ("industrialWhyItMatters").
2. Teoria detalhada em Markdown ("theoryMarkdown") com explicações técnicas profundas e didáticas.
3. Caixa "Dica do Desenvolvedor Sênior" ("seniorDevTip").
4. Caixa "Pegadinha Comum / Armadilha de Código" ("commonSyntaxTrap").
5. Caixa "Caso Real de Mercado / Big Tech" ("marketRealCase").
6. 2 Exemplos de código comentados passo a passo ("codeExamples").
7. 2 Questões de autoavaliação com respostas ("selfAssessmentQuestions").
8. 2 Desafios práticos ("handsOnExercises").

Retorne ESTRITAMENTE um JSON no formato:
{
  "title": "Apostila Completa: ...",
  "subtitle": "Guia Prático e Teórico para Desenvolvimento de Software",
  "estimatedReadHours": 8,
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Capítulo 1: ...",
      "conceptIntro": "...",
      "industrialWhyItMatters": "...",
      "mermaidDiagram": "graph TD; A[Cliente] --> B[API Gateway]; B --> C[Microserviço];",
      "theoryMarkdown": "...",
      "seniorDevTip": "...",
      "commonSyntaxTrap": "...",
      "marketRealCase": "...",
      "codeExamples": [
        { "title": "Exemplo Prático 1", "language": "${lang}", "code": "...", "explanation": "..." }
      ],
      "selfAssessmentQuestions": [
        { "question": "...", "answer": "..." }
      ],
      "handsOnExercises": [
        { "title": "Desafio 1", "challenge": "...", "difficulty": "Iniciante" }
      ]
    }
  ],
  "glossary": [
    { "term": "Termo 1", "definition": "Definição..." }
  ],
  "references": ["Ref 1", "Ref 2"]
}
`;
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 8000 });
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.chapters && Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
          booklet = {
            id,
            title: parsed.title || `Apostila Didática: ${params.theme}`,
            subtitle: parsed.subtitle || "Guia Prático e Conceitual de Engenharia de Software",
            courseName,
            subject,
            targetAudience,
            estimatedReadHours: parsed.estimatedReadHours || 6,
            chapters: parsed.chapters.map((c: any, idx: number) => ({
              id: `chap_${idx + 1}`,
              chapterNumber: idx + 1,
              title: c.title || `Capítulo ${idx + 1}: Fundamentos de ${params.theme}`,
              conceptIntro: c.conceptIntro || `Visão geral estruturada sobre ${params.theme}.`,
              industrialWhyItMatters: c.industrialWhyItMatters || "Essencial para construção de software robusto e escalável na indústria.",
              mermaidDiagram: c.mermaidDiagram || "graph LR; A[Entrada] --> B[Processamento]; B --> C[Saída];",
              theoryMarkdown: c.theoryMarkdown || `Conteúdo teórico detalhado sobre ${params.theme}.`,
              seniorDevTip: c.seniorDevTip || "Mantenha funções pequenas e com responsabilidade única (Princípio SRP).",
              commonSyntaxTrap: c.commonSyntaxTrap || "Cuidado com mutabilidade de objetos passados por referência.",
              marketRealCase: c.marketRealCase || "Grandes plataformas de nuvem utilizam este padrão para alta disponibilidade.",
              codeExamples: Array.isArray(c.codeExamples) ? c.codeExamples : [],
              selfAssessmentQuestions: Array.isArray(c.selfAssessmentQuestions) ? c.selfAssessmentQuestions : [],
              handsOnExercises: Array.isArray(c.handsOnExercises) ? c.handsOnExercises : []
            })),
            glossary: Array.isArray(parsed.glossary) ? parsed.glossary : [
              { term: "Clean Code", definition: "Código legível, direto e fácil de manter por qualquer desenvolvedor." },
              { term: "SOLID", definition: "Cinco princípios fundamentais da programação orientada a objetos." }
            ],
            references: Array.isArray(parsed.references) ? parsed.references : [
              "MARTIN, Robert C. Clean Code: A Handbook of Agile Software Craftsmanship.",
              "SENAI. Metodologia de Educação Profissional do SENAI."
            ],
            createdAt: new Date().toISOString()
          };
        }
      }
    } catch {
      // Fallback
    }

    if (!booklet) {
      booklet = {
        id,
        title: `Manual Prático & Apostila Didática: ${params.theme}`,
        subtitle: "Engenharia de Software Aplicada, Boas Práticas e Padrões Industriais",
        courseName,
        subject,
        targetAudience,
        estimatedReadHours: 8,
        chapters: [
          {
            id: "chap_1",
            chapterNumber: 1,
            title: `Capítulo 1: Fundamentos e Arquitetura de ${params.theme}`,
            conceptIntro: `O domínio de ${params.theme} é essencial para qualquer desenvolvedor moderno que busca construir aplicações resilientes, performáticas e seguras.`,
            industrialWhyItMatters: "Sistemas corporativos demandam alta coesão e baixo acoplamento para permitir entregas contínuas e manutenibilidade sem paradas críticas.",
            mermaidDiagram: "graph TD;\n  A[Requisição do Cliente] --> B[Camada de Apresentação];\n  B --> C[Regras de Negócio Domain];\n  C --> D[Banco de Dados & Storage];",
            theoryMarkdown: `A estruturação correta de ${params.theme} previne débitos técnicos acumulados. Ao projetar componentes, deve-se priorizar a separação de responsabilidades e a previsibilidade do fluxo de execução.\n\nNa prática moderna de desenvolvimento de software, a adesão a contratos de tipos estritos, tratamento de casos de borda e testes automatizados são mandatórios.`,
            seniorDevTip: "Nunca confie em dados externos sem antes passar por uma camada de validação e sanitização (Schema Validation).",
            commonSyntaxTrap: "Confundir escopo de variáveis assíncronas e esquecer de tratar rejeições de Promises em blocos try/catch.",
            marketRealCase: "A Netflix migrou serviços legados para essa arquitetura para garantir disponibilidade global de 99.999% durante picos de transmissão ao vivo.",
            codeExamples: [
              {
                title: "Implementação Canônica com Boas Práticas",
                language: lang,
                code: `export interface DadosEntrada {\n  id: string;\n  valor: number;\n}\n\nexport function processarTransacao(entrada: DadosEntrada): number {\n  if (entrada.valor <= 0) {\n    throw new Error("ValorInválido: deve ser estritamente positivo");\n  }\n  return Number((entrada.valor * 0.95).toFixed(2));\n}`,
                explanation: "Função pura e determinística com validação de invariantes e sem efeitos colaterais indesejados."
              }
            ],
            selfAssessmentQuestions: [
              {
                question: `Qual o principal benefício de isolar as regras de negócio em ${params.theme}?`,
                answer: "Permite testar e evoluir a lógica central sem depender de frameworks externos ou bancos de dados específicos."
              }
            ],
            handsOnExercises: [
              {
                title: "Desafio 1: Validação Estrita de Regra de Negócio",
                challenge: "Implemente um validador com testes de unidade cobrindo valores válidos, negativos e nulos.",
                difficulty: "Iniciante"
              }
            ]
          }
        ],
        glossary: [
          { term: "Imutabilidade", definition: "Propriedade de um objeto cujo estado não pode ser alterado após a instanciação." },
          { term: "Idempotência", definition: "Garantia de que múltiplas execuções do mesmo comando produzem exatamente o mesmo resultado." }
        ],
        references: [
          "FOWLER, Martin. Patterns of Enterprise Application Architecture.",
          "SENAI. Guia de Diretrizes Técnicas de Desenvolvimento de Sistemas."
        ],
        createdAt: new Date().toISOString()
      };
    }

    return booklet;
  }

  // ===========================================================================
  // 2. GERADOR DE SITUAÇÕES DE APRENDIZAGEM (METODOLOGIA SENAI / CHA)
  // ===========================================================================
  static async generateLearningSituation(params: {
    theme: string;
    courseName?: string;
    unitCurricular?: string;
    workloadHours?: number;
    industrialSector?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<LearningSituation> {
    const id = `sa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const code = `SA-${Math.floor(100 + Math.random() * 900)}`;
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";
    const unitCurricular = params.unitCurricular || "Desenvolvimento de Soluções Computacionais";
    const workloadHours = params.workloadHours || 40;
    const sector = params.industrialSector || "Indústria 4.0 / Fintech & Logística";

    let situation: LearningSituation | null = null;

    try {
      const prompt = `
Você é o Especialista Chefe em Metodologia de Educação Profissional do SENAI.
Crie uma SITUAÇÃO DE APRENDIZAGEM (SA) OFICIAL completa no padrão SAEP com Matriz CHA (Conhecimentos, Habilidades e Atitudes) para o tema:
"${params.theme}"

Curso: ${courseName}
Unidade Curricular: ${unitCurricular}
Carga Horária: ${workloadHours} horas
Setor Industrial: ${sector}

ESTRUTURA OBRIGATÓRIA:
1. Empresa Fictícia e Contextualização Industrial do Mundo Real ("scenarioCompany", "industrialContext").
2. Desafio Central detalhado ("problemStatement").
3. 3 Entregáveis / Resultados Esperados ("challengeDeliverables").
4. Matriz CHA com 4 Conhecimentos, 4 Habilidades e 4 Atitudes Profissionais.
5. Rubricas SAEP com critérios pontuados e descritores em 3 níveis (Não Desenvolvido, Em Desenvolvimento, Desenvolvido).
6. 4 Etapas do Plano de Aula Docente ("teachingPlanSteps").

Retorne ESTRITAMENTE um JSON no formato:
{
  "title": "Situação de Aprendizagem: ...",
  "scenarioCompany": "Empresa ...",
  "industrialContext": "...",
  "problemStatement": "...",
  "challengeDeliverables": [
    { "id": "d1", "name": "Documento de Arquitetura", "description": "...", "expectedFormat": "PDF" }
  ],
  "chaMatrix": {
    "knowledge": ["Conhecimento 1", "Conhecimento 2", "Conhecimento 3", "Conhecimento 4"],
    "skills": ["Habilidade 1", "Habilidade 2", "Habilidade 3", "Habilidade 4"],
    "attitudes": ["Atitude 1", "Atitude 2", "Atitude 3", "Atitude 4"]
  },
  "saepRubrics": [
    {
      "id": "r1",
      "criterion": "Domínio Arquitetural e Lógica",
      "weight": 35,
      "indicators": {
        "nonDeveloped": "Não implementou a arquitetura ou apresentou falhas críticas de lógica.",
        "inDevelopment": "Implementou parcialmente com inconsistências pontuais.",
        "developed": "Implementou a arquitetura completa com testes e boas práticas."
      }
    }
  ],
  "teachingPlanSteps": [
    { "stepNumber": 1, "title": "Briefing e Alinhamento", "description": "...", "resourcesNeeded": "...", "estimatedHours": 8 }
  ]
}
`;
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 6000 });
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        situation = {
          id,
          code,
          title: parsed.title || `Situação de Aprendizagem: ${params.theme}`,
          unitCurricular,
          workloadHours,
          scenarioCompany: parsed.scenarioCompany || "LogTech Soluções Industriais S/A",
          industrialContext: parsed.industrialContext || "Cenário industrial de transformação digital e integração de sistemas.",
          problemStatement: parsed.problemStatement || "Desenvolver uma solução escalável para integração e auditoria de processos.",
          challengeDeliverables: Array.isArray(parsed.challengeDeliverables) ? parsed.challengeDeliverables : [],
          chaMatrix: parsed.chaMatrix || {
            knowledge: ["Arquitetura de Software", "APIs REST", "Bancos de Dados", "Testes Unitários"],
            skills: ["Modelar entidades relacionais", "Criar endpoints seguros", "Escrever testes de regressão", "Documentar APIs"],
            attitudes: ["Compromisso com prazos", "Segurança por design", "Trabalho colaborativo", "Postura ética profissional"]
          },
          saepRubrics: Array.isArray(parsed.saepRubrics) ? parsed.saepRubrics : [],
          teachingPlanSteps: Array.isArray(parsed.teachingPlanSteps) ? parsed.teachingPlanSteps : [],
          createdAt: new Date().toISOString()
        };
      }
    } catch {
      // Fallback
    }

    if (!situation) {
      situation = {
        id,
        code,
        title: `Situação de Aprendizagem: Modernização de Sistema Industrial (${params.theme})`,
        unitCurricular,
        workloadHours,
        scenarioCompany: "Inovação & Sistemas Industriais do Brasil Ltda.",
        industrialContext: "A empresa identificou gargalos operacionais no processamento de pedidos e auditoria de estoque em tempo real.",
        problemStatement: `Você foi contratado como Desenvolvedor Júnior pela equipe de engenharia para implementar o módulo de ${params.theme}. A solução deve garantir confiabilidade de dados, validação estrita e suporte a auditoria contínua.`,
        challengeDeliverables: [
          { id: "del_1", name: "Documentação de Arquitetura e Diagrama de Fluxo", description: "Mapeamento das entidades, endpoints e fluxo de dados.", expectedFormat: "PDF / Mermaid" },
          { id: "del_2", name: "Código-Fonte Completo e Testado", description: "Implementação na linguagem indicada com cobertura de testes unitários > 80%.", expectedFormat: "Repositório Git" },
          { id: "del_3", name: "Relatório de Implantação e Validação", description: "Demonstração da passagem em testes com validação de casos de borda.", expectedFormat: "PDF Executivo" }
        ],
        chaMatrix: {
          knowledge: [
            "Lógica de programação avançada e estruturas de dados",
            "Padrões de projeto de software (Clean Architecture / MVC)",
            "Tratamento robusto de exceções e logs estruturados",
            "Engenharia de testes automatizados"
          ],
          skills: [
            "Implementar algoritmos eficientes com complexidade controlada",
            "Configurar suítes de testes unitários automatizados",
            "Identificar e corrigir falhas de segurança e integridade",
            "Elaborar documentação técnica clara para a equipe"
          ],
          attitudes: [
            "Rigor técnico na validação de dados de entrada",
            "Atenção às normas de segurança da informação",
            "Proatividade na resolução de impedimentos técnicos",
            "Compromisso com a pontualidade e qualidade dos entregáveis"
          ]
        },
        saepRubrics: [
          {
            id: "rub_1",
            criterion: "Correção Lógica & Atendimento aos Requisitos Funcionais",
            weight: 40,
            indicators: {
              nonDeveloped: "Código incompleto ou com erros que impedem a execução dos requisitos centrais.",
              inDevelopment: "Implementou a maioria dos requisitos, mas falhou em casos de borda ou validações.",
              developed: "Todos os requisitos funcionais implementados com 100% de precisão e cobertura de testes."
            }
          },
          {
            id: "rub_2",
            criterion: "Qualidade de Código, Clean Code & Modularização",
            weight: 30,
            indicators: {
              nonDeveloped: "Código confuso, monolítico, sem indentação ou com variáveis genéricas.",
              inDevelopment: "Código funcional, porém com acoplamento alto e duplicações pontuais.",
              developed: "Arquitetura limpa, nomes semânticos, sem duplicações e alta coesão."
            }
          },
          {
            id: "rub_3",
            criterion: "Bateria de Testes Automatizados & Confiabilidade",
            weight: 30,
            indicators: {
              nonDeveloped: "Sem testes automatizados ou testes que não validam cenários reais.",
              inDevelopment: "Testes presentes cobrindo apenas o caminho feliz básico.",
              developed: "Bateria abrangente cobrindo caminho feliz, erros, exceções e dados limítrofes."
            }
          }
        ],
        teachingPlanSteps: [
          { stepNumber: 1, title: "Lançamento da SA e Análise do Briefing", description: "Apresentação do contexto da empresa, requisitos e rubricas SAEP.", resourcesNeeded: "Slides e Documento do Desafio", estimatedHours: 8 },
          { stepNumber: 2, title: "Modelagem Arquitetural e Prototipação", description: "Elaboração dos diagramas de fluxo e definição das interfaces.", resourcesNeeded: "Ferramenta de diagramação e IDE", estimatedHours: 12 },
          { stepNumber: 3, title: "Desenvolvimento Guiado e Testes Unitários", description: "Codificação do módulo com aplicação de testes de regressão.", resourcesNeeded: "Ambiente de Desenvolvimento", estimatedHours: 16 },
          { stepNumber: 4, title: "Banca Avaliativa e Apresentação Técnica", description: "Avaliação formativa com aplicação das rubricas SAEP.", resourcesNeeded: "Projetor e Folha de Avaliação", estimatedHours: 4 }
        ],
        createdAt: new Date().toISOString()
      };
    }

    return situation;
  }

  // ===========================================================================
  // 3. GERADOR DE DEBUG LABS ("ACHE O BUG" / LABORATÓRIO FORENSE)
  // ===========================================================================
  static async generateDebugLab(params: {
    theme: string;
    language?: string;
    difficulty?: "Iniciante" | "Intermediário" | "Avançado" | "Especialista";
    bugFocus?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<DebugLabScenario> {
    const id = `dlab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const lang = params.language || "typescript";
    const difficulty = params.difficulty || "Intermediário";
    const bugFocus = params.bugFocus || "Bugs lógicos, Mutabilidade de Estado e Falhas de Limiar";

    let lab: DebugLabScenario | null = null;

    try {
      const prompt = `
Você é o Especialista em Engenharia Reversa e Testes Automatizados do SENAI.
Crie um LABORATÓRIO FORENSE ("Ache e Corrija o Bug") desafiador sobre:
"${params.theme}"

Linguagem: ${lang}
Dificuldade: ${difficulty}
Foco dos Bugs: ${bugFocus}

REQUISITOS OBRIGATÓRIOS:
1. O código defeituoso ("buggyCode") DEVE conter de 2 a 3 bugs sutis e realistas (ex: off-by-one, mutação indevida de array/objeto, divisão por zero, falha de condicional).
2. Forneça o código corrigido perfeito ("fixedSolutionCode").
3. Forneça o código dos testes que FALHAM inicialmente com o código defeituoso ("failingTestsCode").
4. Forneça 3 níveis de dicas progressivas (Nível 1 sutil, Nível 2 direcionado, Nível 3 revelador).
5. Forneça o relatório de autópsia técnica pós-morte ("postMortemExplanation").

Retorne ESTRITAMENTE um JSON no formato:
{
  "title": "Debug Lab: ...",
  "domainScenario": "...",
  "bugCategories": ["Off-by-one", "Mutação Indevida"],
  "buggyCode": "...",
  "fixedSolutionCode": "...",
  "failingTestsCode": "...",
  "passingTestsCode": "...",
  "progressiveHints": [
    { "level": 1, "hint": "..." },
    { "level": 2, "hint": "..." },
    { "level": 3, "hint": "..." }
  ],
  "postMortemExplanation": "..."
}
`;
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 6000 });
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        lab = {
          id,
          title: parsed.title || `Laboratório Forense: Debug de ${params.theme}`,
          language: lang,
          difficulty,
          domainScenario: parsed.domainScenario || `Auditoria de falhas no módulo de ${params.theme}.`,
          bugCategories: Array.isArray(parsed.bugCategories) ? parsed.bugCategories : ["Lógica Condicional", "Casos de Borda"],
          buggyCode: parsed.buggyCode || "// Código com falhas",
          fixedSolutionCode: parsed.fixedSolutionCode || "// Código corrigido",
          failingTestsCode: parsed.failingTestsCode || "// Testes unitários",
          passingTestsCode: parsed.passingTestsCode || parsed.failingTestsCode || "// Testes de validação",
          progressiveHints: Array.isArray(parsed.progressiveHints) ? parsed.progressiveHints : [
            { level: 1, hint: "Observe com atenção a condição de parada dos loops." },
            { level: 2, hint: "Verifique o operador relacional nas faixas de desconto." },
            { level: 3, hint: "O erro está na linha onde o cálculo de limite é avaliado." }
          ],
          postMortemExplanation: parsed.postMortemExplanation || "Análise detalhada da causa raiz e correção definitiva.",
          createdAt: new Date().toISOString()
        };
      }
    } catch {
      // Fallback
    }

    if (!lab) {
      lab = {
        id,
        title: `Debug Lab: Auditoria de Cálculo de Cashback e Taxas (${params.theme})`,
        language: lang,
        difficulty,
        domainScenario: "O gateway de pagamentos da fintech começou a reportar divergências de centavos e transações duplicadas em lotes de alto volume durante a madrugada.",
        bugCategories: ["Off-by-One em Laços", "Mutação Acidental de Array", "Arredondamento de Ponto Flutuante"],
        buggyCode: `// ⚠️ CÓDIGO COM BUGS INTENCIONAIS (AUDITORIA FORENSE)
export interface Transacao {
  id: string;
  valor: number;
  tipo: "PIX" | "BOLETO" | "CARTAO";
}

export function processarLoteTransacoes(transacoes: Transacao[]): { totalProcessado: number; transacoesValidas: Transacao[] } {
  let total = 0;
  // BUG 1: Loop off-by-one que pode estourar ou omitir último item dependendo da condição
  for (let i = 0; i < transacoes.length; i++) {
    const t = transacoes[i];
    
    // BUG 2: Mutação direta do objeto original compartilhado
    if (t.tipo === "PIX") {
      t.valor = t.valor * 0.98; // Aplica taxa modificando o input do chamador
    }
    
    // BUG 3: Soma acumulativa com erro de precisão IEEE 754 sem arredondamento
    total += t.valor;
  }
  
  return {
    totalProcessado: total, // Retorna valor sem toFixed(2)
    transacoesValidas: transacoes
  };
}`,
        fixedSolutionCode: `// ✅ SOLUÇÃO OFICIAL CORRIGIDA
export interface Transacao {
  id: string;
  valor: number;
  tipo: "PIX" | "BOLETO" | "CARTAO";
}

export function processarLoteTransacoes(transacoes: Transacao[]): { totalProcessado: number; transacoesValidas: Transacao[] } {
  let total = 0;
  // Cria clones imutáveis para evitar efeitos colaterais
  const transacoesClonadas: Transacao[] = transacoes.map(t => {
    const valorComTaxa = t.tipo === "PIX" 
      ? Number((t.valor * 0.98).toFixed(2))
      : t.valor;
    
    total += valorComTaxa;
    return { ...t, valor: valorComTaxa };
  });

  return {
    totalProcessado: Number(total.toFixed(2)),
    transacoesValidas: transacoesClonadas
  };
}`,
        failingTestsCode: `// SUÍTE DE TESTES UNITÁRIOS (FALHAM COM O CÓDIGO ORIGINAL)
describe("Auditoria de Lote de Transações", () => {
  it("Não deve modificar os objetos de transação do array original (Imutabilidade)", () => {
    const entrada = [{ id: "tx_1", valor: 100, tipo: "PIX" as const }];
    const copiaOriginal = 100;
    processarLoteTransacoes(entrada);
    expect(entrada[0].valor).toBe(copiaOriginal); // Falha no código com bug!
  });

  it("Deve calcular o total processado com exatidão de 2 casas decimais", () => {
    const entrada = [
      { id: "tx_1", valor: 10.10, tipo: "BOLETO" as const },
      { id: "tx_2", valor: 20.20, tipo: "BOLETO" as const }
    ];
    const resultado = processarLoteTransacoes(entrada);
    expect(resultado.totalProcessado).toBe(30.30);
  });
});`,
        passingTestsCode: `// SUÍTE DE VALIDAÇÃO COMPLETA
describe("Suíte de Aceite Final", () => {
  it("Passa em todos os testes de regressão e casos limites", () => {
    expect(true).toBe(true);
  });
});`,
        progressiveHints: [
          { level: 1, hint: "Inspecione se o código original está modificando as propriedades dos objetos passados por parâmetro." },
          { level: 2, hint: "A mutação direta em `t.valor = t.valor * 0.98` quebra o princípio da imutabilidade e afeta o restante do sistema." },
          { level: 3, hint: "Utilize `map()` para retornar novos objetos `{ ...t, valor: ... }` e garanta `Number(total.toFixed(2))` na soma final." }
        ],
        postMortemExplanation: "A mutação indevida de dados causava erros silenciosos em cascata. A refatoração para funções puras e imutabilidade resolveu o problema sem quebrar a API pública.",
        createdAt: new Date().toISOString()
      };
    }

    return lab;
  }

  // ===========================================================================
  // 4. GERADOR DE ESTUDOS DE CASO & AUTÓPSIAS (POST-MORTEM & ADR)
  // ===========================================================================
  static async generateCaseStudy(params: {
    theme: string;
    industryDomain?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<CaseStudyScenario> {
    const id = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const domain = params.industryDomain || "Sistemas Críticos / Fintech & E-Commerce";

    let caseStudy: CaseStudyScenario | null = null;

    try {
      const prompt = `
Você é o Engenheiro Chefe de Arquitetura de Software e SRE do SENAI.
Crie um ESTUDO DE CASO INDUSTRIAL & AUTÓPSIA DE INCIDENTE TÉCNICO (Post-Mortem + ADR) sobre:
"${params.theme}"

Domínio: ${domain}

REQUISITOS:
1. Resumo do incidente com impacto financeiro/operacional real ("incidentSummary").
2. Linha do tempo com 4 eventos cronológicos ("timelineEvents").
3. Snapshot de logs do servidor mostrando stack traces realistas ("systemLogsSnapshot").
4. Snippet de código defeituoso que causou o incidente ("faultyCodeSnippet").
5. Análise de Causa Raiz - RCA ("rootCauseAnalysis").
6. Proposta de Decisão Arquitetural - ADR com 3 opções avaliadas ("adrProposal").
7. Desafio para os estudantes e 3 perguntas de avaliação crítica.

Retorne ESTRITAMENTE um JSON no formato:
{
  "title": "Estudo de Caso: ...",
  "industryDomain": "${domain}",
  "incidentSummary": "...",
  "architectureOverview": "...",
  "timelineEvents": [
    { "time": "02:14:00", "event": "...", "impact": "..." }
  ],
  "systemLogsSnapshot": "...",
  "faultyCodeSnippet": "...",
  "rootCauseAnalysis": "...",
  "adrProposal": {
    "title": "ADR-001: ...",
    "context": "...",
    "evaluatedOptions": [
      { "optionName": "Opção A", "pros": ["..."], "cons": ["..."], "estimatedCostLatency": "..." }
    ],
    "recommendedDecision": "...",
    "consequences": "..."
  },
  "studentChallengePrompt": "...",
  "evaluationQuestions": ["Pergunta 1", "Pergunta 2", "Pergunta 3"]
}
`;
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 6000 });
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        caseStudy = {
          id,
          title: parsed.title || `Estudo de Caso: Colapso de Arquitetura em ${params.theme}`,
          industryDomain: domain,
          incidentSummary: parsed.incidentSummary || "Falha crítica em ambiente de produção com degradação de serviços.",
          architectureOverview: parsed.architectureOverview || "Microsserviços distribuídos com mensageria e banco de dados relacional.",
          timelineEvents: Array.isArray(parsed.timelineEvents) ? parsed.timelineEvents : [],
          systemLogsSnapshot: parsed.systemLogsSnapshot || "[ERROR] Connection timeout to database pool.",
          faultyCodeSnippet: parsed.faultyCodeSnippet || "// Código problemático",
          rootCauseAnalysis: parsed.rootCauseAnalysis || "Ausência de timeout e retry exponencial em chamadas downstream.",
          adrProposal: parsed.adrProposal || {
            title: "ADR: Implementação de Circuit Breaker e Cache Distribuído",
            context: "Evitar efeito dominó em falhas de microsserviços.",
            evaluatedOptions: [],
            recommendedDecision: "Implementar Circuit Breaker com fallback gracioso.",
            consequences: "Maior resiliência com leve aumento de complexidade operacional."
          },
          studentChallengePrompt: parsed.studentChallengePrompt || "Analise os logs e elabore um parecer técnico recomendando a arquitetura definitiva.",
          evaluationQuestions: Array.isArray(parsed.evaluationQuestions) ? parsed.evaluationQuestions : [
            "Qual fator arquitetural desencadeou a saturação dos recursos?",
            "Como a proposta da ADR previne a recorrência do problema?"
          ],
          createdAt: new Date().toISOString()
        };
      }
    } catch {
      // Fallback
    }

    if (!caseStudy) {
      caseStudy = {
        id,
        title: `Estudo de Caso: Colapso por Cascata de Timeouts na Black Friday (${params.theme})`,
        industryDomain: domain,
        incidentSummary: "Durante o pico de acessos da Black Friday, o serviço de pagamentos sofreu saturação de conexões no banco de dados, propagando travamentos para todo o ecossistema e gerando perda estimada de R$ 420.000 em vendas.",
        architectureOverview: "Frontend SPA conectando a uma API Gateway central que faz chamadas síncronas HTTP REST para microsserviços de Estoque, Pedidos, Antifraude e Gateway Bancário.",
        timelineEvents: [
          { time: "00:01:15", event: "Pico de 45.000 requisições simultâneas de checkout.", impact: "Aumento da latência média de 120ms para 3.800ms." },
          { time: "00:04:30", event: "O serviço Antifraude externo aumentou o tempo de resposta para 10s.", impact: "Workers da API Gateway esgotaram o pool de conexões abertas." },
          { time: "00:07:00", event: "Clientes começaram a clicar repetidamente no botão 'Pagar'.", impact: "Efeito avalanche (Thundering Herd) derrubou a base PostgreSQL." },
          { time: "00:15:00", event: "Equipe de SRE acionou reinício forçado dos pods.", impact: "Perda de sessões ativas e erros HTTP 504 Gateway Timeout." }
        ],
        systemLogsSnapshot: `[2026-09-26 00:04:32.102] [FATAL] [PaymentWorkerPool] PoolExhaustedException: Timeout waiting for idle connection (10000ms). Active: 200/200.
[2026-09-26 00:04:33.415] [ERROR] [HttpDownstreamClient] ETIMEDOUT: GET https://api.antifraude-parceiro.com/v1/score
[2026-09-26 00:05:01.002] [CRITICAL] [PostgreSQL] FATAL: remaining connection slots are reserved for non-replication superuser connections`,
        faultyCodeSnippet: `// ⚠️ CÓDIGO DA CHAMADA SÍNCRONA SEM TIMEOUT OU CIRCUIT BREAKER
export async function processarCheckout(pedido: Pedido): Promise<ResultadoCheckout> {
  // Chamada síncrona sem timeout explícito - trava a thread indefinidamente se o parceiro demorar
  const antifraudeScore = await axios.post("https://api.antifraude-parceiro.com/v1/score", {
    cpf: pedido.cpf,
    valor: pedido.total
  });
  
  // Se antifraude demorar 30s, a conexão com o banco fica presa na transação aberta abaixo
  const client = await pool.connect();
  await client.query("BEGIN");
  await client.query("UPDATE estoque SET saldo = saldo - $1 WHERE item_id = $2", [pedido.qtd, pedido.itemId]);
  await client.query("COMMIT");
  return { status: "aprovado" };
}`,
        rootCauseAnalysis: "Acoplamento temporal síncrono entre operações externas lentas (Antifraude) e transações de banco de dados locais abertas, somado à ausência de Circuit Breakers, Idempotência e Filas de Mensageria assíncrona.",
        adrProposal: {
          title: "ADR-004: Adoção de Arquitetura Orientada a Eventos (Saga Pattern) com Circuit Breaker",
          context: "O sistema não pode travar transações de banco locais aguardando serviços terceiros.",
          evaluatedOptions: [
            {
              optionName: "Opção A: Aumentar pool de conexões do PostgreSQL para 2.000",
              pros: ["Rápido de configurar sem mexer em código."],
              cons: ["Esgota memória RAM do banco e não resolve o gargalo do parceiro."],
              estimatedCostLatency: "Custo Alto de Infra | Latência continua degradada (>10s)"
            },
            {
              optionName: "Opção B: Circuit Breaker + Fila Assíncrona (RabbitMQ/Kafka) com Padrão Saga",
              pros: ["Isolamento total de falhas, resposta instantânea para o usuário (<200ms) e resiliência garantida."],
              cons: ["Exige gerenciar consistência eventual nas telas do frontend."],
              estimatedCostLatency: "Custo Baixo/Médio | Latência Excelente (<150ms)"
            }
          ],
          recommendedDecision: "Implementar Opção B com Circuit Breaker Resilience4j/Opossum e fila assíncrona para processamento desacoplado.",
          consequences: "Eliminação total de indisponibilidade em cascata e garantia de absorção de picos de tráfego."
        },
        studentChallengePrompt: "Com base nos logs e na autópsia técnica, elabore uma solução em código que implemente um Circuit Breaker com fallback gracioso e fila de contingência.",
        evaluationQuestions: [
          "Por que manter conexões de banco abertas durante chamadas HTTP externas é um antipadrão crítico?",
          "Como o padrão Saga com consistência eventual protege o sistema em eventos de alto tráfego como a Black Friday?",
          "Quais métricas de observabilidade (SLI/SLO) deveriam ter alertado a equipe antes da queda total?"
        ],
        createdAt: new Date().toISOString()
      };
    }

    return caseStudy;
  }

  // ===========================================================================
  // 5. GERADOR DE PESQUISAS GUIADAS & WEBQUESTS
  // ===========================================================================
  static async generateGuidedResearch(params: {
    theme: string;
    courseName?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<GuidedResearchQuest> {
    const id = `gr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let quest: GuidedResearchQuest | null = null;

    try {
      const prompt = `
Você é o Orientador Pedagógico e Científico do SENAI.
Crie um ROTEIRO DE PESQUISA GUIADA / WEBQUEST ESTRUTURADA DE ENGENHARIA DE SOFTWARE sobre:
"${params.theme}"

REQUISITOS:
1. Pergunta norteadora instigante ("mainInquiryQuestion").
2. 4 Fontes de Leitura Técnica Recomendadas com anotações críticas (RFCs, Documentações Oficiais, Papers, Blogs de Engenharia).
3. 4 Perguntas Críticas com níveis da Taxonomia de Bloom.
4. Formato do entregável e critérios antiplágio ("antiPlagiarismCriteria").
5. Rubrica de avaliação com 3 dimensões (Profundidade, Exemplificação Prática, Senso Crítico).

Retorne ESTRITAMENTE um JSON no formato:
{
  "title": "Pesquisa Guiada: ...",
  "mainInquiryQuestion": "...",
  "pedagogicalGoal": "...",
  "recommendedSources": [
    { "title": "RFC ... / Docs ...", "urlOrRef": "...", "type": "RFC", "annotation": "..." }
  ],
  "guidingCriticalQuestions": [
    { "question": "...", "expectedAnalysisDepth": "...", "bloomLevel": "Analisar" }
  ],
  "finalDeliverableFormat": "Artigo Técnico em PDF de até 3 páginas...",
  "antiPlagiarismCriteria": ["Obrigatório citar exemplos autorais de código", "Proibido resumo genérico de IA sem fundamentação"],
  "evaluationRubric": [
    { "dimension": "Fundamentação Técnica e Citações", "weight": 40, "description": "..." }
  ]
}
`;
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 5000 });
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        quest = {
          id,
          title: parsed.title || `Pesquisa Guiada: ${params.theme}`,
          mainInquiryQuestion: parsed.mainInquiryQuestion || `Como a tecnologia de ${params.theme} transforma a arquitetura de software moderna?`,
          pedagogicalGoal: parsed.pedagogicalGoal || "Desenvolver a capacidade de leitura de especificações técnicas oficiais e síntese crítica.",
          recommendedSources: Array.isArray(parsed.recommendedSources) ? parsed.recommendedSources : [],
          guidingCriticalQuestions: Array.isArray(parsed.guidingCriticalQuestions) ? parsed.guidingCriticalQuestions : [],
          finalDeliverableFormat: parsed.finalDeliverableFormat || "Artigo Técnico Executivo no formato IEEE / SENAI com exemplos práticos.",
          antiPlagiarismCriteria: Array.isArray(parsed.antiPlagiarismCriteria) ? parsed.antiPlagiarismCriteria : [
            "Proibido colar respostas literais de LLMs; todo conceito deve ser exemplificado com código autoral.",
            "Citação obrigatória das fontes técnicas consultadas segundo normas ABNT/IEEE."
          ],
          evaluationRubric: Array.isArray(parsed.evaluationRubric) ? parsed.evaluationRubric : [],
          createdAt: new Date().toISOString()
        };
      }
    } catch {
      // Fallback
    }

    if (!quest) {
      quest = {
        id,
        title: `Pesquisa Guiada: Paradigmas de Concorrência e Resiliência em ${params.theme}`,
        mainInquiryQuestion: `Por que arquiteturas baseadas em microsserviços modernos adotam mensageria assíncrona orientada a eventos em vez de chamadas síncronas REST para operações críticas?`,
        pedagogicalGoal: "Desenvolver autonomia investigativa, capacidade de interpretação de especificações oficiais e discernimento de trade-offs na tomada de decisão arquitetural.",
        recommendedSources: [
          {
            title: "The Reactive Manifesto (Manifesto Reativo)",
            urlOrRef: "https://www.reactivemanifesto.org/",
            type: "Documentação Oficial",
            annotation: "Leitura obrigatória sobre os 4 pilares: Responsividade, Resiliência, Elasticidade e Orientação a Mensagens."
          },
          {
            title: "RFC 7231 - Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content",
            urlOrRef: "IETF RFC 7231",
            type: "RFC",
            annotation: "Seção sobre métodos idempotentes (GET, PUT, DELETE) versus métodos não-idempotentes (POST)."
          },
          {
            title: "AWS Architecture Center: Event-Driven Architectures",
            urlOrRef: "AWS Whitepapers",
            type: "Artigo de Engenharia",
            annotation: "Casos reais de desacoplamento e mitigação de gargalos de banco de dados em larga escala."
          }
        ],
        guidingCriticalQuestions: [
          {
            question: "Qual a diferença matemática e operacional entre latência de rede e vazão (throughput) em sistemas sob alta concorrência?",
            expectedAnalysisDepth: "Diferenciar com fórmulas e exemplos de filas (Teoria das Filas / Lei de Little).",
            bloomLevel: "Analisar"
          },
          {
            question: "Como o princípio da Idempotência protege uma API contra duplicidade de cobrança quando ocorrem falhas temporárias de conexão?",
            expectedAnalysisDepth: "Apresentar um fluxo com chave de idempotência (Idempotency Key) e tabela de deduplicação.",
            bloomLevel: "Aplicar"
          }
        ],
        finalDeliverableFormat: "Relatório de Engenharia (Artigo Técnico de 3 a 5 páginas) contendo: Diagrama de Arquitetura, Análise Comparativa de Tradeoffs e Código de Demonstração funcional.",
        antiPlagiarismCriteria: [
          "O estudante deve incluir um trecho de código autoral testando o conceito investigado.",
          "Respostas geradas por IA sem análise crítica ou sem citação de fontes serão desclassificadas.",
          "Cada argumento de tradeoff deve confrontar ao menos 2 visões técnicas diferentes."
        ],
        evaluationRubric: [
          { dimension: "Profundidade Conceitual e Teórica", weight: 40, description: "Domínio dos conceitos fundamentais sem superficialidade." },
          { dimension: "Exemplificação Prática com Código Autoral", weight: 35, description: "Código limpo, funcional e diretamente correlacionado ao tema." },
          { dimension: "Capacidade de Análise Crítica e Tradeoffs", weight: 25, description: "Justificativa clara do porquê de cada escolha técnica." }
        ],
        createdAt: new Date().toISOString()
      };
    }

    return quest;
  }

  // ===========================================================================
  // 6. GERADOR DE PACOTE MESTRE INTEGRADO (1-CLICK MASTER TEACHING PACK)
  // ===========================================================================
  static async generateMasterTeachingPack(params: {
    theme: string;
    courseName?: string;
    subject?: string;
    language?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<MasterTeachingPack> {
    const id = `mpack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";
    const subject = params.subject || "Desenvolvimento de Soluções Computacionais";

    // Generate all 5 artifacts in parallel for maximum speed
    const [courseware, learningSituation, debugLab, caseStudy, guidedResearch] = await Promise.all([
      this.generateCoursewareBooklet({ theme: params.theme, courseName, subject, language: params.language, providerConfig: params.providerConfig }),
      this.generateLearningSituation({ theme: params.theme, courseName, unitCurricular: subject, providerConfig: params.providerConfig }),
      this.generateDebugLab({ theme: params.theme, language: params.language, providerConfig: params.providerConfig }),
      this.generateCaseStudy({ theme: params.theme, providerConfig: params.providerConfig }),
      this.generateGuidedResearch({ theme: params.theme, courseName, providerConfig: params.providerConfig })
    ]);

    return {
      id,
      theme: params.theme,
      courseName,
      subject,
      courseware,
      learningSituation,
      debugLab,
      caseStudy,
      guidedResearch,
      createdAt: new Date().toISOString()
    };
  }

  // ===========================================================================
  // EXPORTADORES PDF PROFISSIONAIS (PADRÃO SENAI INSTITUCIONAL)
  // ===========================================================================

  /**
   * Exporta a Apostila Completa em PDF Institucional SENAI com sumário e diagramação elegante.
   */
  static exportCoursewarePdf(booklet: CoursewareBooklet): Buffer {
    const doc = new jsPDF();

    // CAPA INSTITUCIONAL SENAI
    doc.setFillColor(0, 51, 153); // SENAI Blue
    doc.rect(0, 0, 210, 42, "F");
    doc.setFillColor(255, 204, 0); // Yellow
    doc.rect(0, 42, 210, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text("SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI", 14, 14);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(booklet.title.toUpperCase(), 14, 25);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`MATERIAL DIDÁTICO OFICIAL • ${booklet.courseName.toUpperCase()}`, 14, 34);

    // Meta Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 52, 182, 26, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 52, 182, 26, 2, 2, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`Unidade Curricular: ${booklet.subject}`, 18, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Público-Alvo: ${booklet.targetAudience} | Carga Horária Estimada de Estudo: ${booklet.estimatedReadHours} horas`, 18, 67);
    doc.text(`Total de Capítulos Modulares: ${booklet.chapters.length} capítulos com teoria e prática`, 18, 73);

    let currentY = 88;

    // CAPÍTULOS
    booklet.chapters.forEach((chap) => {
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      // Chapter Banner
      doc.setFillColor(0, 51, 153);
      doc.roundedRect(14, currentY, 182, 8, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(chap.title.toUpperCase(), 18, currentY + 5.5);
      currentY += 13;

      // Introdução & Contexto
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      const splitIntro = doc.splitTextToSize(chap.conceptIntro, 180);
      doc.text(splitIntro, 14, currentY);
      currentY += splitIntro.length * 3.8 + 3;

      // Senior Dev Tip Box
      if (currentY > 230) { doc.addPage(); currentY = 20; }
      doc.setFillColor(240, 253, 244); // Green-50
      doc.roundedRect(14, currentY, 182, 14, 1.5, 1.5, "F");
      doc.setDrawColor(34, 197, 94);
      doc.roundedRect(14, currentY, 182, 14, 1.5, 1.5, "S");
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("💡 DICA DO DESENVOLVEDOR SÊNIOR:", 18, currentY + 4.5);
      doc.setFont("helvetica", "normal");
      doc.text(chap.seniorDevTip.substring(0, 110), 18, currentY + 9.5);
      currentY += 18;

      // Syntax Trap Box
      if (currentY > 230) { doc.addPage(); currentY = 20; }
      doc.setFillColor(254, 242, 242); // Red-50
      doc.roundedRect(14, currentY, 182, 14, 1.5, 1.5, "F");
      doc.setDrawColor(239, 68, 68);
      doc.roundedRect(14, currentY, 182, 14, 1.5, 1.5, "S");
      doc.setTextColor(153, 27, 27);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("⚠️ ARMADILHA COMUM / PEGADINHA DE CÓDIGO:", 18, currentY + 4.5);
      doc.setFont("helvetica", "normal");
      doc.text(chap.commonSyntaxTrap.substring(0, 110), 18, currentY + 9.5);
      currentY += 18;

      // Code Examples
      chap.codeExamples.forEach(ce => {
        if (currentY > 210) { doc.addPage(); currentY = 20; }
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`Exemplo Prático: ${ce.title} [${ce.language.toUpperCase()}]`, 14, currentY);
        currentY += 4.5;

        const codeLines = ce.code.split("\n");
        const boxHeight = Math.min(codeLines.length * 3.5 + 4, 38);
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(14, currentY, 182, boxHeight, 1.5, 1.5, "F");
        doc.setTextColor(226, 232, 240);
        doc.setFont("courier", "normal");
        doc.setFontSize(6.5);
        codeLines.slice(0, 9).forEach((line, lIdx) => {
          doc.text(line.substring(0, 85), 18, currentY + 4 + lIdx * 3.5);
        });
        doc.setFont("helvetica", "normal");
        currentY += boxHeight + 4;
      });
    });

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Exporta a Situação de Aprendizagem Oficial no Padrão SENAI/SAEP em PDF.
   */
  static exportLearningSituationPdf(situation: LearningSituation): Buffer {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 30, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 30, 210, 2.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI", 14, 10);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`SITUAÇÃO DE APRENDIZAGEM [${situation.code}]`, 14, 19);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(`UNIDADE CURRICULAR: ${situation.unitCurricular.toUpperCase()} • CARGA: ${situation.workloadHours}H`, 14, 26);

    // Context Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 38, 182, 34, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 38, 182, 34, 2, 2, "S");

    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(`Empresa Parceira / Cenário: ${situation.scenarioCompany}`, 18, 45);
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const splitContext = doc.splitTextToSize(situation.industrialContext, 174);
    doc.text(splitContext, 18, 51);

    let currentY = 78;

    // Desafio Central
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("1. Desafio Central & Situação-Problema:", 14, currentY);
    currentY += 4.5;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    const splitProblem = doc.splitTextToSize(situation.problemStatement, 180);
    doc.text(splitProblem, 14, currentY);
    currentY += splitProblem.length * 3.8 + 6;

    // Matriz CHA Table
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("2. Matriz de Competências CHA (Conhecimentos, Habilidades e Atitudes):", 14, currentY);
    currentY += 4;

    const maxRows = Math.max(
      situation.chaMatrix.knowledge.length,
      situation.chaMatrix.skills.length,
      situation.chaMatrix.attitudes.length
    );

    const chaRows = [];
    for (let i = 0; i < maxRows; i++) {
      chaRows.push([
        situation.chaMatrix.knowledge[i] || "-",
        situation.chaMatrix.skills[i] || "-",
        situation.chaMatrix.attitudes[i] || "-"
      ]);
    }

    safeAutoTable(doc, {
      startY: currentY,
      head: [["🧠 Conhecimentos (Saber)", "🛠️ Habilidades (Saber Fazer)", "🤝 Atitudes (Saber Ser/Conviver)"]],
      body: chaRows,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 6.8, cellPadding: 1.8 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    currentY = getAutoTableFinalY(doc, currentY + 30) + 8;

    // Rubricas SAEP Table
    if (currentY > 210) { doc.addPage(); currentY = 20; }
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("3. Matriz de Avaliação & Rubricas no Padrão SAEP:", 14, currentY);
    currentY += 4;

    const rubricRows = situation.saepRubrics.map(r => [
      `${r.criterion} (${r.weight}%)`,
      r.indicators.nonDeveloped,
      r.indicators.inDevelopment,
      r.indicators.developed
    ]);

    safeAutoTable(doc, {
      startY: currentY,
      head: [["Critério / Peso", "Não Desenvolvido (<60)", "Em Desenvolvimento (60-79)", "Desenvolvido (80-100)"]],
      body: rubricRows,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 6.5, cellPadding: 1.8 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Exporta o Roteiro do Debug Lab / Laboratório Forense em PDF.
   */
  static exportDebugLabPdf(lab: DebugLabScenario): Buffer {
    const doc = new jsPDF();

    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 28, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text("SENAI • LABORATÓRIO FORENSE DE ENGENHARIA DE SOFTWARE", 14, 9);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`DEBUG LAB: ACHE E CORRIJA O BUG [${lab.difficulty.toUpperCase()}]`, 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`LINGUAGEM: ${lab.language.toUpperCase()} • FOCO: ${lab.bugCategories.join(", ").toUpperCase()}`, 14, 25);

    // Domain Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 34, 182, 22, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 34, 182, 22, 2, 2, "S");
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Cenário de Investigação Industrial:", 18, 40);
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const sp = doc.splitTextToSize(lab.domainScenario, 174);
    doc.text(sp, 18, 46);

    let currentY = 62;

    // Buggy Code Box
    doc.setTextColor(220, 38, 38); // Red-600
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("1. Código-Fonte com Falhas Ocultas (Para Auditoria do Aluno):", 14, currentY);
    currentY += 4.5;

    const bLines = lab.buggyCode.split("\n");
    const bHeight = Math.min(bLines.length * 3.5 + 4, 60);
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(14, currentY, 182, bHeight, 1.5, 1.5, "F");
    doc.setTextColor(248, 113, 113);
    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    bLines.slice(0, 15).forEach((l, idx) => {
      doc.text(l.substring(0, 85), 18, currentY + 4 + idx * 3.5);
    });
    currentY += bHeight + 6;

    // Failing Tests
    if (currentY > 220) { doc.addPage(); currentY = 20; }
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("2. Suíte de Testes Automatizados (Critério de Aceite):", 14, currentY);
    currentY += 4.5;

    const tLines = lab.failingTestsCode.split("\n");
    const tHeight = Math.min(tLines.length * 3.5 + 4, 45);
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(14, currentY, 182, tHeight, 1.5, 1.5, "F");
    doc.setTextColor(226, 232, 240);
    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    tLines.slice(0, 11).forEach((l, idx) => {
      doc.text(l.substring(0, 85), 18, currentY + 4 + idx * 3.5);
    });
    currentY += tHeight + 6;

    // Dicas
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("3. Roteiro de Dicas Progressivas (Scaffolding):", 14, currentY);
    currentY += 4;

    lab.progressiveHints.forEach(h => {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(`• Nível ${h.level}:`, 18, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(h.hint, 34, currentY);
      currentY += 4.5;
    });

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Exporta o Estudo de Caso & Autópsia em PDF.
   */
  static exportCaseStudyPdf(study: CaseStudyScenario): Buffer {
    const doc = new jsPDF();

    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 28, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text("SENAI • ESTUDO DE CASO & AUTÓPSIA DE INCIDENTES (POST-MORTEM)", 14, 9);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(study.title.toUpperCase(), 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`DOMÍNIO: ${study.industryDomain.toUpperCase()} • METODOLOGIA DE DECISÃO ARQUITETURAL (ADR)`, 14, 25);

    let currentY = 36;

    // Resumo
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("1. Sumário Executivo do Incidente:", 14, currentY);
    currentY += 4.5;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    const sp = doc.splitTextToSize(study.incidentSummary, 180);
    doc.text(sp, 14, currentY);
    currentY += sp.length * 3.8 + 5;

    // Timeline Table
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("2. Linha do Tempo da Falha em Produção:", 14, currentY);
    currentY += 4;

    const tRows = study.timelineEvents.map(te => [te.time, te.event, te.impact]);
    safeAutoTable(doc, {
      startY: currentY,
      head: [["Horário", "Evento Observado", "Impacto no Sistema"]],
      body: tRows,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 6.8, cellPadding: 1.8 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    currentY = getAutoTableFinalY(doc, currentY + 25) + 6;

    // ADR Box
    if (currentY > 210) { doc.addPage(); currentY = 20; }
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(`3. Proposta de Decisão Arquitetural (${study.adrProposal.title}):`, 14, currentY);
    currentY += 4.5;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 182, 34, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, 182, 34, 2, 2, "S");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(`Decisão Recomendada: ${study.adrProposal.recommendedDecision}`, 18, currentY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const spConseq = doc.splitTextToSize(`Consequências e Tradeoffs: ${study.adrProposal.consequences}`, 174);
    doc.text(spConseq, 18, currentY + 13);
    currentY += 40;

    // Perguntas
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("4. Questões de Avaliação Crítica:", 14, currentY);
    currentY += 4;
    study.evaluationQuestions.forEach((q, idx) => {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7.2);
      doc.text(`${idx + 1}. ${q}`, 18, currentY);
      currentY += 4.5;
    });

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Exporta a Pesquisa Guiada em PDF.
   */
  static exportGuidedResearchPdf(quest: GuidedResearchQuest): Buffer {
    const doc = new jsPDF();

    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 28, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text("SENAI • ROTEIRO DE INVESTIGAÇÃO TÉCNICA E PESQUISA GUIADA", 14, 9);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(quest.title.toUpperCase(), 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("METODOLOGIA DE APRENDIZAGEM ATIVA & PENSAMENTO CRÍTICO", 14, 25);

    let currentY = 36;

    // Pergunta Norteadora
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(14, currentY, 182, 20, 1.5, 1.5, "F");
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, currentY, 182, 20, 1.5, 1.5, "S");
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("PERGUNTA DISPARADORA DA INVESTIGAÇÃO:", 18, currentY + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    const sp = doc.splitTextToSize(quest.mainInquiryQuestion, 174);
    doc.text(sp, 18, currentY + 12);
    currentY += 26;

    // Fontes Recomendadas
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("1. Fontes Técnicas Oficiais Recomendadas:", 14, currentY);
    currentY += 4;

    const sRows = quest.recommendedSources.map(s => [s.title, s.type, s.annotation]);
    safeAutoTable(doc, {
      startY: currentY,
      head: [["Fonte / Especificação", "Tipo", "Anotação Crítica"]],
      body: sRows,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 6.8, cellPadding: 1.8 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    currentY = getAutoTableFinalY(doc, currentY + 25) + 6;

    // Perguntas Críticas
    if (currentY > 210) { doc.addPage(); currentY = 20; }
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("2. Roteiro de Perguntas Críticas (Taxonomia de Bloom):", 14, currentY);
    currentY += 4;

    quest.guidingCriticalQuestions.forEach((q, idx) => {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. [Bloom: ${q.bloomLevel}] ${q.question}`, 18, currentY);
      currentY += 4.2;
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.text(`   Profundidade esperada: ${q.expectedAnalysisDepth}`, 18, currentY);
      currentY += 5;
    });

    return Buffer.from(doc.output("arraybuffer"));
  }
}

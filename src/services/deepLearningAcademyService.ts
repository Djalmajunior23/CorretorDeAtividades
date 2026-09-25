import { jsPDF } from "jspdf";
import { safeAutoTable, getAutoTableFinalY } from "../utils/pdfExport";
import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

export type CognitiveDepthLevel = "Foundational" | "Intermediate" | "Advanced" | "Mastery";

export interface MasteryConceptNode {
  id: string;
  title: string;
  domain: string;
  prerequisites: string[];
  cognitiveDepthLevel: CognitiveDepthLevel;
  mentalModel: {
    coreIntuition: string;
    realWorldAnalogy: string;
    whyItWorks: string;
    failureGotchas: string[];
  };
  masteryScore: number; // 0 - 100
  verifiedPractices: number;
  relatedChallenges: string[];
}

export interface SocraticInquirySession {
  sessionId: string;
  studentId: string;
  conceptId: string;
  conceptTitle: string;
  currentStage: "intuition_hypothesis" | "edge_case_investigation" | "socratic_challenge" | "mastery_synthesis" | "completed";
  questionPrompt: string;
  conversationHistory: Array<{ role: "mentor" | "student"; content: string; timestamp: string }>;
  depthScore: number;
  feedback?: string;
  awardedBadges: string[];
}

export interface MentalDebuggerStep {
  stepNumber: number;
  lineCode: string;
  explanation: string;
  callStack: string[];
  heapAllocations: Record<string, any>;
  scopeVariables: Record<string, any>;
  asymptoticComplexity: string;
  predictionQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface SpacedRepetitionCard {
  id: string;
  topic: string;
  question: string;
  codeSnippet?: string;
  conceptualTrap: string;
  deepExplanation: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  dueDate: string;
  lastRecallQuality?: number; // 1-5 (SM-2)
}

export interface TradeOffRefactoringChallenge {
  id: string;
  title: string;
  scenario: string;
  naiveCode: string;
  tradeOffAxis: "Time vs Space" | "Sync vs Async" | "Procedural vs Functional" | "Mutability vs Immutability";
  constraints: string[];
  optimalSolutions: Array<{
    paradigm: string;
    code: string;
    explanation: string;
    timeComplexity: string;
    spaceComplexity: string;
  }>;
}

export interface MasteryPassportReport {
  studentId: string;
  studentName: string;
  courseName: string;
  overallMasteryPercentage: number;
  deepConcepts: Array<{ concept: string; score: number; level: string }>;
  verifiedHours: number;
  socraticSynthesesCount: number;
  pedagogicalEndorsement: string;
  hashVerification: string;
  issuedAt: string;
}

export class DeepLearningAcademyService {
  /**
   * Default catalog of foundational and advanced deep learning concept nodes
   */
  static getInitialConceptNodes(): MasteryConceptNode[] {
    return [
      {
        id: "node_big_o",
        title: "Análise Assintótica & Complexidade Big-O",
        domain: "Algoritmos & Otimização",
        prerequisites: [],
        cognitiveDepthLevel: "Mastery",
        mentalModel: {
          coreIntuition: "Big-O descreve o limite superior da taxa de crescimento do consumo de recursos (CPU/Memória) conforme o tamanho da entrada N tende ao infinito, ignorando constantes irrelevantes.",
          realWorldAnalogy: "Uma pessoa lendo uma lista de 10 nomes leva 10 segundos (O(N)). Se para cada nome ela tiver que comparar com todos os outros, leva 100 segundos (O(N²)). Em 1 milhão de nomes, a diferença é entre 1 segundo e 31 anos.",
          whyItWorks: "Ao omitir constantes de hardware e termos de menor ordem, o modelo assintótico prevê com precisão matemática o ponto de estrangulamento em escala industrial.",
          failureGotchas: [
            "Acreditar que O(N log N) é sempre mais rápido que O(N²) para N pequeno (constantes ocultas podem influenciar).",
            "Ignorar a complexidade de espaço adicional oculta em chamadas recursivas no Call Stack."
          ]
        },
        masteryScore: 88,
        verifiedPractices: 12,
        relatedChallenges: ["Algoritmos de Ordenação", "Estruturas de Árvore B+", "Memoization"]
      },
      {
        id: "node_async_event_loop",
        title: "Modelo de Concorrência & Event Loop",
        domain: "Arquitetura de Runtimes (JS / Node / Python)",
        prerequisites: ["node_big_o"],
        cognitiveDepthLevel: "Advanced",
        mentalModel: {
          coreIntuition: "O Event Loop gerencia a execução de tarefas assíncronas em uma única thread principal, delegando I/O para o sistema operacional através de filas de Microtasks (Promises) e Macrotasks (Timers/I/O).",
          realWorldAnalogy: "Um garçom de restaurante não fica parado na cozinha esperando o prato cozinhar (não-bloqueante); ele anota o pedido, despacha para a cozinha e atende outra mesa enquanto o timer apita.",
          whyItWorks: "Evita o overhead de chaveamento de contexto (context switching) de milhares de threads do SO em operações limitadas por rede/disco (I/O Bound).",
          failureGotchas: [
            "Executar operações intensivas de CPU (criptografia síncrona, loops pesados) travando a thread do Event Loop.",
            "Confundir ordem de prioridade entre Microtask Queue (process.nextTick, Promise.then) e Macrotask Queue (setTimeout)."
          ]
        },
        masteryScore: 82,
        verifiedPractices: 9,
        relatedChallenges: ["Async/Await Concurrency", "Promise.allSettled vs Promise.all", "Deadlock Prevention"]
      },
      {
        id: "node_clean_solid",
        title: "Princípios SOLID & Arquitetura Limpa",
        domain: "Engenharia de Software",
        prerequisites: [],
        cognitiveDepthLevel: "Intermediate",
        mentalModel: {
          coreIntuition: "SOLID são diretrizes para desacoplar responsabilidades, tornando componentes fáceis de testar, estender sem modificar (Open/Closed) e substituir por polimorfismo sem efeitos colaterais.",
          realWorldAnalogy: "Uma tomada universal padrão: qualquer aparelho elétrico compatível se conecta sem precisar alterar a fiação da parede (Inversão de Dependência e Liskov).",
          whyItWorks: "Isola a volatilidade das regras de negócio contra mudanças em frameworks de terceiros, drivers de banco ou protocolos de entrega.",
          failureGotchas: [
            "Criar abstrações prematuras e interfaces desnecessárias antes do problema exigir polimorfismo.",
            "Violar o princípio de Liskov ao sobrescrever métodos de classes base lançando exceções de 'não implementado'."
          ]
        },
        masteryScore: 92,
        verifiedPractices: 15,
        relatedChallenges: ["Refatoração de Código Monolítico", "Injeção de Dependências", "Domain Driven Design"]
      },
      {
        id: "node_relational_indexing",
        title: "Indexação de Dados & Álgebra Relacional (B-Trees)",
        domain: "Bancos de Dados & Engenharia de Dados",
        prerequisites: ["node_big_o"],
        cognitiveDepthLevel: "Mastery",
        mentalModel: {
          coreIntuition: "Índices B-Tree organizam chaves em páginas balanceadas no disco, reduzindo buscas completas de O(N) páginas lidas para O(log N) saltos de bloco de 8KB.",
          realWorldAnalogy: "O índice alfabético no final de uma enciclopédia: em vez de ler 1.000 páginas, você vai direto à letra 'S' e acessa a página exata.",
          whyItWorks: "Minimiza o número de leituras físicas de disco (I/O) através de páginas de nós que cabem exatamente nos setores de bloco de cache do buffer pool.",
          failureGotchas: [
            "Adicionar índices excessivos penalizando dramaticamente o throughput de comandos INSERT/UPDATE.",
            "Usar funções na coluna do WHERE (ex: `WHERE UPPER(email) = ...`), invalidando o índice padrão (Full Table Scan)."
          ]
        },
        masteryScore: 78,
        verifiedPractices: 8,
        relatedChallenges: ["EXPLAIN ANALYZE Optimization", "Composite Indexes", "Query Tuning"]
      },
      {
        id: "node_devsecops_threats",
        title: "Defesa em Profundidade & Sanitização Criptográfica",
        domain: "Cibersegurança & DevSecOps",
        prerequisites: [],
        cognitiveDepthLevel: "Advanced",
        mentalModel: {
          coreIntuition: "Nenhuma entrada externa é confiável. A segurança deve ser aplicada em camadas (WAF -> Input Validation -> Parameterized Queries -> Least Privilege -> Audit Logging).",
          realWorldAnalogy: "Um aeroporto internacional: controle perimetral, raio-X de bagagem, verificação de passaporte na imigração e revista no portão de embarque.",
          whyItWorks: "Garante que mesmo se uma camada falhar (ex: bypass de regex no frontend), a camada de persistência parametrizada impedirá a injeção de código SQL.",
          failureGotchas: [
            "Confiar em validações exclusivas no cliente (frontend).",
            "Guardar senhas com hashing simples (MD5/SHA256) sem salt e sem algoritmos resistentes a GPU (Bcrypt/Argon2)."
          ]
        },
        masteryScore: 85,
        verifiedPractices: 11,
        relatedChallenges: ["SQL Injection Defense", "JWT Security & Replay Attacks", "CORS & CSRF Tokens"]
      },
      {
        id: "node_api_idempotency",
        title: "Idempotência & Resiliência em Microsserviços",
        domain: "Sistemas Distribuídos & Nuvem",
        prerequisites: ["node_async_event_loop"],
        cognitiveDepthLevel: "Mastery",
        mentalModel: {
          coreIntuition: "Uma operação idempotente produz o exato mesmo estado final do sistema se executada 1 vez ou 100 vezes consecutivas com os mesmos parâmetros.",
          realWorldAnalogy: "O botão do elevador: pressionar 5 vezes não faz o elevador chegar 5 vezes mais rápido nem o envia para 5 andares diferentes.",
          whyItWorks: "Permite que redes móveis e clientes com quedas de conexão reexecutem transações de pagamento ou mensagens em filas (Retry Policies) com garantia de zero duplicidade.",
          failureGotchas: [
            "Não armazenar chaves de idempotência em armazenamento distribuído com TTL atômico (Redis SETNX).",
            "Supor que requisições HTTP POST são naturalmente idempotentes."
          ]
        },
        masteryScore: 75,
        verifiedPractices: 6,
        relatedChallenges: ["Retry com Exponential Backoff", "Sagas & 2-Phase Commit", "Circuit Breakers"]
      }
    ];
  }

  /**
   * Initiates a multi-phase Socratic inquiry session with an AI Pedagogical Mentor
   */
  static async startSocraticInquiry(params: {
    studentId: string;
    conceptId: string;
    conceptTitle: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<SocraticInquirySession> {
    const sessionId = `soc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    let initialQuestion = `Olá! Vamos mergulhar a fundo no conceito "${params.conceptTitle}". Para começarmos, imagine que você está construindo um sistema que precisa atender 100.000 usuários simultâneos. Na sua intuição, o que você considera o maior desafio ou vulnerabilidade técnica quando pensamos em ${params.conceptTitle}?`;

    try {
      const prompt = `
Você é o Mentor Pedagógico Socrático Chefe do SENAI.
O estudante iniciou uma sessão de aprendizagem profunda sobre o conceito: "${params.conceptTitle}".
Gere uma primeira pergunta provocativa de INTUIÇÃO e RACIOCÍNIO CAUSAL que teste se o aluno compreende o mecanismo fundamental deste conceito, e não apenas sua definição decorada.
Faça uma pergunta desafiadora, instigante, clara e em português do Brasil.
`;
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.4, max_tokens: 350 });
      if (aiResponse && aiResponse.trim().length > 20) {
        initialQuestion = aiResponse.trim();
      }
    } catch {
      // Fallback used
    }

    return {
      sessionId,
      studentId: params.studentId,
      conceptId: params.conceptId,
      conceptTitle: params.conceptTitle,
      currentStage: "intuition_hypothesis",
      questionPrompt: initialQuestion,
      conversationHistory: [
        {
          role: "mentor",
          content: initialQuestion,
          timestamp: new Date().toISOString()
        }
      ],
      depthScore: 25,
      awardedBadges: ["Iniciador Socrático"]
    };
  }

  /**
   * Evaluates student's response in the Socratic loop and delivers next guided challenge
   */
  static async evaluateSocraticStep(params: {
    session: SocraticInquirySession;
    studentResponse: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<SocraticInquirySession> {
    const nextStages: Record<string, "edge_case_investigation" | "socratic_challenge" | "mastery_synthesis" | "completed"> = {
      intuition_hypothesis: "edge_case_investigation",
      edge_case_investigation: "socratic_challenge",
      socratic_challenge: "mastery_synthesis",
      mastery_synthesis: "completed"
    };

    const nextStage = nextStages[params.session.currentStage] || "completed";
    let mentorFeedback = "Muito bom raciocínio! Você identificou a premissa central.";
    let nextQuestion = "Agora vamos ao próximo nível de profundidade: como esse mecanismo reage quando levado a uma situação extrema?";
    let scoreIncrement = 25;

    try {
      const prompt = `
Você é o Mentor Pedagógico Socrático do SENAI.
Conceito em estudo: "${params.session.conceptTitle}"
Fase Atual: "${params.session.currentStage}" -> Próxima Fase: "${nextStage}"

Histórico anterior:
${params.session.conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

Nova resposta do estudante:
"${params.studentResponse}"

Avalie a resposta com rigor pedagógico:
1. Reconheça o ponto forte da resposta.
2. Aponte se houve alguma simplificação ou falácia técnica.
3. Elabore a próxima provocação socrática alinhada à fase "${nextStage}".
Se a fase for "mastery_synthesis", peça uma síntese formal em uma frase com teorema ou padrão arquitetural.

Retorne rigorosamente apenas um JSON no formato:
{
  "feedback": "...",
  "nextQuestion": "...",
  "scoreIncrement": 25,
  "badge": "Mestre da Causalidade"
}
`;
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 600 });
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.feedback) mentorFeedback = parsed.feedback;
        if (parsed.nextQuestion) nextQuestion = parsed.nextQuestion;
        if (typeof parsed.scoreIncrement === "number") scoreIncrement = parsed.scoreIncrement;
      }
    } catch {
      // Deterministic fallback
      if (nextStage === "edge_case_investigation") {
        nextQuestion = `Excelente! Agora considere: o que acontece se o volume de dados crescer por um fator de 1000x ou a rede oscilar com 400ms de latência? Onde o gargalo se manifestará primeiro?`;
      } else if (nextStage === "socratic_challenge") {
        nextQuestion = `Um colega seu afirma que poderíamos resolver isso simplesmente aumentando a memória RAM do servidor. Qual contra-argumento técnico e econômico você apresentaria para refutar essa ideia?`;
      } else if (nextStage === "mastery_synthesis") {
        nextQuestion = `Para consolidar seu domínio: sintetize em um parágrafo conciso a regra de ouro que um arquiteto sênior deve seguir ao lidar com ${params.session.conceptTitle}.`;
      } else {
        nextQuestion = `Parabéns! Você completou a trilha socrática de domínio com sucesso. O conceito foi gravado no seu Passaporte Cognitivo.`;
      }
    }

    const updatedHistory = [
      ...params.session.conversationHistory,
      { role: "student" as const, content: params.studentResponse, timestamp: new Date().toISOString() },
      { role: "mentor" as const, content: `${mentorFeedback}\n\n${nextQuestion}`, timestamp: new Date().toISOString() }
    ];

    const badges = [...params.session.awardedBadges];
    if (nextStage === "completed" && !badges.includes("Domínio Conceitual Validado")) {
      badges.push("Domínio Conceitual Validado");
    }

    return {
      ...params.session,
      currentStage: nextStage,
      questionPrompt: nextQuestion,
      feedback: mentorFeedback,
      depthScore: Math.min(100, params.session.depthScore + scoreIncrement),
      conversationHistory: updatedHistory,
      awardedBadges: badges
    };
  }

  /**
   * Generates a step-by-step cognitive execution trace and mental state transitions
   */
  static simulateMentalDebugger(codeSnippet: string, language: string = "typescript"): MentalDebuggerStep[] {
    return [
      {
        stepNumber: 1,
        lineCode: "const buffer = new Array(1000);",
        explanation: "Alocação de um ponteiro na Stack que aponta para um bloco contíguo de 1000 posições na Heap. Complexidade espacial O(N).",
        callStack: ["main()"],
        heapAllocations: { "Array(1000)": "0x7ffee4b2 (8KB)" },
        scopeVariables: { buffer: "[Array de 1000 elementos vazios]" },
        asymptoticComplexity: "Tempo: O(1) | Espaço: O(N)",
        predictionQuestion: {
          question: "Qual região da memória armazena os elementos reais do array?",
          options: ["Stack (Pilha)", "Heap (Monte)", "Registradores da CPU", "Memória ROM"],
          correctIndex: 1,
          explanation: "Objetos dinâmicos e arrays são alocados na memória Heap, enquanto referências/ponteiros locais residem no frame da Stack."
        }
      },
      {
        stepNumber: 2,
        lineCode: "for (let i = 0; i < buffer.length; i++) { buffer[i] = i * 2; }",
        explanation: "Iteração sequencial de 0 a 999. A CPU realiza acesso indexado O(1) por posição com prefetch no cache L1/L2.",
        callStack: ["main()", "loop_iteration(i=0..999)"],
        heapAllocations: { "Array(1000)": "0x7ffee4b2 (Preenchido com inteiros)" },
        scopeVariables: { i: "1000 (após encerramento)", buffer: "[0, 2, 4, ..., 1998]" },
        asymptoticComplexity: "Tempo: O(N) | Espaço: O(1) adicional",
        predictionQuestion: {
          question: "Por que o acesso a buffer[i] opera em tempo estrito O(1)?",
          options: [
            "Porque a CPU calcula o endereço de memória diretamente: endereço_base + i * tamanho_tipo",
            "Porque ele faz uma busca binária no array",
            "Porque o sistema operacional mantém uma tabela hash interna",
            "Porque os arrays em JS são sempre listas ligadas"
          ],
          correctIndex: 0,
          explanation: "Arrays contíguos permitem indexação aritmética direta com deslocamento (offset), garantindo tempo constante O(1)."
        }
      },
      {
        stepNumber: 3,
        lineCode: "const resultado = buffer.reduce((acc, curr) => acc + curr, 0);",
        explanation: "Redução funcional por acumulação sequencial de todos os valores na Heap. Invariante de estado mantido no acumulador.",
        callStack: ["main()", "Array.prototype.reduce()"],
        heapAllocations: { "Array(1000)": "0x7ffee4b2" },
        scopeVariables: { resultado: 999000 },
        asymptoticComplexity: "Tempo: O(N) | Espaço: O(1)",
        predictionQuestion: {
          question: "Qual o valor final acumulado na variável resultado?",
          options: ["500000", "999000", "1000000", "499500"],
          correctIndex: 1,
          explanation: "A soma de 2 * (0 + 1 + ... + 999) = 2 * (999 * 1000 / 2) = 999.000."
        }
      }
    ];
  }

  /**
   * Spaced repetition active recall deck (Leitner / SuperMemo SM-2 Engine)
   */
  static getSpacedRepetitionDeck(): SpacedRepetitionCard[] {
    return [
      {
        id: "card_01",
        topic: "Big-O & Algoritmos",
        question: "Por que o QuickSort tem pior caso O(N²), mas na prática é frequentemente preferido ao MergeSort O(N log N)?",
        codeSnippet: "// Particionamento de Hoare\nfunction partition(arr, low, high) { ... }",
        conceptualTrap: "Achar que a notação Big-O teórica sempre reflete a velocidade no mundo real sem considerar Cache Locality.",
        deepExplanation: "O QuickSort ordena in-place (O(1) de memória extra) com excelente localidade de cache de hardware. O MergeSort requer O(N) de memória auxiliar, aumentando o custo de alocação.",
        intervalDays: 1,
        easeFactor: 2.5,
        repetitions: 0,
        dueDate: new Date().toISOString()
      },
      {
        id: "card_02",
        topic: "Concorrência & JavaScript",
        question: "Qual é a ordem exata de saída de `console.log`: A (síncrono), B (setTimeout 0), C (Promise.resolve.then)?",
        codeSnippet: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));",
        conceptualTrap: "Achar que `setTimeout(..., 0)` roda antes da Microtask Queue da Promise.",
        deepExplanation: "Ordem correta: A -> C -> B. O código síncrono roda primeiro na Call Stack. Ao esvaziar, o Event Loop processa TODAS as Microtasks (Promises) antes de pegar a próxima Macrotask (Timers).",
        intervalDays: 3,
        easeFactor: 2.5,
        repetitions: 1,
        dueDate: new Date().toISOString()
      },
      {
        id: "card_03",
        topic: "Banco de Dados & Índices",
        question: "Por que uma consulta `SELECT * FROM usuarios WHERE email LIKE '%@gmail.com'` não utiliza o índice B-Tree da coluna email?",
        codeSnippet: "-- EXPLAIN ANALYZE\nSELECT * FROM usuarios WHERE email LIKE '%@gmail.com';",
        conceptualTrap: "Supor que a existência de um índice força o banco a usá-lo mesmo em buscas com curinga no início (leading wildcard).",
        deepExplanation: "Árvores B-Tree são ordenadas lexicograficamente da esquerda para a direita. Um curinga `%` no início impede a navegação binária na árvore, forçando um Seq Scan (Full Table Scan O(N)).",
        intervalDays: 7,
        easeFactor: 2.6,
        repetitions: 2,
        dueDate: new Date().toISOString()
      },
      {
        id: "card_04",
        topic: "Clean Architecture & SOLID",
        question: "Qual princípio SOLID é violado quando um controller HTTP cria diretamente uma instância de `new PostgresUserRepository()`?",
        codeSnippet: "class UserController {\n  private repo = new PostgresUserRepository();\n}",
        conceptualTrap: "Achar que criar objetos diretamente não acarreta problemas de acoplamento.",
        deepExplanation: "Viola a Inversão de Dependência (DIP). Módulos de alto nível não devem depender de módulos de baixo nível; ambos devem depender de abstrações (interfaces injetáveis).",
        intervalDays: 14,
        easeFactor: 2.7,
        repetitions: 3,
        dueDate: new Date().toISOString()
      }
    ];
  }

  /**
   * Updates card intervals based on student recall rating (1 to 5) using SuperMemo SM-2
   */
  static reviewCard(card: SpacedRepetitionCard, quality: number): SpacedRepetitionCard {
    const q = Math.min(Math.max(quality, 1), 5);
    let repetitions = card.repetitions;
    let easeFactor = card.easeFactor;
    let intervalDays = card.intervalDays;

    if (q >= 3) {
      if (repetitions === 0) {
        intervalDays = 1;
      } else if (repetitions === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      repetitions++;
    } else {
      repetitions = 0;
      intervalDays = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + intervalDays);

    return {
      ...card,
      repetitions,
      easeFactor: Number(easeFactor.toFixed(2)),
      intervalDays,
      dueDate: nextDue.toISOString(),
      lastRecallQuality: q
    };
  }

  /**
   * Refactoring and Engineering Trade-Off Challenges
   */
  static getTradeOffChallenges(): TradeOffRefactoringChallenge[] {
    return [
      {
        id: "to_01",
        title: "Dojo de Desempenho: Otimização de Busca em Coleções Duplicadas",
        scenario: "Um sistema bancário recebe 1 milhão de IDs de transações e precisa filtrar apenas aquelas que constam na lista de transações suspeitas de 50.000 itens.",
        naiveCode: `// Solução Ingênua O(N * M)\nfunction filtrarSuspeitas(todas: string[], suspeitas: string[]): string[] {\n  return todas.filter(t => suspeitas.includes(t));\n}`,
        tradeOffAxis: "Time vs Space",
        constraints: ["Tempo de execução < 50ms para 1 milhão de itens", "Memória máxima: 128MB"],
        optimalSolutions: [
          {
            paradigm: "Hash Set Lookup (Trade-off: +Memória O(M), -Tempo O(N))",
            code: `function filtrarSuspeitasOtimizado(todas: string[], suspeitas: string[]): string[] {\n  const setSuspeitas = new Set(suspeitas);\n  return todas.filter(t => setSuspeitas.has(t));\n}`,
            explanation: "Ao carregar a lista de suspeitas em uma Hash Table (Set), a verificação de pertencimento cai de O(M) para O(1) amortizado, reduzindo o tempo total de 50 bilhões de operações para 1 milhão.",
            timeComplexity: "O(N + M)",
            spaceComplexity: "O(M)"
          }
        ]
      },
      {
        id: "to_02",
        title: "Dojo de Arquitetura: Idempotência em Webhooks de Pagamento",
        scenario: "O gateway de pagamento pode enviar o mesmo webhook de 'Pagamento Aprovado' múltiplas vezes devido a timeouts de rede.",
        naiveCode: `// Solução Insegura (Risco de duplicidade de crédito)\nasync function processarWebhook(payload: { orderId: string, amount: number }) {\n  await db.pedidos.atualizarStatus(payload.orderId, 'PAGO');\n  await db.carteira.creditarSaldo(payload.orderId, payload.amount);\n}`,
        tradeOffAxis: "Sync vs Async",
        constraints: ["Garantir atomicidade transacional e tolerância a falhas de rede."],
        optimalSolutions: [
          {
            paradigm: "Distributed Lock com Tabela de Eventos Idempotentes",
            code: `async function processarWebhookIdempotente(eventKey: string, payload: any) {\n  return await db.transaction(async (tx) => {\n    const inserted = await tx.idempotency_keys.insertIfNotExists(eventKey);\n    if (!inserted) return { status: 'IGNORED_DUPLICATE' };\n    await tx.pedidos.atualizarStatus(payload.orderId, 'PAGO');\n    await tx.carteira.creditarSaldo(payload.orderId, payload.amount);\n    return { status: 'PROCESSED' };\n  });\n}`,
            explanation: "Usa chave única de idempotência com atomicidade ACID para garantir que o saldo nunca seja creditado duas vezes.",
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)"
          }
        ]
      }
    ];
  }

  /**
   * Generates official SENAI Mastery Passport PDF (Passaporte de Domínio Técnico & Competências)
   */
  static exportMasteryPassportPdf(passport: MasteryPassportReport): Buffer {
    const doc = new jsPDF();

    // Institutional Header
    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 32, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 32, 210, 2.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI / DR", 14, 11);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("PASSAPORTE DE DOMÍNIO TÉCNICO & APRENDIZAGEM PROFUNDA", 14, 21);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("CERTIFICAÇÃO OFICIAL DE PRÁTICA DELIBERADA & COMPETÊNCIAS SAEP / CHA", 14, 28);

    // Student Info Card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 39, 182, 34, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 39, 182, 34, 2, 2, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Estudante: ${passport.studentName}`, 18, 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Curso Técnico: ${passport.courseName}`, 18, 52);
    doc.text(`Índice Geral de Domínio Conceitual: ${passport.overallMasteryPercentage}% • Horas de Prática Deliberada: ${passport.verifiedHours}h`, 18, 58);
    doc.text(`Sínteses Socráticas Concluídas: ${passport.socraticSynthesesCount} • Hash de Autenticidade: ${passport.hashVerification}`, 18, 64);

    // Competency Breakdown Table
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("1. Matriz de Domínio de Conceitos Fundamentais e Avançados:", 14, 82);

    const conceptRows = passport.deepConcepts.map(c => [
      c.concept,
      c.level,
      `${c.score}%`,
      c.score >= 80 ? "[  X  ] Domínio Pleno" : "[  X  ] Em Desenvolvimento"
    ]);

    safeAutoTable(doc, {
      startY: 86,
      head: [["Conceito / Padrão Arquitetural", "Nível de Profundidade", "Score de Retenção", "Status de Validação"]],
      body: conceptRows,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 2.2 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const finalY = getAutoTableFinalY(doc, 200);

    // Pedagogical Endorsement Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, finalY + 8, 182, 42, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY + 8, 182, 42, 2, 2, "S");

    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PARECER PEDAGÓGICO INSTITUCIONAL SENAI:", 18, finalY + 15);

    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const splitEndorsement = doc.splitTextToSize(passport.pedagogicalEndorsement, 174);
    doc.text(splitEndorsement, 18, finalY + 22);

    // Footer signatures
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text("Documento Oficial emitido pelo CodeCheck AI • CiberAcademy SENAI Learning Engine", 14, 285);
    doc.text(`Emitido em: ${new Date(passport.issuedAt).toLocaleDateString("pt-BR")}`, 160, 285);

    return Buffer.from(doc.output("arraybuffer"));
  }
}

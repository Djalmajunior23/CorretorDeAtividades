/**
 * ============================================================================
 * TeacherGlobalSuperAuthoringService
 * ----------------------------------------------------------------------------
 * Super-Poderes Globais do Professor para Produção de Conteúdo e Sala de Aula:
 * 1. 1-Click Multi-Tier Content Differentiator (Universal Scaffolding)
 * 2. AI Synthetic Student Pre-Flight Simulator (Teste Pré-Aula com 3 Personas)
 * 3. Executable Interactive Slide Decks (Marp / Reveal.js com Código Vivo)
 * 4. Surgical SAEP & Bloom's Taxonomy Rubrics Matrix
 * 5. Bug Hunt & Parsons Problem Generator (Engenharia Reversa & Depuração)
 * 6. Live Classroom Orchestrator & Ghost Mode (Modo Fantasma Anticonstrangimento)
 * 7. Real-World Industry Case Injector (Estudos de Caso com Dados Sintéticos)
 * ============================================================================
 */

export interface MultiTierDifferentiatedPackage {
  originalTopic: string;
  targetLanguage: string;
  createdAt: string;
  tier1_beginner: {
    name: string;
    scaffoldingStrategy: string;
    parsonsBlocks: string[];
    fillInTheBlanksCode: string;
    conceptualHints: string[];
  };
  tier2_proficient: {
    name: string;
    problemStatement: string;
    businessRules: string[];
    acceptanceCriteria: string[];
    unitTestsCode: string;
  };
  tier3_challenger: {
    name: string;
    extremeConstraints: string[];
    cornerCases: string[];
    concurrencyStressRequirements: string;
    seniorBenchmarkCriteria: string;
  };
}

export interface SyntheticStudentPersonaResult {
  personaType: "BEGINNER_STRUGGLING" | "AI_PROMPT_COPIER" | "ADVANCED_EXPLORER";
  name: string;
  timeSpentMinutes: number;
  perceivedDifficulty: "FÁCIL" | "ADEQUADO" | "CONFUSO" | "DESAFIADOR";
  feedbackQuote: string;
  frictionSpots: string[];
  vulnerabilityToAiBypass?: "ALTA" | "MODERADA" | "BLINDADA";
  alternativeApproaches?: string[];
  suggestedTeacherAdjustment: string;
}

export interface SyntheticStudentSimulationReport {
  activityTitle: string;
  overallReadinessScore: number; // 0-100
  hallucinationOrAmbiguityRisk: "BAIXO" | "MEDIO" | "ALTO";
  readinessVerdict: "PRONTO_PARA_SALA" | "RECOMENDA_AJUSTES" | "NECESSITA_REVISAO";
  personas: SyntheticStudentPersonaResult[];
  teacherCalibrationAdvice: string;
  generatedAt: string;
}

export interface InteractiveSlide {
  slideIndex: number;
  title: string;
  pedagogicalObjective: string;
  bulletPoints: string[];
  executableCodeBlock?: {
    language: "python" | "sql" | "typescript";
    code: string;
    expectedOutput: string;
  };
  mermaidDiagram?: string;
  livePollCheckpoint?: {
    question: string;
    options: string[];
    correctIndex: number;
    instantExplanation: string;
  };
  teacherSpeakingNotes: string;
}

export interface ExecutableSlideDeck {
  deckTitle: string;
  targetAudience: string;
  estimatedDurationMinutes: number;
  slides: InteractiveSlide[];
  exportFormats: {
    marpMarkdown: string;
    revealHtml: string;
  };
  generatedAt: string;
}

export interface BloomSaepDimension {
  dimensionName: string;
  bloomLevel: "LEMBRAR" | "COMPREENDER" | "APLICAR" | "ANALISAR" | "AVALIAR" | "CRIAR";
  weightPercent: number;
  levels: {
    insufficient: string; // 0-49%
    basic: string;        // 50-69%
    adequate: string;     // 70-89%
    advanced: string;     // 90-100%
  };
}

export interface BloomSaepRubricMatrix {
  activityTitle: string;
  domainCompetency: string;
  totalWeight: number;
  dimensions: BloomSaepDimension[];
  pedagogicalInterventionGuide: string;
  generatedAt: string;
}

export interface BugHuntChallenge {
  challengeId: string;
  title: string;
  bugCategory: "SECURITY_INJECTION" | "CONCURRENCY_DEADLOCK" | "MEMORY_LEAK" | "OFF_BY_ONE_ALGORITHM";
  brokenCodeSnippet: string;
  hiddenBugs: Array<{
    line: number;
    severity: "CRITICAL" | "HIGH" | "MEDIUM";
    bugType: string;
    explanation: string;
    fixedLine: string;
  }>;
  parsonsReorderPuzzle: string[];
  investigatorBriefing: string;
}

export interface LiveClassroomSessionState {
  sessionId: string;
  topic: string;
  activeStudentsCount: number;
  confusionHeatmap: Array<{
    concept: string;
    strugglingPercent: number;
    status: "NORMAL" | "ALERTA" | "CRITICO";
  }>;
  ghostModeSnippet: {
    anonymousSnippetId: string;
    language: string;
    flawedCode: string;
    socraticQuestionForClass: string;
    discussionTalkingPoints: string[];
  };
  popChallenge: {
    challengeId: string;
    durationMinutes: number;
    prompt: string;
    quickQuizOptions: string[];
    correctOptionIndex: number;
  };
}

export interface IndustryCaseStudy {
  caseId: string;
  companyName: string;
  industrySegment: "Fintech" | "HealthTech" | "E-Commerce" | "Logística 4.0";
  incidentNarrative: string;
  syntheticDataSetCsv: string;
  executiveRequirements: string[];
  technicalDeliverables: string[];
  evaluationRubricSummary: string;
}

export class TeacherGlobalSuperAuthoringService {
  /**
   * 1. 1-Click Multi-Tier Content Differentiator (Universal Scaffolding)
   */
  public static generateMultiTierDifferentiatedContent(
    topic: string,
    language = "typescript",
    contextRules = "Sistema de Processamento de Pagamentos e Transações"
  ): MultiTierDifferentiatedPackage {
    const isSql = language.toLowerCase().includes("sql");
    const isPy = language.toLowerCase().includes("python");

    return {
      originalTopic: topic,
      targetLanguage: language,
      createdAt: new Date().toISOString(),
      tier1_beginner: {
        name: "Nível 1: Guiado & Scaffolding (Parsons Problems & Fill-in-the-Blanks)",
        scaffoldingStrategy: "Redução de sobrecarga cognitiva com blocos ordenáveis e pistas conceituais pontuais.",
        parsonsBlocks: isSql ? [
          "SELECT c.nome, SUM(p.valor) as total_gasto",
          "FROM clientes c",
          "INNER JOIN pedidos p ON c.id = p.cliente_id",
          "WHERE p.status = 'PAGO'",
          "GROUP BY c.id, c.nome",
          "HAVING SUM(p.valor) > 1000",
          "ORDER BY total_gasto DESC;"
        ] : [
          "function processarTransacao(conta: Conta, valor: number): boolean {",
          "  if (valor <= 0) throw new Error('Valor inválido');",
          "  if (conta.saldo < valor) return false;",
          "  conta.saldo -= valor;",
          "  registrarLog(conta.id, 'DEBITO', valor);",
          "  return true;",
          "}"
        ],
        fillInTheBlanksCode: isSql
          ? `SELECT c.nome, SUM(p.valor) as total_gasto\nFROM clientes c\n/* PREENCHA_O_JOIN */ pedidos p ON c.id = p.cliente_id\nWHERE p.status = 'PAGO'\nGROUP BY c.id, c.nome\nHAVING /* PREENCHA_CONDICAO_AGREGACAO */ > 1000;`
          : `function calcularTaxa(valor: number, tier: string): number {\n  // 1. Se for tier VIP, taxa de 1%, caso contrário 5%\n  const taxaPercentual = tier === 'VIP' ? /* PREENCHA_AQUI */ : 0.05;\n  return valor * taxaPercentual;\n}`,
        conceptualHints: [
          "Dica 1: O agrupamento (GROUP BY) deve conter todas as colunas não agregadas do SELECT.",
          "Dica 2: A cláusula HAVING filtra após a agregação, enquanto WHERE filtra linhas individuais antes do agrupamento."
        ]
      },
      tier2_proficient: {
        name: "Nível 2: Proficiente & Padrão de Mercado",
        problemStatement: `Construa um módulo de '${topic}' aplicando regras estritas de integridade, idempotência e tratamento de exceções para o domínio: ${contextRules}.`,
        businessRules: [
          "1. Transações com status inconsistente devem sofrer rollback imediato.",
          "2. Todas as chaves estrangeiras devem possuir índices de cobertura para evitar gargalos de I/O.",
          "3. O cálculo financeiro deve manter precisão decimal exata (evitar arredondamento float)."
        ],
        acceptanceCriteria: [
          "✓ Passar em 100% dos testes unitários de caminho feliz e caminhos de exceção.",
          "✓ Tempo de execução menor que 50ms para lotes de 1.000 operações."
        ],
        unitTestsCode: isPy
          ? `def test_transacao_sucesso():\n    conta = Conta(saldo=1000)\n    res = processar_transacao(conta, 200)\n    assert res is True\n    assert conta.saldo == 800\n\ndef test_saldo_insuficiente():\n    conta = Conta(saldo=100)\n    res = processar_transacao(conta, 500)\n    assert res is False\n`
          : `describe('Processamento Transacional', () => {\n  it('deve debitar saldo com sucesso', () => {\n    const conta = { id: 'c1', saldo: 1000 };\n    expect(processarTransacao(conta, 300)).toBe(true);\n    expect(conta.saldo).toBe(700);\n  });\n});`
      },
      tier3_challenger: {
        name: "Nível 3: Desafiador / Master Class (High-Throughput & Corner Cases)",
        extremeConstraints: [
          "Restrição de Complexidade: Solução estritamente O(N log N) em tempo e O(1) em memória adicional.",
          "Resiliência Concorrente: Protegido contra Dirty Reads, Phantom Reads e Deadlocks com bloqueio otimista/pessimista adequado.",
          "Zero dependências externas além da biblioteca padrão do runtime."
        ],
        cornerCases: [
          "Operações concorrentes na mesma milissegunda disputando o mesmo registro de saldo.",
          "Valores negativos em formato string ou payload malicioso tentando forçar overflow numérico.",
          "Queda de conexão simulada durante a etapa de commit."
        ],
        concurrencyStressRequirements: "Deve manter integridade de saldo em teste de estresse com 50 threads concorrentes sem perder um único centavo.",
        seniorBenchmarkCriteria: "Código limpo, arquitetura desacoplada (Clean Architecture / Hexagonal) e documentação de decisões técnicas (ADR)."
      }
    };
  }

  /**
   * 2. AI Synthetic Student Pre-Flight Simulator (Teste Pré-Aula com 3 Personas)
   */
  public static runSyntheticStudentSimulation(
    activityTitle: string,
    activityPrompt: string
  ): SyntheticStudentSimulationReport {
    const promptLen = activityPrompt.trim().length;
    const hasCodeKeywords = /tabela|class|função|function|select|query|create|interface/i.test(activityPrompt);

    const personaA: SyntheticStudentPersonaResult = {
      personaType: "BEGINNER_STRUGGLING",
      name: "Persona: Lucas (Iniciante / Dificuldade em Abstração)",
      timeSpentMinutes: 38,
      perceivedDifficulty: promptLen > 250 ? "CONFUSO" : "ADEQUADO",
      feedbackQuote: "Fiquei em dúvida se precisava criar as chaves estrangeiras manualmente ou se o enunciado já assumia que existiam. Um exemplo visual no passo 2 ajudaria muito!",
      frictionSpots: [
        "Falta de um exemplo de entrada e saída esperado (I/O).",
        "Terminologia técnica sem glossário explicativo para novatos."
      ],
      suggestedTeacherAdjustment: "Inclua um pequeno bloco de 'Exemplo de Entrada / Saída' e a estrutura inicial para destravar o início do exercício."
    };

    const personaB: SyntheticStudentPersonaResult = {
      personaType: "AI_PROMPT_COPIER",
      name: "Persona: Bruno (Tentativa de Bypass com ChatGPT / Copilot)",
      timeSpentMinutes: 4,
      perceivedDifficulty: "FÁCIL",
      vulnerabilityToAiBypass: hasCodeKeywords ? "MODERADA" : "ALTA",
      feedbackQuote: "Colei o enunciado direto no ChatGPT e ele gerou uma resposta 95% pronta na primeira tentativa sem que eu precisasse entender o domínio.",
      frictionSpots: [
        "O enunciado usa nomes genéricos ('cliente', 'produto') facilitando o autocomplete da IA generativa."
      ],
      suggestedTeacherAdjustment: "Contextualize com regras de negócio exclusivas da instituição (ex: 'Regras de Frete Regional SENAI Tech') para exigir raciocínio autêntico do aluno."
    };

    const personaC: SyntheticStudentPersonaResult = {
      personaType: "ADVANCED_EXPLORER",
      name: "Persona: Beatriz (Avançada / Soluções Alternativas)",
      timeSpentMinutes: 12,
      perceivedDifficulty: "ADEQUADO",
      alternativeApproaches: [
        "Utilização de Window Functions (ROW_NUMBER()) em vez de subqueries correlacionadas.",
        "Implementação com padrão Factory Method para extensão dinâmica."
      ],
      feedbackQuote: "Resolvi de forma mais eficiente usando índices compostos e funções analíticas, mas fiquei com receio de o corretor automático descontar nota por não ser a solução esperada clássica.",
      frictionSpots: [
        "Rubrica de correção pode ser rígida demais contra soluções superiores."
      ],
      suggestedTeacherAdjustment: "Garanta que a rubrica avalie o resultado funcional e complexidade assintótica, e não apenas correspondência exata de strings no código."
    };

    const readinessScore = Math.min(96, Math.max(60, 85 - (promptLen < 50 ? 20 : 0) + (hasCodeKeywords ? 10 : -5)));

    return {
      activityTitle,
      overallReadinessScore: readinessScore,
      hallucinationOrAmbiguityRisk: readinessScore >= 80 ? "BAIXO" : "MEDIO",
      readinessVerdict: readinessScore >= 80 ? "PRONTO_PARA_SALA" : "RECOMENDA_AJUSTES",
      personas: [personaA, personaB, personaC],
      teacherCalibrationAdvice: "Excelente atividade! Recomendamos apenas adicionar 1 exemplo de I/O e contextualizar 2 regras de negócio exclusivas para blindar contra respostas rasas de IA.",
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 3. Executable Interactive Slide Decks (Marp / Reveal.js)
   */
  public static generateExecutableSlideDeck(
    topicTitle: string,
    targetAudience = "Estudantes Técnicos SENAI",
    codeLanguage: "python" | "sql" | "typescript" = "sql"
  ): ExecutableSlideDeck {
    const slides: InteractiveSlide[] = [
      {
        slideIndex: 1,
        title: `${topicTitle}: Fundamentos & Arquitetura`,
        pedagogicalObjective: "Apresentar o conceito central e a relevância prática no mercado de trabalho.",
        bulletPoints: [
          "Por que este padrão é essencial na engenharia de software moderna?",
          "Trade-offs: Performance vs. Legibilidade vs. Custo de Manutenção.",
          "O que acontece na produção quando este conceito é negligenciado?"
        ],
        teacherSpeakingNotes: "Abra a aula com uma pergunta provocativa sobre um incidente real de lentidão em produção antes de mostrar a sintaxe."
      },
      {
        slideIndex: 2,
        title: "Estrutura & Diagrama Visual do Domínio",
        pedagogicalObjective: "Visualizar entidades, fluxos e interações antes da codificação.",
        bulletPoints: [
          "Entidades fortes vs. Entidades satélite.",
          "Cardinalidade e integridade referencial.",
          "Fluxo de execução síncrono vs. assíncrono."
        ],
        mermaidDiagram: `graph LR\n  Cliente[Cliente PK] -->|1:N| Pedido[Pedido FK]\n  Pedido -->|1:N| ItemPedido[Item FK]\n  ItemPedido -->|N:1| Produto[Produto PK]`,
        teacherSpeakingNotes: "Peça para um aluno voluntário explicar por que a tabela associativa ItemPedido é necessária."
      },
      {
        slideIndex: 3,
        title: "Live Coding: Execução em Tempo Real",
        pedagogicalObjective: "Demonstrar o código funcional e analisar o output ao vivo na sala.",
        bulletPoints: [
          "Sintaxe correta e padrões de Clean Code.",
          "Execução e inspeção de saída em milissegundos."
        ],
        executableCodeBlock: {
          language: codeLanguage,
          code: codeLanguage === "sql"
            ? "EXPLAIN ANALYZE\nSELECT c.nome, COUNT(p.id) as total_pedidos\nFROM clientes c\nLEFT JOIN pedidos p ON c.id = p.cliente_id\nGROUP BY c.id, c.nome\nORDER BY total_pedidos DESC\nLIMIT 5;"
            : "function processarLote(itens: number[]): number {\n  return itens\n    .filter(x => x > 0)\n    .reduce((acc, curr) => acc + curr * 1.1, 0);\n}\nconsole.log('Total com taxa:', processarLote([100, 250, -50, 400]));",
          expectedOutput: codeLanguage === "sql"
            ? "HashAggregate (cost=12.40..14.20 rows=5) -> Seq Scan on clientes | Execution Time: 0.84 ms"
            : "Total com taxa: 825"
        },
        teacherSpeakingNotes: "Modifique o código ao vivo propositalmente para mostrar o que acontece se retirarmos o GROUP BY."
      },
      {
        slideIndex: 4,
        title: "Checkpoint Socrático: Desafio Relâmpago",
        pedagogicalObjective: "Verificar a retenção conceitual antes de liberar para o laboratório prático.",
        bulletPoints: [
          "Vote na melhor alternativa na tela do seu dispositivo.",
          "Debate de 2 minutos em duplas (Peer Instruction)."
        ],
        livePollCheckpoint: {
          question: "Qual cláusula SQL deve ser utilizada para filtrar o resultado de uma agregação com SUM()?",
          options: [
            "WHERE",
            "HAVING",
            "GROUP BY",
            "ORDER BY"
          ],
          correctIndex: 1,
          instantExplanation: "Correto! O HAVING filtra registros agregados após o GROUP BY, enquanto WHERE filtra antes da agregação."
        },
        teacherSpeakingNotes: "Mostre o gráfico de respostas dos alunos e peça para alguém que acertou justificar para a turma."
      }
    ];

    const marpMarkdown = [
      `---\nmarp: true\ntheme: uncover\npaginate: true\nbackgroundColor: #0f172a\ncolor: #f8fafc\n---\n`,
      ...slides.map(s => (
        `# ${s.title}\n\n` +
        `**Objetivo:** ${s.pedagogicalObjective}\n\n` +
        s.bulletPoints.map(b => `- ${b}`).join("\n") + "\n\n" +
        (s.executableCodeBlock ? `\`\`\`${s.executableCodeBlock.language}\n${s.executableCodeBlock.code}\n\`\`\`\n\n` : "") +
        (s.mermaidDiagram ? `\`\`\`mermaid\n${s.mermaidDiagram}\n\`\`\`\n\n` : "") +
        `---\n`
      ))
    ].join("\n");

    const revealHtml = `
      <div class="reveal">
        <div class="slides">
          ${slides.map(s => `
            <section data-background-color="#0f172a">
              <h2 style="color: #38bdf8;">${s.title}</h2>
              <p style="font-size: 18px; color: #94a3b8;">${s.pedagogicalObjective}</p>
              <ul>${s.bulletPoints.map(b => `<li>${b}</li>`).join("")}</ul>
            </section>
          `).join("")}
        </div>
      </div>
    `.trim();

    return {
      deckTitle: topicTitle,
      targetAudience,
      estimatedDurationMinutes: 45,
      slides,
      exportFormats: {
        marpMarkdown,
        revealHtml
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 4. Surgical SAEP & Bloom's Taxonomy Rubrics Matrix Generator
   */
  public static generateBloomSaepRubricMatrix(
    activityTitle: string,
    domainCompetency = "Desenvolvimento de Software e Banco de Dados SENAI"
  ): BloomSaepRubricMatrix {
    const dimensions: BloomSaepDimension[] = [
      {
        dimensionName: "Modelagem de Dados & Integridade",
        bloomLevel: "APLICAR",
        weightPercent: 30,
        levels: {
          insufficient: "Não define chaves primárias/estrangeiras ou cria redundâncias graves que violam a 1FN.",
          basic: "Chaves PK e FK criadas, mas apresenta atributos multivalorados ou violações de dependência transitiva (3FN).",
          adequate: "Modelo totalmente normalizado na 3FN com tipos de dados coerentes e integridade referencial garantida.",
          advanced: "Modelo 3FN excelente com índices de cobertura, constraints de validação (CHECK) e particionamento justificado."
        }
      },
      {
        dimensionName: "Padrões de Código & Clean Architecture",
        bloomLevel: "CRIAR",
        weightPercent: 30,
        levels: {
          insufficient: "Código monolítico sem separação de responsabilidades, nomes genéricos (a, b, temp) e sem tratamento de erros.",
          basic: "Código funcional, porém com regras de negócio misturadas com apresentação/acesso a dados.",
          adequate: "Código modularizado, com nomes expressivos, tratamento de exceções adequado e tipagem consistente.",
          advanced: "Arquitetura limpa com inversão de dependência (SOLID), design patterns pertinentes e cobertura de testes."
        }
      },
      {
        dimensionName: "Eficiência Algorítmica & Análise Crítica",
        bloomLevel: "ANALISAR",
        weightPercent: 25,
        levels: {
          insufficient: "Gera loops aninhados O(N³) ou full table scans desnecessários que travam a aplicação em volume moderado.",
          basic: "Algoritmo funcional com complexidade razoável, porém com alto consumo de memória.",
          adequate: "Algoritmo eficiente O(N log N) com aproveitamento correto de índices e estruturas de dados adequadas.",
          advanced: "Solução otimizada com justificativa formal de complexidade assintótica (Big-O) e profiling de latência/IO."
        }
      },
      {
        dimensionName: "Segurança Cibernética & LGPD",
        bloomLevel: "AVALIAR",
        weightPercent: 15,
        levels: {
          insufficient: "Concatenação direta de strings em SQL (SQL Injection evidente) ou exposição de senhas/dados sensíveis em texto puro.",
          basic: "Utiliza consultas parametrizadas, mas deixa dados pessoais expostos sem mascaramento.",
          adequate: "100% protegido contra SQLi, com sanitização de inputs e hashing seguro de credenciais (bcrypt/argon2).",
          advanced: "Segurança em profundidade com controle de acesso RBAC, logs de auditoria imutáveis e anonimização LGPD."
        }
      }
    ];

    return {
      activityTitle,
      domainCompetency,
      totalWeight: 100,
      dimensions,
      pedagogicalInterventionGuide: "Alunos com nota na dimensão de Modelagem abaixo de 'Adequado' devem realizar a Trilha de Auto-Cura de Normalização 3FN.",
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 5. Bug Hunt & Parsons Problem Generator (Engenharia Reversa & Depuração)
   */
  public static generateBugHuntChallenge(
    topic = "Segurança em Consultas SQL e Concorrência",
    category: BugHuntChallenge["bugCategory"] = "SECURITY_INJECTION"
  ): BugHuntChallenge {
    return {
      challengeId: `bughunt_${Date.now()}`,
      title: `Operação Caça ao Bug: ${topic}`,
      bugCategory: category,
      brokenCodeSnippet: `// ==========================================\n// CÓDIGO VULNERÁVEL - INVESTIGAÇÃO NECESSÁRIA\n// ==========================================\napp.post('/api/login', async (req, res) => {\n  const { email, senha } = req.body;\n  \n  // BUG 1: Concatenação direta vulnerável a SQL Injection\n  const query = "SELECT * FROM usuarios WHERE email = '" + email + "' AND senha = '" + senha + "';";\n  const [rows] = await db.raw(query);\n  \n  if (rows.length > 0) {\n    // BUG 2: Senha retornada em texto puro no payload da resposta\n    res.json({ token: 'jwt_fake', usuario: rows[0] });\n  } else {\n    res.status(401).json({ error: 'Credenciais inválidas' });\n  }\n});`,
      hiddenBugs: [
        {
          line: 8,
          severity: "CRITICAL",
          bugType: "CWE-89: SQL Injection",
          explanation: "Concatenação direta permite bypass de autenticação com payload: ' OR '1'='1",
          fixedLine: "  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND senha_hash = ?', [email, senhaHash]);"
        },
        {
          line: 12,
          severity: "HIGH",
          bugType: "CWE-312: Cleartext Storage / Exposure of Sensitive Information",
          explanation: "O objeto retornado expõe o campo de senha para o cliente HTTP.",
          fixedLine: "    const { senha, senha_hash, ...safeUser } = rows[0];\n    res.json({ token, usuario: safeUser });"
        }
      ],
      parsonsReorderPuzzle: [
        "const { email, senha } = req.body;",
        "const user = await userRepository.findByEmail(email);",
        "if (!user) return res.status(401).json({ error: 'Não autorizado' });",
        "const isValid = await bcrypt.compare(senha, user.passwordHash);",
        "if (!isValid) return res.status(401).json({ error: 'Não autorizado' });",
        "const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);",
        "return res.json({ token, name: user.name });"
      ],
      investigatorBriefing: "Um pentester alertou que a rota de login pode ser burlada sem senha. Analise o código, aponte a linha do exploit e reordene a implementação correta e segura."
    };
  }

  /**
   * 6. Live Classroom Orchestrator & Anonymous Ghost Mode
   */
  public static generateLiveClassroomSession(
    topic = "Estruturas de Dados e Normalização de Banco"
  ): LiveClassroomSessionState {
    return {
      sessionId: `live_${Date.now()}`,
      topic,
      activeStudentsCount: 32,
      confusionHeatmap: [
        { concept: "Normalização 3FN (Dependência Transitiva)", strugglingPercent: 44, status: "CRITICO" },
        { concept: "JOINs Múltiplos e Índices Compostos", strugglingPercent: 25, status: "ALERTA" },
        { concept: "Declaração de Chave Primária UUID", strugglingPercent: 6, status: "NORMAL" }
      ],
      ghostModeSnippet: {
        anonymousSnippetId: "ghost_snippet_01",
        language: "sql",
        flawedCode: `-- CÓDIGO ANÔNIMO DA TURMA (PROJEÇÃO PEDAGÓGICA)\nSELECT c.nome, p.id, p.valor\nFROM clientes c, pedidos p\n-- Esqueceram o WHERE c.id = p.cliente_id (Gerou Produto Cartesiano de 500k linhas!)\nWHERE p.valor > 100;`,
        socraticQuestionForClass: "Turma, se a tabela clientes tem 1.000 linhas e pedidos tem 5.000 linhas, quantas linhas essa query vai processar na memória?",
        discussionTalkingPoints: [
          "Explicar a diferença entre Produto Cartesiano acidental e INNER JOIN explícito.",
          "Demonstrar como a sintaxe ANSI-92 (\`FROM a INNER JOIN b ON ...\`) evita esse erro comum."
        ]
      },
      popChallenge: {
        challengeId: `pop_${Date.now()}`,
        durationMinutes: 3,
        prompt: "Refatore a query projetada no telão para utilizar INNER JOIN com alias expressivo em até 3 minutos!",
        quickQuizOptions: [
          "FROM clientes c INNER JOIN pedidos p ON c.id = p.cliente_id",
          "FROM clientes c LEFT OUTER JOIN pedidos p ON c.nome = p.id",
          "FROM clientes c, pedidos p WHERE c.nome = p.valor",
          "FROM pedidos p CROSS JOIN clientes c"
        ],
        correctOptionIndex: 0
      }
    };
  }

  /**
   * 7. Real-World Industry Case Injector
   */
  public static generateIndustryCaseStudy(
    segment: IndustryCaseStudy["industrySegment"] = "Fintech",
    topic = "Arquitetura de Microsserviços e Banco Resiliente"
  ): IndustryCaseStudy {
    return {
      caseId: `case_${Date.now()}`,
      companyName: "NexusPay Instituição de Pagamentos S.A.",
      industrySegment: segment,
      incidentNarrative: "Na última Black Friday, a NexusPay processou 1.200 transações por segundo. Durante o pico das 20h, o banco de dados principal atingiu 100% de CPU devido a lock escalations causados por leituras repetidas em transações não indexadas, resultando em R$ 450 mil em pagamentos não confirmados.",
      syntheticDataSetCsv: `transacao_id,cliente_id,valor,moeda,status,timestamp\ntx_901,cli_10,250.00,BRL,PAGO,2026-09-30T20:01:05Z\ntx_902,cli_14,1420.50,BRL,PENDENTE,2026-09-30T20:01:06Z\ntx_903,cli_88,50.00,BRL,CANCELADO,2026-09-30T20:01:07Z\ntx_904,cli_10,890.00,BRL,PAGO,2026-09-30T20:01:08Z`,
      executiveRequirements: [
        "1. Garantir ACID estrito sem permitir leituras sujas (Dirty Read) em concorrência.",
        "2. Reduzir a latência p99 de consulta de extrato para menos de 10ms.",
        "3. Emissão de relatório de auditoria em conformidade com as normas do BACEN e LGPD."
      ],
      technicalDeliverables: [
        "Script DDL com índices otimizados (B-Tree composto) para busca por \`cliente_id\` e \`timestamp\`.",
        "Consulta SQL com paginação por cursor (evitando OFFSET lento).",
        "Diagrama de Arquitetura em Mermaid demonstrando réplica de leitura para desonerar a base primária."
      ],
      evaluationRubricSummary: "Avaliação baseada na redução comprovada de custo de query no simulador e ausência de deadlocks concorrentes."
    };
  }
}

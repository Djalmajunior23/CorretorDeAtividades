import { jsPDF } from "jspdf";
import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

export interface LessonPlanScheduleItem {
  timeBlock: string; // Ex: "00:00 - 00:15 (15 min)"
  phase: "AQUECIMENTO" | "DEMONSTRACAO" | "PRATICA_HANDS_ON" | "DEBRIEFING" | "TICKET_SAIDA";
  title: string;
  teacherActions: string;
  studentActions: string;
  materialsAndTools: string[];
  pedagogicalGoal: string;
}

export interface PracticalLabChallenge {
  id: string;
  title: string;
  scenarioContext: string; // Cenário industrial / empresarial real
  learningObjectives: string[];
  difficulty: "BÁSICO" | "INTERMEDIÁRIO" | "AVANÇADO";
  estimatedMinutes: number;
  starterCode: {
    language: string;
    filename: string;
    content: string;
  };
  solutionCode: {
    language: string;
    filename: string;
    content: string;
  };
  unitTests: {
    testName: string;
    testCode: string;
    expectedResult: string;
    weight: number;
  }[];
  tieredHints: {
    tier: 1 | 2 | 3;
    title: string;
    hintText: string;
  }[];
  saepRubric: {
    criterion: string;
    excellentCriteria: string; // 100%
    proficientCriteria: string; // 80%
    basicCriteria: string;      // 60%
    insufficientCriteria: string; // <60%
  }[];
}

export interface InteractiveSlideCard {
  slideNumber: number;
  type: "CONCEPT" | "LIVE_CODE" | "INTERACTIVE_POLL" | "TROUBLESHOOTING_CHALLENGE";
  title: string;
  bullets: string[];
  codeBlock?: {
    language: string;
    snippet: string;
    highlightLines?: number[];
  };
  interactivePoll?: {
    question: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    revealExplanation: string;
  };
  speakerNotesForTeacher: string;
}

export interface TeacherLessonKit {
  id: string;
  topic: string;
  subject: string;
  courseName: string;
  targetCompetencies: string[]; // BNCC / SENAI
  methodology: "PBL" | "SALA_INVERTIDA" | "GAMIFICACAO" | "PEER_INSTRUCTION" | "HANDS_ON_FABLAB";
  totalDurationMinutes: number;
  prerequisites: string[];
  lessonSchedule: LessonPlanScheduleItem[];
  practicalLab: PracticalLabChallenge;
  interactiveSlides: InteractiveSlideCard[];
  exitTicketQuestions: {
    question: string;
    options: string[];
    correctIndex: number;
    quickDiagnostic: string;
  }[];
  createdAt: string;
}

export class TeacherInteractiveLessonKitService {
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

  // =========================================================================
  // 1. GERADOR DE KIT DE AULA COMPLETO (PLANO + LAB + SLIDES + EXIT TICKET)
  // =========================================================================
  static async generateLessonKit(params: {
    topic: string;
    subject?: string;
    courseName?: string;
    targetDurationMinutes?: number; // Padrão: 100min (2 aulas)
    methodology?: "PBL" | "SALA_INVERTIDA" | "GAMIFICACAO" | "PEER_INSTRUCTION" | "HANDS_ON_FABLAB";
    programmingLanguage?: string;
    industryContext?: string;
    customAI?: CustomAIRequestOptions;
  }): Promise<TeacherLessonKit> {
    const topic = params.topic || "Desenvolvimento de APIs RESTful e Validações";
    const subject = params.subject || "Programação e Desenvolvimento de Sistemas";
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";
    const duration = params.targetDurationMinutes || 100;
    const methodology = params.methodology || "PBL";
    const language = params.programmingLanguage || "TypeScript / Node.js";
    const industryContext = params.industryContext || "Sistema de Gestão e Telemetria para Manufatura Inteligente 4.0";

    const prompt = `Você é um Designer Instrucional e Docente Master SENAI de Tecnologia e Educação Profissional.
Gere um KIT COMPLETO DE AULA PRÁTICA INTERATIVA sobre:
- Tema: "${topic}"
- Disciplina: "${subject}"
- Curso: "${courseName}"
- Metodologia Ativa: "${methodology}"
- Linguagem/Stack: "${language}"
- Contexto da Indústria: "${industryContext}"
- Duração: ${duration} minutos

O kit DEVE conter:
1. Plano de Aula Minuto a Minuto estruturado nas 5 fases pedagógicas (Aquecimento, Demonstração Interativa, Desafio Hands-on, Debriefing e Ticket de Saída).
2. Desafio Prático de Laboratório com Starter Code, Testes Unitários e 3 Dicas Escalonadas (Tier 1: Conceitual, Tier 2: Estrutural, Tier 3: Resolução guiada).
3. Matriz de Rubrica SAEP/SENAI nos 4 níveis de desempenho (Excelente, Proficiente, Básico, Insuficiente).
4. Conjunto de 4 Slides Interativos para projeção com Quick Poll de fixação.
5. Exit Ticket (Ticket de Saída) de 2 questões diagnósticas rápidas.

RETORNE ESTRITAMENTE UM JSON VÁLIDO no seguinte formato:
{
  "topic": "${topic}",
  "subject": "${subject}",
  "courseName": "${courseName}",
  "methodology": "${methodology}",
  "targetCompetencies": ["SENAI-DS-01: Implementar lógica de negócios modular", "SENAI-DS-02: Validar integridade e resiliência"],
  "prerequisites": ["Conceitos básicos de funções e JSON", "Ambiente Node/VSCode configurado"],
  "lessonSchedule": [
    {
      "timeBlock": "00:00 - 00:15 (15 min)",
      "phase": "AQUECIMENTO",
      "title": "Gancho de Mercado: Falhas em Produção",
      "teacherActions": "Apresenta um caso real de indisponibilidade por falta de validação.",
      "studentActions": "Analisam o cenário e opinam sobre possíveis causas.",
      "materialsAndTools": ["Projetor", "Terminal interativo"],
      "pedagogicalGoal": "Despertar curiosidade e relevância profissional do tema."
    }
  ],
  "practicalLab": {
    "id": "LAB-01",
    "title": "Desafio Prático de ${topic}",
    "scenarioContext": "${industryContext}",
    "learningObjectives": ["Criar funções puras de validação", "Garantir 100% de cobertura nos testes unitários"],
    "difficulty": "INTERMEDIÁRIO",
    "estimatedMinutes": 45,
    "starterCode": {
      "language": "${language}",
      "filename": "validator.ts",
      "content": "// Código inicial com TODOs para o aluno..."
    },
    "solutionCode": {
      "language": "${language}",
      "filename": "validator.solution.ts",
      "content": "// Código de referência do professor..."
    },
    "unitTests": [
      {
        "testName": "Deve validar payload correto com sucesso",
        "testCode": "expect(validateSensor({ id: 1, temp: 25 })).toBe(true);",
        "expectedResult": "true",
        "weight": 50
      }
    ],
    "tieredHints": [
      { "tier": 1, "title": "Dica Conceitual", "hintText": "Lembre-se de validar se o objeto não é nulo antes de acessar suas propriedades." },
      { "tier": 2, "title": "Dica Estrutural", "hintText": "Use cláusulas de guarda (if (!obj) return false) no início da função." },
      { "tier": 3, "title": "Dica de Implementação", "hintText": "Exemplo de sintaxe: typeof obj.temp === 'number' && obj.temp >= 0" }
    ],
    "saepRubric": [
      {
        "criterion": "Validação e Robustez de Dados",
        "excellentCriteria": "Valida todos os tipos, limites e casos de borda com retorno semântico.",
        "proficientCriteria": "Valida os tipos principais e rejeita valores fora da faixa.",
        "basicCriteria": "Valida apenas campos obrigatórios sem checagem de tipos profundos.",
        "insufficientCriteria": "Não implementa validação de entrada gerando exceções não tratadas."
      }
    ]
  },
  "interactiveSlides": [
    {
      "slideNumber": 1,
      "type": "CONCEPT",
      "title": "Fundamentos de ${topic}",
      "bullets": ["Por que validar na borda da aplicação?", "Fail-Fast: Falhar o mais cedo possível"],
      "speakerNotesForTeacher": "Destaque a economia de recursos de banco de dados ao rejeitar requisições inválidas no gateway."
    }
  ],
  "exitTicketQuestions": [
    {
      "question": "Qual é a principal vantagem de utilizar Cláusulas de Guarda (Early Return)?",
      "options": [
        "Reduzir o aninhamento ciclomático e tornar o fluxo de erro explícito",
        "Aumentar o uso de memória RAM do servidor",
        "Substituir totalmente o banco de dados",
        "Executar o código em paralelo automaticamente"
      ],
      "correctIndex": 0,
      "quickDiagnostic": "Se o aluno marcar B ou C, revisar o propósito de legibilidade e fluxo de controle."
    }
  ]
}`;

    let parsedResult: any = null;

    try {
      const provider = ProviderFactory.createCustomProvider(params.customAI);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 7000 });

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      // Fallback determinístico offline
      parsedResult = this.generateDeterministicLessonKit(topic, subject, courseName, duration, language, industryContext);
    }

    if (!parsedResult || !parsedResult.lessonSchedule || !parsedResult.practicalLab) {
      parsedResult = this.generateDeterministicLessonKit(topic, subject, courseName, duration, language, industryContext);
    }

    const kitId = `KIT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return {
      id: kitId,
      topic: parsedResult.topic || topic,
      subject: parsedResult.subject || subject,
      courseName: parsedResult.courseName || courseName,
      targetCompetencies: parsedResult.targetCompetencies || [
        "SENAI-DS-01: Implementar lógica de negócios modular e testável",
        "SENAI-DS-02: Garantir segurança e tratamento preventivo de falhas",
      ],
      methodology: params.methodology || "PBL",
      totalDurationMinutes: duration,
      prerequisites: parsedResult.prerequisites || ["Lógica de Programação Básica", "Familiaridade com IDE"],
      lessonSchedule: parsedResult.lessonSchedule,
      practicalLab: parsedResult.practicalLab,
      interactiveSlides: parsedResult.interactiveSlides || [],
      exitTicketQuestions: parsedResult.exitTicketQuestions || [],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Fallback offline para geração garantida de plano de aula de alto padrão
   */
  private static generateDeterministicLessonKit(
    topic: string,
    subject: string,
    courseName: string,
    duration: number,
    language: string,
    industryContext: string
  ): any {
    return {
      topic,
      subject,
      courseName,
      methodology: "PBL",
      targetCompetencies: [
        "SENAI-TEC-01: Projetar algoritmos eficientes para controle de processos industriais",
        "SENAI-TEC-02: Aplicar técnicas de Clean Code e testes automatizados de unidade",
        "SENAI-TEC-03: Diagnosticar e corrigir falhas de execução em tempo real",
      ],
      prerequisites: [
        "Fundamentos de lógica e estruturas condicionais",
        "Sintaxe básica da linguagem " + language,
      ],
      lessonSchedule: [
        {
          timeBlock: "00:00 - 00:15 (15 min)",
          phase: "AQUECIMENTO",
          title: "Abertura & Gancho de Mercado (Indústria 4.0)",
          teacherActions: "Apresenta incidente real onde dados de telemetria corrompidos paralisaram uma linha de montagem automotiva.",
          studentActions: "Identificam potenciais pontos de vulnerabilidade e discutem soluções preventivas.",
          materialsAndTools: ["Slide 1 e 2", "Diagrama de Arquitetura"],
          pedagogicalGoal: "Ancoragem contextual e engajamento emocional com a importância do tema.",
        },
        {
          timeBlock: "00:15 - 00:35 (20 min)",
          phase: "DEMONSTRACAO",
          title: "Demonstração Interativa & Live Coding",
          teacherActions: "Codifica ao vivo no projetor a implementação de Cláusulas de Guarda e validação de schema de dados.",
          studentActions: "Acompanham no terminal local e sugerem cenários de teste de borda (Boundary Cases).",
          materialsAndTools: ["Monaco Editor / VS Code", "Terminal Node.js"],
          pedagogicalGoal: "Modelagem de boas práticas e desmistificação da sintaxe técnica.",
        },
        {
          timeBlock: "00:35 - 00:80 (45 min)",
          phase: "PRATICA_HANDS_ON",
          title: "Desafio Hands-on em Duplas no Laboratório",
          teacherActions: "Circula pelos computadores, atua como mentor socrático e libera dicas escalonadas quando necessário.",
          studentActions: "Codificam em duplas (Driver/Navigator) para fazer todos os testes unitários passarem.",
          materialsAndTools: ["Computadores do Laboratório", "Starter Code do Lab"],
          pedagogicalGoal: "Desenvolvimento de autonomia técnica e colaboração profissional.",
        },
        {
          timeBlock: "00:80 - 00:90 (10 min)",
          phase: "DEBRIEFING",
          title: "Síntese, Erros Comuns & Correção Cruzada",
          teacherActions: "Projeta duas soluções distintas da turma e lidera a discussão de trade-offs de legibilidade e performance.",
          studentActions: "Comparam a sua abordagem com a dos colegas e registram os aprendizados.",
          materialsAndTools: ["Quadro / Projetor"],
          pedagogicalGoal: "Institucionalização do conhecimento e pensamento crítico.",
        },
        {
          timeBlock: "00:90 - 00:100 (10 min)",
          phase: "TICKET_SAIDA",
          title: "Ticket de Saída & Fechamento Formativo",
          teacherActions: "Disponibiliza o quiz relâmpago de 2 questões e confere o termômetro de aprendizado da turma.",
          studentActions: "Respondem individualmente no portal antes de sair da sala.",
          materialsAndTools: ["Portal do Aluno / Celular"],
          pedagogicalGoal: "Avaliação formativa imediata para planejamento da próxima aula.",
        },
      ],
      practicalLab: {
        id: `LAB-AUTO-${Date.now().toString(36)}`,
        title: `Laboratório Guiado: ${topic} no Contexto de ${industryContext}`,
        scenarioContext: `Você é o desenvolvedor responsável pelo módulo de telemetria da fábrica da Indústria 4.0. Sua missão é implementar o motor de validação e processamento de dados para garantir que leituras anômalas não danifiquem os atuadores mecânicos.`,
        learningObjectives: [
          "Construir funções com validação robusta de entradas",
          "Garantir conformidade com os critérios de aceite e testes unitários",
          "Aplicar princípios de Clean Code e documentação clara",
        ],
        difficulty: "INTERMEDIÁRIO",
        estimatedMinutes: 45,
        starterCode: {
          language,
          filename: "telemetryService.ts",
          content: `// STARTER CODE - SENAI LABS
// Implemente a função de validação e cálculo de telemetria

export interface TelemetryReading {
  sensorId: string;
  temperatureCelsius: number;
  vibrationMmS: number;
  status: "ONLINE" | "STANDBY" | "ERROR";
}

export interface ValidationResult {
  isValid: boolean;
  alertLevel: "NORMAL" | "WARNING" | "CRITICAL";
  errorMessage?: string;
}

export function processTelemetryReading(reading: TelemetryReading): ValidationResult {
  // TODO 1: Validar se reading e sensorId são válidos
  // TODO 2: Validar se temperatureCelsius está entre -40 e 150
  // TODO 3: Determinar alertLevel (CRITICAL se temp > 100 ou vibration > 15)

  return {
    isValid: false,
    alertLevel: "NORMAL"
  };
}`,
        },
        solutionCode: {
          language,
          filename: "telemetryService.solution.ts",
          content: `export function processTelemetryReading(reading: TelemetryReading): ValidationResult {
  if (!reading || !reading.sensorId || typeof reading.sensorId !== "string") {
    return { isValid: false, alertLevel: "NORMAL", errorMessage: "Sensor ID inválido ou ausente." };
  }

  if (typeof reading.temperatureCelsius !== "number" || reading.temperatureCelsius < -40 || reading.temperatureCelsius > 150) {
    return { isValid: false, alertLevel: "NORMAL", errorMessage: "Temperatura fora dos limites físicos aceitáveis." };
  }

  let alertLevel: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL";
  if (reading.temperatureCelsius > 100 || reading.vibrationMmS > 15) {
    alertLevel = "CRITICAL";
  } else if (reading.temperatureCelsius > 80 || reading.vibrationMmS > 8) {
    alertLevel = "WARNING";
  }

  return {
    isValid: true,
    alertLevel
  };
}`,
        },
        unitTests: [
          {
            testName: "Deve rejeitar leitura com sensorId vazio",
            testCode: `const res = processTelemetryReading({ sensorId: "", temperatureCelsius: 25, vibrationMmS: 2, status: "ONLINE" });\nexpect(res.isValid).toBe(false);`,
            expectedResult: "isValid === false",
            weight: 30,
          },
          {
            testName: "Deve aceitar leitura normal dentro dos limites",
            testCode: `const res = processTelemetryReading({ sensorId: "SENS-01", temperatureCelsius: 45, vibrationMmS: 3, status: "ONLINE" });\nexpect(res.isValid).toBe(true);\nexpect(res.alertLevel).toBe("NORMAL");`,
            expectedResult: "isValid === true && alertLevel === 'NORMAL'",
            weight: 35,
          },
          {
            testName: "Deve disparar alerta CRÍTICO para temperatura > 100°C",
            testCode: `const res = processTelemetryReading({ sensorId: "SENS-02", temperatureCelsius: 115, vibrationMmS: 2, status: "ONLINE" });\nexpect(res.isValid).toBe(true);\nexpect(res.alertLevel).toBe("CRITICAL");`,
            expectedResult: "isValid === true && alertLevel === 'CRITICAL'",
            weight: 35,
          },
        ],
        tieredHints: [
          {
            tier: 1,
            title: "Dica Conceitual (O que fazer)",
            hintText: "Analise os requisitos em ordem: primeiro a integridade estrutural dos campos, depois os limites numéricos e por fim a classificação de severidade.",
          },
          {
            tier: 2,
            title: "Dica Estrutural (Como organizar)",
            hintText: "Utilize cláusulas de guarda separadas no início da função. Se qualquer verificação falhar, retorne imediatamente { isValid: false, ... }.",
          },
          {
            tier: 3,
            title: "Dica de Código (Sintaxe direta)",
            hintText: "Para verificar o alerta crítico: if (reading.temperatureCelsius > 100 || reading.vibrationMmS > 15) { alertLevel = 'CRITICAL'; }",
          },
        ],
        saepRubric: [
          {
            criterion: "Validação e Integridade de Dados",
            excellentCriteria: "Implementa todas as verificações de tipo, limites e nulidade com mensagens claras.",
            proficientCriteria: "Valida os casos principais com sucesso, cobrindo a maioria dos testes.",
            basicCriteria: "Valida apenas campos básicos sem tratar exceções de tipo numérico.",
            insufficientCriteria: "Código quebra em tempo de execução com exceções TypeError não tratadas.",
          },
          {
            criterion: "Classificação de Risco e Lógica de Negócio",
            excellentCriteria: "Aplica corretamente a matriz de alertas sem redundância de código.",
            proficientCriteria: "Classifica alertas corretamente na maioria dos cenários de teste.",
            basicCriteria: "Lógica de alerta incompleta ou com faixas de transição incorretas.",
            insufficientCriteria: "Não calcula o nível de alerta solicitado pelo desafio.",
          },
        ],
      },
      interactiveSlides: [
        {
          slideNumber: 1,
          type: "CONCEPT",
          title: "Arquitetura Resiliente & Validação Defensiva",
          bullets: [
            "Dados de sensores nunca devem ser considerados confiáveis a priori.",
            "Princípio da Falha Rápida (Fail-Fast): Rejeite o erro na entrada da fronteira.",
            "Impacto direto na segurança operacional e longevidade dos equipamentos.",
          ],
          speakerNotesForTeacher: "Estimule a turma a pensar no custo financeiro de um motor industrial queimado por falta de leitura de alarme.",
        },
        {
          slideNumber: 2,
          type: "LIVE_CODE",
          title: "Padrão de Cláusulas de Guarda (Early Return)",
          bullets: [
            "Evite pirâmides de if/else aninhados (Arrow Anti-pattern).",
            "Mantenha o caminho feliz (Happy Path) alinhado à esquerda da tela.",
          ],
          codeBlock: {
            language: "typescript",
            snippet: `// Recomendado (Guard Clause)\nif (!sensor.id) return { isValid: false };\nif (sensor.temp > 100) return { isValid: true, alert: 'CRITICAL' };\nreturn { isValid: true, alert: 'NORMAL' };`,
          },
          speakerNotesForTeacher: "Abra o terminal e mostre como a leitura do código se torna instantânea para qualquer revisor do time.",
        },
        {
          slideNumber: 3,
          type: "INTERACTIVE_POLL",
          title: "Quiz Relâmpago: Análise de Resiliência",
          bullets: ["Qual das seguintes opções causará um erro fatal 'Cannot read properties of undefined'?"],
          interactivePoll: {
            question: "Se a variável 'payload' for 'null', qual linha causará TypeError?",
            options: [
              { id: "A", text: "if (payload && payload.temp > 50)", isCorrect: false },
              { id: "B", text: "if (payload.temp > 50)", isCorrect: true },
              { id: "C", text: "if (payload?.temp > 50)", isCorrect: false },
              { id: "D", text: "if (!payload) return false", isCorrect: false },
            ],
            revealExplanation: "Acessar 'payload.temp' diretamente quando payload é null gera TypeError imediato no JavaScript.",
          },
          speakerNotesForTeacher: "Peça para os alunos levantarem a mão para A, B, C ou D antes de revelar a resposta.",
        },
      ],
      exitTicketQuestions: [
        {
          question: "Em que momento a validação de parâmetros deve ocorrer em uma função de serviço?",
          options: [
            "Imediatamente na primeira linha (Early Return / Guard Clause)",
            "Apenas após gravar os dados no banco de dados",
            "Nunca, pois o compilador já garante a integridade em tempo de execução",
            "Somente no momento do desligamento do servidor",
          ],
          correctIndex: 0,
          quickDiagnostic: "Verifica se o aluno assimilou o princípio Fail-Fast de segurança.",
        },
        {
          question: "Qual é o objetivo principal dos testes unitários automatizados em um laboratório prático?",
          options: [
            "Validar se cada unidade lógica atende aos critérios de aceite de forma determinística e imediata",
            "Aumentar o tamanho do arquivo do projeto para entrega",
            "Eliminar a necessidade de escrever código da aplicação",
            "Substituir o professor em sala de aula",
          ],
          correctIndex: 0,
          quickDiagnostic: "Avalia a compreensão do ciclo de desenvolvimento guiado por feedback contínuo.",
        },
      ],
    };
  }

  // =========================================================================
  // 2. EXPORTAÇÃO DO PLANO DE AULA & GUIA DO ALUNO EM PDF
  // =========================================================================
  static async exportLessonKitPdf(
    kit: TeacherLessonKit,
    options: {
      includeTeacherSchedule?: boolean;
      includeStudentLabGuide?: boolean;
      includeSaepRubric?: boolean;
      saveFilename?: string;
    } = {}
  ): Promise<Buffer> {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // -------------------------------------------------------------------------
    // PÁGINA 1: PLANO DE AULA EXECUTIVO DO PROFESSOR (CRONOGRAMA & DINÂMICAS)
    // -------------------------------------------------------------------------
    doc.setFillColor(0, 51, 153); // Azul SENAI
    doc.rect(0, 0, 210, 32, "F");
    doc.setFillColor(255, 204, 0); // Amarelo
    doc.rect(0, 32, 210, 2.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI", 14, 10);
    doc.setFontSize(12);
    doc.text(`PLANO DE AULA DINÂMICO & ROTEIRO DE SALA`, 14, 18);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `TEMA: ${kit.topic}  |  DISCIPLINA: ${kit.subject}  |  DURAÇÃO: ${kit.totalDurationMinutes} MIN`,
      14,
      25
    );

    // Box Metodologia & Competências
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 38, 182, 26, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 38, 182, 26, 2, 2, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`METODOLOGIA ATIVA: ${kit.methodology}`, 18, 45);
    doc.text(`CURSO: ${kit.courseName}`, 110, 45);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`Competências BNCC/SENAI: ${kit.targetCompetencies.join(" • ")}`, 18, 53, { maxWidth: 174 });
    doc.text(`Pré-requisitos: ${kit.prerequisites.join(" • ")}`, 18, 60, { maxWidth: 174 });

    // Tabela do Cronograma Minuto a Minuto
    let schedY = 70;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, schedY, 182, 7, "F");
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CRONOGRAMA MINUTO A MINUTO DA AULA", 18, schedY + 5);

    schedY += 9;

    kit.lessonSchedule.forEach((item, idx) => {
      if (schedY > 260) {
        doc.addPage();
        schedY = 20;
      }

      doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
      doc.roundedRect(14, schedY, 182, 28, 1.5, 1.5, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, schedY, 182, 28, 1.5, 1.5, "S");

      // Badge de Fase
      doc.setFillColor(0, 51, 153);
      doc.roundedRect(18, schedY + 3, 38, 5.5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(item.phase, 37, schedY + 7, { align: "center" });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${item.timeBlock} — ${item.title}`, 60, schedY + 7);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Ação do Professor: ${item.teacherActions}`, 18, schedY + 14, { maxWidth: 174 });
      doc.text(`Ação dos Alunos: ${item.studentActions}`, 18, schedY + 19, { maxWidth: 174 });
      doc.text(`Objetivo Pedagógico: ${item.pedagogicalGoal}`, 18, schedY + 24, { maxWidth: 174 });

      schedY += 31;
    });

    // -------------------------------------------------------------------------
    // PÁGINA 2: GUIA DO LABORATÓRIO PRÁTICO & RUBRICA SAEP (ENTREGA PARA O ALUNO)
    // -------------------------------------------------------------------------
    if (options.includeStudentLabGuide !== false) {
      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 28, "F");
      doc.setFillColor(16, 185, 129); // Verde
      doc.rect(0, 28, 210, 2.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`ROTEIRO DE LABORATÓRIO PRÁTICO (HANDS-ON)`, 14, 13);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`DESAFIO: ${kit.practicalLab.title}  |  DURAÇÃO ESTIMADA: ${kit.practicalLab.estimatedMinutes} MIN`, 14, 21);

      // Cenário Contextualizado
      let labY = 36;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, labY, 182, 22, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, labY, 182, 22, 2, 2, "S");

      doc.setTextColor(0, 51, 153);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("CENÁRIO DA INDÚSTRIA & SITUAÇÃO-PROBLEMA:", 18, labY + 6);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(kit.practicalLab.scenarioContext, 18, labY + 12, { maxWidth: 174 });

      labY += 27;

      // Código Inicial (Starter Code)
      doc.setFillColor(241, 245, 249);
      doc.rect(14, labY, 182, 6.5, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`CÓDIGO INICIAL (STARTER CODE) — Arquivo: ${kit.practicalLab.starterCode.filename}`, 18, labY + 4.5);

      labY += 9;

      doc.setFillColor(15, 23, 42);
      const starterLines = doc.splitTextToSize(kit.practicalLab.starterCode.content, 172);
      const starterHeight = Math.min(80, starterLines.length * 3.6 + 6);
      doc.roundedRect(14, labY, 182, starterHeight, 1.5, 1.5, "F");

      doc.setTextColor(248, 250, 252);
      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.text(starterLines.slice(0, 20), 18, labY + 5);

      labY += starterHeight + 5;
      doc.setFont("helvetica", "normal");

      // Dicas Escalonadas (Tiered Hints)
      doc.setFillColor(254, 243, 199);
      doc.rect(14, labY, 182, 6.5, "F");
      doc.setTextColor(146, 64, 14);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("SISTEMA DE DICAS ESCALONADAS (TIERED HINTS PARA AUTONOMIA)", 18, labY + 4.5);

      labY += 9;

      kit.practicalLab.tieredHints.forEach((hint) => {
        doc.setFillColor(255, 251, 235);
        doc.roundedRect(14, labY, 182, 10, 1, 1, "F");
        doc.setDrawColor(253, 230, 138);
        doc.roundedRect(14, labY, 182, 10, 1, 1, "S");

        doc.setTextColor(180, 83, 9);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(`[Nível ${hint.tier}] ${hint.title}:`, 18, labY + 6);

        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.text(hint.hintText, 65, labY + 6, { maxWidth: 125 });

        labY += 12;
      });

      // Rubrica SAEP
      if (kit.practicalLab.saepRubric && kit.practicalLab.saepRubric.length > 0) {
        labY += 2;
        doc.setFillColor(241, 245, 249);
        doc.rect(14, labY, 182, 6.5, "F");
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CRITÉRIOS DE AVALIAÇÃO DE DESEMPENHO (RUBRICA SAEP / SENAI)", 18, labY + 4.5);

        labY += 8;

        kit.practicalLab.saepRubric.forEach((rub) => {
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "bold");
          doc.text(`• ${rub.criterion}`, 16, labY);
          labY += 4.5;

          doc.setTextColor(71, 85, 105);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.text(`  - Excelente (100%): ${rub.excellentCriteria}`, 16, labY, { maxWidth: 178 });
          labY += 4;
          doc.text(`  - Proficiente (80%): ${rub.proficientCriteria}`, 16, labY, { maxWidth: 178 });
          labY += 4;
          doc.text(`  - Básico (60%): ${rub.basicCriteria}`, 16, labY, { maxWidth: 178 });
          labY += 6;
        });
      }
    }

    return this.formatPdfOutput(doc, options.saveFilename || `Kit_Aula_${kit.id}.pdf`);
  }
}

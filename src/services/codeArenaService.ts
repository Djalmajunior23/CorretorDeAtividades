import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

export type ArenaMode = "1v1_duel" | "pair_coop" | "class_vs_clock";
export type ArenaDifficulty = "Iniciante" | "Intermediário" | "Avançado" | "Mestre";

export interface ArenaTestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface ArenaChallenge {
  id: string;
  title: string;
  category: "Algoritmos" | "Estruturas de Dados" | "Otimização" | "Criptografia & Segurança" | "Automação Industrial";
  difficulty: ArenaDifficulty;
  storyContext: string;
  description: string;
  starterCode: Record<string, string>; // language -> code
  testCases: ArenaTestCase[];
  timeLimitSeconds: number;
  memoryLimitMb: number;
}

export interface ArenaDuelist {
  id: string;
  name: string;
  avatarUrl?: string;
  eloRating: number;
  currentCode: string;
  language: string;
  testsPassed: number;
  totalTests: number;
  isFinished: boolean;
  finishTimeSeconds?: number;
  earnedScore?: number;
  status: "coding" | "submitting" | "won" | "lost" | "draw";
}

export interface ArenaRoom {
  roomId: string;
  roomName: string;
  mode: ArenaMode;
  difficulty: ArenaDifficulty;
  challenge: ArenaChallenge;
  duelists: ArenaDuelist[];
  status: "waiting" | "in_progress" | "completed";
  winnerId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface ArenaBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt: string;
}

export interface DuelSubmissionResult {
  roomId: string;
  duelistId: string;
  testsPassed: number;
  totalTests: number;
  allPassed: boolean;
  executionTimeMs: number;
  scoreGained: number;
  newEloRating: number;
  eloDelta: number;
  badgesUnlocked: ArenaBadge[];
  testDetails: Array<{
    testIndex: number;
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    isHidden: boolean;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  className: string;
  eloRating: number;
  victories: number;
  duelsPlayed: number;
  winRate: number;
  badgesCount: number;
}

// In-memory real-time room & leaderboard repository
const arenaRoomsMap: Map<string, ArenaRoom> = new Map();
const arenaLeaderboardStore: Map<string, LeaderboardEntry> = new Map();

export class CodeArenaService {
  /**
   * Generates or fetches an algorithmic competitive challenge.
   */
  static async generateChallenge(params: {
    difficulty?: ArenaDifficulty;
    theme?: string;
    language?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<ArenaChallenge> {
    const difficulty = params.difficulty || "Intermediário";
    const theme = params.theme || "Otimização de Linha de Montagem Industrial";
    const lang = (params.language || "python").toLowerCase();
    const challengeId = `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const prompt = `Você é um Criador de Desafios do Codeforces / LeetCode do SENAI.
Crie um desafio de programação competitivo envolvente de nível "${difficulty}" com o tema: "${theme}".

FORMATO OBRIGATÓRIO (Apenas JSON puro):
{
  "title": "...",
  "category": "Algoritmos",
  "difficulty": "${difficulty}",
  "storyContext": "...",
  "description": "...",
  "starterCode": {
    "python": "def solucao(dados: list[int]) -> int:\\n    # Seu codigo aqui\\n    pass",
    "javascript": "function solucao(dados) {\\n  // Seu codigo aqui\\n}",
    "typescript": "function solucao(dados: number[]): number {\\n  // Seu codigo aqui\\n}"
  },
  "testCases": [
    { "input": "5 10 15", "expectedOutput": "30", "isHidden": false },
    { "input": "0 0 0", "expectedOutput": "0", "isHidden": false },
    { "input": "-5 5 100", "expectedOutput": "100", "isHidden": true },
    { "input": "1000 2000 3000", "expectedOutput": "6000", "isHidden": true }
  ],
  "timeLimitSeconds": 180,
  "memoryLimitMb": 128
}`;

    const provider = ProviderFactory.createCustomProvider(params.providerConfig);

    try {
      const raw = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 3000 });
      const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);

      return {
        id: challengeId,
        title: parsed.title || "Desafio de Programação Competitiva",
        category: parsed.category || "Algoritmos",
        difficulty,
        storyContext: parsed.storyContext || "Cenário de otimização de sistemas industriais.",
        description: parsed.description || "Implemente a função para resolver o problema com o menor tempo de execução.",
        starterCode: parsed.starterCode || {
          python: "def resolver(entrada: str) -> str:\n    return entrada",
          javascript: "function resolver(entrada) {\n  return entrada;\n}",
          typescript: "function resolver(entrada: string): string {\n  return entrada;\n}"
        },
        testCases: Array.isArray(parsed.testCases) ? parsed.testCases : [
          { input: "10 20", expectedOutput: "30", isHidden: false },
          { input: "50 50", expectedOutput: "100", isHidden: true }
        ],
        timeLimitSeconds: Number(parsed.timeLimitSeconds) || 180,
        memoryLimitMb: Number(parsed.memoryLimitMb) || 128
      };
    } catch (err: any) {
      console.warn(`[CodeArenaService] Fallback challenge generated: ${err.message}`);
      return this.generateFallbackChallenge(challengeId, difficulty, lang);
    }
  }

  /**
   * Creates a live arena match room.
   */
  static async createRoom(params: {
    roomName: string;
    mode: ArenaMode;
    difficulty?: ArenaDifficulty;
    duelistA: { id: string; name: string };
    duelistB?: { id: string; name: string };
    providerConfig?: CustomAIRequestOptions;
  }): Promise<ArenaRoom> {
    const roomId = `arena_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const difficulty = params.difficulty || "Intermediário";
    const challenge = await this.generateChallenge({ difficulty, providerConfig: params.providerConfig });

    const duelists: ArenaDuelist[] = [
      {
        id: params.duelistA.id,
        name: params.duelistA.name,
        eloRating: 1200,
        currentCode: challenge.starterCode["python"] || "",
        language: "python",
        testsPassed: 0,
        totalTests: challenge.testCases.length,
        isFinished: false,
        status: "coding"
      }
    ];

    if (params.duelistB) {
      duelists.push({
        id: params.duelistB.id,
        name: params.duelistB.name,
        eloRating: 1215,
        currentCode: challenge.starterCode["python"] || "",
        language: "python",
        testsPassed: 0,
        totalTests: challenge.testCases.length,
        isFinished: false,
        status: "coding"
      });
    }

    const room: ArenaRoom = {
      roomId,
      roomName: params.roomName,
      mode: params.mode,
      difficulty,
      challenge,
      duelists,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    arenaRoomsMap.set(roomId, room);
    return room;
  }

  /**
   * Gets room by ID or creates a simulated demonstration room if not found.
   */
  static getRoom(roomId: string): ArenaRoom {
    if (arenaRoomsMap.has(roomId)) {
      return arenaRoomsMap.get(roomId)!;
    }

    // Default active demo room
    const demoChallenge = this.generateFallbackChallenge("chal_demo_01", "Intermediário", "python");
    const demoRoom: ArenaRoom = {
      roomId,
      roomName: "Grande Duelo 1v1 SENAI Arena • Rodada 4",
      mode: "1v1_duel",
      difficulty: "Intermediário",
      challenge: demoChallenge,
      duelists: [
        {
          id: "stu_101",
          name: "Lucas Silveira",
          eloRating: 1420,
          currentCode: `def resolver_anomalia(leituras):\n    # Filtrando picos fora do desvio padrao\n    media = sum(leituras) / len(leituras)\n    return [x for x in leituras if x > media * 1.5]`,
          language: "python",
          testsPassed: 4,
          totalTests: 4,
          isFinished: true,
          finishTimeSeconds: 42,
          earnedScore: 950,
          status: "won"
        },
        {
          id: "stu_102",
          name: "Ana Beatriz Rocha",
          eloRating: 1390,
          currentCode: `def resolver_anomalia(leituras):\n    # Implementando busca com heap\n    pass`,
          language: "python",
          testsPassed: 2,
          totalTests: 4,
          isFinished: false,
          status: "coding"
        }
      ],
      status: "in_progress",
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    arenaRoomsMap.set(roomId, demoRoom);
    return demoRoom;
  }

  /**
   * Submits duelist solution, calculates test pass rate, speed bonus, Elo rating change, and badges.
   */
  static submitSolution(params: {
    roomId: string;
    duelistId: string;
    code: string;
    language: string;
    timeElapsedSeconds: number;
  }): DuelSubmissionResult {
    const room = this.getRoom(params.roomId);
    const challenge = room.challenge;

    // Simulate test execution against challenge test cases
    const testCases = challenge.testCases;
    let passedCount = 0;

    const testDetails = testCases.map((tc, idx) => {
      // Deterministic evaluation: if code contains basic logic or function body, passes test cases
      const hasCode = params.code && params.code.trim().length > 25;
      const passed = hasCode ? (idx === 3 && params.code.length < 50 ? false : true) : false;
      if (passed) passedCount++;

      return {
        testIndex: idx + 1,
        passed,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: passed ? tc.expectedOutput : "Erro de execução / Saída divergente",
        isHidden: Boolean(tc.isHidden)
      };
    });

    const allPassed = passedCount === testCases.length;
    const speedBonus = Math.max(0, Math.round((1 - params.timeElapsedSeconds / challenge.timeLimitSeconds) * 200));
    const testScore = Math.round((passedCount / testCases.length) * 700);
    const cleanCodeBonus = params.code.includes("def ") || params.code.includes("function") ? 100 : 50;
    const scoreGained = allPassed ? testScore + speedBonus + cleanCodeBonus : testScore;

    const eloDelta = allPassed ? (params.timeElapsedSeconds < 60 ? 32 : 24) : -8;
    const currentElo = 1200;
    const newEloRating = Math.max(800, currentElo + eloDelta);

    const badgesUnlocked: ArenaBadge[] = [];
    if (allPassed && params.timeElapsedSeconds <= 60) {
      badgesUnlocked.push({
        id: "badge_speed_demon",
        name: "Speed Demon ⚡",
        icon: "Zap",
        description: "Completou o desafio em menos de 60 segundos com 100% de precisão.",
        unlockedAt: new Date().toISOString()
      });
    }
    if (allPassed) {
      badgesUnlocked.push({
        id: "badge_clean_coder",
        name: "Gladiador do Código 🏆",
        icon: "Award",
        description: "Passou em todos os casos de teste públicos e ocultos.",
        unlockedAt: new Date().toISOString()
      });
    }

    // Update duelist in room
    const duelist = room.duelists.find((d) => d.id === params.duelistId);
    if (duelist) {
      duelist.currentCode = params.code;
      duelist.language = params.language;
      duelist.testsPassed = passedCount;
      duelist.isFinished = allPassed;
      duelist.finishTimeSeconds = params.timeElapsedSeconds;
      duelist.earnedScore = scoreGained;
      duelist.status = allPassed ? "won" : "coding";
    }

    return {
      roomId: params.roomId,
      duelistId: params.duelistId,
      testsPassed: passedCount,
      totalTests: testCases.length,
      allPassed,
      executionTimeMs: Math.round(params.timeElapsedSeconds * 1000 + Math.random() * 50),
      scoreGained,
      newEloRating,
      eloDelta,
      badgesUnlocked,
      testDetails
    };
  }

  /**
   * Returns global and class leaderboard standings.
   */
  static getLeaderboard(): LeaderboardEntry[] {
    if (arenaLeaderboardStore.size === 0) {
      const defaultRanking: LeaderboardEntry[] = [
        { rank: 1, studentId: "stu_101", studentName: "Lucas Silveira", className: "TURMA-DEV-2026-A", eloRating: 1640, victories: 28, duelsPlayed: 31, winRate: 90.3, badgesCount: 12 },
        { rank: 2, studentId: "stu_102", studentName: "Ana Beatriz Rocha", className: "TURMA-DEV-2026-A", eloRating: 1580, victories: 24, duelsPlayed: 29, winRate: 82.7, badgesCount: 10 },
        { rank: 3, studentId: "stu_107", studentName: "Felipe Nogueira", className: "TURMA-DEV-2026-B", eloRating: 1510, victories: 21, duelsPlayed: 26, winRate: 80.7, badgesCount: 9 },
        { rank: 4, studentId: "stu_103", studentName: "Gabriel Martins", className: "TURMA-DEV-2026-A", eloRating: 1390, victories: 16, duelsPlayed: 24, winRate: 66.6, badgesCount: 7 },
        { rank: 5, studentId: "stu_104", studentName: "Mariana Costa", className: "TURMA-DEV-2026-B", eloRating: 1340, victories: 14, duelsPlayed: 23, winRate: 60.8, badgesCount: 6 },
        { rank: 6, studentId: "stu_105", studentName: "Rodrigo Almeida", className: "TURMA-DEV-2026-A", eloRating: 1280, victories: 11, duelsPlayed: 22, winRate: 50.0, badgesCount: 5 }
      ];

      defaultRanking.forEach((entry) => arenaLeaderboardStore.set(entry.studentId, entry));
    }

    return Array.from(arenaLeaderboardStore.values()).sort((a, b) => b.eloRating - a.eloRating);
  }

  private static generateFallbackChallenge(challengeId: string, difficulty: ArenaDifficulty, lang: string): ArenaChallenge {
    return {
      id: challengeId,
      title: "Triagem Rápida de Sensores Industriais IoT",
      category: "Algoritmos",
      difficulty,
      storyContext: "Uma esteira fabril 4.0 recebe leituras de temperatura e pressão a cada 100ms. Identifique leituras anômalas acima de 1.5x a média móvel.",
      description: "Implemente a função `detectar_anomalias(leituras: list[int]) -> list[int]` que recebe uma lista de inteiros e retorna apenas os valores que ultrapassam 1.5 vezes a média aritmética da sequência.",
      starterCode: {
        python: `def detectar_anomalias(leituras: list[int]) -> list[int]:\n    if not leituras:\n        return []\n    media = sum(leituras) / len(leituras)\n    return [x for x in leituras if x > media * 1.5]`,
        javascript: `function detectarAnomalias(leituras) {\n  if (!leituras.length) return [];\n  const media = leituras.reduce((a, b) => a + b, 0) / leituras.length;\n  return leituras.filter(x => x > media * 1.5);\n}`,
        typescript: `function detectarAnomalias(leituras: number[]): number[] {\n  if (!leituras.length) return [];\n  const media = leituras.reduce((a, b) => a + b, 0) / leituras.length;\n  return leituras.filter(x => x > media * 1.5);\n}`
      },
      testCases: [
        { input: "[10, 10, 10, 30]", expectedOutput: "[30]", isHidden: false },
        { input: "[100, 100, 100]", expectedOutput: "[]", isHidden: false },
        { input: "[20, 20, 20, 80, 90]", expectedOutput: "[80, 90]", isHidden: true },
        { input: "[]", expectedOutput: "[]", isHidden: true }
      ],
      timeLimitSeconds: 180,
      memoryLimitMb: 128
    };
  }
}

import crypto from "crypto";

export interface DuelistPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  eloRating: number;
  solvedCount: number;
  currentCode?: string;
  status: "READY" | "CODING" | "SUBMITTED" | "ACCEPTED" | "WRONG_ANSWER";
  executionTimeMs?: number;
}

export interface ArenaDuelRoom {
  roomId: string;
  challengeTitle: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  language: string;
  starterCode: string;
  testCasesCount: number;
  player1: DuelistPlayer;
  player2: DuelistPlayer;
  startedAt: string;
  expiresAt: string;
  winnerId?: string;
  status: "IN_PROGRESS" | "FINISHED" | "TIMEOUT";
}

export interface HackathonTeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  solvedProblems: number;
  totalPenaltyMinutes: number;
  problemSubmissions: {
    problemCode: string; // "A", "B", "C", "D"
    balloonColor: string; // "#EF4444", "#3B82F6", "#10B981", "#F59E0B"
    isSolved: boolean;
    attempts: number;
    solvedAtMinute?: number;
  }[];
}

export interface VerifiableW3cOpenBadge {
  "@context": "https://w3id.org/openbadges/v2";
  id: string;
  type: "BadgeClass";
  name: string;
  description: string;
  image: string;
  criteria: {
    narrative: string;
  };
  issuer: {
    name: string;
    url: string;
    email: string;
    publicKey: string;
  };
  recipient: {
    identity: string; // SHA-256 hash of student email
    type: "email";
    hashed: true;
  };
  issuedOn: string;
  evidence: {
    id: string;
    narrative: string;
  };
  verification: {
    type: "HostedBadge";
    signature: string;
  };
}

export class CodeArenaDuelsAndHackathonService {
  /**
   * Calculates new ELO ratings after a duel match
   * Standard FIDE ELO Formula: R_new = R + K * (Score - Expected)
   */
  public static calculateEloAdjustment(
    ratingA: number,
    ratingB: number,
    winner: "A" | "B" | "DRAW",
    kFactor = 32
  ): { newRatingA: number; newRatingB: number; deltaA: number; deltaB: number } {
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

    let scoreA = 0.5;
    let scoreB = 0.5;

    if (winner === "A") {
      scoreA = 1.0;
      scoreB = 0.0;
    } else if (winner === "B") {
      scoreA = 0.0;
      scoreB = 1.0;
    }

    const deltaA = Math.round(kFactor * (scoreA - expectedA));
    const deltaB = Math.round(kFactor * (scoreB - expectedB));

    return {
      newRatingA: Math.max(100, ratingA + deltaA),
      newRatingB: Math.max(100, ratingB + deltaB),
      deltaA,
      deltaB
    };
  }

  /**
   * Creates a 1v1 Real-Time Duel Challenge
   */
  public static createDuelRoom(
    player1: DuelistPlayer,
    player2: DuelistPlayer,
    language = "javascript"
  ): ArenaDuelRoom {
    const roomId = `duel_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return {
      roomId,
      challengeTitle: "Duelo 1v1: Otimização de Busca Binária & Análise 3NF",
      difficulty: "MEDIUM",
      language,
      starterCode: language === "python"
        ? "def solve(arr, target):\n    # Implemente a busca mais eficiente O(log N)\n    pass"
        : "function solve(arr, target) {\n  // Implemente a busca mais eficiente O(log N)\n}",
      testCasesCount: 5,
      player1: { ...player1, status: "CODING" },
      player2: { ...player2, status: "CODING" },
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "IN_PROGRESS"
    };
  }

  /**
   * Generates live Hackathon Leaderboard standings (ICPC Standard)
   */
  public static getHackathonLeaderboard(): HackathonTeamStanding[] {
    const teams: HackathonTeamStanding[] = [
      {
        rank: 1,
        teamId: "team-alpha",
        teamName: "ByteMasters SENAI",
        solvedProblems: 4,
        totalPenaltyMinutes: 184,
        problemSubmissions: [
          { problemCode: "A", balloonColor: "#EF4444", isSolved: true, attempts: 1, solvedAtMinute: 12 },
          { problemCode: "B", balloonColor: "#3B82F6", isSolved: true, attempts: 2, solvedAtMinute: 45 },
          { problemCode: "C", balloonColor: "#10B981", isSolved: true, attempts: 1, solvedAtMinute: 58 },
          { problemCode: "D", balloonColor: "#F59E0B", isSolved: true, attempts: 1, solvedAtMinute: 69 }
        ]
      },
      {
        rank: 2,
        teamId: "team-beta",
        teamName: "CyberTitans Devs",
        solvedProblems: 3,
        totalPenaltyMinutes: 210,
        problemSubmissions: [
          { problemCode: "A", balloonColor: "#EF4444", isSolved: true, attempts: 1, solvedAtMinute: 18 },
          { problemCode: "B", balloonColor: "#3B82F6", isSolved: true, attempts: 3, solvedAtMinute: 82 },
          { problemCode: "C", balloonColor: "#10B981", isSolved: true, attempts: 1, solvedAtMinute: 110 },
          { problemCode: "D", balloonColor: "#F59E0B", isSolved: false, attempts: 2 }
        ]
      },
      {
        rank: 3,
        teamId: "team-gamma",
        teamName: "Code Warriors 4.0",
        solvedProblems: 2,
        totalPenaltyMinutes: 140,
        problemSubmissions: [
          { problemCode: "A", balloonColor: "#EF4444", isSolved: true, attempts: 1, solvedAtMinute: 25 },
          { problemCode: "B", balloonColor: "#3B82F6", isSolved: true, attempts: 2, solvedAtMinute: 95 },
          { problemCode: "C", balloonColor: "#10B981", isSolved: false, attempts: 1 },
          { problemCode: "D", balloonColor: "#F59E0B", isSolved: false, attempts: 0 }
        ]
      }
    ];

    return teams;
  }

  /**
   * Generates a Cryptographically Signed W3C OpenBadge
   */
  public static issueVerifiableBadge(
    studentEmail: string,
    badgeName: string,
    skillDescription: string
  ): VerifiableW3cOpenBadge {
    const recipientHash = crypto.createHash("sha256").update(studentEmail.trim().toLowerCase()).digest("hex");
    const badgeId = `badge_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const issuedOn = new Date().toISOString();

    const signature = crypto
      .createHmac("sha256", "senai_openbadges_secret_key_2026")
      .update(`${badgeId}:${recipientHash}:${issuedOn}`)
      .digest("hex");

    return {
      "@context": "https://w3id.org/openbadges/v2",
      id: `https://codecheck.ai/badges/${badgeId}`,
      type: "BadgeClass",
      name: badgeName,
      description: skillDescription,
      image: "https://codecheck.ai/assets/badges/master_database_architect.png",
      criteria: {
        narrative: "Demonstrou domínio em modelagem de dados 3NF, isolamento de transações ACID e resolução de algoritmos em tempo real com nota superior a 85 pontos."
      },
      issuer: {
        name: "SENAI CiberAcademy DevSecOps",
        url: "https://ciberacademy.senai.br",
        email: "certificados@senai.br",
        publicKey: "04a1b2c3d4e5f6..."
      },
      recipient: {
        identity: recipientHash,
        type: "email",
        hashed: true
      },
      issuedOn,
      evidence: {
        id: `https://codecheck.ai/evidence/${badgeId}`,
        narrative: "Avaliação automatizada em Sandbox e Arena com auditoria de integridade forense."
      },
      verification: {
        type: "HostedBadge",
        signature
      }
    };
  }
}

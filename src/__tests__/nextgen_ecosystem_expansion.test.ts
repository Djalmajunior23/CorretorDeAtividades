import { describe, it, expect } from "vitest";
import { DiagramInteractiveStudioService, VisualDatabaseSchema } from "../services/diagramInteractiveStudioService";
import { CognitiveTwinAndVoiceDefenseService } from "../services/cognitiveTwinAndVoiceDefenseService";
import { CodeArenaDuelsAndHackathonService } from "../services/codeArenaDuelsAndHackathonService";
import { LmsAndOfflineSyncService } from "../services/lmsAndOfflineSyncService";
import { KeystrokeForensicsAndXaiService } from "../services/keystrokeForensicsAndXaiService";

describe("Next-Gen Ecosystem Expansion Test Suite", () => {
  describe("Pilar 1: Diagram Studio, Query Cost & ACID Simulator", () => {
    const mockSchema: VisualDatabaseSchema = {
      id: "schema_1",
      title: "E-Commerce Database",
      sgbd: "postgresql",
      tables: [
        {
          id: "tb_clientes",
          name: "tb_clientes",
          position: { x: 0, y: 0 },
          attributes: [
            { name: "id", type: "UUID", isPrimaryKey: true, isNullable: false },
            { name: "nome", type: "VARCHAR", lengthOrPrecision: "100", isPrimaryKey: false, isNullable: false },
            { name: "email", type: "VARCHAR", isPrimaryKey: false, isNullable: false, isUnique: true, hasIndex: true }
          ]
        },
        {
          id: "tb_pedidos",
          name: "tb_pedidos",
          position: { x: 200, y: 0 },
          attributes: [
            { name: "id", type: "UUID", isPrimaryKey: true, isNullable: false },
            { name: "cliente_id", type: "UUID", isPrimaryKey: false, isForeignKey: true, foreignTable: "tb_clientes", foreignField: "id", isNullable: false, hasIndex: true },
            { name: "valor_total", type: "DECIMAL", lengthOrPrecision: "10,2", isPrimaryKey: false, isNullable: false }
          ]
        }
      ],
      relationships: [
        {
          id: "rel_1",
          sourceTable: "tb_pedidos",
          sourceField: "cliente_id",
          targetTable: "tb_clientes",
          targetField: "id",
          cardinality: "1:N"
        }
      ]
    };

    it("should convert visual database schema to valid Mermaid ERD syntax", () => {
      const mermaid = DiagramInteractiveStudioService.schemaToMermaid(mockSchema);
      expect(mermaid).toContain("erDiagram");
      expect(mermaid).toContain("tb_clientes {");
      expect(mermaid).toContain("uuid id PK");
      expect(mermaid).toContain("tb_pedidos ||--o{ tb_clientes");
    });

    it("should generate production-ready DDL SQL with indexes and foreign keys", () => {
      const ddl = DiagramInteractiveStudioService.generateProductionDdl(mockSchema);
      expect(ddl).toContain("CREATE TABLE IF NOT EXISTS tb_clientes");
      expect(ddl).toContain("CREATE INDEX IF NOT EXISTS idx_tb_clientes_email");
      expect(ddl).toContain("ALTER TABLE tb_pedidos ADD CONSTRAINT fk_tb_pedidos_tb_clientes_cliente_id");
    });

    it("should simulate low-cost Index Scan when filter column is indexed", () => {
      const plan = DiagramInteractiveStudioService.simulateQueryPlanCost(mockSchema, "tb_pedidos", "cliente_id");
      expect(plan.scanType).toContain("Index");
      expect(plan.costScore).toBeLessThan(100);
      expect(plan.bottlenecksIdentified).toHaveLength(0);
    });

    it("should detect Seq Scan bottleneck and suggest index DDL on unindexed columns", () => {
      const plan = DiagramInteractiveStudioService.simulateQueryPlanCost(mockSchema, "tb_pedidos", "valor_total");
      expect(plan.scanType).toContain("Seq Scan");
      expect(plan.costScore).toBeGreaterThan(5000);
      expect(plan.suggestedIndexSql).toContain("CREATE INDEX idx_tb_pedidos_valor_total");
    });

    it("should simulate ACID anomalies for READ UNCOMMITTED and verify SERIALIZABLE safety", () => {
      const uncommitted = DiagramInteractiveStudioService.simulateAcidConcurrency("READ UNCOMMITTED", "pedidos");
      expect(uncommitted.isSafe).toBe(false);
      expect(uncommitted.steps.some(s => s.anomalyDetected === "Dirty Read")).toBe(true);

      const serializable = DiagramInteractiveStudioService.simulateAcidConcurrency("SERIALIZABLE", "pedidos");
      expect(serializable.isSafe).toBe(true);
    });
  });

  describe("Pilar 2: Cognitive Twin, Self-Healing & Voice Defense", () => {
    it("should calculate memory retention decay using Ebbinghaus exponential curve", () => {
      const todayIso = new Date().toISOString();
      const retentionToday = CognitiveTwinAndVoiceDefenseService.calculateEbbinghausRetention(todayIso);
      expect(retentionToday).toBe(100);

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const retentionPast = CognitiveTwinAndVoiceDefenseService.calculateEbbinghausRetention(sevenDaysAgo);
      expect(retentionPast).toBeLessThan(50);
    });

    it("should update Bayesian Knowledge Tracing probability on student success and failure", () => {
      const initialP = 0.50;
      const onCorrect = CognitiveTwinAndVoiceDefenseService.updateBktKnowledge(initialP, true);
      expect(onCorrect).toBeGreaterThan(initialP);

      const onWrong = CognitiveTwinAndVoiceDefenseService.updateBktKnowledge(initialP, false);
      expect(onWrong).toBeLessThan(initialP);
    });

    it("should generate a Cognitive Twin Profile and Self-Healing Path", () => {
      const profile = CognitiveTwinAndVoiceDefenseService.getCognitiveTwinProfile("student_123", "João Silva");
      expect(profile.studentId).toBe("student_123");
      expect(profile.competencies.length).toBeGreaterThanOrEqual(3);

      const healingPath = CognitiveTwinAndVoiceDefenseService.generateSelfHealingPath("student_123", "Normalização 3NF");
      expect(healingPath.steps.length).toBeGreaterThanOrEqual(2);
      expect(healingPath.steps[0].interactiveMicroQuiz).toBeDefined();
    });

    it("should evaluate oral defense speech transcription and assess technical fluency", () => {
      const speech = "Decidi criar a chave estrangeira cliente_id na tabela tb_pedido para garantir a integridade referencial, e apliquei a 3FN separando endereços para evitar redundâncias e anomalias de atualização.";
      const evaluation = CognitiveTwinAndVoiceDefenseService.evaluateVoiceOralDefense("student_123", "Defesa 3NF", speech);

      expect(evaluation.metrics.technicalVocabularyScore).toBeGreaterThanOrEqual(60);
      expect(evaluation.overallVerdict).toContain("APROVADO");
      expect(evaluation.socraticFollowUpQuestion).toBeDefined();
    });
  });

  describe("Pilar 3: Code Arena, ELO Calculations & W3C OpenBadges", () => {
    it("should adjust ELO ratings according to FIDE formula", () => {
      const ratingA = 1200;
      const ratingB = 1200;
      const result = CodeArenaDuelsAndHackathonService.calculateEloAdjustment(ratingA, ratingB, "A");

      expect(result.newRatingA).toBe(1216);
      expect(result.newRatingB).toBe(1184);
      expect(result.deltaA).toBe(16);
      expect(result.deltaB).toBe(-16);
    });

    it("should create a 1v1 Arena Duel room with starter code", () => {
      const p1 = { id: "p1", name: "Alice", eloRating: 1350, solvedCount: 12, status: "READY" as const };
      const p2 = { id: "p2", name: "Bob", eloRating: 1320, solvedCount: 10, status: "READY" as const };

      const room = CodeArenaDuelsAndHackathonService.createDuelRoom(p1, p2, "python");
      expect(room.roomId).toContain("duel_");
      expect(room.starterCode).toContain("def solve");
      expect(room.status).toBe("IN_PROGRESS");
    });

    it("should issue cryptographically signed W3C OpenBadges", () => {
      const badge = CodeArenaDuelsAndHackathonService.issueVerifiableBadge("aluno@senai.br", "Master Database Architect", "Domínio comprovado em 3NF e ACID");
      expect(badge["@context"]).toBe("https://w3id.org/openbadges/v2");
      expect(badge.recipient.hashed).toBe(true);
      expect(badge.verification.signature).toHaveLength(64);
    });
  });

  describe("Pilar 4: LMS (LTI 1.3), Webhooks & Offline Sync", () => {
    it("should dispatch LTI 1.3 AGS grade passback", async () => {
      const result = await LmsAndOfflineSyncService.dispatchLtiGradePassback({
        assignmentId: "lab_1",
        studentLtiUserId: "lti_user_42",
        scoreGiven: 90,
        scoreMaximum: 100,
        activityProgress: "COMPLETED",
        gradingProgress: "FULLY_GRADED",
        timestamp: new Date().toISOString()
      });

      expect(result.success).toBe(true);
      expect(result.ltiStatus).toBe(200);
    });

    it("should sign Webhook payloads with HMAC-SHA256 headers", () => {
      const signed = LmsAndOfflineSyncService.signWebhookPayload({
        eventId: "evt_100",
        eventType: "exam.graded",
        data: { studentId: "s1", grade: 95 },
        timestamp: new Date().toISOString()
      });

      expect(signed.headers["X-Hub-Signature-256"]).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(signed.headers["X-Event-Type"]).toBe("exam.graded");
    });
  });

  describe("Pilar 5: Keystroke Forensics, XAI & Dropout Risk", () => {
    it("should detect authentic human typing dynamics and compute WPM", () => {
      const keystrokes = [
        { key: "c", type: "keydown" as const, timestamp: 100 },
        { key: "o", type: "keydown" as const, timestamp: 220 },
        { key: "n", type: "keydown" as const, timestamp: 350 },
        { key: "s", type: "keydown" as const, timestamp: 490 },
        { key: "t", type: "keydown" as const, timestamp: 600 }
      ];

      const result = KeystrokeForensicsAndXaiService.analyzeKeystrokeDynamics("student_1", keystrokes, 5);
      expect(result.authorshipConfidencePercent).toBeGreaterThanOrEqual(80);
      expect(result.forensicVerdict).toBe("AUTORIA_HUMANA_LEGITIMA");
    });

    it("should generate Explainable AI (XAI) annotations on code snippets", () => {
      const code = "for (let i=0; i<n; i++) { for (let j=0; j<n; j++) {} }\nconst q = 'SELECT * FROM users';";
      const annotations = KeystrokeForensicsAndXaiService.generateXaiCodeAnnotations(code);

      expect(annotations.some(a => a.title.includes("O(N²)"))).toBe(true);
      expect(annotations.some(a => a.title.includes("SELECT *"))).toBe(true);
    });

    it("should evaluate dropout risk and suggest immediate intervention when grade < 60", () => {
      const diagnostic = KeystrokeForensicsAndXaiService.evaluateDropoutRisk("student_risk", "Aluno Alerta", 45, 68, 5.0);
      expect(diagnostic.riskLevel).toBe("CRITICO_INTERVENCAO_IMEDIATA");
      expect(diagnostic.riskScore).toBeGreaterThanOrEqual(70);
      expect(diagnostic.recommendedIntervention).toContain("Plano de Recuperação Individual");
    });
  });
});

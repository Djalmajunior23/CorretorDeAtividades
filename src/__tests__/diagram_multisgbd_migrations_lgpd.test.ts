import { describe, it, expect } from "vitest";
import { DatabaseModelAssessmentService } from "../services/databaseModelAssessmentService";

describe("Database Modeling Suite: Multi-SGBD Converter, 3FN Migrations & LGPD Privacy Governance", () => {
  describe("Multi-SGBD DDL Converter", () => {
    it("should convert ER model or DDL to 5 native SGBD dialects with FK indexes and audit triggers", async () => {
      const sampleDdl = `
        CREATE TABLE tb_pedido (
          id UUID PRIMARY KEY,
          cliente_id UUID NOT NULL,
          total NUMERIC(12,2) NOT NULL,
          data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const result = await DatabaseModelAssessmentService.convertModelToMultiSgbd({
        modelCode: sampleDdl
      });

      expect(result).toBeDefined();
      expect(result.postgresql).toBeDefined();
      expect(result.mysql).toBeDefined();
      expect(result.oracle).toBeDefined();
      expect(result.sqlserver).toBeDefined();
      expect(result.sqlite).toBeDefined();

      expect(result.foreignKeyIndexes.length).toBeGreaterThan(0);
      expect(result.auditTriggers.length).toBeGreaterThan(0);
      expect(result.recommendedCollation).toBeDefined();
    });
  });

  describe("3FN Migrations Generator (Flyway / Liquibase)", () => {
    it("should generate V1 legacy, V2 3FN refactored schema, data migration SQL, and rollback", async () => {
      const unnormalizedCode = `
        CREATE TABLE tb_pedido_legado (
          id INT PRIMARY KEY,
          cliente_nome VARCHAR(100),
          cliente_email VARCHAR(100),
          cliente_cidade VARCHAR(100),
          cliente_estado VARCHAR(2),
          total NUMERIC(10,2)
        );
      `;

      const migrations = await DatabaseModelAssessmentService.generateRefactored3fnMigrations({
        unnormalizedCode
      });

      expect(migrations).toBeDefined();
      expect(migrations.migrationTool).toBe("Flyway");
      expect(migrations.v1InitialSchema).toBeDefined();
      expect(migrations.v2Refactor3fnSchema).toBeDefined();
      expect(migrations.dataMigrationSql).toBeDefined();
      expect(migrations.downRollbackSql).toBeDefined();
      expect(migrations.breakingChangesNotes.length).toBeGreaterThan(0);
    });
  });

  describe("LGPD Privacy & Data Governance Audit", () => {
    it("should scan schema for PIIs, calculate compliance score, and flag missing Soft Delete/Consent", async () => {
      const schemaWithPii = `
        CREATE TABLE tb_usuario (
          id UUID PRIMARY KEY,
          nome VARCHAR(150),
          cpf VARCHAR(14) NOT NULL,
          email VARCHAR(100) NOT NULL,
          telefone VARCHAR(20),
          salario NUMERIC(10,2),
          biometria_hash TEXT,
          endereco_completo VARCHAR(255)
        );
      `;

      const audit = await DatabaseModelAssessmentService.auditDataPrivacyGovernance({
        ddlOrMermaid: schemaWithPii
      });

      expect(audit).toBeDefined();
      expect(audit.complianceScore).toBeGreaterThanOrEqual(0);
      expect(audit.complianceScore).toBeLessThanOrEqual(100);
      expect(audit.piiFindings.length).toBeGreaterThanOrEqual(3);

      const hasCpf = audit.piiFindings.some(f => f.columnName.toLowerCase().includes("cpf") || f.piiCategory === "CPF/Documento");
      expect(hasCpf).toBe(true);

      expect(audit.retentionPolicyAudit).toBeDefined();
      expect(audit.retentionPolicyAudit.recommendations.length).toBeGreaterThan(0);
    });
  });
});

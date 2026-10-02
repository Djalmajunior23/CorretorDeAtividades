import { IsomorphicCrypto as crypto } from "../utils/isomorphicCrypto";

export interface VisualEntityAttribute {
  name: string;
  type: "VARCHAR" | "INTEGER" | "BIGINT" | "DECIMAL" | "BOOLEAN" | "TIMESTAMP" | "UUID" | "TEXT" | "JSONB";
  lengthOrPrecision?: string;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  foreignTable?: string;
  foreignField?: string;
  isNullable: boolean;
  isUnique?: boolean;
  hasIndex?: boolean;
  indexType?: "BTREE" | "HASH" | "GIN" | "GIST";
}

export interface VisualEntityTable {
  id: string;
  name: string;
  description?: string;
  position: { x: number; y: number };
  attributes: VisualEntityAttribute[];
}

export interface VisualRelationship {
  id: string;
  sourceTable: string;
  sourceField: string;
  targetTable: string;
  targetField: string;
  cardinality: "1:1" | "1:N" | "N:M";
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
  onUpdate?: "CASCADE" | "RESTRICT";
}

export interface VisualDatabaseSchema {
  id: string;
  title: string;
  sgbd: "postgresql" | "mysql" | "oracle" | "sqlserver";
  tables: VisualEntityTable[];
  relationships: VisualRelationship[];
}

export interface QueryPlanCostResult {
  query: string;
  targetTable: string;
  estimatedRows: number;
  scanType: "Seq Scan (Full Table Scan)" | "Index Scan" | "Index Only Scan" | "Bitmap Index Scan";
  costScore: number;
  executionTimeMsEstimated: number;
  recommendation: string;
  bottlenecksIdentified: string[];
  suggestedIndexSql?: string;
}

export interface AcidSimulationStep {
  stepIndex: number;
  transactionA: string;
  transactionB: string;
  state: string;
  anomalyDetected?: "Dirty Read" | "Non-Repeatable Read" | "Phantom Read" | "Deadlock" | "None (Serializable Safe)";
  explanation: string;
}

export interface AcidSimulationResult {
  isolationLevel: "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE";
  scenarioName: string;
  targetTable: string;
  steps: AcidSimulationStep[];
  isSafe: boolean;
  mitigationAdvice: string;
}

export class DiagramInteractiveStudioService {
  /**
   * Converts a visual database schema to standard Mermaid ERD syntax
   */
  public static schemaToMermaid(schema: VisualDatabaseSchema): string {
    const lines: string[] = ["erDiagram"];

    for (const table of schema.tables) {
      lines.push(`    ${table.name} {`);
      for (const attr of table.attributes) {
        const pkFkTag = attr.isPrimaryKey ? "PK" : attr.isForeignKey ? "FK" : "";
        const typeStr = attr.type.toLowerCase();
        lines.push(`        ${typeStr} ${attr.name} ${pkFkTag}`.trim());
      }
      lines.push("    }");
    }

    for (const rel of schema.relationships) {
      let relSymbol = "||--o{"; // default 1:N
      if (rel.cardinality === "1:1") relSymbol = "||--||";
      if (rel.cardinality === "N:M") relSymbol = "}o--o{";
      lines.push(`    ${rel.sourceTable} ${relSymbol} ${rel.targetTable} : "relaciona"`);
    }

    return lines.join("\n");
  }

  /**
   * Generates production DDL SQL for PostgreSQL, MySQL, Oracle, or SQL Server
   */
  public static generateProductionDdl(schema: VisualDatabaseSchema): string {
    const ddlLines: string[] = [
      `-- ============================================================================`,
      `-- SCRIPT DDL GERADO AUTOMATICAMENTE PELO CIBERACADEMY / CODECHECK STUDIO`,
      `-- SGBD ALVO: ${schema.sgbd.toUpperCase()} | DATA: ${new Date().toISOString()}`,
      `-- ============================================================================`,
      ""
    ];

    for (const table of schema.tables) {
      ddlLines.push(`CREATE TABLE IF NOT EXISTS ${table.name} (`);
      const attrDefs: string[] = [];

      for (const attr of table.attributes) {
        let typeStr: string = attr.type;
        if (attr.lengthOrPrecision) {
          typeStr += `(${attr.lengthOrPrecision})`;
        } else if (attr.type === "VARCHAR") {
          typeStr = "VARCHAR(255)";
        }

        let line = `    ${attr.name} ${typeStr}`;
        if (!attr.isNullable) line += " NOT NULL";
        if (attr.isPrimaryKey) line += " PRIMARY KEY";
        if (attr.isUnique && !attr.isPrimaryKey) line += " UNIQUE";

        attrDefs.push(line);
      }

      ddlLines.push(attrDefs.join(",\n"));
      ddlLines.push(");");
      ddlLines.push("");

      // Indexes
      for (const attr of table.attributes) {
        if (attr.hasIndex && !attr.isPrimaryKey) {
          const indexName = `idx_${table.name}_${attr.name}`;
          const method = attr.indexType ? ` USING ${attr.indexType}` : "";
          ddlLines.push(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${table.name}${method} (${attr.name});`);
        }
      }
      ddlLines.push("");
    }

    // Foreign Keys
    for (const rel of schema.relationships) {
      const fkName = `fk_${rel.sourceTable}_${rel.targetTable}_${rel.sourceField}`;
      const onDel = rel.onDelete ? ` ON DELETE ${rel.onDelete}` : " ON DELETE RESTRICT";
      const onUpd = rel.onUpdate ? ` ON UPDATE ${rel.onUpdate}` : " ON UPDATE CASCADE";

      ddlLines.push(
        `ALTER TABLE ${rel.sourceTable} ADD CONSTRAINT ${fkName} ` +
        `FOREIGN KEY (${rel.sourceField}) REFERENCES ${rel.targetTable}(${rel.targetField})${onDel}${onUpd};`
      );
    }

    return ddlLines.join("\n");
  }

  /**
   * Virtual Query Execution Plan Simulator (Estimates EXPLAIN ANALYZE Cost on 1M virtual rows)
   */
  public static simulateQueryPlanCost(
    schema: VisualDatabaseSchema,
    tableName: string,
    filterColumn: string,
    queryType: "EQUALITY" | "RANGE" | "JOIN" = "EQUALITY"
  ): QueryPlanCostResult {
    const table = schema.tables.find((t) => t.name.toLowerCase() === tableName.toLowerCase());
    const attr = table?.attributes.find((a) => a.name.toLowerCase() === filterColumn.toLowerCase());

    const hasIndex = attr?.isPrimaryKey || attr?.hasIndex || attr?.isForeignKey;
    const estimatedRows = 1_000_000;

    if (hasIndex) {
      const scanType = attr?.isPrimaryKey ? "Index Only Scan" : "Index Scan";
      const costScore = queryType === "RANGE" ? 14.5 : 4.2;
      const executionTimeMsEstimated = queryType === "RANGE" ? 1.8 : 0.4;

      return {
        query: `SELECT * FROM ${tableName} WHERE ${filterColumn} = ?;`,
        targetTable: tableName,
        estimatedRows,
        scanType,
        costScore,
        executionTimeMsEstimated,
        recommendation: `Ótimo desempenho! A coluna '${filterColumn}' utiliza índice estruturado (${attr?.indexType || "BTREE"}), minimizando I/O de disco.`,
        bottlenecksIdentified: []
      };
    } else {
      const scanType = "Seq Scan (Full Table Scan)";
      const costScore = queryType === "RANGE" ? 18500.0 : 12450.0;
      const executionTimeMsEstimated = queryType === "RANGE" ? 245.0 : 180.0;
      const suggestedSql = `CREATE INDEX idx_${tableName}_${filterColumn} ON ${tableName} (${filterColumn});`;

      return {
        query: `SELECT * FROM ${tableName} WHERE ${filterColumn} = ?;`,
        targetTable: tableName,
        estimatedRows,
        scanType,
        costScore,
        executionTimeMsEstimated,
        recommendation: `Alerta de Performance Crítica! A consulta executa varredura sequencial completa (Seq Scan) em 1.000.000 de registros.`,
        bottlenecksIdentified: [
          `Ausência de índice na coluna de filtro '${filterColumn}'`,
          `Alto consumo de buffer cache e latência de I/O elevada (> 150ms)`,
          `Risco de lock de leitura sob alta concorrência`
        ],
        suggestedIndexSql: suggestedSql
      };
    }
  }

  /**
   * ACID & Concurrency Anomaly Simulator
   */
  public static simulateAcidConcurrency(
    isolationLevel: "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE",
    targetTable = "pedidos"
  ): AcidSimulationResult {
    const steps: AcidSimulationStep[] = [];
    let anomaly: "Dirty Read" | "Non-Repeatable Read" | "Phantom Read" | "Deadlock" | "None (Serializable Safe)" = "None (Serializable Safe)";
    let isSafe = true;

    if (isolationLevel === "READ UNCOMMITTED") {
      anomaly = "Dirty Read";
      isSafe = false;
      steps.push(
        {
          stepIndex: 1,
          transactionA: `BEGIN; UPDATE ${targetTable} SET status = 'PAGO' WHERE id = 100; (Não comitou)`,
          transactionB: `BEGIN; -- Aguardando`,
          state: "Tx A realizou alteração na memória sem COMMIT.",
          explanation: "Transação A modificou o registro mas pode dar ROLLBACK."
        },
        {
          stepIndex: 2,
          transactionA: `-- Processando...`,
          transactionB: `SELECT status FROM ${targetTable} WHERE id = 100; -- Leu 'PAGO'`,
          state: "Tx B leu dado não comitado (Dirty Read).",
          anomalyDetected: "Dirty Read",
          explanation: "Tx B tomou decisão com base em dado não persistido que pode ser cancelado."
        },
        {
          stepIndex: 3,
          transactionA: `ROLLBACK; -- Operação cancelada`,
          transactionB: `COMMIT;`,
          state: "Inconsistência consumada.",
          explanation: "Tx B operou com valor fantasma que nunca existiu no disco."
        }
      );
    } else if (isolationLevel === "READ COMMITTED") {
      anomaly = "Non-Repeatable Read";
      isSafe = false;
      steps.push(
        {
          stepIndex: 1,
          transactionA: `BEGIN; SELECT saldo FROM contas WHERE id = 1; -- Leu R$ 1.000`,
          transactionB: `BEGIN;`,
          state: "Tx A inicia leitura de saldo.",
          explanation: "Saldo capturado inicialmente como R$ 1.000."
        },
        {
          stepIndex: 2,
          transactionA: `-- Trabalhando...`,
          transactionB: `UPDATE contas SET saldo = 200 WHERE id = 1; COMMIT;`,
          state: "Tx B altera e comita novo saldo.",
          explanation: "Tx B persistiu nova alteração com sucesso."
        },
        {
          stepIndex: 3,
          transactionA: `SELECT saldo FROM contas WHERE id = 1; -- Leu R$ 200!`,
          transactionB: `END;`,
          state: "Tx A leu dois valores diferentes na mesma transação (Non-Repeatable Read).",
          anomalyDetected: "Non-Repeatable Read",
          explanation: "A mesma query gerou resultados discrepantes dentro da mesma transação Tx A."
        }
      );
    } else if (isolationLevel === "REPEATABLE READ") {
      anomaly = "Phantom Read";
      isSafe = true;
      steps.push(
        {
          stepIndex: 1,
          transactionA: `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ; SELECT COUNT(*) FROM ${targetTable} WHERE valor > 500; -- Leu 5`,
          transactionB: `BEGIN;`,
          state: "Tx A gera snapshot consistente.",
          explanation: "Snapshot MVCC isolado garante leituras repetíveis."
        },
        {
          stepIndex: 2,
          transactionA: `-- Processando regras...`,
          transactionB: `INSERT INTO ${targetTable} (valor) VALUES (800); COMMIT;`,
          state: "Tx B inseriu nova linha compatível com o filtro.",
          explanation: "Linha comitada externamente."
        },
        {
          stepIndex: 3,
          transactionA: `SELECT COUNT(*) FROM ${targetTable} WHERE valor > 500; -- Continua lendo 5!`,
          transactionB: `END;`,
          state: "Snapshot MVCC preservado. Protegido contra Leitura Fantasma.",
          anomalyDetected: "None (Serializable Safe)",
          explanation: "Repeatable Read no PostgreSQL utiliza MVCC e previne Phantom Reads."
        }
      );
    } else {
      // SERIALIZABLE
      isSafe = true;
      steps.push(
        {
          stepIndex: 1,
          transactionA: `BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;`,
          transactionB: `BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;`,
          state: "Ambas as transações em modo Serializável estrito (SSI - Serializable Snapshot Isolation).",
          explanation: "O motor de lock de predicados monitora dependências de leitura/escrita."
        },
        {
          stepIndex: 2,
          transactionA: `UPDATE ${targetTable} SET total = 500 WHERE tipo = 'A';`,
          transactionB: `UPDATE ${targetTable} SET total = 900 WHERE tipo = 'B';`,
          state: "Operações concorrentes sem interseção de predicado.",
          explanation: "Nenhum conflito de serialização detectado."
        },
        {
          stepIndex: 3,
          transactionA: `COMMIT;`,
          transactionB: `COMMIT;`,
          state: "Execução serializável concluída com integridade matemática 100%.",
          anomalyDetected: "None (Serializable Safe)",
          explanation: "Garantia absoluta de consistência ACID sem anomalias concorrentes."
        }
      );
    }

    return {
      isolationLevel,
      scenarioName: `Simulação de Concorrência ACID em '${targetTable}'`,
      targetTable,
      steps,
      isSafe,
      mitigationAdvice: isSafe
        ? "Excelente! O nível de isolamento configurado protege contra as principais anomalias de concorrência."
        : `Recomendado elevar o nível de isolamento para 'REPEATABLE READ' ou 'SERIALIZABLE', ou utilizar 'SELECT ... FOR UPDATE' para bloqueio pessimista explícito.`
    };
  }
}

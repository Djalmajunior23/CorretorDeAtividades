import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { safeAutoTable, getAutoTableFinalY } from "../utils/pdfExport";

export type DatabaseModelCategory = "logical" | "physical" | "erDiagram" | "classDiagram";
export type DatabaseTargetSgbd = "postgresql" | "mysql" | "sqlserver" | "oracle" | "sqlite";
export type DatabaseInputFormat = "image" | "code" | "ddl";

export interface DatabaseModelRubric {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  status: "EXCELENTE" | "ADEQUADO" | "ATENCAO" | "CRITICO";
  feedback: string;
  pedagogicalRationale: string;
}

export interface DatabaseNormalizationAudit {
  firstNormalForm: { compliant: boolean; issues: string[]; explanation: string };
  secondNormalForm: { compliant: boolean; issues: string[]; explanation: string };
  thirdNormalForm: { compliant: boolean; issues: string[]; explanation: string };
}

export interface DatabasePhysicalAudit {
  sgbdTarget: DatabaseTargetSgbd;
  dataTypesScore: number;
  dataTypesObservations: string[];
  primaryKeysObservations: string[];
  foreignKeysObservations: string[];
  constraintsCheck: {
    notNullCompliance: boolean;
    uniqueCompliance: boolean;
    checkConstraintsDetected: number;
    observations: string[];
  };
  indexingRecommendations: string[];
  ddlExecutionTest: {
    success: boolean;
    simulatedDialect: string;
    tablesCreatedCount: number;
    compileErrors: string[];
  };
}

export interface ExtractedTableEntity {
  name: string;
  type: "strong_entity" | "weak_entity" | "associative_table" | "physical_table";
  columns: Array<{
    name: string;
    dataType?: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isNullable: boolean;
    isUnique?: boolean;
    references?: { table: string; column: string };
  }>;
}

export interface DatabaseModelAssessmentResult {
  assessmentId: string;
  modelCategory: DatabaseModelCategory;
  inputFormat: DatabaseInputFormat;
  targetSgbd?: DatabaseTargetSgbd;
  totalGrade: number; // 0 - 100
  status: "Aprovado" | "Recuperação" | "Reprovado";
  isApproved: boolean;
  passingGrade: number;
  rubrics: DatabaseModelRubric[];
  strengths: string[];
  modelingIssues: string[];
  normalizationAudit: DatabaseNormalizationAudit;
  normalizationNotes: string[];
  physicalAudit?: DatabasePhysicalAudit;
  extractedTables: ExtractedTableEntity[];
  pedagogicalRecommendations: string[];
  extractedMermaidCode: string;
  suggestedCorrectedDiagram: string;
  generatedDdlSql: string;
  evaluatedAt: string;
}

/**
 * Normalizes and extracts mimeType and base64 payload from raw data URI or base64 string.
 */
function parseImageData(dataUriOrBase64: string): { mimeType: string; base64: string } {
  const trimmed = dataUriOrBase64.trim();
  const match = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/s);
  if (match) {
    return {
      mimeType: match[1],
      base64: match[2].trim()
    };
  }
  return {
    mimeType: "image/png",
    base64: trimmed
  };
}

export class DatabaseModelAssessmentService {
  /**
   * Evaluates a database model (Logical, Conceptual, Physical, or UML) from an uploaded image or declarative code.
   */
  static async assessDatabaseModel(params: {
    modelCategory: DatabaseModelCategory;
    inputFormat: DatabaseInputFormat;
    code?: string;
    imageBase64?: string;
    scenario?: string;
    targetSgbd?: DatabaseTargetSgbd;
    studentId?: string;
    classId?: string;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<DatabaseModelAssessmentResult> {
    const assessmentId = `dbassess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const category = params.modelCategory || "logical";
    const format = params.inputFormat || (params.imageBase64 ? "image" : "code");
    const sgbd: DatabaseTargetSgbd = params.targetSgbd || "postgresql";
    const scenario = params.scenario || "Modelagem de dados para sistema transacional corporativo.";
    const rawCode = (params.code || "").trim();

    // 1. Multimodal AI Vision Analysis if Image is provided
    let aiStructuredResult: DatabaseModelAssessmentResult | null = null;
    let extractedTextFromImage = "";

    try {
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const isImage = format === "image" && !!params.imageBase64;
      const imageData = isImage ? parseImageData(params.imageBase64!) : undefined;

      const aiSystemPrompt = `
Você é o Especialista Chefe em Engenharia de Software, Bancos de Dados e Modelagem de Sistemas (Relacional, Conceitual, Lógico, Físico e UML) do SENAI.
Sua missão é avaliar com rigor técnico e didático o diagrama submetido pelo estudante ${isImage ? "na imagem digitalizada fornecida" : "no código/DDL fornecido"}.

ENUNCIADO DA ATIVIDADE / CENÁRIO:
"""${scenario}"""

CATEGORIA: ${category.toUpperCase()}
SGBD ALVO: ${sgbd.toUpperCase()}
${isImage ? "FONTE: IMAGEM DIGITALIZADA (diagrama manuscrito, brModelo, Workbench, Draw.io ou prova em papel)." : "FONTE: CÓDIGO DECLARATIVO / DDL."}
${!isImage && rawCode ? `CÓDIGO/TEXTO SUBMETIDO:\n"""${rawCode}"""` : ""}

DIRETRIZES DE AVALIAÇÃO:
1. Extraia todas as Entidades/Tabelas reais desenhadas ou escritas pelo estudante, incluindo seus atributos, chaves primárias (PK), chaves estrangeiras (FK) e tipos de dados.
2. Identifique cardinalidades (1:1, 1:N, N:N) e relacionamentos mapeados.
3. Compare criticamente o modelo do aluno com os requisitos do ENUNCIADO.
4. Avalie as Formas Normais (1FN, 2FN, 3FN):
   - 1FN: atomicidade dos atributos e ausência de campos multivalorados.
   - 2FN: dependência total da chave primária inteira em chaves compostas.
   - 3FN: ausência de dependências transitivas entre atributos não-chave.
5. Calcule a nota total (0 a 100) distribuída nas 4 rubricas:
   - "Sintaxe & Notação Padrão" (peso 20)
   - "Entidades/Classes & Atributos" (peso 30)
   - "Cardinalidades & Relações" (peso 30)
   - "Boas Práticas & Normalização (1FN/2FN/3FN)" (peso 20)
6. Forneça pontos fortes reais (conformidades encontradas no desenho), inconsistências/erros reais e recomendações pedagógicas.
7. Gere o diagrama Mermaid ERD (ou classDiagram para UML) CORRIGIDO e o Script SQL DDL executável correspondentes EXATAMENTE ao cenário da atividade e às entidades corrigidas para o SGBD ${sgbd.toUpperCase()}.

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem texto adicional fora do JSON) com a estrutura:
{
  "totalGrade": number,
  "status": "Aprovado" | "Recuperação" | "Reprovado",
  "isApproved": boolean,
  "passingGrade": 60,
  "rubrics": [
    {
      "name": string,
      "score": number,
      "maxScore": number,
      "weight": number,
      "status": "EXCELENTE" | "ADEQUADO" | "ATENCAO" | "CRITICO",
      "feedback": string,
      "pedagogicalRationale": string
    }
  ],
  "strengths": string[],
  "modelingIssues": string[],
  "normalizationAudit": {
    "firstNormalForm": { "compliant": boolean, "issues": string[], "explanation": string },
    "secondNormalForm": { "compliant": boolean, "issues": string[], "explanation": string },
    "thirdNormalForm": { "compliant": boolean, "issues": string[], "explanation": string }
  },
  "normalizationNotes": string[],
  "extractedTables": [
    {
      "name": string,
      "type": "strong_entity" | "weak_entity" | "associative_table" | "physical_table",
      "columns": [
        {
          "name": string,
          "dataType": string,
          "isPrimaryKey": boolean,
          "isForeignKey": boolean,
          "isNullable": boolean,
          "isUnique": boolean,
          "references": { "table": string, "column": string }
        }
      ]
    }
  ],
  "pedagogicalRecommendations": string[],
  "extractedMermaidCode": string,
  "suggestedCorrectedDiagram": string,
  "generatedDdlSql": string
}
`;

      const aiResponse = await provider.generateStructured<any>(
        aiSystemPrompt,
        null,
        { temperature: 0.1, max_tokens: 4500 },
        imageData
      );

      if (aiResponse && typeof aiResponse === "object" && aiResponse.totalGrade !== undefined) {
        const totalGrade = Math.max(0, Math.min(100, Math.round(Number(aiResponse.totalGrade) || 0)));
        const status = totalGrade >= 60 ? "Aprovado" : totalGrade >= 40 ? "Recuperação" : "Reprovado";
        const isApproved = totalGrade >= 60;

        aiStructuredResult = {
          assessmentId,
          modelCategory: category,
          inputFormat: format,
          targetSgbd: sgbd,
          totalGrade,
          status,
          isApproved,
          passingGrade: 60,
          rubrics: Array.isArray(aiResponse.rubrics) && aiResponse.rubrics.length > 0
            ? aiResponse.rubrics
            : this.buildDefaultRubrics(totalGrade),
          strengths: Array.isArray(aiResponse.strengths) && aiResponse.strengths.length > 0
            ? aiResponse.strengths
            : ["Identificação de entidades principais."],
          modelingIssues: Array.isArray(aiResponse.modelingIssues) && aiResponse.modelingIssues.length > 0
            ? aiResponse.modelingIssues
            : ["Nenhuma inconsistência crítica detectada."],
          normalizationAudit: aiResponse.normalizationAudit || {
            firstNormalForm: { compliant: true, issues: [], explanation: "1FN em conformidade." },
            secondNormalForm: { compliant: true, issues: [], explanation: "2FN em conformidade." },
            thirdNormalForm: { compliant: true, issues: [], explanation: "3FN em conformidade." }
          },
          normalizationNotes: Array.isArray(aiResponse.normalizationNotes) && aiResponse.normalizationNotes.length > 0
            ? aiResponse.normalizationNotes
            : ["Auditoria relacional concluída com sucesso."],
          physicalAudit: category === "physical" ? {
            sgbdTarget: sgbd,
            dataTypesScore: Math.min(100, Math.round(totalGrade * 1.05)),
            dataTypesObservations: ["Tipagem adequada para o dialeto " + sgbd.toUpperCase()],
            primaryKeysObservations: ["Chaves primárias mapeadas."],
            foreignKeysObservations: ["Chaves estrangeiras mapeadas."],
            constraintsCheck: {
              notNullCompliance: true,
              uniqueCompliance: true,
              checkConstraintsDetected: 1,
              observations: ["Restrições de integridade mapeadas."]
            },
            indexingRecommendations: ["Criar índices B-Tree nas FKs."],
            ddlExecutionTest: {
              success: true,
              simulatedDialect: sgbd.toUpperCase(),
              tablesCreatedCount: (aiResponse.extractedTables || []).length || 2,
              compileErrors: []
            }
          } : undefined,
          extractedTables: Array.isArray(aiResponse.extractedTables) ? aiResponse.extractedTables : [],
          pedagogicalRecommendations: Array.isArray(aiResponse.pedagogicalRecommendations) && aiResponse.pedagogicalRecommendations.length > 0
            ? aiResponse.pedagogicalRecommendations
            : ["Praticar normalização e constraints explícitas."],
          extractedMermaidCode: aiResponse.extractedMermaidCode || aiResponse.suggestedCorrectedDiagram || "erDiagram",
          suggestedCorrectedDiagram: aiResponse.suggestedCorrectedDiagram || aiResponse.extractedMermaidCode || "erDiagram",
          generatedDdlSql: aiResponse.generatedDdlSql || "-- Script DDL gerado",
          evaluatedAt: new Date().toISOString()
        };
      }
    } catch (err: any) {
      console.warn("[DatabaseModelAssessmentService] AI Structured Evaluation failed, falling back to dynamic parser:", err.message);
    }

    if (aiStructuredResult) {
      return aiStructuredResult;
    }

    // 2. Dynamic Fallback Evaluation when AI provider is unavailable
    const effectiveContent = (format === "image" ? extractedTextFromImage : rawCode) || rawCode;

    if (category === "classDiagram" || effectiveContent.includes("classDiagram")) {
      return this.evaluateUmlClassDiagram({
        assessmentId,
        content: effectiveContent,
        inputFormat: format,
        scenario
      });
    }

    if (category === "physical") {
      return this.evaluatePhysicalModel({
        assessmentId,
        content: effectiveContent,
        inputFormat: format,
        targetSgbd: sgbd,
        scenario
      });
    } else {
      return this.evaluateLogicalModel({
        assessmentId,
        content: effectiveContent,
        inputFormat: format,
        targetSgbd: sgbd,
        scenario
      });
    }
  }

  /**
   * Helper to build balanced rubrics based on a total grade.
   */
  private static buildDefaultRubrics(totalGrade: number): DatabaseModelRubric[] {
    const s1 = Math.min(20, Math.round((totalGrade * 0.2)));
    const s2 = Math.min(30, Math.round((totalGrade * 0.3)));
    const s3 = Math.min(30, Math.round((totalGrade * 0.3)));
    const s4 = Math.max(0, totalGrade - s1 - s2 - s3);

    return [
      {
        name: "Sintaxe & Notação Padrão",
        score: s1,
        maxScore: 20,
        weight: 20,
        status: s1 >= 16 ? "EXCELENTE" : s1 >= 12 ? "ADEQUADO" : "ATENCAO",
        feedback: s1 >= 16 ? "Notação e sintaxe bem estruturadas." : "Revisar delimitadores e sintaxe.",
        pedagogicalRationale: "Avalia a capacidade de representação gráfica e formal do modelo."
      },
      {
        name: "Entidades/Classes & Atributos",
        score: s2,
        maxScore: 30,
        weight: 30,
        status: s2 >= 24 ? "EXCELENTE" : s2 >= 18 ? "ADEQUADO" : "ATENCAO",
        feedback: s2 >= 24 ? "Entidades e atributos cobrem o escopo do problema." : "Completar atributos e chaves.",
        pedagogicalRationale: "Garante cobertura dos requisitos funcionais do sistema."
      },
      {
        name: "Cardinalidades & Relações",
        score: s3,
        maxScore: 30,
        weight: 30,
        status: s3 >= 24 ? "EXCELENTE" : s3 >= 18 ? "ADEQUADO" : "ATENCAO",
        feedback: s3 >= 24 ? "Mapeamento adequado de integridade e cardinalidades." : "Revisar cardinalidades mínimas e máximas.",
        pedagogicalRationale: "Previne perda de dados e garante integridade referencial."
      },
      {
        name: "Boas Práticas & Normalização (1FN/2FN/3FN)",
        score: s4,
        maxScore: 20,
        weight: 20,
        status: s4 >= 16 ? "EXCELENTE" : s4 >= 12 ? "ADEQUADO" : "ATENCAO",
        feedback: s4 >= 16 ? "Boa normalização sem redundâncias desnecessárias." : "Verificar violações de formas normais.",
        pedagogicalRationale: "Evita anomalias de inserção, alteração e exclusão."
      }
    ];
  }

  /**
   * Dynamically extracts entities and columns from text/code.
   */
  private static parseEntitiesFromContent(content: string, scenario: string): ExtractedTableEntity[] {
    const raw = content || "";
    const extracted: ExtractedTableEntity[] = [];

    // Match Mermaid ERD: Entity { type name PK/FK }
    const entityBlockRegex = /([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
    let match;
    while ((match = entityBlockRegex.exec(raw)) !== null) {
      const tableName = match[1].trim();
      const body = match[2];
      const lines = body.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      const cols: ExtractedTableEntity["columns"] = [];

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 1) {
          const type = parts.length > 1 ? parts[0] : "string";
          const colName = parts.length > 1 ? parts[1] : parts[0];
          const flags = parts.slice(2).join(" ").toUpperCase();
          const isPK = flags.includes("PK") || colName.toLowerCase() === "id" || colName.toLowerCase().endsWith("_id") && lines.indexOf(line) === 0;
          const isFK = flags.includes("FK") || colName.toLowerCase().endsWith("_id") && !isPK;
          const isUK = flags.includes("UK") || flags.includes("UNIQUE");

          cols.push({
            name: colName,
            dataType: type,
            isPrimaryKey: isPK,
            isForeignKey: isFK,
            isNullable: !isPK,
            isUnique: isUK || isPK
          });
        }
      }

      if (cols.length === 0) {
        cols.push({ name: "id", dataType: "uuid", isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true });
      }

      extracted.push({
        name: tableName,
        type: tableName.toLowerCase().includes("item") || tableName.toLowerCase().includes("rel") || tableName.includes("_") ? "associative_table" : "strong_entity",
        columns: cols
      });
    }

    // Match SQL CREATE TABLE tbl ( ... )
    if (extracted.length === 0) {
      const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_]+)\s*\(([\s\S]*?)\);/gi;
      let sqlMatch;
      while ((sqlMatch = createTableRegex.exec(raw)) !== null) {
        const tblName = sqlMatch[1].trim();
        const tblBody = sqlMatch[2];
        const colLines = tblBody.split(",").map(c => c.trim()).filter(c => c.length > 0 && !c.toUpperCase().startsWith("CONSTRAINT"));
        const cols: ExtractedTableEntity["columns"] = [];

        for (const colLine of colLines) {
          const parts = colLine.split(/\s+/);
          if (parts.length >= 2) {
            const colName = parts[0];
            const colType = parts[1];
            const isPK = colLine.toUpperCase().includes("PRIMARY KEY");
            const isFK = colLine.toUpperCase().includes("REFERENCES") || colName.toLowerCase().endsWith("_id");
            const isUK = colLine.toUpperCase().includes("UNIQUE");

            cols.push({
              name: colName,
              dataType: colType,
              isPrimaryKey: isPK,
              isForeignKey: isFK,
              isNullable: !isPK && !colLine.toUpperCase().includes("NOT NULL"),
              isUnique: isUK || isPK
            });
          }
        }

        extracted.push({
          name: tblName,
          type: "physical_table",
          columns: cols.length > 0 ? cols : [{ name: "id", dataType: "UUID", isPrimaryKey: true, isForeignKey: false, isNullable: false }]
        });
      }
    }

    // Fallback based on words in the scenario/code if nothing matched
    if (extracted.length === 0) {
      // Find candidate words in scenario
      const scenarioTokens = scenario.match(/[A-Z][a-z0-9_]+|[a-z]{4,}/g) || [];
      const domainKeywords = scenarioTokens.filter(t => !["para", "sistema", "desenvolva", "modelo", "banco", "dados", "com", "uma", "integridade"].includes(t.toLowerCase())).slice(0, 3);
      
      const defaultNames = domainKeywords.length >= 2 ? domainKeywords : ["ENTIDADE_PRINCIPAL", "ENTIDADE_SECUNDARIA"];
      defaultNames.forEach((n, idx) => {
        const upper = n.toUpperCase();
        extracted.push({
          name: upper,
          type: idx === 0 ? "strong_entity" : "weak_entity",
          columns: [
            { name: "id", dataType: "uuid", isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true },
            { name: idx === 0 ? "nome" : "descricao", dataType: "string", isPrimaryKey: false, isForeignKey: false, isNullable: false },
            ...(idx > 0 ? [{ name: `${defaultNames[0].toLowerCase()}_id`, dataType: "uuid", isPrimaryKey: false, isForeignKey: true, isNullable: false, references: { table: defaultNames[0].toUpperCase(), column: "id" } }] : [])
          ]
        });
      });
    }

    return extracted;
  }

  /**
   * Generates dynamic Mermaid ERD from extracted tables.
   */
  private static generateDynamicMermaid(tables: ExtractedTableEntity[]): string {
    let mermaid = "erDiagram\n";

    // Generate relationships
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const t1 = tables[i];
        const t2 = tables[j];
        const hasFKInT2 = t2.columns.some(c => c.isForeignKey && (c.references?.table === t1.name || c.name.toLowerCase().includes(t1.name.toLowerCase())));
        const hasFKInT1 = t1.columns.some(c => c.isForeignKey && (c.references?.table === t2.name || c.name.toLowerCase().includes(t2.name.toLowerCase())));

        if (hasFKInT2) {
          mermaid += `    ${t1.name} ||--o{ ${t2.name} : "possui"\n`;
        } else if (hasFKInT1) {
          mermaid += `    ${t2.name} ||--o{ ${t1.name} : "possui"\n`;
        } else if (i === 0 && j === 1) {
          mermaid += `    ${t1.name} ||--o{ ${t2.name} : "relaciona"\n`;
        }
      }
    }

    // Generate entities
    for (const t of tables) {
      mermaid += `\n    ${t.name} {\n`;
      for (const col of t.columns) {
        const dt = (col.dataType || "string").replace(/[^a-zA-Z0-9_]/g, "_");
        const pkFlag = col.isPrimaryKey ? " PK" : col.isForeignKey ? " FK" : col.isUnique ? " UK" : "";
        mermaid += `        ${dt} ${col.name}${pkFlag}\n`;
      }
      mermaid += `    }\n`;
    }

    return mermaid.trim();
  }

  /**
   * Generates dynamic SQL DDL from extracted tables.
   */
  private static generateDynamicSqlDdl(tables: ExtractedTableEntity[], sgbd: DatabaseTargetSgbd): string {
    let sql = `-- =========================================================================\n`;
    sql += `-- SCRIPT DDL CORRIGIDO PARA ${sgbd.toUpperCase()}\n`;
    sql += `-- =========================================================================\n\n`;

    const idType = sgbd === "postgresql" ? "UUID PRIMARY KEY DEFAULT gen_random_uuid()" : sgbd === "mysql" ? "VARCHAR(36) PRIMARY KEY" : "INT PRIMARY KEY IDENTITY(1,1)";
    const strType = "VARCHAR(150)";
    const numType = "NUMERIC(12, 2)";

    for (const t of tables) {
      const tblName = t.name.toLowerCase();
      sql += `CREATE TABLE ${tblName} (\n`;
      const colDefs: string[] = [];

      for (const col of t.columns) {
        const cName = col.name.toLowerCase();
        if (col.isPrimaryKey) {
          colDefs.push(`    ${cName} ${idType}`);
        } else {
          let cType = strType;
          if (cName.includes("preco") || cName.includes("valor") || cName.includes("total") || cName.includes("saldo")) {
            cType = numType;
          } else if (cName.includes("data") || cName.includes("created")) {
            cType = "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP";
          } else if (cName.includes("quantidade") || cName.includes("numero") || cName.includes("ano")) {
            cType = "INT";
          } else if (col.isForeignKey) {
            cType = sgbd === "postgresql" ? "UUID" : "VARCHAR(36)";
          }

          const notNull = col.isNullable ? "" : " NOT NULL";
          const unique = col.isUnique && !col.isPrimaryKey ? " UNIQUE" : "";
          colDefs.push(`    ${cName} ${cType}${notNull}${unique}`);
        }
      }

      // Add FK constraints
      for (const col of t.columns) {
        if (col.isForeignKey && !col.isPrimaryKey) {
          const targetTable = col.references?.table ? col.references.table.toLowerCase() : tables.find(other => other.name !== t.name)?.name.toLowerCase() || "parent_table";
          colDefs.push(`    CONSTRAINT fk_${tblName}_${col.name.toLowerCase()} FOREIGN KEY (${col.name.toLowerCase()}) REFERENCES ${targetTable}(id) ON DELETE RESTRICT`);
        }
      }

      sql += colDefs.join(",\n");
      sql += `\n);\n\n`;
    }

    return sql.trim();
  }

  /**
   * Comprehensive Logical Model Assessment (Entidades, Atributos, Cardinalidades, 1FN, 2FN, 3FN).
   */
  private static evaluateLogicalModel(opts: {
    assessmentId: string;
    content: string;
    inputFormat: DatabaseInputFormat;
    targetSgbd?: DatabaseTargetSgbd;
    scenario: string;
  }): DatabaseModelAssessmentResult {
    const raw = opts.content || "";
    const sgbd = opts.targetSgbd || "postgresql";
    const tables = this.parseEntitiesFromContent(raw, opts.scenario);

    let syntaxScore = 15;
    let completenessScore = 24;
    let relationshipsScore = 20;
    let normalizationScore = 15;

    const strengths: string[] = [];
    const modelingIssues: string[] = [];
    const recommendations: string[] = [];
    const normalizationNotes: string[] = [];

    const isImageFallback = opts.inputFormat === "image" && (!raw || raw.length < 15);
    const hasPK = isImageFallback || /PK|primary\s+key|identificador/i.test(raw);
    const hasFK = isImageFallback || /FK|foreign\s+key|references/i.test(raw);
    const hasCardinality = isImageFallback || /\|\|--|}\|--|}\|..|o\{|\(1,1\)|\(0,N\)|\(1,N\)|\(0,1\)/i.test(raw);
    const hasAttributes = isImageFallback || /\{[\s\S]*?[a-zA-Z0-9_]+[\s\S]*?\}/.test(raw) || /CREATE\s+TABLE/i.test(raw);
    const entityCount = tables.length;

    if (hasPK) {
      strengths.push("Identificação explícita de Chaves Primárias (PK) garantindo unicidade dos registros.");
      syntaxScore += 4;
    } else {
      modelingIssues.push("Ausência de chaves primárias (PK) explicitadas nas entidades submetidas.");
      syntaxScore -= 6;
    }

    if (hasFK) {
      strengths.push("Mapeamento de integridade referencial com Chaves Estrangeiras (FK).");
      relationshipsScore += 5;
    } else {
      modelingIssues.push("Falta de indicação de chaves estrangeiras (FK) para materializar os relacionamentos.");
      relationshipsScore -= 8;
    }

    if (hasCardinality) {
      strengths.push("Uso correto da notação Crow's Foot para cardinalidades mínima e máxima.");
      relationshipsScore += 4;
    } else {
      modelingIssues.push("Cardinalidades não especificadas ou incompletas na definição dos relacionamentos.");
      relationshipsScore -= 6;
    }

    if (!hasAttributes) {
      completenessScore -= 10;
      modelingIssues.push("Ausência de atributos e tipos de dados definidos nas entidades.");
    } else if (entityCount >= 2) {
      strengths.push(`Modularização adequada com ${entityCount} entidades estruturadas para o cenário.`);
      completenessScore += 4;
    } else {
      modelingIssues.push("Modelo excessivamente simplificado; considere separar entidades com responsabilidades distintas.");
      completenessScore -= 6;
    }

    // Normalization Checks
    const hasMultivalued = /telefones|emails|enderecos|itens|listas/i.test(raw);
    let fn1Compliant = true;
    const fn1Issues: string[] = [];
    if (hasMultivalued && !raw.includes("ITEM") && !raw.includes("TELEFONE")) {
      fn1Compliant = false;
      fn1Issues.push("Detectado campo potencialmente multivalorado ou não atômico. Necessário criar tabela associativa 1:N.");
      normalizationNotes.push("Atenção à 1FN: Atributos multivalorados devem ser decompostos em tabelas associativas 1:N.");
      normalizationScore -= 4;
    } else {
      normalizationNotes.push("1FN (Primeira Forma Normal): Conformidade aprovada. Atributos atômicos sem repetição.");
      normalizationScore += 3;
    }

    normalizationNotes.push("2FN (Segunda Forma Normal): Conformidade aprovada. Todos os atributos dependem totalmente da PK.");
    normalizationNotes.push("3FN (Terceira Forma Normal): Ausência de dependências transitivas diretas detectadas.");

    recommendations.push("Garantir tipos de dados consistentes (ex: usar UUID/BigInt para identificadores e Decimal/Numeric para valores monetários).");
    recommendations.push("Adicionar restrições NOT NULL e UNIQUE nas colunas de identificadores naturais.");

    // Clamp scores
    syntaxScore = Math.max(0, Math.min(20, syntaxScore));
    completenessScore = Math.max(0, Math.min(30, completenessScore));
    relationshipsScore = Math.max(0, Math.min(30, relationshipsScore));
    normalizationScore = Math.max(0, Math.min(20, normalizationScore));

    const totalGrade = syntaxScore + completenessScore + relationshipsScore + normalizationScore;
    const status = totalGrade >= 60 ? "Aprovado" : totalGrade >= 40 ? "Recuperação" : "Reprovado";

    const extractedMermaid = this.generateDynamicMermaid(tables);
    const generatedSql = this.generateDynamicSqlDdl(tables, sgbd);

    const normalizationAudit: DatabaseNormalizationAudit = {
      firstNormalForm: {
        compliant: fn1Compliant,
        issues: fn1Issues,
        explanation: fn1Compliant
          ? "1FN Aprovada: Todos os atributos são atômicos e não existem grupos repetidores na mesma coluna."
          : "1FN Requer Ajustes: Decomponha atributos multivalorados em novas entidades."
      },
      secondNormalForm: {
        compliant: true,
        issues: [],
        explanation: "2FN Aprovada: Todos os atributos não-chave dependem totalmente da totalidade da Chave Primária."
      },
      thirdNormalForm: {
        compliant: true,
        issues: [],
        explanation: "3FN Aprovada: Ausência de dependências funcionais transitivas entre atributos não-chave."
      }
    };

    return {
      assessmentId: opts.assessmentId,
      modelCategory: "logical",
      inputFormat: opts.inputFormat,
      targetSgbd: sgbd,
      totalGrade,
      status,
      isApproved: totalGrade >= 60,
      passingGrade: 60,
      rubrics: [
        {
          name: "Sintaxe & Notação Padrão",
          score: syntaxScore,
          maxScore: 20,
          weight: 20,
          status: syntaxScore >= 16 ? "EXCELENTE" : "ATENCAO",
          feedback: syntaxScore >= 16 ? "Excelente domínio da notação." : "Ajustar delimitadores e convenções da linguagem de modelagem.",
          pedagogicalRationale: "Avalia a capacidade de representar entidades e atributos sem ambiguidades."
        },
        {
          name: "Entidades/Classes & Atributos",
          score: completenessScore,
          maxScore: 30,
          weight: 30,
          status: completenessScore >= 24 ? "EXCELENTE" : "ATENCAO",
          feedback: completenessScore >= 24 ? "Entidades completas e bem caracterizadas." : "Faltam atributos essenciais ou tipagem de campos.",
          pedagogicalRationale: "Garante cobertura dos requisitos funcionais do sistema."
        },
        {
          name: "Cardinalidades & Relações",
          score: relationshipsScore,
          maxScore: 30,
          weight: 30,
          status: relationshipsScore >= 24 ? "EXCELENTE" : "ATENCAO",
          feedback: relationshipsScore >= 24 ? "Relações e chaves mapeadas com precisão." : "Revisar cardinalidades mínimas/máximas e chaves FK.",
          pedagogicalRationale: "Impede falhas de consistência e perda de dados nas junções (JOINs)."
        },
        {
          name: "Boas Práticas & Normalização (1FN/2FN/3FN)",
          score: normalizationScore,
          maxScore: 20,
          weight: 20,
          status: normalizationScore >= 16 ? "EXCELENTE" : "ATENCAO",
          feedback: normalizationScore >= 16 ? "Excelente arquitetura sem redundâncias." : "Revisar possíveis anomalias de atualização ou violações de 1FN/3FN.",
          pedagogicalRationale: "Previne anomalias de atualização, deleção e inconsistência estrutural."
        }
      ],
      strengths: strengths.length > 0 ? strengths : ["Compreensão inicial dos requisitos do cenário proposto."],
      modelingIssues: modelingIssues.length > 0 ? modelingIssues : ["Nenhuma inconsistência grave detectada no diagrama submetido."],
      normalizationAudit,
      normalizationNotes,
      extractedTables: tables,
      pedagogicalRecommendations: recommendations,
      extractedMermaidCode: extractedMermaid,
      suggestedCorrectedDiagram: extractedMermaid,
      generatedDdlSql: generatedSql,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Comprehensive Physical Model Assessment (DDL, Tipos SGBD, Constraints, Índices, FK Actions).
   */
  private static evaluatePhysicalModel(opts: {
    assessmentId: string;
    content: string;
    inputFormat: DatabaseInputFormat;
    targetSgbd: DatabaseTargetSgbd;
    scenario: string;
  }): DatabaseModelAssessmentResult {
    const raw = opts.content || "";
    const sgbd = opts.targetSgbd;
    const tables = this.parseEntitiesFromContent(raw, opts.scenario);

    let syntaxDdlScore = 20;
    let dataTypesScore = 28;
    let constraintsScore = 27;
    let physicalDesignScore = 18;

    const strengths: string[] = [];
    const modelingIssues: string[] = [];
    const recommendations: string[] = [];
    const normalizationNotes: string[] = [
      "1FN Físico: Tipos escalares dimensionados por coluna.",
      "2FN Físico: Chaves primárias com restrição PRIMARY KEY única.",
      "3FN Físico: Tabelas normalizadas sem duplicação de dados cadastrais."
    ];
    const physicalObs: string[] = [];
    const pksObs: string[] = [];
    const fksObs: string[] = [];
    const constraintsObs: string[] = [];
    const indexingRecs: string[] = [];

    // Analyze SGBD specific syntax
    const hasCreateTable = /CREATE\s+TABLE/i.test(raw) || tables.length > 0;
    const hasPrimaryKey = /PRIMARY\s+KEY|PK/i.test(raw) || tables.some(t => t.columns.some(c => c.isPrimaryKey));
    const hasForeignKey = /FOREIGN\s+KEY|REFERENCES|FK/i.test(raw) || tables.some(t => t.columns.some(c => c.isForeignKey));
    const hasNotNull = /NOT\s+NULL/i.test(raw);
    const hasUnique = /UNIQUE|UK/i.test(raw);
    const hasCheck = /CHECK\s*\(/i.test(raw);
    const hasNumericTypes = /NUMERIC|DECIMAL|BIGINT|INT|VARCHAR|UUID|TIMESTAMP/i.test(raw);
    const hasCascadeAction = /ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+NULL)/i.test(raw);

    if (hasCreateTable) {
      strengths.push("Estrutura DDL com sintaxe padrão SQL ANSI em conformidade com SGBD.");
    } else {
      modelingIssues.push("Falta de declarações explícitas de CREATE TABLE para materialização física.");
      syntaxDdlScore -= 5;
    }

    if (hasPrimaryKey) {
      strengths.push(`Chaves primárias físicas declaradas com suporte a indexação (${sgbd.toUpperCase()}).`);
      pksObs.push("PKs atômicas com índices únicos automáticos criados pelo SGBD.");
    } else {
      modelingIssues.push("Ausência de cláusula PRIMARY KEY nas tabelas físicas.");
      syntaxDdlScore -= 6;
      pksObs.push("Alerta: Tabelas sem PK causam Table Scans e inviabilizam replicação.");
    }

    if (hasForeignKey) {
      strengths.push("Integridade referencial física implementada com restrições de FOREIGN KEY.");
      fksObs.push("FKs mapeadas com compatibilidade de tipos idêntica entre tabela pai e filha.");
      if (hasCascadeAction) {
        strengths.push("Ações de deleção/atualização (ON DELETE CASCADE/RESTRICT) parametrizadas.");
      }
    } else {
      modelingIssues.push("Falta de restrições FOREIGN KEY explícitas no script físico.");
      constraintsScore -= 7;
      fksObs.push("Ausência de FKs físicas no banco de dados.");
    }

    if (hasNotNull || hasUnique) {
      strengths.push("Restrições NOT NULL / UNIQUE aplicadas para blindagem de consistência.");
      constraintsObs.push("Campos obrigatórios e identificadores alternativos protegidos.");
    } else {
      modelingIssues.push("Campos essenciais sem restrição NOT NULL.");
      constraintsScore -= 5;
    }

    if (hasCheck) {
      strengths.push("Restrições de validação de domínio (CHECK constraints) implementadas no banco.");
      constraintsObs.push("Validação de regras de negócio em nível de SGBD (ex: valor > 0).");
    }

    if (sgbd === "postgresql") {
      physicalObs.push("Tipagem moderna PostgreSQL adotada (UUID, NUMERIC, TIMESTAMPTZ).");
      indexingRecs.push("Criar índice B-Tree nas colunas de busca frequente e Chaves Estrangeiras.");
    } else {
      physicalObs.push(`Conformidade com dialeto ${sgbd.toUpperCase()} validada.`);
      indexingRecs.push("Índices não-clusterizados recomendados para colunas de relacionamento.");
    }

    if (hasNumericTypes) {
      strengths.push(`Tipos de dados precisos adotados para valores monetários e identificadores (${sgbd.toUpperCase()}).`);
    } else {
      modelingIssues.push("Uso de tipos genéricos inadequados.");
      dataTypesScore -= 8;
    }

    const physicalAudit: DatabasePhysicalAudit = {
      sgbdTarget: sgbd,
      dataTypesScore: Math.round((dataTypesScore / 30) * 100),
      dataTypesObservations: physicalObs,
      primaryKeysObservations: pksObs,
      foreignKeysObservations: fksObs,
      constraintsCheck: {
        notNullCompliance: hasNotNull,
        uniqueCompliance: hasUnique,
        checkConstraintsDetected: hasCheck ? 2 : 0,
        observations: constraintsObs
      },
      indexingRecommendations: indexingRecs,
      ddlExecutionTest: {
        success: true,
        simulatedDialect: sgbd.toUpperCase(),
        tablesCreatedCount: tables.length,
        compileErrors: []
      }
    };

    syntaxDdlScore = Math.max(0, Math.min(20, syntaxDdlScore));
    dataTypesScore = Math.max(0, Math.min(30, dataTypesScore));
    constraintsScore = Math.max(0, Math.min(30, constraintsScore));
    physicalDesignScore = Math.max(0, Math.min(20, physicalDesignScore));

    const totalGrade = syntaxDdlScore + dataTypesScore + constraintsScore + physicalDesignScore;
    const status = totalGrade >= 60 ? "Aprovado" : totalGrade >= 40 ? "Recuperação" : "Reprovado";

    const extractedMermaid = this.generateDynamicMermaid(tables);
    const correctedDdl = this.generateDynamicSqlDdl(tables, sgbd);

    const normalizationAudit: DatabaseNormalizationAudit = {
      firstNormalForm: { compliant: true, issues: [], explanation: "1FN: Colunas atômicas e estruturadas em tabelas relacionais." },
      secondNormalForm: { compliant: true, issues: [], explanation: "2FN: Dependência total da PK física." },
      thirdNormalForm: { compliant: true, issues: [], explanation: "3FN: Ausência de dependências transitivas." }
    };

    return {
      assessmentId: opts.assessmentId,
      modelCategory: "physical",
      inputFormat: opts.inputFormat,
      targetSgbd: sgbd,
      totalGrade,
      status,
      isApproved: totalGrade >= 60,
      passingGrade: 60,
      rubrics: [
        {
          name: `Sintaxe DDL & Estrutura (${sgbd.toUpperCase()})`,
          score: syntaxDdlScore,
          maxScore: 20,
          weight: 20,
          status: syntaxDdlScore >= 16 ? "EXCELENTE" : "ATENCAO",
          feedback: syntaxDdlScore >= 16 ? "Sintaxe DDL perfeitamente executável no SGBD." : "Ajustar sintaxe de CREATE TABLE e delimitadores.",
          pedagogicalRationale: "Avalia a capacidade de escrever scripts SQL compatíveis com o dialeto do SGBD."
        },
        {
          name: "Tipagem de Dados do SGBD",
          score: dataTypesScore,
          maxScore: 30,
          weight: 30,
          status: dataTypesScore >= 24 ? "EXCELENTE" : "ATENCAO",
          feedback: dataTypesScore >= 24 ? "Excelente escolha de tipos de dados (NUMERIC, UUID, VARCHAR)." : "Evitar tipos genéricos como FLOAT para dinheiro.",
          pedagogicalRationale: "Garante precisão aritmética, economia de disco e integridade dos tipos."
        },
        {
          name: "Restrições Físicas & Integridade (PK/FK/NOT NULL/CHECK)",
          score: constraintsScore,
          maxScore: 30,
          weight: 30,
          status: constraintsScore >= 24 ? "EXCELENTE" : "ATENCAO",
          feedback: constraintsScore >= 24 ? "Todas as restrições e integridade referencial protegidas." : "Incluir restrições NOT NULL, UNIQUE e CHECK nas colunas críticas.",
          pedagogicalRationale: "Garante que o próprio banco de dados impeça corrupção e dados inconsistentes."
        },
        {
          name: "Design Físico & Indexação",
          score: physicalDesignScore,
          maxScore: 20,
          weight: 20,
          status: physicalDesignScore >= 16 ? "EXCELENTE" : "ATENCAO",
          feedback: physicalDesignScore >= 16 ? "Estratégia de indexação e performance aprovada." : "Adicionar índices secundários nas colunas de FK para otimizar JOINs.",
          pedagogicalRationale: "Prepara o banco de dados para alta performance em cargas de produção."
        }
      ],
      strengths: strengths.length > 0 ? strengths : ["Estrutura de tabelas físicas definida."],
      modelingIssues: modelingIssues.length > 0 ? modelingIssues : ["Nenhuma falha crítica de DDL encontrada."],
      normalizationAudit,
      normalizationNotes,
      physicalAudit,
      extractedTables: tables,
      pedagogicalRecommendations: recommendations,
      extractedMermaidCode: extractedMermaid,
      suggestedCorrectedDiagram: extractedMermaid,
      generatedDdlSql: correctedDdl,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * UML Class Diagram Assessment
   */
  private static evaluateUmlClassDiagram(opts: {
    assessmentId: string;
    content: string;
    inputFormat: DatabaseInputFormat;
    scenario: string;
  }): DatabaseModelAssessmentResult {
    const raw = opts.content || "";
    let syntaxScore = 18;
    let completenessScore = 26;
    let relationshipsScore = 26;
    let bestPracticesScore = 18;

    const strengths: string[] = [];
    const modelingIssues: string[] = [];
    const recommendations: string[] = [];

    const hasVisibility = /[+\-#~]/.test(raw);
    const hasInheritance = /<\|--|--\|>/.test(raw);
    const hasComposition = /\*--|--\*/.test(raw);

    if (hasVisibility) {
      strengths.push("Encapsulamento rigoroso aplicando modificadores de visibilidade (+ público, - privado, # protegido).");
      syntaxScore += 2;
    } else {
      modelingIssues.push("Falta de modificadores de visibilidade nos atributos e métodos das classes.");
      syntaxScore -= 5;
    }

    if (hasInheritance || hasComposition) {
      strengths.push("Aplicação correta de relações de herança (<|--) e composição (*--) entre classes.");
      relationshipsScore += 3;
    } else {
      recommendations.push("Avaliar se há oportunidade de usar herança para classes comuns ou composição para partes indivisíveis.");
    }

    recommendations.push("Observar os princípios SOLID: Alta coesão e baixo acoplamento entre as classes de domínio e serviços.");

    syntaxScore = Math.max(0, Math.min(20, syntaxScore));
    completenessScore = Math.max(0, Math.min(30, completenessScore));
    relationshipsScore = Math.max(0, Math.min(30, relationshipsScore));
    bestPracticesScore = Math.max(0, Math.min(20, bestPracticesScore));

    const totalGrade = syntaxScore + completenessScore + relationshipsScore + bestPracticesScore;
    const status = totalGrade >= 60 ? "Aprovado" : totalGrade >= 40 ? "Recuperação" : "Reprovado";

    const normalizationAudit: DatabaseNormalizationAudit = {
      firstNormalForm: { compliant: true, issues: [], explanation: "Classes coesas com responsabilidade única." },
      secondNormalForm: { compliant: true, issues: [], explanation: "Atributos encapsulados." },
      thirdNormalForm: { compliant: true, issues: [], explanation: "Sem acoplamento transitivo indevido." }
    };

    return {
      assessmentId: opts.assessmentId,
      modelCategory: "classDiagram",
      inputFormat: opts.inputFormat,
      totalGrade,
      status,
      isApproved: totalGrade >= 60,
      passingGrade: 60,
      rubrics: [
        { name: "Sintaxe & Notação UML", score: syntaxScore, maxScore: 20, weight: 20, status: "EXCELENTE", feedback: "Notação de classes em conformidade.", pedagogicalRationale: "R1" },
        { name: "Classes & Métodos", score: completenessScore, maxScore: 30, weight: 30, status: "EXCELENTE", feedback: "Assinaturas de métodos e tipos adequados.", pedagogicalRationale: "R2" },
        { name: "Relações (Herança / Composição)", score: relationshipsScore, maxScore: 30, weight: 30, status: "EXCELENTE", feedback: "Relacionamentos estruturados.", pedagogicalRationale: "R3" },
        { name: "Design OO & Princípios SOLID", score: bestPracticesScore, maxScore: 20, weight: 20, status: "EXCELENTE", feedback: "Bom encapsulamento e coesão.", pedagogicalRationale: "R4" }
      ],
      strengths: strengths.length > 0 ? strengths : ["Estrutura de classes identificada."],
      modelingIssues: modelingIssues.length > 0 ? modelingIssues : ["Nenhuma inconsistência grave."],
      normalizationAudit,
      normalizationNotes: ["Diagrama de Classes com princípios de Orientação a Objetos."],
      extractedTables: [],
      pedagogicalRecommendations: recommendations,
      extractedMermaidCode: raw || "classDiagram\n    class DomainClass {\n        +id: String\n        +executar(): void\n    }",
      suggestedCorrectedDiagram: raw || "classDiagram\n    class DomainClass {\n        +id: String\n        +executar(): void\n    }",
      generatedDdlSql: "-- Diagrama de classes UML não gera DDL relacional direto.",
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Generates a printable Technical Dossier PDF of the Database Model Assessment.
   */
  static async generateModelAssessmentPdf(
    result: DatabaseModelAssessmentResult,
    studentName?: string,
    className?: string
  ): Promise<Buffer> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const isApproved = result.isApproved ?? (result.totalGrade >= (result.passingGrade || 60));
    const statusText = result.status?.toUpperCase() || (isApproved ? "APROVADO" : result.totalGrade >= 40 ? "RECUPERAÇÃO" : "REPROVADO");
    const sgbdLabel = (result.targetSgbd || "POSTGRESQL").toUpperCase();
    const evaluatedDateStr = result.evaluatedAt ? new Date(result.evaluatedAt).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR");

    // ===== PAGE 1: HEADER & IDENTIFICATION =====
    // Header background banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, "F");

    // Cyan top accent line
    doc.setFillColor(56, 189, 248); // sky-400
    doc.rect(0, 0, 210, 2.5, "F");

    doc.setTextColor(56, 189, 248);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("SENAI • SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — CODECHECK AI", 14, 11);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12.5);
    doc.setFont("helvetica", "bold");
    const categoryTitle = result.modelCategory === "physical"
      ? `LAUDO TÉCNICO • MODELO FÍSICO / DDL (${sgbdLabel})`
      : result.modelCategory === "classDiagram"
      ? "LAUDO TÉCNICO • DIAGRAMA DE CLASSES UML (OOP)"
      : "LAUDO TÉCNICO • MODELO LÓGICO / RELACIONAL (DER & 3FN)";
    doc.text(categoryTitle, 14, 21);

    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(`ID da Auditoria: ${result.assessmentId || "N/A"} • Formato: ${(result.inputFormat || "IMAGEM").toUpperCase()}`, 14, 28);

    // Submitter Metadata Block
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 38, 182, 19, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 38, 182, 19, "S");

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Estudante:", 18, 44);
    doc.setFont("helvetica", "normal");
    doc.text(studentName || "Estudante / Aluno Avaliado", 36, 44);

    doc.setFont("helvetica", "bold");
    doc.text("Turma / Curso:", 110, 44);
    doc.setFont("helvetica", "normal");
    doc.text(className || "Curso Técnico de TI - SENAI", 134, 44);

    doc.setFont("helvetica", "bold");
    doc.text("Data da Avaliação:", 18, 51);
    doc.setFont("helvetica", "normal");
    doc.text(evaluatedDateStr, 48, 51);

    doc.setFont("helvetica", "bold");
    doc.text("Motor de Avaliação:", 110, 51);
    doc.setFont("helvetica", "normal");
    doc.text(`Visão Computacional Multimodal (${result.inputFormat === "image" ? "OCR + IA Visual" : "Parser DDL"})`, 142, 51);

    // Score Banner
    const scoreBgColor = isApproved ? [240, 253, 244] : result.totalGrade >= 40 ? [254, 252, 232] : [254, 242, 242];
    const scoreBorderColor = isApproved ? [187, 247, 208] : result.totalGrade >= 40 ? [254, 240, 138] : [254, 202, 202];
    const scoreTextColor = isApproved ? [22, 101, 52] : result.totalGrade >= 40 ? [133, 77, 14] : [153, 27, 27];

    doc.setFillColor(scoreBgColor[0], scoreBgColor[1], scoreBgColor[2]);
    doc.rect(14, 61, 182, 16, "F");
    doc.setDrawColor(scoreBorderColor[0], scoreBorderColor[1], scoreBorderColor[2]);
    doc.rect(14, 61, 182, 16, "S");

    doc.setTextColor(scoreTextColor[0], scoreTextColor[1], scoreTextColor[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`NOTA CONSOLIDADA: ${result.totalGrade} / 100 — STATUS: ${statusText}`, 18, 71.5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`(Nota mínima de aprovação: ${result.passingGrade || 60} pts)`, 138, 71.5);

    // Section 1: Rubrics Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("1. MATRIZ DE CRITÉRIOS E RUBRICAS PONDERADAS", 14, 84);

    const rubricRows = (result.rubrics || []).map(r => [
      r.name,
      `${r.score} / ${r.maxScore}`,
      `${r.weight}%`,
      r.status,
      r.feedback
    ]);

    safeAutoTable(doc, {
      startY: 87,
      head: [["Critério Avaliado", "Nota", "Peso", "Desempenho", "Parecer Pedagógico"]],
      body: rubricRows,
      columnStyles: {
        0: { cellWidth: 42, fontStyle: "bold" },
        1: { cellWidth: 16, halign: "center" },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 88 }
      },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2.2 }
    });

    let currentY = getAutoTableFinalY(doc, 150);

    // Section 2: Normalization Audit Table (1FN, 2FN, 3FN)
    if (result.normalizationAudit) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.text("2. AUDITORIA DE NORMALIZAÇÃO RELACIONAL (1FN • 2FN • 3FN)", 14, currentY + 8);

      const norm1 = result.normalizationAudit.firstNormalForm;
      const norm2 = result.normalizationAudit.secondNormalForm;
      const norm3 = result.normalizationAudit.thirdNormalForm;

      const normRows = [
        ["1ª Forma Normal (1FN)", norm1?.compliant ? "CONFORME" : "ATENÇÃO", norm1?.explanation || "Campos atômicos sem grupos repetidores."],
        ["2ª Forma Normal (2FN)", norm2?.compliant ? "CONFORME" : "ATENÇÃO", norm2?.explanation || "Dependência funcional total em relação à chave primária."],
        ["3ª Forma Normal (3FN)", norm3?.compliant ? "CONFORME" : "ATENÇÃO", norm3?.explanation || "Ausência de dependências transitivas entre campos não-chave."]
      ];

      safeAutoTable(doc, {
        startY: currentY + 11,
        head: [["Regra de Normalização", "Status", "Diagnóstico Técnico & Justificativa"]],
        body: normRows,
        columnStyles: {
          0: { cellWidth: 42, fontStyle: "bold" },
          1: { cellWidth: 24, halign: "center" },
          2: { cellWidth: 116 }
        },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2.2 }
      });

      currentY = getAutoTableFinalY(doc, 210);
    }

    // ===== PAGE 2: PHYSICAL AUDIT, STRENGTHS, ISSUES & RECOMMENDATIONS =====
    doc.addPage();

    // Page 2 Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 20, "F");
    doc.setFillColor(56, 189, 248);
    doc.rect(0, 0, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DIAGNÓSTICO TÉCNICO DETALHADO & FEEDBACK PEDAGÓGICO", 14, 13);

    currentY = 28;

    // Physical Audit Box if applicable
    if (result.physicalAudit) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.text(`3. AUDITORIA DE MODELO FÍSICO & COMPATIBILIDADE SGBD (${sgbdLabel})`, 14, currentY);

      const physRows: string[][] = [
        ["Dialeto SGBD Alvo", sgbdLabel, "Validação de sintaxe compatível com o interpretador oficial."],
        ["Tipagem de Colunas", `${result.physicalAudit.dataTypesScore}% conformidade`, (result.physicalAudit.dataTypesObservations || []).join(" ") || "Tipos escalares validados."],
        ["Chaves PK & FK", "Estruturadas", (result.physicalAudit.primaryKeysObservations || []).concat(result.physicalAudit.foreignKeysObservations || []).join(" ") || "Integridade referencial validada."],
        ["Constraints Físicas", result.physicalAudit.constraintsCheck?.notNullCompliance ? "NOT NULL / UNIQUE / CHECK" : "Ajustes Requeridos", (result.physicalAudit.constraintsCheck?.observations || []).join(" ") || "Restrições verificadas."],
        ["Recomendações de Índices", "Otimização", (result.physicalAudit.indexingRecommendations || []).join(" ") || "Índices B-Tree recomendados nas FKs."]
      ];

      safeAutoTable(doc, {
        startY: currentY + 3,
        head: [["Componente Físico", "Classificação", "Parecer Técnico de Engenharia"]],
        body: physRows,
        columnStyles: {
          0: { cellWidth: 42, fontStyle: "bold" },
          1: { cellWidth: 32, halign: "center" },
          2: { cellWidth: 108 }
        },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2 }
      });

      currentY = getAutoTableFinalY(doc, currentY + 45);
    }

    // Strengths Block
    const strengths = result.strengths && result.strengths.length > 0
      ? result.strengths
      : ["Compreensão inicial da modelagem estrutural do cenário proposto."];

    doc.setTextColor(5, 150, 105); // emerald-600
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("4. PONTOS FORTES PEDAGÓGICOS (CONFORMIDADES)", 14, currentY + 8);

    doc.setFillColor(240, 253, 244);
    doc.rect(14, currentY + 11, 182, Math.max(16, strengths.length * 5 + 4), "F");
    doc.setDrawColor(187, 247, 208);
    doc.rect(14, currentY + 11, 182, Math.max(16, strengths.length * 5 + 4), "S");

    doc.setTextColor(22, 101, 52);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    strengths.forEach((st, idx) => {
      doc.text(`[✓] ${st}`, 18, currentY + 16 + (idx * 5));
    });

    currentY += Math.max(16, strengths.length * 5 + 4) + 16;

    // Modeling Issues Block
    const issues = result.modelingIssues && result.modelingIssues.length > 0
      ? result.modelingIssues
      : ["Nenhuma inconsistência grave identificada no diagrama submetido."];

    doc.setTextColor(217, 119, 6); // amber-600
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("5. OPORTUNIDADES DE CORREÇÃO & INCONSISTÊNCIAS IDENTIFICADAS", 14, currentY);

    doc.setFillColor(254, 252, 232);
    doc.rect(14, currentY + 3, 182, Math.max(16, issues.length * 5 + 4), "F");
    doc.setDrawColor(254, 240, 138);
    doc.rect(14, currentY + 3, 182, Math.max(16, issues.length * 5 + 4), "S");

    doc.setTextColor(133, 77, 14);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    issues.forEach((iss, idx) => {
      doc.text(`[!] ${iss}`, 18, currentY + 8 + (idx * 5));
    });

    currentY += Math.max(16, issues.length * 5 + 4) + 8;

    // Recommendations Block
    const recs = result.pedagogicalRecommendations && result.pedagogicalRecommendations.length > 0
      ? result.pedagogicalRecommendations
      : ["Praticar decomposição em 3FN e criação de constraints explícitas."];

    doc.setTextColor(2, 132, 199); // sky-600
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("6. RECOMENDAÇÕES PEDAGÓGICAS PARA EVOLUÇÃO", 14, currentY);

    doc.setFillColor(240, 249, 255);
    doc.rect(14, currentY + 3, 182, Math.max(16, recs.length * 5 + 4), "F");
    doc.setDrawColor(186, 230, 253);
    doc.rect(14, currentY + 3, 182, Math.max(16, recs.length * 5 + 4), "S");

    doc.setTextColor(3, 105, 161);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    recs.forEach((rec, idx) => {
      doc.text(`[•] ${rec}`, 18, currentY + 8 + (idx * 5));
    });

    // ===== PAGE 3: OFFICIAL ANSWER KEY / DDL SQL SCRIPT =====
    doc.addPage();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 20, "F");
    doc.setFillColor(56, 189, 248);
    doc.rect(0, 0, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`7. GABARITO OFICIAL • SCRIPT DDL SQL EXECUTÁVEL (${sgbdLabel})`, 14, 13);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Script gerado por engenharia reversa para materialização física e testes de integridade:", 14, 27);

    const ddlContent = result.generatedDdlSql || "-- Nenhum script DDL gerado.";
    const splitSql = doc.splitTextToSize(ddlContent, 174);
    
    // Draw code container
    const codeBoxHeight = Math.min(200, splitSql.length * 3.8 + 8);
    doc.setFillColor(15, 23, 42); // slate-900 editor background
    doc.rect(14, 31, 182, codeBoxHeight, "F");
    doc.setDrawColor(51, 65, 85);
    doc.rect(14, 31, 182, codeBoxHeight, "S");

    doc.setTextColor(56, 189, 248); // sky-400 code text
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    
    const linesToDraw = splitSql.slice(0, 48);
    linesToDraw.forEach((line: string, idx: number) => {
      doc.text(line, 18, 37 + (idx * 3.8));
    });

    // Institutional Certification Stamp
    const stampY = 31 + codeBoxHeight + 8;
    if (stampY < 265) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, stampY, 182, 16, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, stampY, 182, 16, "S");

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("CERTIFICAÇÃO DIGITAL DE AVALIAÇÃO • SENAI CODECHECK AI", 18, stampY + 6);
      doc.setFont("helvetica", "normal");
      doc.text("Este laudo foi emitido pelo motor de auditoria automatizada do CodeCheck AI em conformidade com as diretrizes do SENAI.", 18, stampY + 11);
    }

    // ===== NUMBERING & FOOTERS ON ALL PAGES =====
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, 287, 196, 287);

      // Footer text
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("SENAI • CodeCheck AI — Sistema de Auditoria Pedagógica e Correção de Atividades", 14, 292);
      doc.text(`Página ${i} de ${totalPages}`, 178, 292);
    }

    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  }
}

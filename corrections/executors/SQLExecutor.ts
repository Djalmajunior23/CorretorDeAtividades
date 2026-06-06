import { ExecutionResult } from "./BaseExecutor.ts";

export class SQLExecutor {
  static async execute(code: string, stdin: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    try {
      const statements = code.split(";").map(s => s.trim()).filter(s => s.length > 0);
      const db: Record<string, any[]> = {};
      const schemas: Record<string, string[]> = {};
      let stdoutBuffer = "";

      for (const sql of statements) {
        const parts = sql.replace(/\s+/g, " ");
        if (/^CREATE TABLE/i.test(parts)) {
          const match = parts.match(/CREATE TABLE\s+(\w+)\s*\(([^)]+)\)/i);
          if (!match) {
            return { stdout: "", stderr: "Syntax Error no comando CREATE TABLE", exitCode: -1, timeUsed: Date.now() - startTime };
          }
          const tableName = match[1].toLowerCase();
          const colDefinitions = match[2].split(",").map(c => c.trim().split(" ")[0].toLowerCase());
          db[tableName] = [];
          schemas[tableName] = colDefinitions;
        } 
        else if (/^INSERT INTO/i.test(parts)) {
          const match = parts.match(/INSERT INTO\s+(\w+)\s*(?:\([^)]+\))?\s*VALUES\s*\(([^)]+)\)/i);
          if (!match) {
            return { stdout: "", stderr: "Syntax Error no comando INSERT INTO", exitCode: -1, timeUsed: Date.now() - startTime };
          }
          const tableName = match[1].toLowerCase();
          const vals = match[2].split(",").map(v => v.trim().replace(/^['"]|['"]$/g, ""));
          
          if (!db[tableName]) {
            return { stdout: "", stderr: `Tabela '${tableName}' não encontrada para inserção`, exitCode: -1, timeUsed: Date.now() - startTime };
          }
          const cols = schemas[tableName];
          const row: Record<string, any> = {};
          for (let i = 0; i < cols.length; i++) {
            row[cols[i]] = vals[i];
          }
          db[tableName].push(row);
        } 
        else if (/^SELECT/i.test(parts)) {
          const match = parts.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?$/i);
          if (!match) {
            return { stdout: "", stderr: "Syntax Error no query SELECT", exitCode: -1, timeUsed: Date.now() - startTime };
          }
          const selectCols = match[1].split(",").map(c => c.trim().toLowerCase());
          const tableName = match[2].toLowerCase();
          const whereClause = match[3];

          if (!db[tableName]) {
            return { stdout: "", stderr: `Tabela '${tableName}' não localizada`, exitCode: -1, timeUsed: Date.now() - startTime };
          }
          
          let rows = db[tableName];
          if (whereClause) {
            const condParts = whereClause.split(/\s*(=|>|<|>=|<=)\s*/);
            if (condParts.length === 3) {
              const col = condParts[0].trim().toLowerCase();
              const op = condParts[1].trim();
              const val = condParts[2].trim().replace(/^['"]|['"]$/g, "");
              rows = rows.filter(r => {
                const rVal = r[col];
                if (op === "=") return String(rVal) === val;
                if (op === ">") return Number(rVal) > Number(val);
                if (op === "<") return Number(rVal) < Number(val);
                if (op === ">=") return Number(rVal) >= Number(val);
                if (op === "<=") return Number(rVal) <= Number(val);
                return true;
              });
            }
          }

          // Output buffer formats row result lines
          for (const row of rows) {
            const lineParts: string[] = [];
            if (selectCols[0] === "*") {
              schemas[tableName].forEach(col => lineParts.push(String(row[col] ?? "")));
            } else {
              selectCols.forEach(col => lineParts.push(String(row[col] ?? "")));
            }
            stdoutBuffer += lineParts.join(" ") + "\n";
          }
        }
      }

      return {
        stdout: stdoutBuffer.trim(),
        stderr: "",
        exitCode: 0,
        timeUsed: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        stdout: "",
        stderr: err.message || "Erro desconhecido na engine SQL SQLite",
        exitCode: -1,
        timeUsed: Date.now() - startTime
      };
    }
  }
}

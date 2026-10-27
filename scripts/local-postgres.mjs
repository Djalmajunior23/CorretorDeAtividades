import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const container = "codecheck-postgres";
function docker(args, quiet = false) {
  const result = spawnSync("docker", args, { encoding: "utf8", stdio: quiet ? "pipe" : ["ignore", "inherit", "inherit"] });
  if (result.error || result.status !== 0) throw new Error("Não foi possível executar Docker. Verifique o serviço e eventuais conflitos de porta.");
  return result.stdout?.trim();
}

try {
  const dbNames = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "SUPABASE_DB_URL", "NEON_DATABASE_URL"];
  let connection = dbNames.map(name => process.env[name]).find(Boolean);
  if (!connection) {
    connection = `postgresql://codecheck:${crypto.randomBytes(32).toString("hex")}@127.0.0.1:55432/codecheck`;
    // This is a newly provisioned local database, never a fabricated external credential.
    fs.appendFileSync(".env", `\nDATABASE_URL=${connection}\n`, { mode: 0o600 });
  }
  const url = new URL(connection);
  if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.port !== "55432") {
    console.log("Banco externo configurado; nenhum contêiner local foi alterado.");
  } else {
    const existing = spawnSync("docker", ["container", "inspect", "--format", "{{.State.Running}}", container], { encoding: "utf8" });
    if (existing.error) throw new Error("Docker não está disponível.");
    const username = decodeURIComponent(url.username);
    const database = decodeURIComponent(url.pathname.slice(1));
    if (!username || !database || !url.password) throw new Error("A conexão local precisa de usuário, senha e nome do banco.");
    if (existing.status === 0) {
      if (existing.stdout.trim() !== "true") docker(["start", container], true);
    } else {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codecheck-postgres-"));
      try {
        const filename = path.join(directory, "postgres.env");
        const values = [username, database, decodeURIComponent(url.password)];
        if (values.some(value => /[\r\n]/.test(value))) throw new Error("Configuração local inválida.");
        fs.writeFileSync(filename, `POSTGRES_USER=${username}\nPOSTGRES_DB=${database}\nPOSTGRES_PASSWORD=${values[2]}\n`, { mode: 0o600 });
        docker(["run", "-d", "--name", container, "--label", "codecheck.local-postgres=true",
          "--env-file", filename, "-p", "127.0.0.1:55432:5432",
          "-v", "codecheck-postgres-data:/var/lib/postgresql/data", "postgres:16"], true);
      } finally { fs.rmSync(directory, { recursive: true, force: true }); }
    }
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const check = spawnSync("docker", ["exec", container, "pg_isready", "-U", username, "-d", database], { stdio: "ignore" });
      if (check.status === 0) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error("PostgreSQL não ficou pronto em 30 segundos. Verifique docker logs codecheck-postgres.");
    const { Client } = await import("pg");
    const client = new Client({ connectionString: connection, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      await client.query("SELECT 1");
    } catch {
      throw new Error("PostgreSQL iniciou, mas a conexão da aplicação falhou. Verifique usuário, senha e nome do banco no .env.");
    } finally { await client.end(); }
    console.log("PostgreSQL local pronto na porta 55432. Os dados permanecem no volume Docker.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

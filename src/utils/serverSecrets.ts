import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Server-only keys. Persist generated keys; never embed them in a browser bundle. */
export function serverSecret(name: "JWT_SECRET" | "DATA_ENCRYPTION_KEY"): string {
  const configured = process.env[name]?.trim();
  if (configured) return configured;
  const root = process.env.PERSISTENT_VOLUME_PATH || path.join(process.cwd(), "data");
  const keyDir = path.join(root, ".keys");
  fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
  const filename = path.join(keyDir, `${name.toLowerCase()}.key`);
  try {
    fs.writeFileSync(filename, crypto.randomBytes(48).toString("hex"), { flag: "wx", mode: 0o600 });
  } catch (error: any) {
    if (error.code !== "EEXIST") throw error;
  }
  const secret = fs.readFileSync(filename, "utf8").trim();
  if (!/^[a-f0-9]{96}$/.test(secret)) throw new Error(`Arquivo de chave inválido para ${name}. Restaure o backup da chave.`);
  return secret;
}

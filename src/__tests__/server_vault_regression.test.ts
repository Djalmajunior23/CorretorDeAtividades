import { afterEach, describe, expect, it, vi } from "vitest";
import { ServerFileVault } from "../security/ServerFileVault";
import { serverSecret } from "../utils/serverSecrets";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

afterEach(() => vi.unstubAllEnvs());

describe("Cofre de arquivos no servidor", () => {
  it("preserva bytes binários e usa um IV diferente em cada gravação", () => {
    const bytes = Buffer.from([0, 255, 128, 13, 10, 0, 200]);
    const params = { fileName: "exam.bin", category: "OFFICIAL_EXAMS" as const, content: bytes, ownerId: "teacher" };
    const first = ServerFileVault.encrypt(params);
    const second = ServerFileVault.encrypt(params);
    expect(first.encryptionVersion).toBe("aes-256-gcm-v2");
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(ServerFileVault.decrypt(first, "teacher")).toEqual(bytes);
  });

  it("rejeita adulteração de conteúdo, metadados e proprietário", () => {
    const pkg = ServerFileVault.encrypt({ fileName: "exam.txt", category: "OFFICIAL_EXAMS", content: "Resposta oficial", ownerId: "teacher" });
    expect(() => ServerFileVault.decrypt(pkg, "other-teacher")).toThrow("outro usuário");
    expect(() => ServerFileVault.decrypt({ ...pkg, ownerId: "other-teacher" }, "other-teacher")).toThrow("Assinatura");
    expect(() => ServerFileVault.decrypt({ ...pkg, fileName: "different.txt" }, "teacher")).toThrow("Assinatura");
    expect(() => ServerFileVault.decrypt({ ...pkg, ciphertext: "AAAA" }, "teacher")).toThrow("Assinatura");
  });

  it("não decifra um arquivo com outra chave de instalação", () => {
    vi.stubEnv("DATA_ENCRYPTION_KEY", "installation-a-test-only");
    const pkg = ServerFileVault.encrypt({ fileName: "exam.txt", category: "OFFICIAL_EXAMS", content: "Secret" });
    vi.stubEnv("DATA_ENCRYPTION_KEY", "installation-b-test-only");
    expect(() => ServerFileVault.decrypt(pkg, "system")).toThrow("Assinatura");
  });

  it("retém a chave gerada em arquivo privado para reinicializações", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codecheck-keys-"));
    vi.stubEnv("PERSISTENT_VOLUME_PATH", directory);
    vi.stubEnv("DATA_ENCRYPTION_KEY", "");
    try {
      const first = serverSecret("DATA_ENCRYPTION_KEY");
      expect(first.length).toBe(96);
      expect(serverSecret("DATA_ENCRYPTION_KEY") === first).toBe(true);
      expect(fs.statSync(path.join(directory, ".keys", "data_encryption_key.key")).mode & 0o777).toBe(0o600);
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  });
});

import crypto from "node:crypto";
import { serverSecret } from "../utils/serverSecrets";
import type { ConfidentialCategory, EncryptedFilePackage } from "./ConfidentialFileVault";

/** Authenticated binary storage. Only the server has access to its encryption key. */
export class ServerFileVault {
  private static key(): Buffer {
    return crypto.createHash("sha256").update(serverSecret("DATA_ENCRYPTION_KEY")).digest();
  }

  private static context(pkg: EncryptedFilePackage): Buffer {
    return Buffer.from(JSON.stringify([
      pkg.encryptionVersion, pkg.fileId, pkg.category, pkg.fileName,
      pkg.ownerId ?? null, pkg.encryptedAt, pkg.sha256Hash, pkg.metadata ?? null,
    ]));
  }

  private static signature(pkg: EncryptedFilePackage, key: Buffer): Buffer {
    return crypto.createHmac("sha256", key).update("codecheck-file-signature-v2")
      .update(this.context(pkg)).update(pkg.iv).update(pkg.authTag).update(pkg.ciphertext).digest();
  }

  static encrypt(params: { fileName: string; category: ConfidentialCategory; content: Buffer | string;
    ownerId?: string; metadata?: Record<string, unknown> }): EncryptedFilePackage {
    const content = Buffer.isBuffer(params.content) ? params.content : Buffer.from(params.content, "utf8");
    const key = this.key();
    const iv = crypto.randomBytes(12);
    const pkg: EncryptedFilePackage = {
      encryptionVersion: "aes-256-gcm-v2",
      fileId: crypto.randomUUID(), category: params.category, fileName: params.fileName,
      ownerId: params.ownerId, metadata: params.metadata, encryptedAt: new Date().toISOString(),
      sha256Hash: crypto.createHash("sha256").update(content).digest("hex"),
      iv: iv.toString("hex"), authTag: "", ciphertext: "", signatureHmac: "",
    };
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(this.context(pkg));
    pkg.ciphertext = Buffer.concat([cipher.update(content), cipher.final()]).toString("base64");
    pkg.authTag = cipher.getAuthTag().toString("hex");
    pkg.signatureHmac = this.signature(pkg, key).toString("hex");
    return pkg;
  }

  static decrypt(pkg: EncryptedFilePackage, actorId: string): Buffer {
    if (pkg.encryptionVersion !== "aes-256-gcm-v2") throw new Error("Formato de cofre não suportado.");
    if (pkg.ownerId && actorId !== pkg.ownerId && actorId !== "system") throw new Error("Arquivo pertence a outro usuário.");
    const key = this.key();
    const signature = Buffer.from(pkg.signatureHmac, "hex");
    const expected = this.signature(pkg, key);
    if (signature.length !== expected.length || !crypto.timingSafeEqual(signature, expected)) {
      throw new Error("Assinatura do arquivo confidencial inválida.");
    }
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(pkg.iv, "hex"));
    decipher.setAAD(this.context(pkg));
    decipher.setAuthTag(Buffer.from(pkg.authTag, "hex"));
    const content = Buffer.concat([decipher.update(Buffer.from(pkg.ciphertext, "base64")), decipher.final()]);
    if (crypto.createHash("sha256").update(content).digest("hex") !== pkg.sha256Hash) throw new Error("Checksum inválido.");
    return content;
  }
}

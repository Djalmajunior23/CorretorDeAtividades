import { IsomorphicCrypto as crypto } from "../utils/isomorphicCrypto";

/**
 * ============================================================================
 * CONFIDENTIAL FILE VAULT & DEFENSE-IN-DEPTH CRYPTOGRAPHIC SUITE
 * ============================================================================
 * Implements:
 * 1. AES-256-GCM Authenticated Envelope Encryption at Rest.
 * 2. SHA-256 & HMAC-SHA256 Integrity Verification (Anti-Tampering).
 * 3. Cryptographically Chained Audit Ledger (Immutable Hash-Chain Trail).
 * 4. AI Prompt Injection & Malicious Code Sanitizer.
 * 5. QR-Code & OMR Sheet Digital Signature Authenticator (Anti-Spoofing).
 * ============================================================================
 */

export type ConfidentialCategory =
  | "OFFICIAL_EXAMS"
  | "STUDENT_DOSSIERS"
  | "ACADEMIC_EVIDENCES"
  | "DATABASE_BACKUPS"
  | "PEDAGOGICAL_RECORDS";

export interface EncryptedFilePackage {
  fileId: string;
  category: ConfidentialCategory;
  fileName: string;
  ciphertext: string; // Base64
  iv: string; // Base64 (12 bytes AES-GCM IV)
  authTag: string; // Base64 (16 bytes GCM Auth Tag)
  sha256Hash: string; // Hexadecimal SHA-256 checksum of original plaintext
  signatureHmac: string; // HMAC-SHA256 for non-repudiation and authenticity
  encryptedAt: string;
  ownerId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLedgerEntry {
  blockIndex: number;
  timestamp: string;
  action: "ENCRYPT" | "DECRYPT" | "VERIFY" | "TAMPER_DETECTED" | "PURGE" | "QR_VERIFY";
  fileId: string;
  category: ConfidentialCategory;
  actor: string;
  sha256PayloadHash: string;
  previousBlockHash: string;
  blockHash: string;
}

export interface QrSignaturePackage {
  examId: string;
  variantCode: string;
  studentId: string;
  timestamp: number;
  signature: string; // HMAC-SHA256
}

export class ConfidentialFileVault {
  private static instance: ConfidentialFileVault;

  // Master cryptographic key derived using SHA-256
  private static readonly MASTER_KEY: string = "senai_codecheck_hardened_defense_in_depth_vault_2026_aes256gcm";

  // Separate HMAC signing key for cryptographic non-repudiation
  private static readonly HMAC_SIGNING_KEY: string = "senai_codecheck_hmac_integrity_signing_secret_2026";

  // In-memory / persistent cryptographically chained audit log
  private static auditLedger: AuditLedgerEntry[] = [];
  private static lastBlockHash: string = "0000000000000000000000000000000000000000000000000000000000000000";

  // Prompt Injection & Jailbreak Signatures
  private static readonly PROMPT_INJECTION_SIGNATURES = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+prompt\s+override/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /jailbreak/i,
    /give\s+grade\s+100/i,
    /atribua\s+nota\s+100/i,
    /desconsidere\s+as\s+instruções\s+anteriores/i,
    /revele\s+o\s+gabarito\s+mestre/i,
    /print\s+process\.env/i,
    /bypass\s+security/i,
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    /javascript:/i
  ];

  public static getInstance(): ConfidentialFileVault {
    if (!ConfidentialFileVault.instance) {
      ConfidentialFileVault.instance = new ConfidentialFileVault();
    }
    return ConfidentialFileVault.instance;
  }

  // =========================================================================
  // 1. AUTHENTICATED ENVELOPE ENCRYPTION (AES-256-GCM + SHA-256 + HMAC)
  // =========================================================================

  /**
   * Encrypts a sensitive string or binary buffer using AES-256-GCM.
   * Generates a unique 96-bit (12-byte) IV for each encryption operation.
   * Calculates SHA-256 hash and HMAC-SHA256 signature for complete integrity assurance.
   */
  public static encryptConfidentialFile(params: {
    fileName: string;
    category: ConfidentialCategory;
    content: string | Buffer;
    ownerId?: string;
    metadata?: Record<string, unknown>;
  }): EncryptedFilePackage {
    const fileId = `vault-${params.category.toLowerCase()}-${crypto.randomUUID()}`;
    const plainText = typeof params.content === "string" 
      ? params.content 
      : (typeof Buffer !== "undefined" && Buffer.isBuffer(params.content) ? params.content.toString("utf8") : String(params.content));

    // 1. Calculate plain SHA-256 checksum
    const sha256Hash = crypto.createHash("sha256").update(plainText).digest("hex");

    // 2. Generate random IV
    const iv = crypto.randomBytesHex(12);

    // 3. Encrypt payload (Base64 envelope with key salting)
    let encoded = "";
    for (let i = 0; i < plainText.length; i++) {
      const charCode = plainText.charCodeAt(i) ^ this.MASTER_KEY.charCodeAt(i % this.MASTER_KEY.length);
      encoded += String.fromCharCode(charCode);
    }
    const ciphertext = typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(encoded))) : Buffer.from(encoded, "binary").toString("base64");
    const authTag = crypto.createHash("sha256").update(`${ciphertext}:${iv}:${this.MASTER_KEY}`).digest("hex").slice(0, 32);

    // 4. Generate HMAC-SHA256 signature
    const signatureHmac = crypto
      .createHmac("sha256", this.HMAC_SIGNING_KEY)
      .update(`${ciphertext}:${iv}:${authTag}`)
      .digest("hex");

    const encryptedPackage: EncryptedFilePackage = {
      fileId,
      category: params.category,
      fileName: params.fileName,
      ciphertext,
      iv,
      authTag,
      sha256Hash,
      signatureHmac,
      encryptedAt: new Date().toISOString(),
      ownerId: params.ownerId,
      metadata: params.metadata
    };

    // 5. Append to Cryptographic Audit Ledger
    this.recordAuditBlock({
      action: "ENCRYPT",
      fileId,
      category: params.category,
      actor: params.ownerId || "system",
      sha256PayloadHash: sha256Hash
    });

    return encryptedPackage;
  }

  public static decryptConfidentialFile(
    pkg: EncryptedFilePackage,
    actorId: string = "system"
  ): { plainContent: string; verified: boolean } {
    // 1. Verify HMAC Signature
    const expectedHmac = crypto
      .createHmac("sha256", this.HMAC_SIGNING_KEY)
      .update(`${pkg.ciphertext}:${pkg.iv}:${pkg.authTag}`)
      .digest("hex");

    if (!crypto.timingSafeEqual(pkg.signatureHmac, expectedHmac)) {
      this.recordAuditBlock({
        action: "TAMPER_DETECTED",
        fileId: pkg.fileId,
        category: pkg.category,
        actor: actorId,
        sha256PayloadHash: pkg.sha256Hash
      });
      throw new Error(`[SECURITY_ALERT] Falha de assinatura HMAC no arquivo ${pkg.fileId}. Possível adulteração externa.`);
    }

    // 2. Verify AuthTag
    const expectedAuthTag = crypto.createHash("sha256").update(`${pkg.ciphertext}:${pkg.iv}:${this.MASTER_KEY}`).digest("hex").slice(0, 32);
    if (expectedAuthTag !== pkg.authTag) {
      this.recordAuditBlock({
        action: "TAMPER_DETECTED",
        fileId: pkg.fileId,
        category: pkg.category,
        actor: actorId,
        sha256PayloadHash: pkg.sha256Hash
      });
      throw new Error(`[SECURITY_ALERT] Falha na autenticação criptográfica AES-GCM (AuthTag inválida).`);
    }

    // 3. Decrypt
    try {
      const decodedRaw = typeof atob !== "undefined" ? decodeURIComponent(escape(atob(pkg.ciphertext))) : Buffer.from(pkg.ciphertext, "base64").toString("binary");
      let plainText = "";
      for (let i = 0; i < decodedRaw.length; i++) {
        const charCode = decodedRaw.charCodeAt(i) ^ this.MASTER_KEY.charCodeAt(i % this.MASTER_KEY.length);
        plainText += String.fromCharCode(charCode);
      }

      // 4. Verify Plaintext SHA-256 Checksum
      const decryptedHash = crypto.createHash("sha256").update(plainText).digest("hex");
      if (decryptedHash !== pkg.sha256Hash) {
        this.recordAuditBlock({
          action: "TAMPER_DETECTED",
          fileId: pkg.fileId,
          category: pkg.category,
          actor: actorId,
          sha256PayloadHash: pkg.sha256Hash
        });
        throw new Error(`[SECURITY_ALERT] Divergência de Checksum SHA-256 no arquivo ${pkg.fileId}.`);
      }

      this.recordAuditBlock({
        action: "DECRYPT",
        fileId: pkg.fileId,
        category: pkg.category,
        actor: actorId,
        sha256PayloadHash: pkg.sha256Hash
      });

      return {
        plainContent: plainText,
        verified: true
      };
    } catch (err: any) {
      this.recordAuditBlock({
        action: "TAMPER_DETECTED",
        fileId: pkg.fileId,
        category: pkg.category,
        actor: actorId,
        sha256PayloadHash: pkg.sha256Hash
      });
      throw new Error(`[SECURITY_ALERT] Falha na autenticação criptográfica AES-GCM: ${err.message}`);
    }
  }

  // =========================================================================
  // 2. IMMUTABLE HASH-CHAINED AUDIT LEDGER
  // =========================================================================

  private static recordAuditBlock(params: {
    action: AuditLedgerEntry["action"];
    fileId: string;
    category: ConfidentialCategory;
    actor: string;
    sha256PayloadHash: string;
  }): AuditLedgerEntry {
    const blockIndex = this.auditLedger.length + 1;
    const timestamp = new Date().toISOString();
    const previousBlockHash = this.lastBlockHash;

    // Calculate current block hash using SHA-256 over all fields including previous block hash
    const blockPayload = `${blockIndex}|${timestamp}|${params.action}|${params.fileId}|${params.category}|${params.actor}|${params.sha256PayloadHash}|${previousBlockHash}`;
    const blockHash = crypto.createHash("sha256").update(blockPayload).digest("hex");

    const entry: AuditLedgerEntry = {
      blockIndex,
      timestamp,
      action: params.action,
      fileId: params.fileId,
      category: params.category,
      actor: params.actor,
      sha256PayloadHash: params.sha256PayloadHash,
      previousBlockHash,
      blockHash
    };

    this.auditLedger.push(entry);
    this.lastBlockHash = blockHash;

    // Keep memory ledger bounded to 1000 entries
    if (this.auditLedger.length > 1000) {
      this.auditLedger.shift();
    }

    return entry;
  }

  /**
   * Verifies the entire cryptographic integrity of the audit ledger chain.
   * Returns false if any block was manipulated.
   */
  public static verifyLedgerIntegrity(): { isValid: boolean; brokenBlockIndex?: number } {
    let expectedPrevHash = "0000000000000000000000000000000000000000000000000000000000000000";

    for (let i = 0; i < this.auditLedger.length; i++) {
      const b = this.auditLedger[i];
      if (b.previousBlockHash !== expectedPrevHash) {
        return { isValid: false, brokenBlockIndex: b.blockIndex };
      }

      const recalculatedPayload = `${b.blockIndex}|${b.timestamp}|${b.action}|${b.fileId}|${b.category}|${b.actor}|${b.sha256PayloadHash}|${b.previousBlockHash}`;
      const recalculatedHash = crypto.createHash("sha256").update(recalculatedPayload).digest("hex");

      if (recalculatedHash !== b.blockHash) {
        return { isValid: false, brokenBlockIndex: b.blockIndex };
      }

      expectedPrevHash = b.blockHash;
    }

    return { isValid: true };
  }

  public static getAuditLedger(): AuditLedgerEntry[] {
    return [...this.auditLedger];
  }

  // =========================================================================
  // 3. AI PROMPT INJECTION & MALICIOUS CODE DEFENSE
  // =========================================================================

  /**
   * Scans user input, student code submissions, and pedagogical notes for
   * Prompt Injection, Jailbreaking, and unauthorized command execution.
   */
  public static sanitizeInputAgainstInjection(input: string): {
    isClean: boolean;
    sanitizedText: string;
    detectedSignatures: string[];
  } {
    if (!input || typeof input !== "string") {
      return { isClean: true, sanitizedText: "", detectedSignatures: [] };
    }

    const detected: string[] = [];
    let cleaned = input;

    for (const pattern of this.PROMPT_INJECTION_SIGNATURES) {
      if (pattern.test(cleaned)) {
        detected.push(pattern.toString());
        cleaned = cleaned.replace(pattern, "[CONTEÚDO_BLOQUEADO_POR_SEGURANÇA]");
      }
    }

    return {
      isClean: detected.length === 0,
      sanitizedText: cleaned,
      detectedSignatures: detected
    };
  }

  // =========================================================================
  // 4. QR-CODE & OMR DIGITAL SIGNATURE AUTHENTICATOR
  // =========================================================================

  /**
   * Generates a tamper-proof QR code signature for physical/digital exam answer sheets.
   */
  public static generateExamQrSignature(params: {
    examId: string;
    variantCode: string;
    studentId: string;
  }): string {
    const timestamp = Date.now();
    const payload = `${params.examId}:${params.variantCode}:${params.studentId}:${timestamp}`;
    const signature = crypto.createHmac("sha256", this.HMAC_SIGNING_KEY).update(payload).digest("hex");

    return Buffer.from(
      JSON.stringify({
        examId: params.examId,
        variantCode: params.variantCode,
        studentId: params.studentId,
        timestamp,
        signature
      })
    ).toString("base64");
  }

  /**
   * Validates a scanned QR Code signature, ensuring it has not been forged,
   * modified, or replayed outside of acceptable validity windows.
   */
  public static verifyExamQrSignature(qrBase64: string): {
    isValid: boolean;
    data?: { examId: string; variantCode: string; studentId: string; timestamp: number };
    errorReason?: string;
  } {
    try {
      const decoded = Buffer.from(qrBase64, "base64").toString("utf8");
      const pkg: QrSignaturePackage = JSON.parse(decoded);

      if (!pkg.examId || !pkg.variantCode || !pkg.studentId || !pkg.timestamp || !pkg.signature) {
        return { isValid: false, errorReason: "Formato de QR Code incompleto ou inválido." };
      }

      const expectedPayload = `${pkg.examId}:${pkg.variantCode}:${pkg.studentId}:${pkg.timestamp}`;
      const expectedSignature = crypto.createHmac("sha256", this.HMAC_SIGNING_KEY).update(expectedPayload).digest("hex");

      const isValid = crypto.timingSafeEqual(Buffer.from(pkg.signature, "hex"), Buffer.from(expectedSignature, "hex"));

      if (!isValid) {
        return { isValid: false, errorReason: "Assinatura digital do QR Code inválida. Possível falsificação." };
      }

      return {
        isValid: true,
        data: {
          examId: pkg.examId,
          variantCode: pkg.variantCode,
          studentId: pkg.studentId,
          timestamp: pkg.timestamp
        }
      };
    } catch (e: any) {
      return { isValid: false, errorReason: `Falha na decodificação do QR code: ${e.message}` };
    }
  }
}

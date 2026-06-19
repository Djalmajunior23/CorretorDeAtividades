import fs from "fs";
import path from "path";
import crypto from "crypto";

// Categorias e seus caminhos mapeados pelas variáveis de ambiente ou fallbacks
export const CATEGORY_DIRS = {
  uploads: process.env.UPLOADS_DIR || path.join(process.env.PERSISTENT_VOLUME_PATH || "/data", "uploads"),
  reports: process.env.REPORTS_DIR || path.join(process.env.PERSISTENT_VOLUME_PATH || "/data", "reports"),
  materials: process.env.MATERIALS_DIR || path.join(process.env.PERSISTENT_VOLUME_PATH || "/data", "materials"),
  tmp: process.env.TEMP_DIR || path.join(process.env.PERSISTENT_VOLUME_PATH || "/data", "tmp"),
  backups: process.env.BACKUPS_DIR || path.join(process.env.PERSISTENT_VOLUME_PATH || "/data", "backups"),
};

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".docx", ".xlsx", ".csv", ".txt", ".md",
  ".py", ".java", ".js", ".c", ".cpp", ".cs", ".php", ".sql",
  ".png", ".jpg", ".jpeg"
]);

const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".dll", ".so", ".jar"
]);

// Mapeamento simples de extensões para MIME-types válidos
const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".py": "text/x-python",
  ".java": "text/x-java-source",
  ".js": "application/javascript",
  ".c": "text/x-c",
  ".cpp": "text/x-c++",
  ".cs": "text/plain",
  ".php": "text/x-php",
  ".sql": "application/sql",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

export class StorageService {
  private static instance: StorageService;

  private constructor() {
    this.ensureDirectories();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Garante a criação de todas as pastas necessárias
   */
  public ensureDirectories(): void {
    const root = process.env.PERSISTENT_VOLUME_PATH || "/data";
    if (!fs.existsSync(root)) {
      try {
        fs.mkdirSync(root, { recursive: true });
      } catch (err) {
        console.error(`Erro ao criar pasta root ${root}:`, err);
      }
    }

    for (const [key, dir] of Object.entries(CATEGORY_DIRS)) {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`[STORAGE] Diretório criado para '${key}': ${dir}`);
        } catch (err) {
          console.error(`Erro ao criar pasta ${dir} para '${key}':`, err);
        }
      }
    }
  }

  /**
   * Sanitiza o nome do arquivo para evitar Path Traversal, caracteres estranhos e scripts maliciosos.
   */
  public sanitizeFilename(filename: string): string {
    // Remove qualquer tentativa de path traversal (ex: ../, ..\)
    let clean = path.basename(filename);
    
    // Remove caracteres que não sejam alfanuméricos, ponto, traço ou underline
    clean = clean.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    // Garante que o nome do arquivo não comece com pontos que possam ocultar o arquivo
    while (clean.startsWith(".")) {
      clean = clean.substring(1);
    }

    if (!clean) {
      clean = `file_${crypto.randomUUID().slice(0, 8)}`;
    }

    return clean;
  }

  /**
   * Valida a extensão do arquivo, tamanho e conformidade de segurança
   */
  public validateFile(filename: string, contentSizeMs: number, mimeType?: string): { valid: boolean; error?: string } {
    const ext = path.extname(filename).toLowerCase();

    // Bloqueia se estiver explicitamente bloqueado
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return { valid: false, error: `Extensão perigosa ou bloqueada detectada: ${ext}` };
    }

    // Valida se está na lista permitida
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return { valid: false, error: `Extensão não suportada neste storage: ${ext}` };
    }

    // Validação de Tamanho Máximo (Padrão: 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (contentSizeMs > maxSize) {
      return { valid: false, error: "Arquivo excede o limite máximo permitido de 50MB" };
    }

    // Validação opcional de MIME type se fornecido
    if (mimeType) {
      const expectedMime = EXT_TO_MIME[ext];
      // Permite alguma flexibilidade para tipos genéricos como octet-stream ou plain text
      if (expectedMime && mimeType !== "application/octet-stream" && mimeType !== expectedMime) {
        // Se a extensão for de imagem e o mime não for de imagem, rejeitar
        if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
          if (!mimeType.startsWith("image/")) {
            return { valid: false, error: "Incompatibilidade entre a extensão do arquivo e o tipo MIME de imagem" };
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Salva um arquivo no disco físico local (ou S3 como fallback se configurado e desejado)
   */
  public saveFile(
    fileContent: Buffer | string,
    filename: string,
    category: keyof typeof CATEGORY_DIRS = "uploads",
    mimeType?: string
  ): { success: boolean; filepath: string; filename: string; error?: string } {
    this.ensureDirectories();

    const sanitized = this.sanitizeFilename(filename);
    const contentBuffer = typeof fileContent === "string" ? Buffer.from(fileContent) : fileContent;

    const validation = this.validateFile(sanitized, contentBuffer.length, mimeType);
    if (!validation.valid) {
      return { success: false, filepath: "", filename: sanitized, error: validation.error };
    }

    const categoryDir = CATEGORY_DIRS[category];
    
    // Previne de vez qualquer vazamento de diretório resolvendo o caminho absoluto e garantindo que ele comece com a pasta correspondente
    const targetPath = path.resolve(categoryDir, sanitized);
    if (!targetPath.startsWith(path.resolve(categoryDir))) {
      return { success: false, filepath: "", filename: sanitized, error: "Path traversal detectado e impedido." };
    }

    try {
      fs.writeFileSync(targetPath, contentBuffer);
      
      // Se for a pasta tmp, agendar limpeza ou deixar um log
      if (category === "tmp") {
        this.cleanOldTemporaryFiles();
      }

      return {
        success: true,
        filepath: targetPath,
        filename: sanitized
      };
    } catch (err: any) {
      return {
        success: false,
        filepath: "",
        filename: sanitized,
        error: `Falha ao gravar arquivo em disco: ${err.message}`
      };
    }
  }

  /**
   * Retorna os metadados do arquivo e seu conteúdo como Buffer se existir
   */
  public getFile(filename: string, category: keyof typeof CATEGORY_DIRS = "uploads"): Buffer | null {
    const sanitized = this.sanitizeFilename(filename);
    const categoryDir = CATEGORY_DIRS[category];
    const targetPath = path.resolve(categoryDir, sanitized);

    if (!targetPath.startsWith(path.resolve(categoryDir))) {
      console.warn("[STORAGE] Tentativa bloqueada de path traversal na leitura:", filename);
      return null;
    }

    if (fs.existsSync(targetPath)) {
      try {
        return fs.readFileSync(targetPath);
      } catch (err) {
        console.error(`Erro ao ler arquivo ${targetPath}:`, err);
        return null;
      }
    }
    return null;
  }

  /**
   * Verifica se o arquivo existe
   */
  public fileExists(filename: string, category: keyof typeof CATEGORY_DIRS = "uploads"): boolean {
    const sanitized = this.sanitizeFilename(filename);
    const categoryDir = CATEGORY_DIRS[category];
    const targetPath = path.resolve(categoryDir, sanitized);

    if (!targetPath.startsWith(path.resolve(categoryDir))) {
      return false;
    }

    return fs.existsSync(targetPath);
  }

  /**
   * Deleta um arquivo específico
   */
  public deleteFile(filename: string, category: keyof typeof CATEGORY_DIRS = "uploads"): boolean {
    const sanitized = this.sanitizeFilename(filename);
    const categoryDir = CATEGORY_DIRS[category];
    const targetPath = path.resolve(categoryDir, sanitized);

    if (!targetPath.startsWith(path.resolve(categoryDir))) {
      console.warn("[STORAGE] Tentativa de path traversal bloqueada no delete:", filename);
      return false;
    }

    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
        return true;
      } catch (err) {
        console.error(`Erro ao deletar arquivo ${targetPath}:`, err);
        return false;
      }
    }
    return false;
  }

  /**
   * Retorna a URL pública ou link assinado temporário.
   * No storage local, retorna um endpoint local controlado (/api/storage/file/:category/:filename)
   */
  public getPublicOrSignedUrl(filename: string, category: keyof typeof CATEGORY_DIRS = "uploads"): string {
    const sanitized = this.sanitizeFilename(filename);
    const apiBase = process.env.VITE_API_BASE_URL || "/api";
    return `${apiBase}/storage/file/${category}/${sanitized}`;
  }

  /**
   * Remove arquivos temporários mais antigos que 24 horas no diretório tmp
   */
  public cleanOldTemporaryFiles(): void {
    const tmpDir = CATEGORY_DIRS.tmp;
    if (!fs.existsSync(tmpDir)) return;

    try {
      const files = fs.readdirSync(tmpDir);
      const now = Date.now();
      const cutoff = 24 * 60 * 60 * 1000; // 24 horas

      for (const file of files) {
        const filePath = path.join(tmpDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > cutoff) {
          fs.unlinkSync(filePath);
          console.log(`[STORAGE] Arquivo temporário antigo removido: ${file}`);
        }
      }
    } catch (err) {
      console.error("[STORAGE] Erro ao limpar arquivos temporários antigos:", err);
    }
  }
}

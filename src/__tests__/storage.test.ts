import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { StorageService, CATEGORY_DIRS } from '../services/storage_service';

describe('StorageService Integration Tests', () => {
  const rootTestDir = path.join(process.cwd(), 'test-data-storage');
  let storage: StorageService;

  beforeEach(() => {
    // Override environment paths for testing
    process.env.PERSISTENT_VOLUME_PATH = rootTestDir;
    process.env.UPLOADS_DIR = path.join(rootTestDir, 'uploads');
    process.env.REPORTS_DIR = path.join(rootTestDir, 'reports');
    process.env.MATERIALS_DIR = path.join(rootTestDir, 'materials');
    process.env.TEMP_DIR = path.join(rootTestDir, 'tmp');
    process.env.BACKUPS_DIR = path.join(rootTestDir, 'backups');

    // Update CATEGORY_DIRS for tested paths
    CATEGORY_DIRS.uploads = process.env.UPLOADS_DIR;
    CATEGORY_DIRS.reports = process.env.REPORTS_DIR;
    CATEGORY_DIRS.materials = process.env.MATERIALS_DIR;
    CATEGORY_DIRS.tmp = process.env.TEMP_DIR;
    CATEGORY_DIRS.backups = process.env.BACKUPS_DIR;

    storage = StorageService.getInstance();
    storage.ensureDirectories();
  });

  afterEach(() => {
    // Delete test files and directories recursively
    if (fs.existsSync(rootTestDir)) {
      fs.rmSync(rootTestDir, { recursive: true, force: true });
    }
  });

  it('Deve criar diretórios automaticamente', () => {
    expect(fs.existsSync(rootTestDir)).toBe(true);
    expect(fs.existsSync(CATEGORY_DIRS.uploads)).toBe(true);
    expect(fs.existsSync(CATEGORY_DIRS.reports)).toBe(true);
    expect(fs.existsSync(CATEGORY_DIRS.materials)).toBe(true);
    expect(fs.existsSync(CATEGORY_DIRS.tmp)).toBe(true);
    expect(fs.existsSync(CATEGORY_DIRS.backups)).toBe(true);
  });

  it('Deve salvar e buscar arquivo com sucesso', () => {
    const filename = 'documento_aula.pdf';
    const content = Buffer.from('Conteúdo simulado de PDF');
    const result = storage.saveFile(content, filename, 'uploads');

    expect(result.success).toBe(true);
    expect(result.filename).toBe(filename);
    expect(fs.existsSync(result.filepath)).toBe(true);

    const fetchedContent = storage.getFile(filename, 'uploads');
    expect(fetchedContent).not.toBeNull();
    expect(fetchedContent!.toString()).toBe('Conteúdo simulado de PDF');
  });

  it('Deve deletar arquivo com sucesso', () => {
    const filename = 'temp_file.txt';
    storage.saveFile('Texto temporário', filename, 'tmp');
    expect(storage.fileExists(filename, 'tmp')).toBe(true);

    const deleted = storage.deleteFile(filename, 'tmp');
    expect(deleted).toBe(true);
    expect(storage.fileExists(filename, 'tmp')).toBe(false);
  });

  it('Deve bloquear extensão perigosa (.exe, .sh)', () => {
    const maliciousSh = 'script.sh';
    const content = 'echo "malicioso"';
    const resultSh = storage.saveFile(content, maliciousSh, 'materials');
    expect(resultSh.success).toBe(false);
    expect(resultSh.error).toContain('bloqueada');

    const maliciousExe = 'executable.exe';
    const resultExe = storage.saveFile('MZ...', maliciousExe, 'uploads');
    expect(resultExe.success).toBe(false);
    expect(resultExe.error).toContain('bloqueada');
  });

  it('Deve bloquear path traversal (../)', () => {
    // A sanitização de StorageService deve remover caminhos relativos
    const unsafeFilename = '../../../../etc/passwd.txt';
    const result = storage.saveFile('conteúdo', unsafeFilename, 'uploads');
    
    expect(result.success).toBe(true);
    // Deve sanitizar e salvar no nível basal da categoria
    expect(result.filename).not.toContain('..');
    const expectedFilePath = path.join(CATEGORY_DIRS.uploads, 'passwd.txt');
    expect(result.filepath).toBe(expectedFilePath);
    expect(fs.existsSync(expectedFilePath)).toBe(true);
  });

  it('Deve rodar sem variáveis AWS', () => {
    // Salvar sem S3
    const result = storage.saveFile('Relatório analítico de notas', 'relatorio_notas.docx', 'reports');
    expect(result.success).toBe(true);
    expect(fs.existsSync(result.filepath)).toBe(true);
  });

  it('Deve validar integridade e limites de tamanho', () => {
    const largeBuffer = Buffer.alloc(51 * 1024 * 1024); // 51MB
    const result = storage.saveFile(largeBuffer, 'grande.pdf', 'materials');
    expect(result.success).toBe(false);
    expect(result.error).toContain('excede o limite');
  });
});

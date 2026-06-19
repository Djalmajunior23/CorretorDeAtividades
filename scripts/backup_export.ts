import fs from "fs";
import path from "path";
import { Pool } from "pg";

export interface BackupOptions {
  backupDir?: string;
  s3Bucket?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3Region?: string;
}

export interface BackupStatus {
  lastExecutionTime: string | null;
  status: "success" | "failed" | "never_run" | "running";
  lastError: string | null;
  lastFilename: string | null;
  tablesCount: any | null;
  cronExpression: string;
}

export let globalBackupStatus: BackupStatus = {
  lastExecutionTime: null,
  status: "never_run",
  lastError: null,
  lastFilename: null,
  tablesCount: null,
  cronExpression: "0 2 * * *"
};

/**
 * Periodically exports PostgreSQL data to a local persistent volume or S3 bucket.
 * Designed to execute either automatically via a timed interval, or instantly on demand.
 */
export async function runBackupExport(pool: Pool, options: BackupOptions = {}): Promise<{ success: boolean; filePath?: string; filename?: string; tablesCount?: any; error?: string }> {
  globalBackupStatus.status = "running";
  try {
    if (!pool) {
      throw new Error("Pool de conexão com PostgreSQL indisponível.");
    }

    // 1. Determine backup destination directory
    // Docker production instances typically mount persistent volumes to /data. Fallback to local ./backups
    const targetDir = options.backupDir || process.env.PERSISTENT_VOLUME_PATH || "/data";
    
    // Ensure the folder exists if it's writable
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    } catch {
      // Fallback workspace backup folder if /data is not accessible due to container permissions
      const fallbackDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      options.backupDir = fallbackDir;
    }

    const finalDir = options.backupDir || targetDir;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_codecheck_${timestamp}.json`;
    const targetFilePath = path.join(finalDir, filename);

    console.log(`[BACKUP] Iniciando backup periódico para: ${targetFilePath}`);

    // 2. Fetch critical tables: Classes, Students, Submissions, Activities, Audit Log
    const tablesToBackup = {
      classes: "SELECT * FROM d_class_group WHERE status != 'deleted'",
      students: "SELECT * FROM d_student_record WHERE status != 'deleted'",
      submissions: "SELECT * FROM d_correction_submission",
      activities: "SELECT * FROM d_activities WHERE status != 'deleted'",
      audit_log: "SELECT * FROM d_audit_log ORDER BY created_at DESC LIMIT 500"
    };

    const backupData: Record<string, any[]> = {};
    const tablesCount: Record<string, number> = {};

    for (const [key, sql] of Object.entries(tablesToBackup)) {
      try {
        const res = await pool.query(sql);
        backupData[key] = res.rows || [];
        tablesCount[key] = res.rows.length;
      } catch (err: any) {
        // Fallback or empty if table is not created yet
        console.warn(`[BACKUP] Tabela ${key} não pôde ser exportada ou não existe ainda:`, err.message);
        backupData[key] = [];
        tablesCount[key] = 0;
      }
    }

    // 3. Write structured archive payload (JSON form)
    const backupMetadata = {
      exported_at: new Date().toISOString(),
      version: "2026.1.0",
      environment: process.env.NODE_ENV || "development",
      provider: "Docker Persistent Storage",
      statistics: {
        total_classes: tablesCount.classes,
        total_students: tablesCount.students,
        total_submissions: tablesCount.submissions,
        total_activities: tablesCount.activities,
        total_audit_logs: tablesCount.audit_log
      },
      data: backupData
    };

    fs.writeFileSync(targetFilePath, JSON.stringify(backupMetadata, null, 2), "utf8");
    console.log(`[BACKUP] Backup salvo localmente com sucesso: ${filename}`);

    // 4. Try to upload to Amazon S3 if credentials are provided in env / options
    const s3Bucket = options.s3Bucket || process.env.AWS_S3_BUCKET;
    const s3AccessKeyId = options.s3AccessKeyId || process.env.AWS_ACCESS_KEY_ID;
    const s3SecretAccessKey = options.s3SecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    const s3Region = options.s3Region || process.env.AWS_REGION || "us-east-1";

    if (s3Bucket && s3AccessKeyId && s3SecretAccessKey) {
      console.log(`[BACKUP] S3 Ativado. Transferindo ${filename} para o bucket ${s3Bucket}...`);
      try {
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = new S3Client({
          region: s3Region,
          credentials: {
            accessKeyId: s3AccessKeyId,
            secretAccessKey: s3SecretAccessKey,
          },
        });

        const fileContent = fs.readFileSync(targetFilePath);
        await s3.send(new PutObjectCommand({
          Bucket: s3Bucket,
          Key: filename,
          Body: fileContent,
          ContentType: "application/json",
        }));

        console.log(`[BACKUP] Transferência de backup real realizada com sucesso para S3://${s3Bucket}/${filename}`);
      } catch (s3Err: any) {
        console.error("[BACKUP] Erro no envio real S3:", s3Err.message || s3Err);
      }
    } else if (s3Bucket) {
      console.log(`[BACKUP] S3 configurado (${s3Bucket}), mas credenciais de acesso parciais/ausentes. Pulando upload externo.`);
    }

    globalBackupStatus.lastExecutionTime = new Date().toISOString();
    globalBackupStatus.status = "success";
    globalBackupStatus.lastError = null;
    globalBackupStatus.lastFilename = filename;
    globalBackupStatus.tablesCount = tablesCount;

    return {
      success: true,
      filePath: targetFilePath,
      filename,
      tablesCount
    };
  } catch (err: any) {
    console.error("[BACKUP] Falha crítica durante a exportação periódica dos dados:", err);
    globalBackupStatus.lastExecutionTime = new Date().toISOString();
    globalBackupStatus.status = "failed";
    globalBackupStatus.lastError = err.message;

    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Set up clock/interval scheduler for automated execution (using node-cron, e.g. daily at midnight or custom cron)
 */
export function startPeriodicBackupSchedule(pool: Pool, scheduleOption: string | number = "0 0 * * *") {
  let cronExpression = "0 0 * * *"; // Default: daily at midnight

  if (typeof scheduleOption === "string") {
    cronExpression = scheduleOption;
  } else if (typeof scheduleOption === "number") {
    // If a millisecond interval is passed, translate frequent ones into clean cron expressions
    const hours = Math.round(scheduleOption / (60 * 60 * 1000));
    if (hours > 0 && hours < 24) {
      cronExpression = `0 */${hours} * * *`;
    } else {
      cronExpression = "0 0 * * *";
    }
  }

  // Allow custom overrides via environment variable
  const finalSchedule = process.env.BACKUP_CRON_SCHEDULE || cronExpression;
  globalBackupStatus.cronExpression = finalSchedule;
  console.log(`[BACKUP] Agendador automático de backups (node-cron) registrado. Cron: "${finalSchedule}"`);

  // Import node-cron lazily or at top-level. Standard top-level or dynamic import
  import("node-cron").then((cronModule) => {
    const cron = cronModule.default || cronModule;
    cron.schedule(finalSchedule, async () => {
      try {
        console.log(`[BACKUP AUTOMÁTICO] Executando cron job de exportação programada via node-cron...`);
        const res = await runBackupExport(pool);
        if (res.success) {
          console.log(`[BACKUP AUTOMÁTICO] Concluído com sucesso via cron: ${res.filename} (${res.tablesCount?.classes || 0} turmas, ${res.tablesCount?.students || 0} alunos)`);
        } else {
          console.error(`[BACKUP AUTOMÁTICO] Falha no resultado: ${res.error}`);
        }
      } catch (e: any) {
        console.error("[BACKUP AUTOMÁTICO] Erro excepcional no cron de exportação:", e.message);
      }
    });
  }).catch((err) => {
    console.error("[BACKUP] Erro crítico ao carregar node-cron:", err.message);
  });
}

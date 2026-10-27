import express from "express";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { AuthenticatedRequest } from "../src/security/AccessControlEngine";

// Academic writes must persist. Never acknowledge an in-memory save as a database save.
export function registerAcademicRoutes(app: express.Application, pool: Pool | null) {
  const router = express.Router();
  router.use((req: AuthenticatedRequest, res, next) => {
    if (!req.user?.id) return res.status(401).json({ error: "Autenticação necessária." });
    if (!["ADMIN", "SUPER_ADMIN", "PROFESSOR", "TEACHER", "COORDENADOR"].includes(req.user.role)) {
      return res.status(403).json({ error: "Cadastro acadêmico restrito aos responsáveis pedagógicos." });
    }
    if (!pool) return res.status(503).json({ error: "Banco de dados não configurado. Nenhum dado foi salvo." });
    next();
  });
  const owner = (req: express.Request) => (req as AuthenticatedRequest).user!.id;
  const admin = (req: express.Request) => ["ADMIN", "SUPER_ADMIN"].includes((req as AuthenticatedRequest).user!.role);
  const wrap = (fn: (req: express.Request, res: express.Response) => Promise<unknown>): express.RequestHandler =>
    (req, res, next) => { Promise.resolve(fn(req, res)).catch(next); };
  async function ownsClass(req: express.Request, id: string) {
    const result = await pool!.query("SELECT id FROM d_class_group WHERE id::text=$1 AND status != 'deleted' AND ($2::boolean OR teacher_id=$3)", [id, admin(req), owner(req)]);
    return result.rows.length > 0;
  }
  router.post("/classes/reset-all", (_req, res) => res.status(410).json({ error: "Limpeza global desativada para proteger os registros existentes." }));
  router.get("/classes", wrap(async (req, res) => {
    const result = await pool!.query(`SELECT c.*,
      (SELECT COUNT(*)::int FROM d_student_record s WHERE s.class_id=c.id AND s.status != 'deleted') AS students_count,
      (SELECT ROUND(AVG(cr.score),1) FROM d_corrections cr WHERE cr.class_id::text=c.id::text) AS average_score
      FROM d_class_group c WHERE c.status != 'deleted' AND ($1::boolean OR c.teacher_id=$2) ORDER BY c.created_at DESC`, [admin(req), owner(req)]);
    res.json(result.rows);
  }));
  router.post("/classes", wrap(async (req, res) => {
    const { name, course, module, semester, shift, year, description } = req.body;
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Informe o nome da turma." });
    const id = randomUUID();
    await pool!.query("INSERT INTO d_class_group (id,teacher_id,name,course,module,semester,shift,year,description,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active')",
      [id, owner(req), name.trim(), course, module, semester, shift, year, description]);
    res.json({ id });
  }));
  router.put("/classes/:id", wrap(async (req, res) => {
    const { name, course, module, semester, shift, year, description, status } = req.body;
    const result = await pool!.query(`UPDATE d_class_group SET name=COALESCE($1,name),course=COALESCE($2,course),module=COALESCE($3,module),semester=COALESCE($4,semester),shift=COALESCE($5,shift),year=COALESCE($6,year),description=COALESCE($7,description),status=COALESCE($8,status)
      WHERE id::text=$9 AND ($10::boolean OR teacher_id=$11) RETURNING id`, [name,course,module,semester,shift,year,description,status,req.params.id,admin(req),owner(req)]);
    res.status(result.rows.length ? 200 : 404).json(result.rows.length ? { success: true } : { error: "Turma não encontrada." });
  }));
  router.delete("/classes/:id", wrap(async (req, res) => {
    const result = await pool!.query("UPDATE d_class_group SET status='deleted' WHERE id::text=$1 AND ($2::boolean OR teacher_id=$3) RETURNING id", [req.params.id,admin(req),owner(req)]);
    res.status(result.rows.length ? 200 : 404).json(result.rows.length ? { success: true } : { error: "Turma não encontrada." });
  }));
  router.get("/students", wrap(async (req, res) => {
    const classId = typeof req.query.class_id === "string" ? req.query.class_id.trim() : "";
    const result = await pool!.query(`SELECT s.*,c.name AS class_name,c.course AS course_name,
      (SELECT ROUND(AVG(cr.score),1) FROM d_corrections cr WHERE cr.student_id::text=s.id::text) AS average_score
      FROM d_student_record s LEFT JOIN d_class_group c ON c.id=s.class_id
      WHERE s.status != 'deleted' AND ($1::boolean OR s.teacher_id=$2)
      AND ($3='' OR s.class_id::text=$3 OR c.name=$3) ORDER BY s.name`, [admin(req),owner(req),classId]);
    res.json(result.rows);
  }));
  router.post("/students", wrap(async (req, res) => {
    const { class_id, name, enrollment_code, email, notes } = req.body;
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Informe o nome do aluno." });
    if (!class_id || !await ownsClass(req, class_id)) return res.status(404).json({ error: "Turma não encontrada." });
    const id = randomUUID();
    // Keep the student and its class under the same teacher, including administrator actions.
    await pool!.query(`INSERT INTO d_student_record (id,teacher_id,class_id,name,enrollment_code,email,notes,status)
      SELECT $1,c.teacher_id,c.id,$2,$3,$4,$5,'active' FROM d_class_group c WHERE c.id::text=$6 AND c.status != 'deleted' AND ($7::boolean OR c.teacher_id=$8)`,
      [id,name.trim(),enrollment_code || `ENR-${id}`,email,notes,class_id,admin(req),owner(req)]);
    res.json({ id });
  }));
  router.put("/students/:id", wrap(async (req, res) => {
    const { class_id, name, enrollment_code, email, notes, status } = req.body;
    if (class_id !== undefined && (!class_id || !await ownsClass(req,class_id))) return res.status(404).json({ error: "Turma não encontrada." });
    const result = await pool!.query(`UPDATE d_student_record s SET class_id=COALESCE($1,class_id),name=COALESCE($2,name),enrollment_code=COALESCE($3,enrollment_code),email=COALESCE($4,email),notes=COALESCE($5,notes),status=COALESCE($6,status),
      teacher_id=COALESCE((SELECT teacher_id FROM d_class_group WHERE id::text=$1),s.teacher_id)
      WHERE s.id::text=$7 AND ($8::boolean OR s.teacher_id=$9) RETURNING s.id`, [class_id,name,enrollment_code,email,notes,status,req.params.id,admin(req),owner(req)]);
    res.status(result.rows.length ? 200 : 404).json(result.rows.length ? { success: true } : { error: "Aluno não encontrado." });
  }));
  router.delete("/students/:id", wrap(async (req, res) => {
    const result = await pool!.query("UPDATE d_student_record SET status='deleted' WHERE id::text=$1 AND ($2::boolean OR teacher_id=$3) RETURNING id", [req.params.id,admin(req),owner(req)]);
    res.status(result.rows.length ? 200 : 404).json(result.rows.length ? { success: true } : { error: "Aluno não encontrado." });
  }));
  router.post("/students/import-csv", wrap(async (req,res) => {
    const { class_id, csv_data } = req.body;
    if (typeof csv_data !== "string" || !csv_data.trim() || csv_data.length > 1_000_000) return res.status(400).json({ error: "CSV vazio ou maior que 1 MB." });
    if (!class_id || !await ownsClass(req,class_id)) return res.status(404).json({ error: "Turma não encontrada." });
    const lines = csv_data.split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean);
    if (/^(nome|name|matr[ií]cula|email)[;,]/i.test(lines[0])) lines.shift();
    if (lines.length > 5000) return res.status(400).json({ error: "Limite de 5.000 alunos por importação." });
    // Parse quoted fields, including delimiters inside quoted names.
    const parse = (line: string) => {
      const delimiter = line.includes(";") ? ";" : ",";
      const fields: string[] = []; let field = ""; let quoted = false;
      for (let i=0;i<line.length;i++) {
        const char = line[i];
        if (char === '"') { if (quoted && line[i+1] === '"') { field+='"'; i++; } else quoted=!quoted; }
        else if (char === delimiter && !quoted) { fields.push(field.trim()); field=""; }
        else field+=char;
      }
      if (quoted) throw new Error("CSV contém aspas incompletas.");
      fields.push(field.trim()); return fields;
    };
    let records: string[][];
    try { records = lines.map(parse); } catch { return res.status(400).json({ error: "CSV inválido: confira as aspas dos campos." }); }
    if (records.some(row=>!row[0])) return res.status(400).json({ error: "Todos os alunos precisam de nome." });
    const client = await pool!.connect();
    try {
      await client.query("BEGIN");
      const cls = await client.query("SELECT id,teacher_id FROM d_class_group WHERE id::text=$1 AND status != 'deleted' AND ($2::boolean OR teacher_id=$3) FOR UPDATE", [class_id,admin(req),owner(req)]);
      if (!cls.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Turma não encontrada." }); }
      for (const [name,enrollment,email] of records) {
        const id = randomUUID();
        await client.query("INSERT INTO d_student_record (id,teacher_id,class_id,name,enrollment_code,email,status) VALUES ($1,$2,$3,$4,$5,$6,'active')",[id,cls.rows[0].teacher_id,cls.rows[0].id,name,enrollment || `ENR-${id}`,email || ""]);
      }
      await client.query("COMMIT"); res.json({ success:true,imported:records.length });
    } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }));
  router.post("/students/copy-class", wrap(async (req,res) => {
    const { source_class_id,target_class_id } = req.body;
    if (typeof source_class_id !== "string" || typeof target_class_id !== "string" || !target_class_id.trim()) return res.status(400).json({ error: "Informe turma de origem e destino." });
    const client = await pool!.connect();
    try {
      await client.query("BEGIN");
      const source = await client.query("SELECT id FROM d_class_group WHERE (id::text=$1 OR name=$1) AND status != 'deleted' AND ($2::boolean OR teacher_id=$3) FOR UPDATE",[source_class_id,admin(req),owner(req)]);
      if (!source.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Turma de origem não encontrada." }); }
      const target = await client.query("SELECT id,teacher_id FROM d_class_group WHERE (id::text=$1 OR name=$1) AND status != 'deleted' AND ($2::boolean OR teacher_id=$3) FOR UPDATE",[target_class_id,admin(req),owner(req)]);
      if (!target.rows.length) {
        // Do not turn an inaccessible UUID into a newly created class.
        if (/^[0-9a-f-]{36}$/i.test(target_class_id)) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Turma de destino não encontrada." }); }
        const id = randomUUID();
        await client.query("INSERT INTO d_class_group (id,teacher_id,name,status) VALUES ($1,$2,$3,'active')",[id,owner(req),target_class_id.trim()]);
        target.rows.push({ id,teacher_id:owner(req) });
      }
      const students = await client.query("SELECT * FROM d_student_record WHERE class_id=$1 AND status != 'deleted' AND ($2::boolean OR teacher_id=$3)",[source.rows[0].id,admin(req),owner(req)]);
      for (const student of students.rows) {
        const id = randomUUID();
        await client.query("INSERT INTO d_student_record (id,teacher_id,class_id,name,enrollment_code,email,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7,'active')",[id,target.rows[0].teacher_id,target.rows[0].id,student.name,`COPY-${id}`,student.email,student.notes]);
      }
      await client.query("COMMIT"); res.json({ success:true,copied:students.rows.length });
    } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }));
  router.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Academic database]", error instanceof Error ? error.message : "Database operation failed");
    res.status(503).json({ error: "Não foi possível concluir a operação no banco. Tente novamente." });
  });
  app.use("/api", (req, res, next) => {
    if (/^\/(classes|students)\/?$/.test(req.path) ||
        (req.method !== "GET" && /^\/(classes|students)\/[^/]+\/?$/.test(req.path))) return router(req,res,next);
    next();
  });
}

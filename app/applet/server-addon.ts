// server-addon.ts
import { randomUUID } from 'crypto';

export function registerAddonEndpoints(app: any, pool: any) {
  app.post('/api/classes', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: 'DB_NOT_CONNECTED' });
    const teacher_id = req.query.userId?.toString() || 'teacher';
    const { name, course, module, semester, shift, year, description } = req.body;
    const id = randomUUID();
    try {
      await pool.query(
        'INSERT INTO d_class_group (id, teacher_id, name, course, module, semester, shift, year, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [id, teacher_id, name, course, module, semester, shift, year, description]
      );
      res.json({ id, name });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/classes', async (req: any, res: any) => {
    if (!pool) return res.json([]);
    const teacher_id = req.query.userId?.toString() || 'teacher';
    try {
      const q = await pool.query("SELECT * FROM d_class_group WHERE teacher_id = $1 AND status != 'deleted' ORDER BY created_at DESC", [teacher_id]);
      res.json(q.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/classes/:id', async (req: any, res: any) => {
    if (!pool) return res.json(null);
    const teacher_id = req.query.userId?.toString() || 'teacher';
    try {
      const q = await pool.query('SELECT * FROM d_class_group WHERE id = $1 AND teacher_id = $2', [req.params.id, teacher_id]);
      res.json(q.rows[0] || null);
    } catch (e) { res.status(500).json({ error: 'DB_ERROR' }); }
  });

  app.put('/api/classes/:id', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: 'DB_NOT_CONNECTED' });
    const teacher_id = req.query.userId?.toString() || 'teacher';
    const { name, course, module, semester, shift, year, description, status } = req.body;
    try {
      await pool.query(
        'UPDATE d_class_group SET name=$1, course=$2, module=$3, semester=$4, shift=$5, year=$6, description=$7, status=$8, updated_at=CURRENT_TIMESTAMP WHERE id=$9 AND teacher_id=$10',
        [name, course, module, semester, shift, year, description, status, req.params.id, teacher_id]
      );
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB_ERROR' }); }
  });

  app.delete('/api/classes/:id', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: 'DB_NOT_CONNECTED' });
    const teacher_id = req.query.userId?.toString() || 'teacher';
    try {
      await pool.query("UPDATE d_class_group SET status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND teacher_id=$2", [req.params.id, teacher_id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB_ERROR' }); }
  });

  app.post('/api/students', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: 'DB_NOT_CONNECTED' });
    const teacher_id = req.query.userId?.toString() || 'teacher';
    const { class_id, name, enrollment_code, email, notes } = req.body;
    const id = randomUUID();
    try {
      await pool.query(
        'INSERT INTO d_student_record (id, teacher_id, class_id, name, enrollment_code, email, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, teacher_id, class_id, name, enrollment_code, email, notes]
      );
      res.json({ id, name });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/students', async (req: any, res: any) => {
    if (!pool) return res.json([]);
    const teacher_id = req.query.userId?.toString() || 'teacher';
    const class_id = req.query.class_id?.toString();
    try {
      let qStr = "SELECT s.*, c.name as class_name FROM d_student_record s LEFT JOIN d_class_group c ON s.class_id = c.id WHERE s.teacher_id = $1 AND s.status != 'deleted'";
      let params = [teacher_id];
      if (class_id) {
         qStr += ' AND s.class_id = $2';
         params.push(class_id);
      }
      qStr += ' ORDER BY s.name ASC';
      const q = await pool.query(qStr, params);
      res.json(q.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/students/:id', async (req: any, res: any) => {
    if (!pool) return res.json(null);
    const teacher_id = req.query.userId?.toString() || 'teacher';
    try {
      const q = await pool.query('SELECT s.*, c.name as class_name FROM d_student_record s LEFT JOIN d_class_group c ON s.class_id = c.id WHERE s.id = $1 AND s.teacher_id = $2', [req.params.id, teacher_id]);
      res.json(q.rows[0] || null);
    } catch (e) { res.status(500).json({ error: 'DB_ERROR' }); }
  });

  app.put('/api/students/:id', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: 'DB_NOT_CONNECTED' });
    const teacher_id = req.query.userId?.toString() || 'teacher';
    const { class_id, name, enrollment_code, email, notes, status } = req.body;
    try {
      await pool.query(
        'UPDATE d_student_record SET class_id=$1, name=$2, enrollment_code=$3, email=$4, notes=$5, status=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7 AND teacher_id=$8',
        [class_id, name, enrollment_code, email, notes, status, req.params.id, teacher_id]
      );
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB_ERROR' }); }
  });

  app.delete('/api/students/:id', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: 'DB_NOT_CONNECTED' });
    const teacher_id = req.query.userId?.toString() || 'teacher';
    try {
      await pool.query("UPDATE d_student_record SET status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND teacher_id=$2", [req.params.id, teacher_id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB_ERROR' }); }
  });

  app.post('/api/students/import-csv', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: 'DB_NOT_CONNECTED' });
    const teacher_id = req.query.userId?.toString() || 'teacher';
    const { class_id, csv_data } = req.body;
    if (!class_id || !csv_data) return res.status(400).json({ error: 'Missing class_id or csv_data' });
    
    const lines = csv_data.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    if (lines.length < 2) return res.status(400).json({ error: 'Arquivo inválido ou vazio' });
    
    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const enrollment = parts[1].trim();
        const email = parts[2] ? parts[2].trim() : null;
        if (name) {
          await pool.query(
            'INSERT INTO d_student_record (id, teacher_id, class_id, name, enrollment_code, email) VALUES ($1, $2, $3, $4, $5, $6)',
            [randomUUID(), teacher_id, class_id, name, enrollment, email]
          );
          imported++;
        }
      }
    }
    res.json({ success: true, imported });
  });

  app.get('/api/evidences', async (req: any, res: any) => {
    if (!pool) return res.json([]);
    const teacher_id = req.query.userId?.toString() || 'teacher';
    try {
      const q = await pool.query('SELECT e.*, c.name as class_name, s.name as student_name FROM d_pedagogical_evidence e LEFT JOIN d_class_group c ON e.class_id = c.id LEFT JOIN d_student_record s ON e.student_id = s.id WHERE e.teacher_id = $1 ORDER BY e.created_at DESC', [teacher_id]);
      res.json(q.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/evidences/student/:id', async (req: any, res: any) => {
    if (!pool) return res.json([]);
    const teacher_id = req.query.userId?.toString() || 'teacher';
    try {
      const q = await pool.query('SELECT e.*, c.name as class_name, s.name as student_name FROM d_pedagogical_evidence e LEFT JOIN d_class_group c ON e.class_id = c.id LEFT JOIN d_student_record s ON e.student_id = s.id WHERE e.student_id = $1 AND e.teacher_id = $2 ORDER BY e.created_at DESC', [req.params.id, teacher_id]);
      res.json(q.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/evidences/class/:id', async (req: any, res: any) => {
    if (!pool) return res.json([]);
    const teacher_id = req.query.userId?.toString() || 'teacher';
    try {
      const q = await pool.query('SELECT e.*, c.name as class_name, s.name as student_name FROM d_pedagogical_evidence e LEFT JOIN d_class_group c ON e.class_id = c.id LEFT JOIN d_student_record s ON e.student_id = s.id WHERE e.class_id = $1 AND e.teacher_id = $2 ORDER BY e.created_at DESC', [req.params.id, teacher_id]);
      res.json(q.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/classes/:id/dashboard', async (req: any, res: any) => {
    if (!pool) return res.json({});
    const teacher_id = req.query.userId?.toString() || 'teacher';
    const class_id = req.params.id;
    try {
      const studentCount = await pool.query("SELECT COUNT(*) as c FROM d_student_record WHERE class_id = $1 AND teacher_id = $2 AND status != 'deleted'", [class_id, teacher_id]);
      const evidenceCount = await pool.query('SELECT COUNT(*) as c FROM d_pedagogical_evidence WHERE class_id = $1 AND teacher_id = $2', [class_id, teacher_id]);
      const avgScore = await pool.query('SELECT AVG(score) as avg FROM d_pedagogical_evidence WHERE class_id = $1 AND teacher_id = $2 AND score IS NOT NULL', [class_id, teacher_id]);
      
      res.json({
        student_count: parseInt(studentCount.rows[0].c),
        evidence_count: parseInt(evidenceCount.rows[0].c),
        average_score: avgScore.rows[0].avg ? parseFloat(avgScore.rows[0].avg).toFixed(1) : 0,
        critical_content: 'Laços de Repetição',
        mastered_content: 'Variáveis',
        students_at_risk: Math.max(0, parseInt(studentCount.rows[0].c) - 2)
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  console.log("Class and Evidences Endpoints Registered.");
}

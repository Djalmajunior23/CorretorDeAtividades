import express from 'express';
import crypto from 'crypto';

export function registerAddonEndpoints(app: any, pool: any) {
  // Config
  app.get('/api/classes', async (req: any, res: any) => {
    if (!pool) return res.json([]);
    try {
      const q = await pool.query("SELECT * FROM d_class_group WHERE status != 'deleted' ORDER BY name ASC");
      res.json(q.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/classes', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    const { name, course, module, semester, shift, year, description } = req.body;
    try {
      const id = crypto.randomUUID();
      await pool.query(
        "INSERT INTO d_class_group (id, teacher_id, name, course, module, semester, shift, year, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [id, "teacher_portal", name, course || null, module || null, semester || null, shift || null, year || null, description || null]
      );
      res.json({ id, success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/classes/:id', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    const { id } = req.params;
    const { name, course, module, semester, shift, year, description, status } = req.body;
    try {
      await pool.query(
        "UPDATE d_class_group SET name=$1, course=$2, module=$3, semester=$4, shift=$5, year=$6, description=$7, status=$8, updated_at=CURRENT_TIMESTAMP WHERE id=$9",
        [name, course || null, module || null, semester || null, shift || null, year || null, description || null, status || 'active', id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/classes/:id', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      await pool.query("UPDATE d_class_group SET status='deleted' WHERE id=$1", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Students
  app.get('/api/students', async (req: any, res: any) => {
    if (!pool) return res.json([]);
    try {
      const { class_id } = req.query;
      let qStr = "SELECT s.*, c.name as class_name FROM d_student_record s LEFT JOIN d_class_group c ON s.class_id = c.id WHERE s.status != 'deleted'";
      let params = [];
      if (class_id) {
        qStr += " AND s.class_id = $1";
        params.push(class_id);
      }
      qStr += " ORDER BY s.name ASC";
      
      const q = await pool.query(qStr, params);
      res.json(q.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/students', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    const { name, class_id, enrollment_code, email, notes } = req.body;
    try {
      const id = crypto.randomUUID();
      await pool.query(
        "INSERT INTO d_student_record (id, teacher_id, class_id, name, enrollment_code, email, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, "teacher_portal", class_id || null, name, enrollment_code || null, email || null, notes || null]
      );
      res.json({ id, success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/students/:id', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    const { id } = req.params;
    const { name, class_id, enrollment_code, email, notes, status } = req.body;
    try {
      await pool.query(
        "UPDATE d_student_record SET class_id=$1, name=$2, enrollment_code=$3, email=$4, notes=$5, status=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7",
        [class_id || null, name, enrollment_code || null, email || null, notes || null, status || 'active', id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/students/:id', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      await pool.query("UPDATE d_student_record SET status='deleted' WHERE id=$1", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/students/import-csv', async (req: any, res: any) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    const { class_id, csv_data } = req.body;
    if (!csv_data) return res.status(400).json({ error: "Missing CSV" });
    
    try {
      const rows = csv_data.split('\\n').map((r: any) => r.trim()).filter((r: any) => r);
      let imported = 0;
      
      for (const row of rows) {
        const parts = row.split(',');
        if (parts.length >= 1) {
          const name = parts[0].trim();
          if (name.toLowerCase() === 'nome') continue; // header
          
          const enroll = parts[1] ? parts[1].trim() : null;
          const email = parts[2] ? parts[2].trim() : null;
          
          await pool.query(
            "INSERT INTO d_student_record (id, teacher_id, class_id, name, enrollment_code, email) VALUES ($1, $2, $3, $4, $5, $6)",
            [crypto.randomUUID(), "teacher_portal", class_id || null, name, enroll, email]
          );
          imported++;
        }
      }
      
      res.json({ success: true, imported });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Evidences
  app.get('/api/evidences', async (req: any, res: any) => {
    if (!pool) return res.json([]);
    try {
      const q = await pool.query(
        "SELECT e.*, c.name as class_name, s.name as student_name FROM d_pedagogical_evidence e LEFT JOIN d_class_group c ON e.class_id = c.id LEFT JOIN d_student_record s ON e.student_id = s.id ORDER BY e.created_at DESC"
      );
      res.json(q.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  
  app.get('/api/evidences/class/:class_id', async (req: any, res: any) => {
    if (!pool) return res.json([]);
    try {
      const q = await pool.query(
        "SELECT e.*, c.name as class_name, s.name as student_name FROM d_pedagogical_evidence e LEFT JOIN d_class_group c ON e.class_id = c.id LEFT JOIN d_student_record s ON e.student_id = s.id WHERE e.class_id = $1 ORDER BY e.created_at DESC", 
        [req.params.class_id]
      );
      res.json(q.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}

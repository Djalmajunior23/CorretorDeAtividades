const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `app.delete("/api/codecheck/diary/sessions/:id", async (req, res) => {
  if (!FEATURE_FLAGS.ENABLE_SMART_CLASS_DIARY) return res.status(403).json({ error: "Desativado" });
  const { id } = req.params;
  if (pool) {
    try {
      await pool.query(\`DELETE FROM class_sessions WHERE id = $1\`, [id]);
    } catch (e: any) {
      console.error("[Diary Sessions] DB delete error:", e.message);
    }
  }
  const idx = inMemoryClassSessions.findIndex(s => s.id === id);
  if (idx !== -1) {
    inMemoryClassSessions.splice(idx, 1);
  }`;

// Trying another approach
const lines = content.split('\n');
let modified = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('app.delete("/api/codecheck/diary/sessions/:id"')) {
    // we found it. let's inject after the query.
    for (let j = i; j < i + 15; j++) {
      if (lines[j].includes('DELETE FROM class_sessions WHERE id = $1')) {
        lines.splice(j + 1, 0, '      await pool.query(`DELETE FROM lesson_logger_records WHERE id = $1`, [id]);');
        lines.splice(j + 2, 0, '      await pool.query(`DELETE FROM todos_os_registros WHERE id = $1`, [id]);');
        modified = true;
        break;
      }
    }
    
    if (modified) {
       for (let j = i; j < i + 30; j++) {
         if (lines[j].includes('inMemoryClassSessions.splice(idx, 1);')) {
           lines.splice(j + 2, 0, '  const llIdx = inMemoryLessonLoggerRecords.findIndex(r => r.id === id);');
           lines.splice(j + 3, 0, '  if (llIdx !== -1) { inMemoryLessonLoggerRecords.splice(llIdx, 1); }');
           break;
         }
       }
    }
    break;
  }
}

if (modified) {
  fs.writeFileSync('server.ts', lines.join('\n'));
  console.log("Patched server.ts successfully");
} else {
  console.log("Failed to patch server.ts");
}

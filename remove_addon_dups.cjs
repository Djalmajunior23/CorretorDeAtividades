const fs = require('fs');

const file = 'server-apis-addon.ts';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');

const toRemove = [
  'app.get("/api/resources"',
  'app.post("/api/resources/:id/favorite"',
  'app.delete("/api/resources/:id"',
  'app.get("/api/reports"',
  'app.post("/api/reports/generate"',
  'app.get("/api/reports/:id/export/pdf"',
  'app.get("/api/system/status"',
  'app.get("/api/audit-logs"',
  'app.get("/api/analytics/overview"',
  'app.get("/api/analytics/classes"',
  'app.get("/api/analytics/students"',
  'app.post("/api/analytics/recalculate"'
];

let inRemoveBlock = false;
let blockBraces = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (!inRemoveBlock) {
    if (toRemove.some(r => line.includes(r))) {
      inRemoveBlock = true;
      blockBraces = 0;
    }
  }

  if (inRemoveBlock) {
    blockBraces += (line.match(/\{/g) || []).length;
    blockBraces -= (line.match(/\}/g) || []).length;
    
    // comment out
    lines[i] = '// ' + lines[i];

    if (blockBraces === 0 && line.includes('});')) {
      inRemoveBlock = false;
    }
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Done');

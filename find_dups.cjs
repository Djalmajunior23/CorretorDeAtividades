const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const routes = [...content.matchAll(/app\.(get|post|put|delete|patch)\(['"](\/api\/[^'"]+)['"]/g)];
const counts = {};
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(/app\.(get|post|put|delete|patch)\(['"](\/api\/[^'"]+)['"]/);
  if (match) {
    const key = match[1].toUpperCase() + ' ' + match[2];
    if (!counts[key]) counts[key] = [];
    counts[key].push(i + 1);
  }
}
for (const [key, occur] of Object.entries(counts)) {
  if (occur.length > 1) {
    console.log(key + ' at lines ' + occur.join(', '));
  }
}

// also check server-addon.ts and server-apis-addon.ts
function checkFile(filename) {
  if (!fs.existsSync(filename)) return;
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/app\.(get|post|put|delete|patch)\(['"](\/api\/[^'"]+)['"]/);
    if (match) {
      const key = match[1].toUpperCase() + ' ' + match[2];
      console.log('EXTERNAL: ' + key + ' at ' + filename + ':' + (i + 1));
    }
  }
}
checkFile('server-addon.ts');
checkFile('server-apis-addon.ts');

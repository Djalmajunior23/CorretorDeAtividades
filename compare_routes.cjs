const fs = require('fs');

function getRoutes(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const routes = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/app\.(get|post|put|delete|patch)\(['"](\/api\/[^'"]+)['"]/);
    if (match) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        file: filename,
        line: i + 1
      });
    }
  }
  return routes;
}

const routes1 = getRoutes('server.ts');
const routes2 = getRoutes('server-apis-addon.ts');
const allRoutes = [...routes1, ...routes2];

const counts = {};
for (const r of allRoutes) {
  const key = r.method + ' ' + r.path;
  if (!counts[key]) counts[key] = [];
  counts[key].push(r);
}

for (const [key, occurrences] of Object.entries(counts)) {
  if (occurrences.length > 1) {
    console.log(key);
    for (const o of occurrences) {
      console.log('  -> ' + o.file + ':' + o.line);
    }
  }
}

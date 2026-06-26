const fs = require('fs');

const serverCode = fs.readFileSync('server.ts', 'utf8');
const routes = new Set();
const routeRegex = /app\.(get|post|put|delete|patch)\(['"`](.+?)['"`]/g;
let match;
while ((match = routeRegex.exec(serverCode)) !== null) {
  let r = match[2];
  if(r !== "*") routes.add(r);
}

const frontendCode = fs.readFileSync('all_calls.txt', 'utf8');
const calledEndpoints = new Set();
const apiRegex = /\/api\/[a-zA-Z0-9_\/-]+/g;
let m2;
while ((m2 = apiRegex.exec(frontendCode)) !== null) {
  let path = m2[0];
  if (path.endsWith('/')) path = path.slice(0, -1);
  calledEndpoints.add(path);
}

const serverRouteArr = Array.from(routes);
console.log("Missing endpoints:");
for (const endpoint of calledEndpoints) {
  let found = false;
  for (const sr of serverRouteArr) {
    const regexStr = sr.replace(/:[^\/]+/g, '[^/]+');
    const regex = new RegExp(`^${regexStr}$`);
    if (regex.test(endpoint)) {
      found = true;
      break;
    }
  }
  
  if (!found) {
    console.log(endpoint);
  }
}

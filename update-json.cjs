const fs = require('fs');

function updateSafeJson(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace await res.json() with await safeJsonResponse(res)
  if (content.includes('await res.json()')) {
    content = content.replace(/await res\.json\(\)/g, 'await safeJsonResponse(res)');
    changed = true;
  }
  
  // Replace .then(res => res.json()) with .then(res => safeJsonResponse(res))
  if (content.includes('.then(res => res.json())')) {
    content = content.replace(/\.then\(res => res\.json\(\)\)/g, '.then(res => safeJsonResponse(res))');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
}

updateSafeJson('src/App.tsx');

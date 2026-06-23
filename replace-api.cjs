const fs = require('fs');
const path = require('path');

function getRelativePath(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile);
  if (!rel.startsWith('.')) rel = './' + rel;
  // remove extension
  return rel.replace(/\.tsx?$/, '');
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (fullPath === 'src/config/api.ts' || fullPath === 'src/utils/api.ts') continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace getApiUrl("...") with apiUrl("...")
      if (content.includes('getApiUrl(')) {
        content = content.replace(/getApiUrl\(/g, 'apiUrl(');
        changed = true;
      }
      
      // Replace fetch("/api/...") with fetch(apiUrl("/api/..."))
      const fetchRegex = /fetch\(\s*(["'`]\/api\/[^"'`]*["'`])\s*(?:,|\))/g;
      if (fetchRegex.test(content)) {
        content = content.replace(fetchRegex, (match, p1) => {
          if (match.endsWith(',')) {
            return `fetch(apiUrl(${p1}),`;
          }
          return `fetch(apiUrl(${p1}))`;
        });
        changed = true;
      }

      // Replace fetch("/api/..." in template literals if simple
      
      if (changed) {
        // Add import { apiUrl } from '...'; if not exists
        if (!content.includes('apiUrl } from')) {
          const relPath = getRelativePath(fullPath, 'src/config/api.ts');
          const importStmt = `import { apiUrl, safeJsonResponse } from "${relPath}";\n`;
          
          // insert after last import or at top
          const importsRegex = /^import .* from .*;/gm;
          let lastMatch = null;
          let match;
          while ((match = importsRegex.exec(content)) !== null) {
            lastMatch = match;
          }
          
          if (lastMatch) {
            const insertIndex = lastMatch.index + lastMatch[0].length + 1;
            content = content.slice(0, insertIndex) + importStmt + content.slice(insertIndex);
          } else {
            content = importStmt + content;
          }
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

processDirectory('src');

const fs = require('fs');

let aix = fs.readFileSync('/app/applet/src/ai/services/sandbox/AIExecutor.ts', 'utf-8');
aix = aix.replace('../factory/ProviderFactory', '../../factory/ProviderFactory');
fs.writeFileSync('/app/applet/src/ai/services/sandbox/AIExecutor.ts', aix);
console.log("AIExecutor patched.");

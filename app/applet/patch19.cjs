const fs = require('fs');

let aish = fs.readFileSync('/app/applet/src/components/AIStatusDashboard.tsx', 'utf-8');
aish = aish.replace('typeof model === "string" ? model : (model?.name || model?.id || JSON.stringify(model))', 
'typeof model === "string" ? model : ((model as any)?.name || (model as any)?.id || JSON.stringify(model))');
fs.writeFileSync('/app/applet/src/components/AIStatusDashboard.tsx', aish);

const fs = require('fs');

let aig = fs.readFileSync('/app/applet/src/ai/services/AIGateway.ts', 'utf-8');
aig = aig.replace('return await provider.execute(task, prompt, options, imageData) as T;', 
\`            if (task === AITask.IMAGE_OCR || task === AITask.GENERAL_ANALYSIS) {
                return (await provider.generateContent(prompt, options, imageData)) as any as T;
            }
            return await provider.generateStructured<T>(prompt, null, options, imageData);\`);
fs.writeFileSync('/app/applet/src/ai/services/AIGateway.ts', aig);

let tsContent = fs.readFileSync('/app/applet/src/ai/types.ts', 'utf-8');
tsContent = tsContent.replace(/export interface CodeCorrectionRequest \{/, 
  'export interface CodeCorrectionRequest {\\n  level?: string;\\n  statement?: string;\\n  rubric?: string;');
fs.writeFileSync('/app/applet/src/ai/types.ts', tsContent);

let aish = fs.readFileSync('/app/applet/src/components/AIStatusDashboard.tsx', 'utf-8');
// Fix AIStatusDashboard.tsx(107,17): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
// Usually model.id or something? Let's check status.models format. if models is an object.
aish = aish.replace(/\{model\}/g, '{typeof model === "string" ? model : (model?.name || model?.id || JSON.stringify(model))}');
fs.writeFileSync('/app/applet/src/components/AIStatusDashboard.tsx', aish);

let serverTs = fs.readFileSync('/app/applet/server.ts', 'utf-8');
serverTs = serverTs.replace('const responseText = await provider.generateContent(prompt || "Olá");', 
  'const responseText = await provider.generateContent(prompt || "Olá", { responseMimeType: "text/plain" });'); // Provide options if needed
fs.writeFileSync('/app/applet/server.ts', serverTs);

console.log("TypeScript issues patched");

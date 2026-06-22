const fs = require('fs');

let aig = fs.readFileSync('/app/applet/src/ai/services/AIGateway.ts', 'utf-8');
aig = aig.replace('ProviderFactory.getProvider()', 'ProviderFactory.createProvider(task)');
fs.writeFileSync('/app/applet/src/ai/services/AIGateway.ts', aig);

let tsContent = fs.readFileSync('/app/applet/src/ai/types.ts', 'utf-8');
if (!tsContent.includes('CodeCorrectionRequest')) {
  tsContent += `
export interface CodeCorrectionRequest {
  code: string;
  language: string;
  prompt?: string;
  options?: any;
}

export interface CodeCorrectionResponse {
  success: boolean;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  errors_found: string[];
}

export interface AIStatusResponse {
  provider: string;
  available: boolean;
  base_url: string;
  models: any;
  health: string;
  error?: string;
}
`;
}
if (!tsContent.includes('PEDAGOGICAL_FEEDBACK')) {
  tsContent = tsContent.replace('QUESTION_GENERATION = \'question_generation\'', 'QUESTION_GENERATION = \'question_generation\',\n    PEDAGOGICAL_FEEDBACK = \'pedagogical_feedback\'');
}
fs.writeFileSync('/app/applet/src/ai/types.ts', tsContent);

let aish = fs.readFileSync('/app/applet/src/components/AIStatusDashboard.tsx', 'utf-8');
aish = aish.replace('status.models.map((model, i)', 'status.models.map((model: string, i: number)');
aish = aish.replace('Object.entries(status.models || {}).map(([key, model])', 'Object.entries(status.models || {}).map(([key, model]: [string, any])');
fs.writeFileSync('/app/applet/src/components/AIStatusDashboard.tsx', aish);

console.log("TS issues patched");

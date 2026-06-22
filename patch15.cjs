const fs = require('fs');

let serverTs = fs.readFileSync('/app/applet/server.ts', 'utf-8');

// Patch /api/ai/status to include standardized fields
serverTs = serverTs.replace(
  'provider: "ollama",\n          available: true,\n          base_url: ollamaUrl,\n          models: modelsList,\n          health: "ok"',
  `success: true,
          message: "Ollama online",
          data: { provider: "ollama", models: modelsList },
          ai_available: true,
          fallback_used: false,
          provider: "ollama",
          available: true,
          base_url: ollamaUrl,
          models: modelsList,
          health: "ok"`
);

serverTs = serverTs.replace(
  `provider: provider,\n        available: true,\n        base_url: "",\n        models: [`,
  `success: true,
        message: "Gemini online",
        data: {},
        ai_available: true,
        fallback_used: false,
        provider: provider,
        available: true,
        base_url: "",
        models: [`
);

// We need to write back 
fs.writeFileSync('/app/applet/server.ts', serverTs);
console.log("Server patched with standardized response fields for status");

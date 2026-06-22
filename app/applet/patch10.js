const fs = require('fs');

let server = fs.readFileSync('/app/applet/server.ts', 'utf-8');

server = server.replace('import { GoogleGenAI, Type } from "@google/genai";\n', '');
server = server.replace('import { GeminiProvider } from "./src/ai/providers/GeminiProvider.ts";\n', '');

server = server.replace(
  'const provider = providerName === "ollama" ? new OllamaProvider(config) : new GeminiProvider(config);',
  'const provider = ProviderFactory.createProvider("chat");'
);

fs.writeFileSync('/app/applet/server.ts', server);

let providerFactory = fs.readFileSync('/app/applet/src/ai/factory/ProviderFactory.ts', 'utf-8');

providerFactory = providerFactory.replace('import { GeminiProvider } from "../providers/GeminiProvider";\n', '');

providerFactory = providerFactory.replace(
  `        switch (providerName.toLowerCase()) {
            case "gemini":
                return new GeminiProvider(config);
            case "ollama":
            default:`,
  `        switch (providerName.toLowerCase()) {
            case "gemini":
                // return new GeminiProvider(config);
                // Gemini code removed to ensure local inference as requested
            case "ollama":
            default:`
);

fs.writeFileSync('/app/applet/src/ai/factory/ProviderFactory.ts', providerFactory);
console.log("Patched server.ts and ProviderFactory.ts");

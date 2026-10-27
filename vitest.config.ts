import { defineConfig } from "vitest/config";

// Tests register mocked pools and must never inherit a developer's real database.
// Run PostgreSQL smoke checks separately against a disposable database.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    maxWorkers: 2,
    env: {
      ...Object.fromEntries([
      "DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL",
      "POSTGRES_URL_NON_POOLING", "SUPABASE_DB_URL", "NEON_DATABASE_URL",
      "VAULT_DATABASE_URL", "VPS_DATABASE_URL", "STORAGE_DATABASE_URL",
      "GEMINI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY", "DEEPSEEK_API_KEY", "OLLAMA_PROXY_TOKEN",
      ].map(name => [name, ""])),
      AI_PROVIDER: "ollama",
      // Port 1 is forbidden by fetch, so fallback tests cannot contact a real AI.
      OLLAMA_BASE_URL: "http://127.0.0.1:1",
    },
  },
});

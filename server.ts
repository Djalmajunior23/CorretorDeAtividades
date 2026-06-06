import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware is needed for explicit express routes before proxy
  app.use(express.json());

  // Proxy /api requests to the Python backend
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:8081",
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
      on: {
        proxyReq: (proxyReq, req, res) => {
          // Just a hook for future use
        },
        error: (err, req, res) => {
          console.error(
            "Proxy error (is Python backend running on port 8081?):",
            err.message,
          );

          // Fallback for AI Studio preview if python is not running
          if (
            req.method === "POST" &&
            (req.url === "/auth/login" || req.originalUrl === "/api/auth/login")
          ) {
            // Because we are an Express app typing is actually Response
            const response = res as express.Response;
            if (!response.headersSent) {
              response.writeHead(200, { "Content-Type": "application/json" });
              response.end(
                JSON.stringify({
                  token: "preview-token",
                  user: {
                    id: 1,
                    name: "Professor Admin",
                    email: "professor@codecheck.ai",
                    role: "PROFESSOR",
                  },
                }),
              );
            }
            return;
          }

          if (
            req.method === "GET" &&
            (req.url === "/auth/me" || req.originalUrl === "/api/auth/me")
          ) {
            const response = res as express.Response;
            if (!response.headersSent) {
              response.writeHead(200, { "Content-Type": "application/json" });
              response.end(
                JSON.stringify({
                  id: 1,
                  name: "Professor Admin",
                  email: "professor@codecheck.ai",
                  role: "PROFESSOR",
                }),
              );
            }
            return;
          }

          if (
            req.method === "POST" &&
            (req.url === "/corrections/run" ||
              req.originalUrl === "/api/corrections/run")
          ) {
            const response = res as express.Response;
            if (!response.headersSent) {
              response.writeHead(200, { "Content-Type": "application/json" });
              response.end(
                JSON.stringify({
                  final_score: 100,
                  syntax_ok: true,
                  tests_passed: 1,
                  total_tests: 1,
                  stdout: "MOCK RUNNER: 5",
                  stderr: "",
                  feedback:
                    "Código executado com sucesso (Preview Fallback Mock).",
                }),
              );
            }
            return;
          }

          const response = res as express.Response;
          if (!response.headersSent) {
            response.writeHead(502, { "Content-Type": "application/json" });
            response.end(
              JSON.stringify({
                error:
                  "Backend server is fully powered by Python FastAPI. Please run 'uvicorn backend.app.main:app --port 8081' locally.",
              }),
            );
          }
        },
      },
    }),
  );

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "CodeCheck AI Backend"
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "professor@codecheck.ai" && password === "123456") {
      res.json({
        access_token: "preview-token",
        token_type: "bearer",
        user: {
          id: 1,
          name: "Professor",
          email: "professor@codecheck.ai",
          role: "PROFESSOR"
        }
      });
    } else {
      res.status(401).json({ detail: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.includes("preview-token")) {
      res.json({
        id: 1,
        name: "Professor",
        email: "professor@codecheck.ai",
        role: "PROFESSOR"
      });
    } else {
      res.status(401).json({ detail: "Not authenticated" });
    }
  });

  app.post("/api/corrections/run", (req, res) => {
    res.json({
      syntax_ok: true,
      tests_passed: 1,
      total_tests: 1,
      final_score: 100,
      stdout: "5",
      stderr: "",
      feedback: "Código executado com sucesso."
    });
  });

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

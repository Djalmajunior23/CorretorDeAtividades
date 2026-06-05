import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for code submission
  app.post("/api/submissions/", (req, res) => {
    const { code_content } = req.body;
    
    // Simulate correction logic (simplified from what I wrote in Python)
    const syntaxOk = !code_content.includes("syntaxerror"); // Very simple "check"
    
    let score = 50;
    if (code_content.includes("def ")) score += 20;
    if (code_content.includes("for ") || code_content.includes("while ")) score += 15;
    if (code_content.includes("if ")) score += 15;
    score = Math.min(score, 100);

    const feedback = !syntaxOk 
      ? "Erro de sintaxe encontrado no seu código."
      : score < 60 ? "Código muito básico." : "Excelente trabalho!";

    res.json({ submission_id: 1, score, feedback });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

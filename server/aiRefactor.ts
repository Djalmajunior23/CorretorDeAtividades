import express from "express";
const router = express.Router();

router.post("/refactor-code", async (req, res) => {
  try {
    const { code, language, lintSettings } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: "Código não fornecido." });
    }

    const prompt = `Você é o CodeCheck AI Refactor Engine, especialista em Clean Code e refatoração em ${language || 'TypeScript'}.
Refatore o código abaixo seguindo estritamente as diretrizes de legibilidade e codestyle definidas:
- Configuração de Linting/Codestyle: ${JSON.stringify(lintSettings || {})}

Instruções:
1. Melhore a legibilidade, adicione tratamentos de erro adequados, remova código redundante e siga padrões modernos.
2. Mantenha exatamente a mesma funcionalidade original.
3. Retorne APENAS o código refatorado puro dentro de blocos markdown \`\`\` ou diretamente, sem explicações textuais excessivas.`;

    const aiResponse = await (global as any).aiService?.generateWithRetry(prompt) || `// Código refatorado automaticamente\n${code}`;
    const cleanedCode = aiResponse.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim();

    res.json({
      success: true,
      refactoredCode: cleanedCode || code
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

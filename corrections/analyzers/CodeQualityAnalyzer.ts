export interface QualityResult {
  score: number; // 0 to 20
  issues: string[];
}

export class CodeQualityAnalyzer {
  static analyze(code: string, language: string): QualityResult {
    const issues: string[] = [];
    let score = 20; // Starts with max 20 points
    
    if (!code || code.trim().length === 0) {
      return { score: 0, issues: ["O campo de código está vazio."] };
    }

    const lines = code.split("\n");
    const codeLower = code.toLowerCase();
    const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 0);

    // 1. Code Size & Organização
    if (code.length < 25) {
      score -= 4;
      issues.push("O tamanho do código é muito curto. Garanta que implementou toda a lógica necessária.");
    }
    if (lines.length > 80) {
      score -= 2;
      issues.push("Código excessivamente longo. Considere refatorar o script e modularizar blocos redundantes.");
    }

    // 2. Variable Names (Single Letter or Bad Habit Pattern Checks)
    // Find variables/parameters with single letter names like x, y, a, b, i, j (excluding loop counters)
    const badVarMatches = code.match(/\b(x|y|z|a|b|c|temp|temp_val|val|foo|bar)\s*=/g);
    if (badVarMatches && badVarMatches.length >= 2) {
      score -= 3;
      issues.push("Uso recorrente de nomes de variáveis pouco descritivos (" + badVarMatches.map(m => m.replace("=", "").trim()).slice(0, 3).join(", ") + "). Utilize nomes significativos como 'soma_total', 'resultado_filtro'.");
    }

    // 3. Code Duplication / Redundancy heuristic
    let duplicates = 0;
    const occurrenceMap: Record<string, number> = {};
    for (const l of cleanLines) {
      if (l.length > 15) {
        occurrenceMap[l] = (occurrenceMap[l] || 0) + 1;
        if (occurrenceMap[l] > 1) {
          duplicates++;
        }
      }
    }
    if (duplicates >= 2) {
      score -= 3;
      issues.push("Duplicidade de código detectada. Evite repetir as mesmas instruções exatas em vários trechos; use funções ou loops.");
    }

    // 4. Function usage encouragement
    const hasFunctions = codeLower.includes("def ") || 
                         codeLower.includes("function") || 
                         codeLower.includes("=>") || 
                         codeLower.includes("func ") ||
                         codeLower.includes("funcao") ||
                         codeLower.includes("função");
    
    // In SQL or Pseudocode/Portugol, functions are not always required
    const isSpecialLang = ["sql", "portugol", "pseudocode", "pseudocodigo", "pseudocódigo"].includes(language.toLowerCase());
    if (!hasFunctions && !isSpecialLang) {
      score -= 3;
      issues.push("Seu código não utiliza sub-rotinas (funções/métodos). Dividir o programa em funções melhora a legibilidade e reuso.");
    }

    // 5. Basic complexity (Nested depth of loops)
    const countNestedLoops = (
      (codeLower.match(/for\s+.*:/g) || []).length > 1 || 
      (codeLower.match(/while\s+.*\b/g) || []).length > 1 ||
      (code.includes("for") && code.includes("while"))
    );
    if (countNestedLoops && code.length > 200) {
      // Potentially nested
      const hasDeepIndent = cleanLines.some(l => l.startsWith("        ") || l.startsWith("\t\t"));
      if (hasDeepIndent) {
        score -= 2;
        issues.push("Complexidade sintática elevada encontrada (lógica muito aninhada). Considere sanitizar os níveis de indentação usando cláusulas de guarda ou funções auxiliares.");
      }
    }

    // 6. Helpful comments
    const hasComments = code.includes("#") || code.includes("//") || code.includes("/*") || code.includes("--");
    if (!hasComments && code.length > 100) {
      score -= 1;
      issues.push("Adicione comentários breves para descrever partes complexas do seu algoritmo.");
    }

    // Keep score bounded within [0, 20]
    score = Math.max(0, Math.min(20, score));

    return { score, issues };
  }
}

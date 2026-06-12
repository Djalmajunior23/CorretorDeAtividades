export interface LintingSettings {
  requireComments: boolean;
  requireIndentation: boolean;
  maxLinesLimit: number;
  requireNoSingleLetterVars: boolean;
  requireFunctions: boolean;
}

export interface QualityResult {
  score: number; // 0 to 20
  issues: string[];
}

export class CodeQualityAnalyzer {
  static analyze(code: string, language: string, lintingSettings?: LintingSettings): QualityResult {
    const issues: string[] = [];
    let score = 20; // Starts with max 20 points
    
    if (!code || code.trim().length === 0) {
      return { score: 0, issues: ["O campo de código está vazio."] };
    }

    const lines = code.split("\n");
    const codeLower = code.toLowerCase();
    const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 0);

    // Resolve settings dynamically with robust defaults
    const config = lintingSettings || {
      requireComments: true,
      requireIndentation: true,
      maxLinesLimit: 80,
      requireNoSingleLetterVars: true,
      requireFunctions: false
    };

    // 1. Code Size & Lines Limit (Limite de linhas configurável)
    if (code.length < 25) {
      score -= 4;
      issues.push("O tamanho do código é muito curto. Garanta que implementou toda a lógica necessária.");
    }
    
    const limit = config.maxLinesLimit || 80;
    if (lines.length > limit) {
      score -= 3;
      issues.push(`O limite de linhas estipulado pelo professor (${limit}) foi excedido. O seu código possui ${lines.length} linhas. Considere refatorar e modularizar.`);
    } else if (lines.length > 80) {
      score -= 1;
      issues.push("Código excessivamente longo. Considere refatorar o script e modularizar blocos redundantes.");
    }

    // 2. Indentation check (Indentação correta configurável)
    if (config.requireIndentation) {
      let indentIssues = false;
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1];
        const trimmed = line.trim();
        const nextTrimmed = nextLine.trim();

        if (nextTrimmed.length > 0) {
          // Python colon check
          if (language.toLowerCase() === "python" && trimmed.endsWith(":")) {
            if (!nextLine.startsWith(" ") && !nextLine.startsWith("\t")) {
              indentIssues = true;
              break;
            }
          }
          // JavaScript/TypeScript curly brace check
          if (trimmed.endsWith("{")) {
            if (!nextLine.startsWith(" ") && !nextLine.startsWith("\t") && !nextTrimmed.startsWith("}")) {
              indentIssues = true;
              break;
            }
          }
        }
      }
      if (indentIssues) {
        score -= 3;
        issues.push("Inconsistência de indentação detectada. É obrigatório manter o código recuado corretamente dentro de blocos de controle.");
      }
    }

    // 3. Variable Names (Single Letter or Bad Habit Pattern Checks)
    if (config.requireNoSingleLetterVars) {
      const badVarMatches = code.match(/\b(x|y|z|a|b|c|temp|temp_val|val|foo|bar)\s*=/g);
      if (badVarMatches && badVarMatches.length >= 2) {
        score -= 3;
        issues.push("Uso recorrente de nomes de variáveis pouco descritivos (" + badVarMatches.map(m => m.replace("=", "").trim()).slice(0, 3).join(", ") + "). Utilize nomes significativos como 'soma_total', 'resultado_filtro'.");
      }
    }

    // 4. Code Duplication / Redundancy heuristic
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

    // 5. Function usage encouragement
    const hasFunctions = codeLower.includes("def ") || 
                         codeLower.includes("function") || 
                         codeLower.includes("=>") || 
                         codeLower.includes("func ") ||
                         codeLower.includes("funcao") ||
                         codeLower.includes("função");
    
    // In SQL functions are not always required
    const isSpecialLang = ["sql"].includes(language.toLowerCase());
    if (config.requireFunctions && !hasFunctions && !isSpecialLang) {
      score -= 4;
      issues.push("Obrigatoriedade de sub-rotinas ativada pelo professor. Seu código não utiliza funções ou métodos para modularizar a lógica.");
    } else if (!hasFunctions && !isSpecialLang && !["portugol", "pseudocode"].includes(language.toLowerCase())) {
      const countComplexity = (codeLower.match(/for|while|if/g) || []).length;
      if (countComplexity > 5) {
        score -= 2;
        issues.push("Seu código está ficando complexo e não utiliza funções. Dividir o programa em funções melhora a legibilidade e reuso.");
      }
    }

    // 6. Basic complexity (Nested depth of loops)
    const countNestedLoops = (
      (codeLower.match(/for\s+.*:/g) || []).length > 1 || 
      (codeLower.match(/while\s+.*\b/g) || []).length > 1 ||
      (code.includes("for") && code.includes("while"))
    );
    if (countNestedLoops && code.length > 200) {
      const hasDeepIndent = cleanLines.some(l => l.startsWith("        ") || l.startsWith("\t\t"));
      if (hasDeepIndent) {
        score -= 2;
        issues.push("Complexidade sintática elevada encontrada (lógica muito aninhada). Considere sanitizar os níveis de indentação usando cláusulas de guarda ou funções auxiliares.");
      }
    }

    // 7. Helpful comments (Obrigatoriedade de comentários configurável)
    const hasComments = code.includes("#") || code.includes("//") || code.includes("/*") || code.includes("--");
    if (config.requireComments && !hasComments) {
      score -= 4;
      issues.push("Obrigatoriedade de comentários ativada. Adicione comentários explicativos ou documentação para descrever partes complexas do seu algoritmo.");
    } else if (!hasComments && code.length > 100) {
      score -= 1;
      issues.push("Adicione comentários breves para descrever partes complexas do seu algoritmo.");
    }

    // Keep score bounded within [0, 20]
    score = Math.max(0, Math.min(20, score));

    return { score, issues };
  }
}

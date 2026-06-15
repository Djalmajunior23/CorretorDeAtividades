
export class SimilarityService {
  /**
   * Normaliza o código removerndo comentários e espaços em branco excessivos.
   */
  static normalizeCode(code: string, language: string): string {
    let normalized = code;

    // Remover comentários (simplificado)
    if (["python", "sql"].includes(language)) {
      normalized = normalized.replace(/#.*$/gm, "");
    } else {
      normalized = normalized.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
    }

    // Normalizar espaços e quebras de linha
    normalized = normalized.replace(/\s+/g, " ").trim().toLowerCase();
    
    return normalized;
  }

  /**
   * Tokenização simplificada: extrai "palavras" que não são meramente sintaxe básica.
   */
  static getTokens(code: string): string[] {
    // Regex para capturar identificadores e operadores
    const tokens = code.match(/[a-zA-Z_][a-zA-Z0-9_]*|[0-9]+|==|!=|<=|>=|&&|\|\||[+\-*/%]/g) || [];
    return tokens;
  }

  /**
   * Similaridade de Jaccard entre dois conjuntos de tokens.
   */
  static jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * Similaridade baseada em estrutura (frequência de palavras-chave).
   */
  static structuralSimilarity(codeA: string, codeB: string): number {
    const keywords = ["if", "for", "while", "else", "elif", "switch", "case", "return", "function", "def", "class", "try", "catch"];
    
    const countKeywords = (code: string) => {
      const counts: Record<string, number> = {};
      const words = code.split(/\W+/);
      words.forEach(w => {
        if (keywords.includes(w)) {
          counts[w] = (counts[w] || 0) + 1;
        }
      });
      return counts;
    };

    const countsA = countKeywords(codeA);
    const countsB = countKeywords(codeB);
    
    const allKeys = new Set([...Object.keys(countsA), ...Object.keys(countsB)]);
    if (allKeys.size === 0) return 1.0; // Ambas vazias

    let matchScore = 0;
    allKeys.forEach(key => {
      const valA = countsA[key] || 0;
      const valB = countsB[key] || 0;
      const max = Math.max(valA, valB);
      if (max > 0) {
        matchScore += Math.min(valA, valB) / max;
      }
    });

    return matchScore / allKeys.size;
  }

  /**
   * Analisa um par de códigos e retorna scores detalhados.
   */
  static analyzePair(codeA: string, codeB: string, language: string) {
    const normA = this.normalizeCode(codeA, language);
    const normB = this.normalizeCode(codeB, language);

    const tokensA = this.getTokens(normA);
    const tokensB = this.getTokens(normB);

    const jaccard = this.jaccardSimilarity(tokensA, tokensB);
    const structural = this.structuralSimilarity(normA, normB);
    
    // Texto normalizado similarity (overlap percent)
    const textOverlap = this.jaccardSimilarity(normA.split(" "), normB.split(" "));

    const overallScore = (jaccard * 0.4) + (structural * 0.4) + (textOverlap * 0.2);

    let level = "low";
    if (overallScore >= 0.90) level = "critical";
    else if (overallScore >= 0.75) level = "high";
    else if (overallScore >= 0.50) level = "medium";

    let explanation = "";
    if (level === "critical") {
      explanation = "Soluções idênticas ou extremamente similares na lógica e nomenclatura. Revisão imediata recomendada.";
    } else if (level === "high") {
      explanation = "Alta similaridade detectada na estrutura lógica. Pode indicar reaproveitamento de código.";
    } else if (level === "medium") {
      explanation = "Similaridade moderada detectada. Estruturas comuns encontradas.";
    } else {
      explanation = "Baixa similaridade. Códigos parecem ser independentes.";
    }

    return {
      score: overallScore,
      level,
      explanation,
      method_scores: {
        normalized_text: textOverlap,
        tokens: jaccard,
        structure: structural
      }
    };
  }
}

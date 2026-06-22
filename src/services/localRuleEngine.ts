export class LocalRuleEngine {
  static analyzeCode(language: string, code: string): any {
    const feedback = "A IA local está indisponível. Foi realizada uma análise básica por regras.";
    let score = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];
    const errors_found: string[] = [];

    const lcCode = code.toLowerCase();

    if (language.toLowerCase() === 'python') {
      if (lcCode.includes('def ')) strengths.push("Uso de funções.");
      else improvements.push("Considere organizar o código em funções (def).");

      if (lcCode.includes('print(')) strengths.push("Saída de dados implementada.");
      else improvements.push("O código não parece exibir resultados (print).");

      if (lcCode.includes('if ') || lcCode.includes('elif ')) strengths.push("Lógica condicional encontrada.");
      
      if (lcCode.includes('for ') || lcCode.includes('while ')) strengths.push("Estrutura de repetição encontrada.");

      score = 70; // Basic score
    } 
    else if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
      if (lcCode.includes('function ') || lcCode.includes('=>')) strengths.push("Uso de funções.");
      else improvements.push("Considere organizar o código em funções.");

      if (lcCode.includes('console.log')) strengths.push("Saída de dados implementada.");
      else improvements.push("O código não parece exibir resultados (console.log).");

      if (lcCode.includes('if ') || lcCode.includes('else')) strengths.push("Lógica condicional encontrada.");
      
      if (lcCode.includes('for ') || lcCode.includes('while ')) strengths.push("Estrutura de repetição encontrada.");

      score = 70;
    }
    else if (language.toLowerCase() === 'java') {
      if (lcCode.includes('class ')) strengths.push("Classe principal definida.");
      else errors_found.push("Classe não encontrada. Em Java é necessário definir uma 'class'.");

      if (lcCode.includes('public static void main')) strengths.push("Método main encontrado.");
      else errors_found.push("Método 'main' não encontrado.");

      if (lcCode.includes('system.out.print')) strengths.push("Saída de dados implementada.");
      else improvements.push("O código não parece exibir resultados (System.out.println).");

      score = 70;
    }
    else {
      improvements.push("Análise aprofundada não disponível para esta linguagem no motor de regras.");
      score = 50;
    }

    return {
      success: true,
      mode: "local_rule_engine",
      ai_available: false,
      score: score,
      summary: "Código analisado via motor de regras locais.",
      strengths: strengths,
      improvements: improvements,
      errors_found: errors_found,
      feedback: feedback
    };
  }
}

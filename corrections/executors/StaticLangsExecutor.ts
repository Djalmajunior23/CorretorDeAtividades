import { ExecutionResult } from "./BaseExecutor.ts";

export interface StaticAnalysisResult {
  syntaxOk: boolean;
  qualityScore: number;
  feedback: string;
  isUnavailable: boolean;
}

export class StaticLangsExecutor {
  /**
   * Helper to perform static analysis, Portugol parser or Pseudocode validations
   */
  static analyze(code: string, language: string): StaticAnalysisResult {
    const codeLower = code.toLowerCase();
    const lang = language.toLowerCase();

    // 1. Portugol Analyzer
    if (lang === "portugol") {
      const checks = {
        programa: codeLower.includes("programa") || codeLower.includes("algoritmo"),
        inicio: codeLower.includes("inicio") || codeLower.includes("início") || codeLower.includes("funcao"),
        fim: codeLower.includes("fim"),
        escreva: codeLower.includes("escreva") || codeLower.includes("escrever") || codeLower.includes("exiba"),
        leia: codeLower.includes("leia") || codeLower.includes("ler")
      };

      let scoreSum = 0;
      if (checks.programa) scoreSum += 6;
      if (checks.inicio) scoreSum += 6;
      if (checks.fim) scoreSum += 6;
      if (checks.escreva) scoreSum += 6;
      if (checks.leia) scoreSum += 6;

      let feedback = "Análise Estrutural e Pedagógica estática de Portugol concluída.\n";
      if (scoreSum === 30) {
        feedback += "✓ Excelente estrutura! Todos os blocos fundamentais (programa, inicio, fim, leia e escreva) estão declarados de acordo com a norma gramatical.";
      } else {
        feedback += "⚠ Estrutura parcialmente identificada. Verifique se declarou todos os operadores funcionais básicos de Portugol (programa, inicio, fim, escreva, leia).";
      }

      return {
        syntaxOk: scoreSum >= 18,
        qualityScore: scoreSum + 40, // 0-100 normalization
        feedback,
        isUnavailable: false
      };
    }

    // 2. Pseudocode Analyzer
    if (lang === "pseudocode" || lang === "pseudocodigo" || lang === "pseudocódigo") {
      const checks = {
        algoritmo: codeLower.includes("algoritmo") || codeLower.includes("pseudocódigo"),
        decl: codeLower.includes("var") || codeLower.includes("declarar") || codeLower.includes("inteiro") || codeLower.includes("real"),
        inicio: codeLower.includes("inicio") || codeLower.includes("início") || codeLower.includes("começo"),
        fim: codeLower.includes("fim") || codeLower.includes("fimalgoritmo")
      };

      let scoreSum = 0;
      if (checks.algoritmo) scoreSum += 7;
      if (checks.decl) scoreSum += 8;
      if (checks.inicio) scoreSum += 8;
      if (checks.fim) scoreSum += 7;

      let feedback = "Análise Pedagógica estática do Pseudocódigo concluída.\n";
      if (scoreSum === 30) {
        feedback += "✓ Parabéns! A semântica em pseudo-linguagem obedece minuciosamente às diretrizes curriculares clássicas (Bloco algoritmo, var, início e fimalgoritmo).";
      } else {
        feedback += "⚠ Faltam seções padrão na declaração do Pseudocódigo.\nSeu pseudocódigo deve conter 'Algoritmo', declarar variáveis no bloco 'var', possuir demarcadores de corpo 'inicio' e efetuar encerramento com 'fimalgoritmo'.";
      }

      return {
        syntaxOk: scoreSum >= 15,
        qualityScore: scoreSum + 40,
        feedback,
        isUnavailable: false
      };
    }

    // 3. Unavailable Compilation Languages (Java, C, C++, C#, php, go, rust, kotlin)
    let bracketsOk = true;
    let countOpen = (code.match(/\{/g) || []).length;
    let countClose = (code.match(/\}/g) || []).length;
    if (countOpen !== countClose) bracketsOk = false;

    let syntaxOk = false;
    let qualityScore = 15;
    let detail = "";

    if (lang === "java") {
      const hasClass = code.includes("class");
      const hasMain = code.includes("public static void main");
      syntaxOk = hasClass && hasMain && bracketsOk;
      qualityScore = hasMain ? 20 : 10;
      detail = syntaxOk 
        ? "Estrutura de Classe Java e método public static void main identificados."
        : "Problemas na análise de classe e chaves do código Java.";
    } 
    else if (lang === "c" || lang === "cpp") {
      const hasInclude = code.includes("#include");
      const hasMain = code.includes("int main") || code.includes("void main");
      syntaxOk = hasInclude && hasMain && bracketsOk;
      qualityScore = hasMain ? 20 : 8;
      detail = syntaxOk 
        ? "Inclusões stdio/iostream e função main() localizadas com sucesso."
        : "Sentença main() ou diretivas '#include' ausentes no código C/C++.";
    }
    else if (lang === "csharp") {
      const hasUsing = code.includes("using");
      const hasNamespace = code.includes("namespace") || code.includes("class");
      syntaxOk = hasUsing && hasNamespace && bracketsOk;
      qualityScore = hasNamespace ? 18 : 10;
      detail = syntaxOk ? "Namespace e diretiva 'using System' contempladas." : "C#: Estrutura de namespace ou classe principal ausentes.";
    }
    else if (lang === "php") {
      const hasPhpTag = code.includes("<?php") || code.includes("<?");
      syntaxOk = hasPhpTag;
      qualityScore = hasPhpTag ? 15 : 5;
      detail = hasPhpTag ? "Declaração PHP validada." : "PHP: Tag <?php de abertura não localizada.";
    }
    else if (lang === "go") {
      const hasPackage = code.includes("package ");
      const hasFuncMain = code.includes("func main");
      syntaxOk = hasPackage && hasFuncMain;
      qualityScore = hasFuncMain ? 20 : 10;
      detail = syntaxOk ? "Go: Estrutura package main e func main() validadas." : "Go: Pacote ou função main ausentes.";
    }
    else {
      syntaxOk = bracketsOk && code.length > 20;
      qualityScore = 15;
      detail = "Análise estática simples executada.";
    }

    return {
      syntaxOk,
      qualityScore,
      feedback: `Executor da linguagem ${language.toUpperCase()} ainda não está disponível neste ambiente de contêiner serverless local. Pelo checklist estático preliminar: ${detail}`,
      isUnavailable: true
    };
  }
}

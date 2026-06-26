import { aiService } from "../ai/services/AIService.ts";

export interface ProjectFile {
  filepath: string;
  content: string;
}

export interface ReviewResult {
  score: number;
  classification: "Excelente" | "Bom" | "Regular" | "Insuficiente";
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  securityWarnings: string[];
  pedagogicalFeedback: string;
  competencies: string[];
  nextSteps: string[];
}

export interface StructureAnalysis {
  baseFramework: string;
  detectedLanguage: string;
  filteredFiles: ProjectFile[];
  ignoredFilesCount: number;
  folders: string[];
  fileCount: number;
  structureSummary: string;
  structuralStrengths: string[];
  structuralWeaknesses: string[];
  structuralRecommendations: string[];
}

export class ProjectReviewEngine {
  /**
   * Identifica se um arquivo ou diretório é irrelevante para a análise técnica
   * (arquivos de build, dependências gigantes, segredos do sistema, etc.)
   */
  static isIrrelevantPath(filepath: string): boolean {
    const normalized = filepath.replace(/\\/g, "/").toLowerCase();
    
    // Pastas irrelevantes a ignorar
    const ignoredFolders = [
      "node_modules/",
      ".git/",
      ".github/",
      "__pycache__/",
      ".idea/",
      ".vscode/",
      "dist/",
      "build/",
      "target/",
      ".gradle/",
      "bin/",
      "obj/",
      ".pytest_cache/",
      ".angular/",
      ".next/",
      ".nuxt/",
      "out/",
      "vendor/",
      "venv/",
      "env/",
      ".venv/"
    ];
    
    // Arquivos irrelevantes a ignorar
    const ignoredFiles = [
      ".ds_store",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "composer.lock",
      "gemfile.lock",
      ".gitattributes",
      ".gitignore"
    ];
    
    // Se estiver em uma pasta irrelevante
    const isInIgnoredFolder = ignoredFolders.some(folder => normalized.includes(folder) || normalized.startsWith(folder));
    if (isInIgnoredFolder) return true;
    
    // Se for um arquivo de lock ou configuração irrelevante
    const filename = normalized.split("/").pop() || "";
    if (ignoredFiles.includes(filename)) return true;
    
    return false;
  }

  /**
   * Analisa os arquivos relevantes do projeto e detecta automaticamente o framework base e linguagem
   */
  static detectBaseFramework(files: ProjectFile[]): { framework: string; confidence: number; detectedLanguage: string } {
    let framework = "Nenhum/Standard";
    let confidence = 0;
    let detectedLanguage = "Desconhecida";

    let hasReactDeps = false;
    let hasExpressDeps = false;
    let hasAngularDeps = false;
    let hasVueDeps = false;
    let hasNestDeps = false;
    let hasSpringBootDeps = false;
    let hasDjangoDeps = false;
    let hasFlaskDeps = false;
    let hasFastAPIDeps = false;
    let hasLaravelDeps = false;
    let hasRailsDeps = false;
    let hasDotnetCore = false;

    let reactFileCount = 0;
    let springAnnotationsCount = 0;
    let djangoFilesCount = 0;
    let flaskImportsCount = 0;
    let fastapiImportsCount = 0;
    let expressImportsCount = 0;

    files.forEach(file => {
      const filename = file.filepath.toLowerCase();
      const content = file.content || "";
      const lcContent = content.toLowerCase();

      // Heurísticas de arquivos de manifesto
      if (filename.endsWith("package.json")) {
        try {
          const pkg = JSON.parse(content);
          const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
          
          if (deps["react"]) { hasReactDeps = true; detectedLanguage = "TypeScript/JavaScript"; }
          if (deps["express"]) { hasExpressDeps = true; detectedLanguage = "TypeScript/JavaScript"; }
          if (deps["@angular/core"]) { hasAngularDeps = true; detectedLanguage = "TypeScript"; }
          if (deps["vue"]) { hasVueDeps = true; detectedLanguage = "JavaScript/Vue"; }
          if (deps["@nestjs/core"]) { hasNestDeps = true; detectedLanguage = "TypeScript"; }
        } catch (e) {}
      }

      if (filename.endsWith("pom.xml") || filename.endsWith("build.gradle")) {
        detectedLanguage = "Java";
        if (lcContent.includes("spring-boot") || lcContent.includes("springframework")) {
          hasSpringBootDeps = true;
        }
      }

      if (filename.endsWith("requirements.txt") || filename.endsWith("pyproject.toml") || filename.endsWith("pipfile")) {
        detectedLanguage = "Python";
        if (lcContent.includes("django")) hasDjangoDeps = true;
        if (lcContent.includes("flask")) hasFlaskDeps = true;
        if (lcContent.includes("fastapi")) hasFastAPIDeps = true;
      }

      if (filename.endsWith("composer.json")) {
        detectedLanguage = "PHP";
        if (lcContent.includes("laravel")) hasLaravelDeps = true;
      }

      if (filename.endsWith("gemfile")) {
        detectedLanguage = "Ruby";
        if (lcContent.includes("rails")) hasRailsDeps = true;
      }

      if (filename.endsWith(".csproj")) {
        detectedLanguage = "C#";
        if (lcContent.includes("microsoft.aspnetcore") || lcContent.includes("microsoft.net.sdk.web")) {
          hasDotnetCore = true;
        }
      }

      // Heurísticas de conteúdo e estrutura de arquivos
      if (filename.endsWith(".jsx") || filename.endsWith(".tsx") || (filename.endsWith(".js") && lcContent.includes("import react"))) {
        reactFileCount++;
      }

      if (filename.endsWith(".java")) {
        detectedLanguage = "Java";
        if (content.includes("@SpringBootApplication") || content.includes("@RestController") || content.includes("@Autowired") || content.includes("@Service")) {
          springAnnotationsCount++;
        }
      }

      if (filename.endsWith("manage.py") || filename.endsWith("settings.py") || filename.endsWith("wsgi.py")) {
        djangoFilesCount++;
        detectedLanguage = "Python";
      }

      if (lcContent.includes("from flask import") || lcContent.includes("import flask")) {
        flaskImportsCount++;
        detectedLanguage = "Python";
      }

      if (lcContent.includes("from fastapi import") || lcContent.includes("import fastapi")) {
        fastapiImportsCount++;
        detectedLanguage = "Python";
      }

      if (lcContent.includes("require('express')") || lcContent.includes("import express")) {
        expressImportsCount++;
        detectedLanguage = "TypeScript/JavaScript";
      }
    });

    // Ranqueamento dos frameworks por pontuação de confiança
    const frameworkScores = [
      { name: "React", score: (hasReactDeps ? 100 : 0) + (reactFileCount > 0 ? 40 + reactFileCount : 0), lang: "TypeScript/JavaScript" },
      { name: "Spring Boot", score: (hasSpringBootDeps ? 100 : 0) + (springAnnotationsCount > 0 ? 40 + springAnnotationsCount * 10 : 0), lang: "Java" },
      { name: "Django", score: (hasDjangoDeps ? 100 : 0) + (djangoFilesCount > 0 ? 50 + djangoFilesCount * 20 : 0), lang: "Python" },
      { name: "Flask", score: (hasFlaskDeps ? 100 : 0) + (flaskImportsCount > 0 ? 40 + flaskImportsCount * 15 : 0), lang: "Python" },
      { name: "FastAPI", score: (hasFastAPIDeps ? 100 : 0) + (fastapiImportsCount > 0 ? 40 + fastapiImportsCount * 15 : 0), lang: "Python" },
      { name: "Express.js", score: (hasExpressDeps ? 100 : 0) + (expressImportsCount > 0 ? 40 + expressImportsCount * 10 : 0), lang: "TypeScript/JavaScript" },
      { name: "Angular", score: (hasAngularDeps ? 100 : 0), lang: "TypeScript" },
      { name: "Vue.js", score: (hasVueDeps ? 100 : 0), lang: "JavaScript/Vue" },
      { name: "NestJS", score: (hasNestDeps ? 100 : 0), lang: "TypeScript" },
      { name: "Laravel", score: (hasLaravelDeps ? 100 : 0), lang: "PHP" },
      { name: "Ruby on Rails", score: (hasRailsDeps ? 100 : 0), lang: "Ruby" },
      { name: "ASP.NET Core", score: (hasDotnetCore ? 100 : 0), lang: "C#" }
    ];

    frameworkScores.sort((a, b) => b.score - a.score);
    const bestMatch = frameworkScores[0];

    if (bestMatch && bestMatch.score > 0) {
      framework = bestMatch.name;
      confidence = Math.min(100, bestMatch.score);
      detectedLanguage = bestMatch.lang;
    } else {
      // Dedução secundária por extensões de arquivo predominantes
      const extCounts: Record<string, number> = {};
      files.forEach(file => {
        const ext = file.filepath.split(".").pop()?.toLowerCase();
        if (ext) {
          extCounts[ext] = (extCounts[ext] || 0) + 1;
        }
      });

      const sortedExts = Object.entries(extCounts).sort((a, b) => b[1] - a[1]);
      if (sortedExts.length > 0) {
        const mainExt = sortedExts[0][0];
        if (["py"].includes(mainExt)) detectedLanguage = "Python";
        else if (["java"].includes(mainExt)) detectedLanguage = "Java";
        else if (["js", "jsx"].includes(mainExt)) detectedLanguage = "JavaScript";
        else if (["ts", "tsx"].includes(mainExt)) detectedLanguage = "TypeScript";
        else if (["cs"].includes(mainExt)) detectedLanguage = "C#";
        else if (["cpp", "h"].includes(mainExt)) detectedLanguage = "C++";
        else if (["c"].includes(mainExt)) detectedLanguage = "C";
        else if (["php"].includes(mainExt)) detectedLanguage = "PHP";
        else if (["rb"].includes(mainExt)) detectedLanguage = "Ruby";
      }
    }

    return { framework, confidence, detectedLanguage };
  }

  /**
   * Serviço principal de análise estrutural do repositório
   */
  static analyzeProjectStructure(files: ProjectFile[]): StructureAnalysis {
    const filteredFiles: ProjectFile[] = [];
    let ignoredFilesCount = 0;

    files.forEach(f => {
      if (this.isIrrelevantPath(f.filepath)) {
        ignoredFilesCount++;
      } else {
        filteredFiles.push(f);
      }
    });

    const { framework, detectedLanguage } = this.detectBaseFramework(filteredFiles);

    // Identificar pastas lógicas do projeto filtrado
    const foldersSet = new Set<string>();
    filteredFiles.forEach(f => {
      const parts = f.filepath.split("/");
      if (parts.length > 1) {
        foldersSet.add(parts[0]);
        if (parts.length > 2) {
          foldersSet.add(`${parts[0]}/${parts[1]}`);
        }
      }
    });

    const folders = Array.from(foldersSet);

    // Heurísticas de boas práticas de arquitetura e estrutura
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (ignoredFilesCount > 0) {
      strengths.push(`Limpeza de repositório: Otimizado ao filtrar ${ignoredFilesCount} arquivos irrelevantes de build ou dependências locais.`);
    }

    if (folders.length > 3) {
      strengths.push(`Modularização de pastas: O projeto possui uma divisão estrutural adequada em ${folders.length} subdiretórios.`);
    } else if (folders.length > 0) {
      strengths.push("Estrutura lógica de pastas inicial identificada.");
    } else {
      weaknesses.push("Baixa modularidade: Todo o código-fonte está plano na raiz do projeto.");
      recommendations.push("Organize o código em diretórios padronizados de acordo com as convenções da comunidade (ex: src/, controllers/, components/).");
    }

    // Regras específicas por Framework
    if (framework === "React") {
      const hasSrc = filteredFiles.some(f => f.filepath.startsWith("src/"));
      const hasComponents = filteredFiles.some(f => f.filepath.includes("components/"));
      if (hasSrc) strengths.push("Organização de acordo com convenção 'src/' em projetos React.");
      if (hasComponents) strengths.push("Diretório dedicado para componentes reutilizáveis ('components/').");
      else {
        weaknesses.push("Falta de diretório focado em componentes isolados/reutilizáveis.");
        recommendations.push("Crie uma pasta dedicada 'src/components/' para separar seus componentes visuais reutilizáveis.");
      }
    } else if (framework === "Spring Boot") {
      const hasController = filteredFiles.some(f => f.filepath.toLowerCase().includes("controller"));
      const hasService = filteredFiles.some(f => f.filepath.toLowerCase().includes("service"));
      const hasRepository = filteredFiles.some(f => f.filepath.toLowerCase().includes("repository") || f.filepath.toLowerCase().includes("dao"));

      if (hasController && hasService && hasRepository) {
        strengths.push("Padrão MVC / Arquitetura em 3 camadas de alto nível estruturada perfeitamente.");
      } else {
        if (!hasController) {
          weaknesses.push("Camada de controle de rotas de API não identificada.");
          recommendations.push("Crie Controllers Java annotados com @RestController para centralizar suas rotas HTTP.");
        }
        if (!hasService) {
          weaknesses.push("Ausência de uma camada isolada de serviços (Service).");
          recommendations.push("Adicione classes annotated com @Service para conter as regras de negócio separadas do Controller.");
        }
      }
    } else if (framework === "Django") {
      const hasModels = filteredFiles.some(f => f.filepath.includes("models.py"));
      const hasViews = filteredFiles.some(f => f.filepath.includes("views.py"));
      if (hasModels && hasViews) {
        strengths.push("Padrão estrutural clássico do Django MVT perfeitamente preservado.");
      } else {
        weaknesses.push("Organização MVT incompleta para projeto Django.");
        recommendations.push("Estruture o seu app Django com arquivos 'models.py' e 'views.py' correspondentes.");
      }
    }

    const structureSummary = `Análise Estrutural: Detectado ecossistema ${detectedLanguage} com framework principal ${framework}. O projeto possui ${filteredFiles.length} arquivos significativos analisados e ${ignoredFilesCount} arquivos de ruído ignorados com sucesso.`;

    return {
      baseFramework: framework,
      detectedLanguage,
      filteredFiles,
      ignoredFilesCount,
      folders,
      fileCount: filteredFiles.length,
      structureSummary,
      structuralStrengths: strengths,
      structuralWeaknesses: weaknesses,
      structuralRecommendations: recommendations
    };
  }

  static analyzeLocally(
    files: ProjectFile[],
    language: string,
    framework: string,
    structureSummary?: string
  ): ReviewResult {
    // 1. Executa a Análise Estrutural Avançada filtrando ruídos
    const structuralAnalysis = this.analyzeProjectStructure(files);
    const relevantFiles = structuralAnalysis.filteredFiles;
    const finalLanguage = language && language !== "Desconhecida" ? language : structuralAnalysis.detectedLanguage;
    const finalFramework = framework && framework !== "Nenhum" ? framework : structuralAnalysis.baseFramework;
    const finalSummary = structureSummary || structuralAnalysis.structureSummary;

    // 2. Pontuações iniciais de critérios profissionais
    let scoreOrganizacao = 10;   // max 15
    let scoreEstrutura = 10;     // max 15
    let scoreLegibilidade = 11;  // max 15
    let scoreBoasPraticas = 10;  // max 15
    let scoreDocumentacao = 5;    // max 10
    let scoreTratamentoErros = 5; // max 10
    let scoreSeguranca = 10;      // max 10
    let scoreFramework = 8;       // max 10

    const strengths: string[] = [...structuralAnalysis.structuralStrengths];
    const weaknesses: string[] = [...structuralAnalysis.structuralWeaknesses];
    const recommendations: string[] = [...structuralAnalysis.structuralRecommendations];
    const securityWarnings: string[] = [];
    const competencies: string[] = ["Lógica Básica de Programação", "Estruturação de Arquivos"];
    const nextSteps: string[] = [];

    const fileCount = relevantFiles.length;
    const hasReadme = relevantFiles.some(f => f.filepath.toLowerCase().includes("readme.md"));
    const hasTests = relevantFiles.some(f => f.filepath.toLowerCase().includes("test") || f.filepath.toLowerCase().includes("spec"));
    
    // Configurações do ecossistema do framework detectado
    const hasPackageJson = relevantFiles.some(f => f.filepath.toLowerCase().includes("package.json"));
    const hasPomXml = relevantFiles.some(f => f.filepath.toLowerCase().includes("pom.xml"));
    const hasBuildGradle = relevantFiles.some(f => f.filepath.toLowerCase().includes("build.gradle"));
    const hasRequirements = relevantFiles.some(f => f.filepath.toLowerCase().includes("requirements.txt"));
    const hasPyProject = relevantFiles.some(f => f.filepath.toLowerCase().includes("pyproject.toml"));

    // Heurísticas de Documentação
    if (hasReadme) {
      scoreDocumentacao += 3;
      scoreOrganizacao += 3;
      strengths.push("Presença de documentação inicial (README.md) orientando sobre o projeto.");
    } else {
      weaknesses.push("Ausência de um arquivo README.md para documentar o repositório.");
      recommendations.push("Adicione um arquivo README.md contendo instruções de execução, pré-requisitos e descrição de arquitetura.");
    }

    // Heurísticas de Organização de Pastas
    if (structuralAnalysis.folders.length > 1) {
      scoreOrganizacao += 2;
      scoreEstrutura += 2;
    }

    // Heurísticas de Testes Automatizados
    if (hasTests) {
      scoreEstrutura += 3;
      scoreBoasPraticas += 2;
      strengths.push("Presença de arquivos de teste (unitários ou integração) identificados.");
      competencies.push("Testes Unitários e Qualidade de Software");
    } else {
      weaknesses.push("Nenhum arquivo de teste automatizado identificado no repositório.");
      recommendations.push("Implemente testes utilizando frameworks recomendados (ex: Jest, PyTest, JUnit) para assegurar o funcionamento.");
    }

    // Heurísticas de adequação do Framework
    let isFrameworkMatched = false;
    if (finalLanguage.toLowerCase() === "python" && (hasRequirements || hasPyProject)) {
      isFrameworkMatched = true;
    } else if (finalLanguage.toLowerCase() === "java" && (hasPomXml || hasBuildGradle)) {
      isFrameworkMatched = true;
    } else if (["javascript", "typescript", "node"].includes(finalLanguage.toLowerCase()) && hasPackageJson) {
      isFrameworkMatched = true;
    }

    if (isFrameworkMatched || structuralAnalysis.baseFramework !== "Nenhum/Standard") {
      scoreFramework = 10;
      strengths.push(`Utilização correta dos arquivos padrão de configuração para o framework ${finalFramework}.`);
    } else {
      scoreFramework = 6;
      weaknesses.push(`Falta de arquivos de manifesto de dependências claros para o ecossistema ${finalLanguage}.`);
      recommendations.push("Adicione arquivos de gerenciamento de dependências adequados ao projeto.");
    }

    // Análise de Conteúdo e Boas Práticas dos Arquivos Relevantes
    let totalLines = 0;
    let totalComments = 0;
    let tryCatchCount = 0;
    let evalCount = 0;
    let sqlConcatCount = 0;
    let hardcodedSecrets = 0;

    relevantFiles.forEach(f => {
      const content = f.content || "";
      const lcContent = content.toLowerCase();
      const lines = content.split("\n");
      totalLines += lines.length;

      // Contagem simples de comentários
      lines.forEach(l => {
        const trimmed = l.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
          totalComments++;
        }
      });

      // Contagem de tratamento de erros
      const tryCatchMatches = lcContent.match(/try\s*\{|except\s*|catch\s*\(/g);
      if (tryCatchMatches) {
        tryCatchCount += tryCatchMatches.length;
      }

      // Alertas de Segurança Básica
      if (lcContent.includes("eval(") || lcContent.includes("exec(")) {
        evalCount++;
      }

      if (lcContent.includes("select ") && (lcContent.includes(" + ") || lcContent.includes(" % ") || lcContent.includes(".format("))) {
        sqlConcatCount++;
      }

      const secretKeywords = ["api_key =", "password =", "secret_key =", "token =", "senha ="];
      secretKeywords.forEach(kw => {
        if (lcContent.includes(kw)) {
          hardcodedSecrets++;
        }
      });
    });

    // Legibilidade e Documentação Inline
    if (totalLines > 0) {
      const commentRatio = totalComments / totalLines;
      if (commentRatio > 0.05) {
        scoreDocumentacao = Math.min(10, scoreDocumentacao + 2);
        scoreLegibilidade = Math.min(15, scoreLegibilidade + 2);
        strengths.push("Excelente clareza técnica e boa densidade de comentários inline explicando as regras.");
      } else {
        scoreDocumentacao = Math.max(2, scoreDocumentacao - 1);
        weaknesses.push("Baixa densidade de comentários explicando trechos complexos de negócio.");
      }
    }

    // Tratamento de Erros
    if (tryCatchCount > 0) {
      scoreTratamentoErros = Math.min(10, scoreTratamentoErros + (tryCatchCount >= 3 ? 5 : 3));
      strengths.push("Implementação ativa de try/catch para prevenção de falhas em runtime.");
      competencies.push("Tratamento de Exceções e Resiliência");
    } else {
      scoreTratamentoErros = 3;
      weaknesses.push("Ausência de tratamento defensivo contra falhas de execução críticas.");
      recommendations.push("Implemente blocos try/catch ou tratamento centralizado de erros em rotas e serviços principais.");
    }

    // Processamento de Alertas de Segurança
    if (evalCount > 0) {
      scoreSeguranca -= 4;
      securityWarnings.push("Uso inseguro de funções do sistema eval() ou exec() detectado.");
      recommendations.push("Substitua execuções dinâmicas de código (eval) por mecanismos estruturados de parser seguro.");
    }
    if (sqlConcatCount > 0) {
      scoreSeguranca -= 3;
      securityWarnings.push("Possível concatenação direta em consultas SQL (vulnerabilidade de SQL Injection).");
      recommendations.push("Utilize queries parametrizadas, prepared statements ou ORM oficial para neutralizar SQL Injection.");
    }
    if (hardcodedSecrets > 0) {
      scoreSeguranca -= 3;
      securityWarnings.push("Presença de segredos ou chaves privadas gravados em texto claro (Hardcoded Secrets).");
      recommendations.push("Mova credenciais, senhas e tokens para arquivos de variáveis de ambiente protegidos (.env).");
    }

    scoreSeguranca = Math.max(0, scoreSeguranca);

    // Garantir limites máximos de cada critério
    scoreOrganizacao = Math.min(15, scoreOrganizacao);
    scoreEstrutura = Math.min(15, scoreEstrutura);
    scoreLegibilidade = Math.min(15, scoreLegibilidade);
    scoreBoasPraticas = Math.min(15, scoreBoasPraticas);
    scoreDocumentacao = Math.min(10, scoreDocumentacao);
    scoreTratamentoErros = Math.min(10, scoreTratamentoErros);
    scoreFramework = Math.min(10, scoreFramework);

    const totalScore = scoreOrganizacao + scoreEstrutura + scoreLegibilidade + scoreBoasPraticas + scoreDocumentacao + scoreTratamentoErros + scoreSeguranca + scoreFramework;
    
    let classification: "Excelente" | "Bom" | "Regular" | "Insuficiente" = "Insuficiente";
    if (totalScore >= 90) classification = "Excelente";
    else if (totalScore >= 75) classification = "Bom";
    else if (totalScore >= 60) classification = "Regular";

    if (totalScore >= 80) {
      competencies.push("Boas Práticas de Engenharia", "Estrutura de Código Limpo");
    }

    // Garantir valores únicos
    const uniqueStrengths = Array.from(new Set(strengths));
    const uniqueWeaknesses = Array.from(new Set(weaknesses));
    const uniqueRecommendations = Array.from(new Set(recommendations));
    const uniqueSecurityWarnings = Array.from(new Set(securityWarnings));
    const uniqueCompetencies = Array.from(new Set(competencies));

    const generatedNextSteps = [
      "Analisar detalhadamente o parecer de engenharia pedagógica do CodeCheck.",
      "Planejar refatoração estrutural com foco na separação de responsabilidades."
    ];
    if (uniqueSecurityWarnings.length > 0) {
      generatedNextSteps.unshift("Corrigir imediatamente com alta prioridade todos os alertas de segurança.");
    }
    if (!hasTests) {
      generatedNextSteps.push("Adicionar uma suite de testes unitários básica para os fluxos principais.");
    }

    let defaultFeedback = `O repositório do projeto obteve uma nota de avaliação técnica de ${totalScore}/100, classificado como ${classification.toUpperCase()}. `;
    if (totalScore >= 75) {
      defaultFeedback += `Demonstra grande domínio tecnológico no ecossistema ${finalLanguage} utilizando ${finalFramework}, estruturando o projeto com boa aderência às convenções arquiteturais.`;
    } else {
      defaultFeedback += `Recomenda-se realizar uma revisão no acoplamento das classes, criar diretórios lógicos para evitar arquivos avulsos na raiz e adicionar documentação detalhada.`;
    }

    return {
      score: totalScore,
      classification,
      strengths: uniqueStrengths.length > 0 ? uniqueStrengths : ["Estrutura básica de arquivos reconhecida."],
      weaknesses: uniqueWeaknesses.length > 0 ? uniqueWeaknesses : ["Nenhuma fragilidade estrutural grave encontrada."],
      recommendations: uniqueRecommendations.length > 0 ? uniqueRecommendations : ["Continue polindo a arquitetura de arquivos."],
      securityWarnings: uniqueSecurityWarnings.length > 0 ? uniqueSecurityWarnings : ["Nenhum alerta de segurança grave identificado."],
      pedagogicalFeedback: defaultFeedback,
      competencies: uniqueCompetencies,
      nextSteps: generatedNextSteps
    };
  }

  static async reviewProject(
    files: ProjectFile[],
    language: string,
    framework: string,
    structureSummary?: string
  ): Promise<ReviewResult> {
    const localResult = this.analyzeLocally(files, language, framework, structureSummary);

    // Tentativa de enriquecimento técnico e parecer pedagógico completo via Inteligência Artificial
    try {
      const structuralAnalysis = this.analyzeProjectStructure(files);
      const relevantFiles = structuralAnalysis.filteredFiles;
      const finalLanguage = language && language !== "Desconhecida" ? language : structuralAnalysis.detectedLanguage;
      const finalFramework = framework && framework !== "Nenhum" ? framework : structuralAnalysis.baseFramework;

      const filesPreviewPrompt = relevantFiles.slice(0, 5).map(f => `- **Caminho**: ${f.filepath}\n\`\`\`${finalLanguage}\n${(f.content || "").slice(0, 800)}\n\`\`\``).join("\n\n");
      
      const prompt = `Você é o CodeCheck Project Review Engine, um analista técnico especialista em avaliação pedagógica de repositórios.
Estamos avaliando as características do projeto de engenharia:
- Linguagem Detectada: ${finalLanguage}
- Framework/Biblioteca Base: ${finalFramework}
- Resumo estrutural: ${structureSummary || structuralAnalysis.structureSummary}

Resultados de análise estática local:
- Pontuação estrutural: ${localResult.score}/100
- Classificação: ${localResult.classification}
- Pontos Fortes identificados: ${JSON.stringify(localResult.strengths)}
- Pontos de melhoria identificados: ${JSON.stringify(localResult.weaknesses)}
- Recomendações: ${JSON.stringify(localResult.recommendations)}
- Alertas de Segurança: ${JSON.stringify(localResult.securityWarnings)}

Veja a visualização dos arquivos mais importantes do projeto:
${filesPreviewPrompt}

Sua tarefa:
1. Validar e refinar todos os dados de forma didática e corporativa de alto nível.
2. Formular um parecer pedagógico detalhado (pedagogicalFeedback) explicando os fundamentos arquiteturais do projeto de forma construtiva para o aluno.
3. Fornecer a resposta exclusivamente em formato JSON com as chaves exatas descritas abaixo:
   - "score": número (0 a 100)
   - "classification": string ("Excelente", "Bom", "Regular", "Insuficiente")
   - "strengths": array de strings
   - "weaknesses": array de strings
   - "recommendations": array de strings
   - "securityWarnings": array de strings
   - "pedagogicalFeedback": string contendo o parecer didático enriquecido
   - "competencies": array de strings
   - "nextSteps": array de strings

Retorne unicamente o objeto JSON válido, sem tags markdown externas ou preâmbulos.`;

      const aiResponse = await aiService.generateWithRetry(prompt);
      const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const aiResult = JSON.parse(cleanJson);
      
      if (aiResult && typeof aiResult.score === "number") {
        return {
          score: aiResult.score,
          classification: aiResult.classification || localResult.classification,
          strengths: aiResult.strengths || localResult.strengths,
          weaknesses: aiResult.weaknesses || localResult.weaknesses,
          recommendations: aiResult.recommendations || localResult.recommendations,
          securityWarnings: aiResult.securityWarnings || localResult.securityWarnings,
          pedagogicalFeedback: aiResult.pedagogicalFeedback || localResult.pedagogicalFeedback,
          competencies: aiResult.competencies || localResult.competencies,
          nextSteps: aiResult.nextSteps || localResult.nextSteps
        };
      }
    } catch (e) {
      console.warn("[ProjectReviewEngine] Falha ao enriquecer com IA. Retornando os dados analíticos locais perfeitos.", e);
    }

    return localResult;
  }
}

export interface SecurityResult {
  security_ok: boolean;
  reason: string | null;
}

export class SecurityAnalyzer {
  static check(code: string, language: string): SecurityResult {
    const codeLower = code.toLowerCase();
    const lang = language.toLowerCase();

    // General severe threat matches
    const generalThreats = [
      { pattern: "rm -rf", desc: "Tentativa de remoção recursiva de diretórios (rm -rf)" },
      { pattern: ":(){ :|:& };:", desc: "Padrão de Fork bomb detectado para evitar negação de serviço" },
    ];

    for (const t of generalThreats) {
      if (codeLower.includes(t.pattern)) {
        return { security_ok: false, reason: t.desc };
      }
    }

    if (lang === "python") {
      const pyThreats = [
        { pattern: "eval(", desc: "Uso proibido de eval() devido a riscos graves de injeção de código" },
        { pattern: "exec(", desc: "Uso proibido de exec() devido a riscos de execução remota de scripts" },
        { pattern: "subprocess", desc: "Manipulação de processos auxiliares e terminais via 'subprocess' bloqueada" },
        { pattern: "os.system", desc: "Invocação direta de comandos do sistema executora via 'os.system' bloqueada" },
        { pattern: "child_process", desc: "Uso impróprio de child_process em scripts Python" },
        { pattern: "socket", desc: "Sinal socket inibido para mitigar saídas de rede não autorizadas" },
        { pattern: "requests", desc: "Requisições HTTP externas pela biblioteca 'requests' desabilitadas" },
        { pattern: "fetch", desc: "Chamadas de requisições de rede 'fetch' externas bloqueadas" },
        { pattern: "while true", desc: "Laço infinito sem controle aparente ('while True' detectado sem 'break' de parada)" },
        { pattern: "import os", desc: "Importação direta de comandos do sistema ('os') bloqueada por segurança" },
        { pattern: "shutil", desc: "Manipulação avançada de arquivos via module shutil bloqueada" },
        { pattern: "fs.rm", desc: "Remoção de filesystem (fs.rm) bloqueada" },
      ];

      for (const t of pyThreats) {
        if (codeLower.includes(t.pattern.toLowerCase())) {
          // Allow "while true" if it includes break, continue or exit logic
          if (t.pattern === "while true" && (codeLower.includes("break") || codeLower.includes("return") || codeLower.includes("sys.exit"))) {
            continue;
          }
          return { security_ok: false, reason: t.desc };
        }
      }
    }

    if (lang === "javascript" || lang === "typescript" || lang === "js" || lang === "ts") {
      const jsThreats = [
        { pattern: "child_process", desc: "Instanciação de processos secundários via child_process bloqueada" },
        { pattern: "require(", desc: "Importação legada require() não permitida no sandbox seguro" },
        { pattern: "fs.rm", desc: "Deleção de arquivos no filesystem de controle (fs.rm) bloqueada" },
        { pattern: "fs.", desc: "Operação no sistema de arquivos local do servidor ('fs') bloqueada" },
        { pattern: "eval(", desc: "Injeção dinâmica de scripts e interpretador local ('eval') proibido" },
        { pattern: "process.", desc: "Tentativa de manipulação ou exaustão do processo Node host ('process') bloqueada" },
        { pattern: "socket", desc: "Bloqueio preventivo de tráfego de rede interna por sockets" },
        { pattern: "fetch(", desc: "Requisições HTTP externas do navegador ou runtime ('fetch') bloqueadas" },
        { pattern: "while (true)", desc: "Laço indefinido eterno ('while (true)') sem controle" },
      ];

      for (const t of jsThreats) {
        if (codeLower.includes(t.pattern.toLowerCase())) {
          if (t.pattern === "while (true)" && (codeLower.includes("break") || codeLower.includes("return"))) {
            continue;
          }
          return { security_ok: false, reason: t.desc };
        }
      }
    }

    return { security_ok: true, reason: null };
  }
}

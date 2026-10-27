
export class SecurityScanner {
  private static BLOCKED_PATTERNS: Record<string, string[]> = {
    python: [
      "import os", "from os", "import subprocess", "from subprocess",
      "import socket", "from socket", "eval(", "exec(", "open(", "__import__",
      "getattr(", "setattr(", "delattr(", "pty.", "shutil.", "pickle.", "marshal."
    ],
    javascript: [
      "require('fs')", "require(\"fs\")", "child_process", "process.env",
      "eval(", "Function(", "XMLHttpRequest", "fetch(", "require('net')", "require('http')"
    ],
    java: [
      "Runtime.getRuntime()", "ProcessBuilder", "System.exit", "java.io.File",
      "java.net.", "java.nio.", "System.load", "System.setProperty"
    ],
    cpp: [
      "system(", "fork(", "exec(", "#include <unistd.h>", "#include <sys/socket.h>",
      "#include <fstream>",
      "std::filesystem", "remove(", "rename("
    ],
    c: [
      "system(", "fork(", "exec(", "#include <unistd.h>", "#include <sys/socket.h>",
      "fopen(", "remove(", "rename("
    ],
    php: [
      "shell_exec", "exec(", "system(", "passthru", "proc_open", "file_get_contents",
      "unlink(", "rmdir(", "mkdir(", "curl_init", "popean"
    ],
    sql: [
      "DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE USER", "GRANT", "REVOKE",
      "UPDATE", "INSERT INTO", "COMMIT", "ROLLBACK" // Blocks everything except SELECT for safety in sandbox
    ]
  };

  static scan(language: string, code: string): { safe: boolean; flaggedPatterns: string[] } {
    const aliases: Record<string, string> = { js: "javascript", node: "javascript", nodejs: "javascript", typescript: "javascript", py: "python", python3: "python", "c++": "cpp" };
    const normalized = language.toLowerCase().trim();
    const lang = aliases[normalized] || normalized;
    const patterns = this.BLOCKED_PATTERNS[lang] || [];
    const flaggedPatterns: string[] = [];

    for (const pattern of patterns) {
      if (lang === "sql" ? code.toUpperCase().includes(pattern) : code.includes(pattern)) {
        flaggedPatterns.push(pattern);
      }
    }

    return {
      safe: flaggedPatterns.length === 0,
      flaggedPatterns
    };
  }
}

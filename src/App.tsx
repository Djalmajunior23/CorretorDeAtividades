import React, { useState, useEffect } from "react";
import Sidebar from "./components/layout/Sidebar";
import { 
  Play, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Clock, 
  Activity, 
  Layers, 
  Award,
  ChevronRight,
  Code2,
  FileText,
  UploadCloud,
  Sparkles
} from "lucide-react";
import { TestCase, CorrectionResult, SubmissionLog } from "./types";

const CODE_TEMPLATES: Record<string, string> = {
  python: `a, b = map(int, input().split())
print(a + b)`,
  javascript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(" ").map(Number);
console.log(input[0] + input[1]);`,
  typescript: `import * as fs from "fs";
const input = fs.readFileSync(0, "utf8").trim().split(" ").map(Number);
console.log(input[0] + input[1]);`,
  java: `import java.util.*;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(String);
    int a = sc.nextInt();
    int b = sc.nextInt();
    System.out.println(a + b);
  }
}`,
  c: `#include <stdio.h>

int main() {
  int a, b;
  scanf("%d %d", &a, &b);
  printf("%d\\n", a + b);
  return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
  int a, b;
  cin >> a >> b;
  cout << a + b << endl;
  return 0;
}`,
  csharp: `using System;

class Program {
  static void Main() {
    string[] tokens = Console.ReadLine().Split(' ');
    int a = int.Parse(tokens[0]);
    int b = int.Parse(tokens[1]);
    Console.WriteLine(a + b);
  }
}`,
  php: `<?php
$tokens = explode(" ", trim(fgets(STDIN)));
echo intval($tokens[0]) + intval($tokens[1]) . "\\n";`,
  go: `package main
import (
  "fmt"
  "os"
)

func main() {
  var a, b int
  fmt.Fscan(os.Stdin, &a, &b)
  fmt.Println(a + b)
}`,
  rust: `use std::io;

fn main() {
  let mut input = String::new();
  io::stdin().read_line(&mut input).unwrap();
  let parts: Vec<i32> = input.trim().split_whitespace().map(|s| s.parse().unwrap()).collect();
  println!("{}", parts[0] + parts[1]);
}`,
  kotlin: `import java.util.Scanner

fn main() {
  val sc = Scanner(System.\`in\`)
  val a = sc.nextInt()
  val b = sc.nextInt()
  println(a + b)
}`,
  sql: `CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(50), age INT);
INSERT INTO employees VALUES (1, 'Alice', 25);
INSERT INTO employees VALUES (2, 'Bob', 32);
SELECT name, age FROM employees WHERE age > 30;`,
  portugol: `programa {
  funcao inicio() {
    inteiro a, b, resultado
    leia(a)
    leia(b)
    resultado = a + b
    escreva(resultado)
  }
}`,
  pseudocode: `Algoritmo SomaValores
Var
  a, b, resultado : inteiro
Inicio
  leia(a)
  leia(b)
  resultado <- a + b
  escreva(resultado)
Fimalgoritmo`
};

// Target execution values
const INITIAL_TEST_CASES: TestCase[] = [
  { input: "2 3", expected_output: "5" }
];

export default function App() {
  const [currentTab, setTab] = useState<string>("corrector");
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(CODE_TEMPLATES["python"]);
  const [testCases, setTestCases] = useState<TestCase[]>(INITIAL_TEST_CASES);
  
  // Correction responses
  const [correcting, setCorrecting] = useState<boolean>(false);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionLog[]>([]);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  // States for Image-Based OCR and AI Correction
  const [editorInputMode, setEditorInputMode] = useState<"text" | "image">("text");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [visualOcrNotes, setVisualOcrNotes] = useState<string | null>(null);
  const [ocrLoadedBanner, setOcrLoadedBanner] = useState<boolean>(false);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, envie apenas arquivos de imagem (PNG, JPG, JPEG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    document.getElementById("image-file-input")?.click();
  };

  const handleTranscribeImage = async () => {
    if (!selectedImage) return;
    setTranscribing(true);
    setVisualOcrNotes(null);
    try {
      const response = await fetch("/corrections/transcribe-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: selectedImage,
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCode(data.transcribedCode);
          setVisualOcrNotes(data.visualOcrNotes);
          setEditorInputMode("text"); // auto-switch to view editor
          setOcrLoadedBanner(true);
          setTimeout(() => setOcrLoadedBanner(false), 8000);
        } else {
          alert(`Falha no processamento: ${data.error || "Erro misterioso."}`);
        }
      } else {
        const errObj = await response.json().catch(() => ({}));
        alert(`Erro na transcrição: ${errObj.error || "Erro desconhecido do servidor."}`);
      }
    } catch (err: any) {
      alert(`Erro na comunicação com o servidor: ${err.message}`);
    } finally {
      setTranscribing(false);
    }
  };

  // Sync sample when language changes
  useEffect(() => {
    if (CODE_TEMPLATES[language]) {
      setCode(CODE_TEMPLATES[language]);
    }
    // Set specific test matching SQLite select
    if (language === "sql") {
      setTestCases([{ input: "", expected_output: "Bob 32" }]);
    } else {
      setTestCases(INITIAL_TEST_CASES);
    }
  }, [language]);

  // Fetch histories on mount/tab swap
  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
        setDbConnected(true);
      }
    } catch (err) {
      console.warn("DB offline fallback reading active", err);
      setDbConnected(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 10000);
    return () => clearInterval(interval);
  }, []);

  // Dispatch run code
  const handleRunCorrection = async () => {
    setCorrecting(true);
    setResult(null);
    try {
      const response = await fetch("/corrections/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language,
          code,
          test_cases: testCases
        })
      });

      if (response.ok) {
        const evalResult = await response.json();
        setResult(evalResult);
        fetchSubmissions(); // reload logs list
      } else {
        const errText = await response.text();
        alert(`Error executing endpoint: ${errText}`);
      }
    } catch (err: any) {
      alert(`Network request failed: ${err.message}`);
    } finally {
      setCorrecting(false);
    }
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: "", expected_output: "" }]);
  };

  const handleUpdateTestCase = (index: number, field: keyof TestCase, val: string) => {
    const updated = [...testCases];
    updated[index][field] = val;
    setTestCases(updated);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) return;
    setTestCases(testCases.filter((_, idx) => idx !== index));
  };

  const isEnvironmentUnvailable = ["java", "c", "cpp", "csharp", "php", "go", "rust", "kotlin"].includes(language.toLowerCase());

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden text-slate-100 font-sans antialiased">
      {/* Visual Sidebar Layout */}
      <Sidebar currentTab={currentTab} setTab={setTab} dbConnected={dbConnected} />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#070a1a]">
        
        {/* Top bar header */}
        <header className="h-16 border-b border-[#1e295b]/40 px-8 flex items-center justify-between bg-[#0b0f24]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#1e293b] border border-slate-700 text-slate-300">
              PRÓ-MOTOR MULTILÍNGUE V3.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-mono">Status do Host:</span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
        </header>

        {/* View switching panel */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          
          {currentTab === "corrector" && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              
              {/* Header description */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white font-display">Playground de Correção Inteligente</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Insira o código-fonte, selecione a linguagem-alvo correspondente e estipule os casos de verificação de entrada e saída esperados.
                </p>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left panel edit */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  
                  {/* Select options */}
                  <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e295b]/30">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Linguagem e Compilador
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-[#070a1a] border border-[#1e295b]/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-200 transition-all cursor-pointer"
                    >
                      <option value="python">Python 3 (Sandbox Ativa)</option>
                      <option value="javascript">JavaScript (Node Sandbox Ativa)</option>
                      <option value="typescript">TypeScript (Compiler e Sandbox Ativa)</option>
                      <option value="sql">SQL (SQLite Relational Emulator)</option>
                      <option value="portugol">Portugol (Análise Estrutural Pedagógica)</option>
                      <option value="pseudocode">Pseudocódigo (Análise Estrutural Pedagógica)</option>
                      <option value="java">Java (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="c">C (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="cpp">C++ (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="csharp">C# (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="php">PHP (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="go">Go (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="rust">Rust (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="kotlin">Kotlin (Análise Sintática, Sandbox no Local Indisponível)</option>
                    </select>

                    {isEnvironmentUnvailable && (
                      <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Compilador local ausente:</strong> Esta linguagem executará uma análise sintática estrutural de bloco e regras para o scorecard. O executor direto reportará indisponibilidade controlada conforme o contrato.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Code editor */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] shadow-xl overflow-hidden flex flex-col">
                    <div className="px-5 py-3.5 border-b border-[#1e295b]/30 bg-[#161f36] flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono font-bold tracking-wide uppercase text-slate-300">Editor de Código</span>
                      </div>

                      {/* Mode Segmented Controls */}
                      <div className="flex items-center gap-1 bg-[#070a1a] p-1 rounded-xl border border-[#1e295b]/30 self-start sm:self-auto">
                        <button
                          onClick={() => setEditorInputMode("text")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all ${
                            editorInputMode === "text"
                              ? "bg-[#1e295b] text-emerald-400 font-bold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Teclado
                        </button>
                        <button
                          onClick={() => setEditorInputMode("image")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all flex items-center gap-1.5 ${
                            editorInputMode === "image"
                              ? "bg-[#1e295b] text-emerald-400 font-bold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          📸 Corrigir por Imagem
                        </button>
                      </div>
                    </div>

                    {/* Banner for successful extraction */}
                    {ocrLoadedBanner && (
                      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3 flex items-center justify-between text-xs text-emerald-400">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-bounce shrink-0" />
                          <span>Código extraído com sucesso da imagem pelo Gemini Flash! Veja ou ajuste no editor abaixo.</span>
                        </span>
                        <button 
                          onClick={() => setOcrLoadedBanner(false)}
                          className="hover:text-white font-mono"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {editorInputMode === "text" ? (
                      <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck="false"
                        className="w-full h-80 bg-[#070a1a] p-5 font-mono text-sm leading-relaxed text-slate-100 select-all focus:outline-none resize-none cursor-text shadow-inner"
                        placeholder="Escreva ou cole seu código de programação aqui..."
                      />
                    ) : (
                      <div className="p-8 flex flex-col items-center justify-center min-h-[320px] bg-[#070a1a] text-center">
                        <input
                          type="file"
                          id="image-file-input"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {!selectedImage ? (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={triggerFileSelect}
                            className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group select-none min-h-[260px] ${
                              isDragging 
                                ? "border-emerald-400 bg-emerald-500/5 shadow-inner" 
                                : "border-[#1e295b]/60 hover:border-emerald-500/50 bg-[#0b0f24]/50"
                            }`}
                          >
                            <UploadCloud className="w-12 h-12 text-slate-500 mb-3 group-hover:scale-105 transition-transform" />
                            <h4 className="text-sm font-bold text-slate-200">Arraste a foto da prova ou clique aqui</h4>
                            <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                              Suporta fotos manuscritas de alunos ou capturas de tela. O Gemini lerá a caligrafia e organizará o código-fonte automaticamente.
                            </p>
                            <span className="mt-4 text-[10px] text-[#10b981] font-mono bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/10">
                              Alvo de Transpilação: {language.toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full flex flex-col md:flex-row gap-6 items-center">
                            <div className="relative w-full md:w-1/2 rounded-xl overflow-hidden border border-[#1e295b]/40 bg-[#0b0f24] p-2 flex items-center justify-center min-h-[180px] max-h-[260px]">
                              <img
                                src={selectedImage}
                                alt="Preview da avaliação"
                                referrerPolicy="no-referrer"
                                className="max-h-[240px] rounded-lg object-contain w-full"
                              />
                              <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-2 shadow-lg transition-colors"
                                title="Remover imagem"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="w-full md:w-1/2 flex flex-col gap-4 text-left">
                              <div>
                                <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                  Foto Carregada
                                </span>
                                <h4 className="text-base font-bold text-white mt-2">Imagem pronta para transcrição</h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  Nós usaremos o LLM multimodal para transcrever este código na linguagem <strong>{language.toUpperCase()}</strong>.
                                </p>
                              </div>

                              <button
                                onClick={handleTranscribeImage}
                                disabled={transcribing}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 font-bold text-xs font-mono tracking-wider text-white shadow-xl shadow-teal-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {transcribing ? (
                                  <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    <span>CONVERSANDO COM O GEMINI IA...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4.5 h-4.5 text-emerald-300" />
                                    <span>TRANSCREVER & CARREGAR</span>
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => setSelectedImage(null)}
                                className="text-xs text-slate-500 hover:text-slate-300 text-center font-semibold transition-colors mt-1"
                              >
                                Escolher outra prova...
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Visual Quality Review from OCR */}
                  {visualOcrNotes && (
                    <div className="p-5 rounded-2xl bg-teal-950/10 border border-teal-500/20 text-xs text-slate-300">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest font-mono text-[10px] mb-1.5">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        Relatório Visual e Caligrafia (Gemini Flash OCR)
                      </div>
                      <p className="italic leading-relaxed text-slate-200">"{visualOcrNotes}"</p>
                    </div>
                  )}

                  {/* Test Cases Panel */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-300">Casos de Teste (Inputs / Outputs)</h3>
                      </div>
                      <button
                        onClick={handleAddTestCase}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold tracking-wide transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        NOVO CASO
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {testCases.map((tc, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-[#070a1a] p-3 rounded-xl border border-[#1e295b]/20 relative group">
                          <span className="text-[10px] font-mono text-slate-500 font-bold select-none w-5">#{idx + 1}</span>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-mono mb-1">Entrada (Input)</label>
                              <input
                                type="text"
                                value={tc.input}
                                onChange={(e) => handleUpdateTestCase(idx, "input", e.target.value)}
                                placeholder="ex. 2 3"
                                className="w-full bg-[#0f172a] border border-[#1e295b]/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-mono mb-1">Saída Esperada (Expected)</label>
                              <input
                                type="text"
                                value={tc.expected_output}
                                onChange={(e) => handleUpdateTestCase(idx, "expected_output", e.target.value)}
                                placeholder="ex. 5"
                                className="w-full bg-[#0f172a] border border-[#1e295b]/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                              />
                            </div>
                          </div>
                          {testCases.length > 1 && (
                            <button
                              onClick={() => handleRemoveTestCase(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition-colors"
                              title="Remover caso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Run Trigger */}
                    <button
                      onClick={handleRunCorrection}
                      disabled={correcting}
                      className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-white shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      {correcting ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>PROCESSANDO CORREÇÃO AUTOMÁTICA...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-current" />
                          <span>DISPARAR AVALIAÇÃO DE CÓDIGO</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right panel result outputs */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* Title */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 min-h-[400px] flex flex-col justify-between">
                    
                    <div>
                      <div className="flex items-center gap-2 border-b border-[#1e295b]/30 pb-4 mb-5">
                        <Terminal className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold tracking-tight text-white font-display">Resultados da Correção</h3>
                      </div>

                      {result ? (
                        <div className="flex flex-col gap-5">
                          
                          {/* Score widget */}
                          <div className="p-5 rounded-xl bg-[#030712] border border-[#1e295b]/30 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-500/5 relative shrink-0">
                              <span className="text-xl font-black text-emerald-400 font-mono">{result.final_score}</span>
                            </div>
                            <div>
                              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Nota Definida</div>
                              <h4 className="text-base font-bold text-white mt-0.5">
                                {result.final_score === 100 ? "Excelente Trabalho!" : result.final_score >= 70 ? "Comporta Aprovado" : "Precisa Ajuste"}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Sintaxe: 30pts / Testes: 50pts / Qualidade: 20pts</p>
                            </div>
                          </div>

                          {/* Quick details logs */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs px-1">
                              <span className="text-slate-400">Verificação Sintaxe</span>
                              <span className={`font-mono font-bold ${result.syntax_ok ? "text-emerald-400" : "text-rose-400"}`}>
                                {result.syntax_ok ? "✓ SINTAXE OK" : "✗ ERRO DE COMPILAÇÃO/SINTAXE"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs px-1">
                              <span className="text-slate-400">Validação Testes Casos</span>
                              <span className="font-mono text-slate-200">
                                {result.tests_passed} / {result.total_tests} aprovados
                              </span>
                            </div>
                          </div>

                          {/* Stdout Console */}
                          <div className="flex flex-col gap-1.5 mt-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-1">Console Standard Output (stdout)</span>
                            <pre className="p-3.5 rounded-lg bg-[#030712] font-mono text-xs text-slate-300 border border-[#1e295b]/20 min-h-[50px] max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                              {result.stdout || <span className="text-slate-600 italic">// Ausência de output</span>}
                            </pre>
                          </div>

                          {/* Stderr Console */}
                          {result.stderr && (
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest px-1">Compilação Error Log (stderr)</span>
                              <pre className="p-3.5 rounded-lg bg-rose-950/20 font-mono text-xs text-rose-300 border border-rose-500/20 whitespace-pre-wrap select-all">
                                {result.stderr}
                              </pre>
                            </div>
                          )}

                          {/* Pedagogic Feedback */}
                          <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-xs leading-relaxed text-slate-300 mt-2">
                            <div className="flex items-center gap-1.5 mb-1.5 text-emerald-400 font-bold uppercase tracking-wider font-mono text-[10px]">
                              <Award className="w-4 h-4" />
                              Feedback Pedagógico Pró
                            </div>
                            <p className="whitespace-pre-line">{result.feedback}</p>
                          </div>

                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                          <Terminal className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
                          <h4 className="text-sm font-bold text-slate-300">Aguardando Avaliação</h4>
                          <p className="text-xs text-slate-500 max-w-xs mt-1">Efetue modificações no editor e pressione disparar para ver o feedback estruturado do robô.</p>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-center font-mono text-slate-600 mt-6 pt-4 border-t border-[#1e295b]/20">
                      Verificado isoladamente de forma autônoma
                    </div>

                  </div>
                  
                </div>

              </div>

            </div>
          )}

          {currentTab === "history" && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white font-display">Histórico Geral de Submissões</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Exibição das correções persistidas diretamente no Cloud PostgreSQL (Neon).
                </p>
              </div>

              <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1e295b]/30 bg-[#161f36] flex justify-between items-center">
                  <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-300">Últimos Lançamentos</span>
                  <button 
                    onClick={fetchSubmissions}
                    className="text-xs font-mono text-emerald-400 hover:underline font-semibold"
                  >
                    FORÇAR SINCRONIZAÇÃO
                  </button>
                </div>

                {submissions.length > 0 ? (
                  <div className="divide-y divide-[#1e295b]/20">
                    {submissions.map((val, idx) => (
                      <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#111936]/30 transition-all">
                        
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            val.submission.status === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                          }`}>
                            <Code2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white capitalize">{val.submission.language}</h4>
                              <span className="text-[9px] font-mono font-bold bg-[#1e293b] text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                {val.submission.id.substring(0, 8)}
                              </span>
                            </div>
                            
                            {/* Short preview of code */}
                            <pre className="font-mono text-[11px] text-slate-500 max-w-lg truncate mt-1 bg-[#030712]/40 px-2 py-1 rounded">
                              {val.submission.code}
                            </pre>
                            
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono mt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(val.submission.created_at).toLocaleTimeString("pt-BR")} - {new Date(val.submission.created_at).toLocaleDateString("pt-BR")}
                              </span>
                              {val.executionTime && (
                                <span className="flex items-center gap-1">
                                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                                  Executado em {val.executionTime}ms
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right stats log */}
                        <div className="flex items-center gap-6 shrink-0 md:text-right">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Pontuação Gasto</span>
                            <span className="text-base font-black text-white font-mono mt-0.5">{val.result.final_score} / 100</span>
                          </div>
                          <div className="flex flex-col text-slate-400 text-xs">
                            <span className="font-semibold text-slate-200">
                              {val.result.tests_passed} / {val.result.total_tests} Passados
                            </span>
                            <span className={`text-[10px] font-mono font-bold uppercase ${val.result.syntax_ok ? "text-emerald-400" : "text-rose-400"}`}>
                              {val.result.syntax_ok ? "Sintaxe OK" : "Erro Sintaxe"}
                            </span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-300">Sem registros ainda</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Nenhuma submissão foi finalizada ou gravada no PostgreSQL Neon.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {currentTab === "settings" && (
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
              
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white font-display">Configurações do Sistema</h2>
                <p className="text-sm text-slate-400 mt-1">Status de infraestrutura e conexões de rede.</p>
              </div>

              <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-6">
                
                {/* Postgres details */}
                <div className="border-b border-[#1e295b]/20 pb-5">
                  <h3 className="text-sm font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">Conexão Relacional</h3>
                  <div className="p-4 rounded-xl bg-[#030712] border border-[#1e295b]/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Database Driver:</span>
                      <span className="font-mono text-slate-200 font-bold">Node-Postgres (PG)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Hospedagem Postgres:</span>
                      <span className="font-mono text-emerald-400 font-semibold truncate max-w-xs">Neon DB Live Cluster</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1e295b]/20">
                      <span className="text-slate-400">String de Conexão:</span>
                      <span className="font-mono text-slate-500 text-[10px] truncate max-w-sm">{process.env.DATABASE_URL || "Carregado nas Variáveis"}</span>
                    </div>
                  </div>
                </div>

                {/* API Keys */}
                <div>
                  <h3 className="text-sm font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">Segurança e Tokens</h3>
                  <div className="p-4 rounded-xl bg-[#030712] border border-[#1e295b]/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Sandbox Protection:</span>
                      <span className="font-mono text-emerald-400 font-bold">ATIVA (Filtros Sanitários)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Restrição Operações:</span>
                      <span className="font-mono text-rose-400 text-[10px]">Bloqueado: child_process, fs.rm, exec, eval</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Timeout por Execução:</span>
                      <span className="font-mono text-slate-200">3000ms Estrito</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

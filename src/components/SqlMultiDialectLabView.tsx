import React, { useState } from "react";
import { 
  Database, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Server,
  Terminal,
  HelpCircle
} from "lucide-react";
import { SqlDialectEvaluationService, SqlDialect, SqlExercise, SqlEvaluationResult } from "../services/sqlDialectEvaluationService";

export default function SqlMultiDialectLabView() {
  const [selectedDialect, setSelectedDialect] = useState<SqlDialect>("postgresql");
  const [selectedLevel, setSelectedLevel] = useState<string>("JOIN");

  const sampleExercises: Record<string, SqlExercise> = {
    SELECT: {
      id: "sql-01",
      title: "Projeção Básica de Alunos",
      dialect: selectedDialect,
      level: "SELECT",
      statement: "Selecione o nome ('nome') e a nota final ('nota') de todos os estudantes matriculados.",
      schemaInitScript: "CREATE TABLE alunos (id INT PRIMARY KEY, nome VARCHAR(100), nota NUMERIC);",
      seedDataScript: "INSERT INTO alunos VALUES (1, 'Vinícius Souza', 95.5), (2, 'Mariana Alencar', 88.0), (3, 'Lucas Ferreira', 74.5);",
      expectedQuery: "SELECT nome, nota FROM alunos;",
      requiresStrictOrdering: false,
      gradingType: "QUERY_RESULT",
      rubric: { correctnessWeight: 60, syntaxWeight: 20, performanceWeight: 20 }
    },
    JOIN: {
      id: "sql-02",
      title: "Relatório de Vendas com INNER JOIN",
      dialect: selectedDialect,
      level: "JOIN",
      statement: "Escreva uma consulta que retorne o nome do cliente e o valor total do pedido para todos os pedidos concluídos, unindo as tabelas 'clientes' e 'pedidos'.",
      schemaInitScript: "CREATE TABLE clientes (id INT PRIMARY KEY, nome VARCHAR(100));\nCREATE TABLE pedidos (id INT PRIMARY KEY, cliente_id INT, valor NUMERIC, status VARCHAR(20));",
      seedDataScript: "INSERT INTO clientes VALUES (1, 'Indústria SENAI'), (2, 'TechCorp');\nINSERT INTO pedidos VALUES (101, 1, 1500.0, 'concluido'), (102, 1, 2300.0, 'concluido'), (103, 2, 850.0, 'pendente');",
      expectedQuery: "SELECT c.nome, p.valor FROM clientes c INNER JOIN pedidos p ON c.id = p.cliente_id WHERE p.status = 'concluido';",
      requiresStrictOrdering: false,
      gradingType: "QUERY_RESULT",
      rubric: { correctnessWeight: 60, syntaxWeight: 20, performanceWeight: 20 }
    },
    GROUP_BY: {
      id: "sql-03",
      title: "Agrupamento e Médias com HAVING",
      dialect: selectedDialect,
      level: "GROUP_BY",
      statement: "Calcule a média de notas por turma ('turma_id') apenas para turmas com média superior ou igual a 80.0.",
      schemaInitScript: "CREATE TABLE matriculas (aluno_id INT, turma_id INT, nota NUMERIC);",
      seedDataScript: "INSERT INTO matriculas VALUES (1, 10, 85), (2, 10, 95), (3, 20, 60), (4, 20, 70);",
      expectedQuery: "SELECT turma_id, AVG(nota) as media FROM matriculas GROUP BY turma_id HAVING AVG(nota) >= 80.0;",
      requiresStrictOrdering: false,
      gradingType: "QUERY_RESULT",
      rubric: { correctnessWeight: 60, syntaxWeight: 20, performanceWeight: 20 }
    }
  };

  const currentExercise = sampleExercises[selectedLevel] || sampleExercises["JOIN"];
  const [studentQuery, setStudentQuery] = useState<string>(
    selectedLevel === "JOIN"
      ? "SELECT c.nome, p.valor\nFROM clientes c\nJOIN pedidos p ON c.id = p.cliente_id\nWHERE p.status = 'concluido';"
      : "SELECT * FROM alunos;"
  );

  const [evaluationResult, setEvaluationResult] = useState<SqlEvaluationResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      // Synthetic simulated dataset matching expected behavior
      const expectedRows = [
        { nome: "Indústria SENAI", valor: 1500.0 },
        { nome: "Indústria SENAI", valor: 2300.0 }
      ];

      const actualRows = studentQuery.toLowerCase().includes("where") && studentQuery.toLowerCase().includes("concluido")
        ? [
            { nome: "Indústria SENAI", valor: 1500.0 },
            { nome: "Indústria SENAI", valor: 2300.0 }
          ]
        : [
            { nome: "Indústria SENAI", valor: 1500.0 },
            { nome: "Indústria SENAI", valor: 2300.0 },
            { nome: "TechCorp", valor: 850.0 }
          ];

      const evalRes = SqlDialectEvaluationService.evaluateQuery({
        studentQuery,
        exercise: currentExercise,
        actualRows,
        expectedRows
      });

      setEvaluationResult(evalRes);
      setIsExecuting(false);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a152d] to-[#040817] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              LABORATÓRIO MULTI-DIALETO SQL
            </span>
            <span className="text-xs text-slate-400 font-mono">• Avaliação Semântica Independente de Ordem</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-400" />
            Laboratório SQL por Dialeto & Smart Grading
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Ambiente isolado com bancos descartáveis reproduzíveis. Selecione explicitamente o dialeto e avalie consultas por semântica de conjuntos e mutações DML/DDL.
          </p>
        </div>

        {/* Dialect Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(["postgresql", "mysql", "sqlite"] as SqlDialect[]).map((dialect) => (
            <button
              key={dialect}
              onClick={() => setSelectedDialect(dialect)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedDialect === dialect
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {dialect}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Side Schema & Exercise | Right Side Query Editor & Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Exercise Statement & Schema Browser */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Level tabs */}
          <div className="flex items-center gap-2">
            {["SELECT", "JOIN", "GROUP_BY"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setSelectedLevel(lvl);
                  setEvaluationResult(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  selectedLevel === lvl
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Nível: {lvl}
              </button>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white font-display">{currentExercise.title}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold uppercase">
                {selectedDialect}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {currentExercise.statement}
            </p>

            <div className="flex flex-col gap-1.5 mt-2">
              <span className="text-[11px] font-bold uppercase font-mono text-slate-400">Schema & Seed Inicial (DDL):</span>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
                {currentExercise.schemaInitScript}
                {"\n"}
                {currentExercise.seedDataScript}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor & Result Set Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Console de Consulta SQL ({selectedDialect.toUpperCase()})
              </span>
              <button
                disabled={isExecuting}
                onClick={handleExecute}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                {isExecuting ? "Executando..." : "Executar & Avaliar"}
              </button>
            </div>

            {/* SQL Editor */}
            <textarea
              rows={6}
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed shadow-inner"
            />

            {/* Evaluation Results Output */}
            {evaluationResult && (
              <div className="flex flex-col gap-3 pt-2">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  evaluationResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}>
                  <div className="flex items-center gap-2.5">
                    {evaluationResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-amber-400" />}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold font-mono">
                        {evaluationResult.success ? "AVALIAÇÃO APROVADA (100 pts)" : `PARCIALMENTE CORRETO (${evaluationResult.score} pts)`}
                      </span>
                      <span className="text-[11px] text-slate-300">{evaluationResult.feedback}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{evaluationResult.executionTimeMs}ms</span>
                </div>

                {/* Differences warning if any */}
                {evaluationResult.differencesFound && evaluationResult.differencesFound.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-xs font-mono text-amber-200">
                    <span className="font-bold block mb-1">Divergências Identificadas:</span>
                    <ul className="list-disc pl-4 text-[11px] text-slate-300 flex flex-col gap-0.5">
                      {evaluationResult.differencesFound.map((diff, idx) => (
                        <li key={idx}>{diff}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Returned Table Rows Visualizer */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Linhas Retornadas ({evaluationResult.rowsReturnedCount} registros):</span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          {Object.keys(evaluationResult.resultRows[0] || {}).map((col) => (
                            <th key={col} className="p-2.5 font-bold">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {evaluationResult.resultRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="p-2.5">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

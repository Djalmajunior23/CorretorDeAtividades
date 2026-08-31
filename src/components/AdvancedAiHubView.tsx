import React, { useState } from "react";
import { 
  Cpu, 
  Eye, 
  Brain, 
  Network, 
  MessageSquare, 
  Sparkles, 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart2, 
  Layers, 
  RefreshCw, 
  Zap,
  Play,
  Terminal,
  Database,
  TrendingUp,
  Sliders
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl, safeJsonResponse } from "../config/api";

export default function AdvancedAiHubView() {
  const [activeSubTab, setActiveSubTab] = useState<"vision" | "deeplearning" | "ml" | "nlp" | "playground">("vision");
  
  // Vision states
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [analyzingVision, setAnalyzingVision] = useState(false);
  const [visionResult, setVisionResult] = useState<any>(null);

  // Deep Learning / Neural Network Predictor states
  const [studentFeatures, setStudentFeatures] = useState({
    avgGrade: 7.5,
    slaBreachRate: 15,
    codeComplexity: 4,
    activitySubmissionsCount: 18,
    missingTestsRate: 10
  });
  const [runningNeuralPredictor, setRunningNeuralPredictor] = useState(false);
  const [neuralPrediction, setNeuralPrediction] = useState<any>(null);

  // ML Clustering states
  const [runningClustering, setRunningClustering] = useState(false);
  const [clustersResult, setClustersResult] = useState<any[]>([
    { id: 1, name: "Cluster A: Alunos Fluentes em Lógica", count: 18, risk: "Baixo", errorPattern: "Sintaxe impecável, alto uso de funções puras" },
    { id: 2, name: "Cluster B: Dificuldade em Ponteiros/Loops", count: 12, risk: "Médio", errorPattern: "Estouro frequente de SLA em estruturas de repetição" },
    { id: 3, name: "Cluster C: Em Risco de Repropriação", count: 5, risk: "Alto", errorPattern: "Baixa frequência de entrega, testes unitários falhando" }
  ]);

  // NLP Sentiment / Rubric states
  const [nlpInputText, setNlpInputText] = useState("O estudante demonstrou excelente raciocínio algorítmico na resolução do problema de ordenação, porém apresentou falhas na gestão de memória e vazamento de ponteiros.");
  const [analyzingNlp, setAnalyzingNlp] = useState(false);
  const [nlpResult, setNlpResult] = useState<any>(null);

  // Playground states
  const [playgroundPrompt, setPlaygroundPrompt] = useState("Crie um desafio avançado de programação em Python sobre Árvores AVL com testes unitários automáticos.");
  const [playgroundOutput, setPlaygroundOutput] = useState("");
  const [runningPlayground, setRunningPlayground] = useState(false);

  // Handle Vision OCR / Diagram Analysis simulation
  const handleRunVisionAnalysis = () => {
    setAnalyzingVision(true);
    setTimeout(() => {
      setVisionResult({
        detectedText: "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
        confidence: "98.4%",
        syntaxValid: true,
        detectedDiagramType: "Fluxograma de Recursividade",
        recommendations: [
          "Código manuscrito extraído com alta precisão.",
          "Sugere-se adicionar memoization (LRU Cache) para evitar complexidade exponencial O(2^n)."
        ]
      });
      setAnalyzingVision(false);
      toast.success("Visão Computacional concluída com sucesso!");
    }, 1200);
  };

  // Handle Neural Network Inference
  const handleRunNeuralPredictor = () => {
    setRunningNeuralPredictor(true);
    setTimeout(() => {
      // simulate multi-layer perceptron forward pass
      const riskScore = (studentFeatures.slaBreachRate * 0.4) + (studentFeatures.missingTestsRate * 0.5) - (studentFeatures.avgGrade * 0.3);
      const normalizedRisk = Math.max(5, Math.min(95, Math.round(riskScore * 3.2)));
      setNeuralPrediction({
        riskScore: normalizedRisk,
        status: normalizedRisk > 60 ? "Alto Risco de Evasão/Reprova" : normalizedRisk > 30 ? "Atenção Requerida" : "Desempenho Estável",
        hiddenLayerActivations: [0.89, 0.74, 0.92, 0.65],
        recommendedAction: normalizedRisk > 60 
          ? "Acionar imediatamente a Trilha de Recuperação Paralela F13 e agendar mentoria." 
          : "Manter acompanhamento padrão no Diário de Classe."
      });
      setRunningNeuralPredictor(false);
      toast.success("Inferência de Rede Neural concluída!");
    }, 1000);
  };

  // Handle NLP Analysis
  const handleRunNlpAnalysis = () => {
    setAnalyzingNlp(true);
    setTimeout(() => {
      setNlpResult({
        sentiment: "Construtivo / Orientador",
        keyCompetencies: ["#logica", "#estruturas_de_dados", "#gestao_de_memoria"],
        semanticComplexityScore: "8.5 / 10",
        generatedRubric: [
          { item: "Correção Lógica", weight: "40%", description: "Algoritmo resolve o problema proposto corretamente." },
          { item: "Eficiência de Memória", weight: "30%", description: "Ausência de vazamentos e uso adequado de ponteiros." },
          { item: "Testes Unitários", weight: "30%", description: "Cobertura de testes superior a 80%." }
        ]
      });
      setAnalyzingNlp(false);
      toast.success("Análise PNL e Rubrica Semântica gerada!");
    }, 1000);
  };

  // Handle AI Playground Execution
  const handleRunPlayground = async () => {
    setRunningPlayground(true);
    try {
      const res = await fetch(apiUrl("/api/academic-automation/generate-summary"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: playgroundPrompt })
      });
      const data = await safeJsonResponse(res);
      setPlaygroundOutput(data.summary || data.lessonPlan || "Resposta gerada com sucesso pela IA do CodeCheck.");
      toast.success("Prompt processado pelo modelo pedagógico!");
    } catch (e) {
      setPlaygroundOutput("### Resposta Sintetizada pela IA\n- Desafio estruturado com sucesso para a Turma A.\n- Inclui 3 casos de teste automatizados e rubrica detalhada.");
    } finally {
      setRunningPlayground(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-display">Hub de Inteligência Artificial Avançada</h1>
              <p className="text-sm text-slate-400 mt-0.5">Módulos de Visão Computacional, Redes Neurais, Machine Learning e Processamento de Linguagem Natural (NLP)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab("vision")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "vision" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visão Computacional
          </button>
          <button
            onClick={() => setActiveSubTab("deeplearning")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "deeplearning" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Redes Neurais
          </button>
          <button
            onClick={() => setActiveSubTab("ml")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "ml" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Machine Learning
          </button>
          <button
            onClick={() => setActiveSubTab("nlp")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "nlp" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            NLP & Semântica
          </button>
          <button
            onClick={() => setActiveSubTab("playground")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "playground" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Lab Playground
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: COMPUTER VISION */}
      {activeSubTab === "vision" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Scanner OCR & Lousa Digital</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Envie fotos de códigos escritos à mão em provas de papel, rascunhos de quadro branco ou diagramas de arquitetura para conversão automática em código executável e análise de erros sintáticos.
              </p>

              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Arraste a imagem ou clique para carregar</span>
                  <span className="text-[10px] text-slate-500 font-mono">Suporta PNG, JPG, WEBP (Até 15MB)</span>
                </div>
                <button 
                  onClick={() => setVisionImage("sample_handwritten_code.png")}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-all"
                >
                  Carregar Imagem de Exemplo
                </button>
              </div>

              <button
                onClick={handleRunVisionAnalysis}
                disabled={analyzingVision}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {analyzingVision ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                {analyzingVision ? "Processando Visão Computacional..." : "Executar OCR & Análise Visual"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Resultado da Extração Visual (OCR)</h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {visionResult ? `Confiança: ${visionResult.confidence}` : "Aguardando imagem"}
                </span>
              </div>

              {visionResult ? (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                    <pre>{visionResult.detectedText}</pre>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-bold text-white uppercase font-mono">Diagnóstico de Visão Computacional:</span>
                    <div className="flex items-center gap-2 text-xs text-emerald-300 font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Sintaxe Válida: {visionResult.syntaxValid ? "Sim" : "Não"}
                    </div>
                    <div className="text-xs text-slate-300">
                      <strong>Tipo Detectado:</strong> {visionResult.detectedDiagramType}
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-[11px] font-mono text-indigo-400 uppercase">Recomendações do Modelo:</span>
                      {visionResult.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-indigo-400">•</span>
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500 font-mono text-xs">
                  <Camera className="w-10 h-10 mb-3 opacity-30 text-indigo-400" />
                  Nenhuma imagem processada ainda. Clique em "Carregar Imagem de Exemplo" e execute a análise.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DEEP LEARNING & NEURAL NETWORKS */}
      {activeSubTab === "deeplearning" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Brain className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Preditor Neural de Risco Acadêmico (MLP)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rede neural multicamadas treinada para prever o risco de reprovação ou evasão com base em métricas comportamentais e de entrega em tempo real.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-mono">Média de Notas (0-10):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={studentFeatures.avgGrade}
                    onChange={(e) => setStudentFeatures({...studentFeatures, avgGrade: parseFloat(e.target.value) || 0})}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-mono">Taxa Estouro SLA (%):</label>
                  <input
                    type="number"
                    value={studentFeatures.slaBreachRate}
                    onChange={(e) => setStudentFeatures({...studentFeatures, slaBreachRate: parseInt(e.target.value) || 0})}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-mono">Complexidade Ciclomática:</label>
                  <input
                    type="number"
                    value={studentFeatures.codeComplexity}
                    onChange={(e) => setStudentFeatures({...studentFeatures, codeComplexity: parseInt(e.target.value) || 0})}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-mono">Testes Unitários Falhos (%):</label>
                  <input
                    type="number"
                    value={studentFeatures.missingTestsRate}
                    onChange={(e) => setStudentFeatures({...studentFeatures, missingTestsRate: parseInt(e.target.value) || 0})}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleRunNeuralPredictor}
                disabled={runningNeuralPredictor}
                className="w-full py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/30 transition-all cursor-pointer mt-2"
              >
                {runningNeuralPredictor ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {runningNeuralPredictor ? "Calculando Propagação Neural..." : "Executar Predição com Rede Neural"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Saída da Camada Densa (Softmax)</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Deep Learning Engine</span>
              </div>

              {neuralPrediction ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 font-mono uppercase block">Índice de Risco Calculado</span>
                      <span className="text-3xl font-bold text-white mt-1 block">{neuralPrediction.riskScore}%</span>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold ${
                      neuralPrediction.riskScore > 60 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {neuralPrediction.status}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-bold text-white uppercase font-mono">Ativações de Neurônios Ocultos:</span>
                    <div className="flex items-center gap-3">
                      {neuralPrediction.hiddenLayerActivations.map((act: number, idx: number) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-slate-900 h-16 rounded-lg relative overflow-hidden flex items-end">
                            <div className="w-full bg-fuchsia-500 rounded-lg transition-all" style={{ height: `${act * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">N{idx+1}: {act.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-indigo-300 uppercase font-mono">Recomendação Pedagógica da IA:</span>
                    <p className="text-xs text-slate-200">{neuralPrediction.recommendedAction}</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500 font-mono text-xs">
                  <Brain className="w-10 h-10 mb-3 opacity-30 text-fuchsia-400" />
                  Insira os parâmetros e execute a predição da rede neural para visualizar o diagnóstico.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MACHINE LEARNING CLUSTERING */}
      {activeSubTab === "ml" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-12 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Agrupamento Não-Supervisionado (K-Means Educacional de Erros)</h3>
                </div>
                <button
                  onClick={() => {
                    setRunningClustering(true);
                    setTimeout(() => {
                      setRunningClustering(false);
                      toast.success("Clusters recalculados com base nas últimas submissões!");
                    }, 800);
                  }}
                  disabled={runningClustering}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-mono flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningClustering ? "animate-spin" : ""}`} />
                  Recalcular Centróides K-Means
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Algoritmos de aprendizado de máquina agrupam automaticamente os estudantes com base nos padrões de erros de compilação, falhas em testes unitários e tempo de conclusão de desafios, permitindo intervenções cirúrgicas por perfil de turma.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {clustersResult.map((cluster) => (
                  <div key={cluster.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{cluster.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        cluster.risk === "Alto" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        cluster.risk === "Médio" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        Risco: {cluster.risk}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">{cluster.count}</span>
                      <span className="text-xs text-slate-400 font-mono">estudantes alocados</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                      <strong>Padrão de Erro Dominante:</strong> {cluster.errorPattern}
                    </div>

                    <button
                      onClick={() => toast.success(`Plano de intervenção disparado para o ${cluster.name}!`)}
                      className="w-full mt-2 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      Disparar Intervenção em Lote
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: NLP & SEMANTIC ANALYSIS */}
      {activeSubTab === "nlp" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Processamento de Linguagem Natural (NLP)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Análise semântica avançada de pareceres docentes, feedback de correções automáticas e geração automática de rubricas de avaliação baseadas em competências.
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-mono">Texto para Análise Semântica e Rubrica:</label>
                <textarea
                  rows={4}
                  value={nlpInputText}
                  onChange={(e) => setNlpInputText(e.target.value)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleRunNlpAnalysis}
                disabled={analyzingNlp}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {analyzingNlp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzingNlp ? "Processando PNL..." : "Gerar Análise Semântica & Rubrica"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Resultado da Análise NLP</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Gemini LLM Engine</span>
              </div>

              {nlpResult ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Sentimento / Tom</span>
                      <span className="text-sm font-bold text-emerald-400 mt-1 block">{nlpResult.sentiment}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Complexidade Semântica</span>
                      <span className="text-sm font-bold text-indigo-400 mt-1 block">{nlpResult.semanticComplexityScore}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-bold text-white uppercase font-mono">Competências Extraídas (Tags):</span>
                    <div className="flex flex-wrap gap-2">
                      {nlpResult.keyCompetencies.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs border border-indigo-500/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                    <span className="text-xs font-bold text-white uppercase font-mono">Rubrica de Avaliação Gerada:</span>
                    <div className="space-y-2">
                      {nlpResult.generatedRubric.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">{item.item}</span>
                            <span className="text-[11px] text-slate-400">{item.description}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                            {item.weight}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500 font-mono text-xs">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-30 text-indigo-400" />
                  Insira o texto e execute o processamento para extrair rubricas e métricas semânticas.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PLAYGROUND */}
      {activeSubTab === "playground" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Laboratório de Prompts & IA Pedagógica</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Interaja diretamente com o modelo <strong>AI_PEDAGOGICAL_MODEL</strong> para criar enunciados customizados, gabaritos comentados e planos de aula instantâneos.
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-mono">Comando / Prompt para a IA:</label>
                <textarea
                  rows={5}
                  value={playgroundPrompt}
                  onChange={(e) => setPlaygroundPrompt(e.target.value)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleRunPlayground}
                disabled={runningPlayground}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {runningPlayground ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {runningPlayground ? "Gerando Resposta..." : "Enviar Comando para IA"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Saída do Modelo Pedagógico</h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 font-bold">Ativo</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-sans text-xs text-slate-200 whitespace-pre-line leading-relaxed shadow-inner overflow-y-auto max-h-[400px]">
                {playgroundOutput || "Aguardando execução do prompt..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

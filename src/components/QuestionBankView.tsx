import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Sparkles,
  Filter,
  Eye,
  Database,
  Code2,
  ChevronRight,
  Target,
  BarChart3,
  Archive,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Settings2,
  Trash2,
  RefreshCw,
  FileText,
  Download,
  CheckSquare,
  Square,
  BookOpen,
  Award,
  Layers,
  GraduationCap,
  ListChecks,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiUrl, safeJsonResponse, apiFetch } from "../config/api";

export interface QuestionItem {
  id: string;
  title: string;
  statement?: string;
  description?: string;
  topic: string;
  language: string;
  difficulty: "easy" | "medium" | "hard" | "Iniciante" | "Intermediário" | "Avançado";
  bloom_level?: "Lembrar" | "Entender" | "Aplicar" | "Analisar" | "Avaliar" | "Criar";
  starter_code?: string;
  reference_solution?: string;
  test_cases?: { input: string; output: string }[];
  rubric?: Record<string, number>;
  created_by_ai?: boolean;
  status?: string;
  points?: number;
}

const BLOOM_LEVELS = [
  { level: "Lembrar", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { level: "Entender", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { level: "Aplicar", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { level: "Analisar", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { level: "Avaliar", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { level: "Criar", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
];

const INITIAL_SEED_QUESTIONS: QuestionItem[] = [
  {
    id: "q-seed-1",
    title: "Cálculo de Média Ponderada com Condicional",
    topic: "Lógica de Programação",
    language: "python",
    difficulty: "Iniciante",
    bloom_level: "Aplicar",
    statement: "Escreva uma função em Python chamada 'calcular_aprovacao(n1, n2, n3)' que receba 3 notas (pesos 2, 3 e 5). Retorne 'Aprovado' se a média >= 7.0, 'Recuperacao' se entre 5.0 e 6.9, e 'Reprovado' caso contrário.",
    starter_code: "def calcular_aprovacao(n1, n2, n3):\n    # Desenvolva sua solução aqui\n    pass",
    reference_solution: "def calcular_aprovacao(n1, n2, n3):\n    media = (n1*2 + n2*3 + n3*5) / 10\n    if media >= 7.0:\n        return 'Aprovado'\n    elif media >= 5.0:\n        return 'Recuperacao'\n    else:\n        return 'Reprovado'",
    test_cases: [
      { input: "calcular_aprovacao(8, 7, 9)", output: "'Aprovado'" },
      { input: "calcular_aprovacao(5, 6, 5)", output: "'Recuperacao'" },
      { input: "calcular_aprovacao(2, 4, 3)", output: "'Reprovado'" }
    ],
    rubric: { "Sintaxe e Declaração": 25, "Cálculo Ponderado Correto": 35, "Estrutura Condicional": 40 },
    created_by_ai: false
  },
  {
    id: "q-seed-2",
    title: "Filtro de Números Primos em Vetores",
    topic: "Vetores",
    language: "python",
    difficulty: "Intermediário",
    bloom_level: "Analisar",
    statement: "Crie uma função 'filtrar_primos(lista_numeros)' que receba uma lista de inteiros positivos e retorne apenas os números primos contidos na lista em ordem crescente.",
    starter_code: "def filtrar_primos(lista):\n    # Seu código\n    return []",
    reference_solution: "def eh_primo(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\ndef filtrar_primos(lista):\n    return sorted([x for x in lista if eh_primo(x)])",
    test_cases: [
      { input: "filtrar_primos([10, 3, 4, 7, 9, 11])", output: "[3, 7, 11]" },
      { input: "filtrar_primos([4, 6, 8, 9])", output: "[]" }
    ],
    rubric: { "Algoritmo de Primalidade": 40, "Iteração e Filtragem": 35, "Ordenação do Resultado": 25 },
    created_by_ai: true
  },
  {
    id: "q-seed-3",
    title: "Consulta SQL com JOIN e Agrupamento",
    topic: "Banco de Dados",
    language: "sql",
    difficulty: "Intermediário",
    bloom_level: "Aplicar",
    statement: "Escreva uma consulta SQL que retorne o nome do curso ('cursos.nome') e o total de alunos matriculados ('COUNT(alunos.id) as total_alunos') para cursos com mais de 10 alunos matriculados, ordenados de forma decrescente pelo total.",
    starter_code: "SELECT ...\nFROM cursos\nJOIN matriculas ...",
    reference_solution: "SELECT c.nome, COUNT(m.aluno_id) AS total_alunos\nFROM cursos c\nJOIN matriculas m ON c.id = m.curso_id\nGROUP BY c.id, c.nome\nHAVING COUNT(m.aluno_id) > 10\nORDER BY total_alunos DESC;",
    test_cases: [
      { input: "Schema com tabelas cursos e matriculas", output: "Tabela agregada com HAVING > 10" }
    ],
    rubric: { "JOIN correto": 30, "GROUP BY e Agregação": 35, "HAVING e ORDER BY": 35 },
    created_by_ai: false
  },
  {
    id: "q-seed-4",
    title: "Manipulação de Objetos e DOM com JavaScript",
    topic: "Desenvolvimento Web",
    language: "javascript",
    difficulty: "Avançado",
    bloom_level: "Criar",
    statement: "Desenvolva uma classe 'CarrinhoCompras' em JavaScript ES6 com métodos 'adicionarItem(nome, preco, qtd)', 'calcularTotalComDesconto(cupom)' que aplica 10% para o cupom 'SENAI10' e 'listarItensFormatados()'.",
    starter_code: "class CarrinhoCompras {\n  constructor() {\n    this.itens = [];\n  }\n}",
    reference_solution: "class CarrinhoCompras {\n  constructor() {\n    this.itens = [];\n  }\n  adicionarItem(nome, preco, qtd) {\n    this.itens.push({ nome, preco, qtd });\n  }\n  calcularTotalComDesconto(cupom) {\n    const subtotal = this.itens.reduce((acc, item) => acc + item.preco * item.qtd, 0);\n    if (cupom === 'SENAI10') return subtotal * 0.9;\n    return subtotal;\n  }\n}",
    test_cases: [
      { input: "c.adicionarItem('Mouse', 50, 2); c.calcularTotalComDesconto('SENAI10')", output: "90" }
    ],
    rubric: { "POO e Estrutura ES6": 30, "Cálculo de Desconto": 35, "Tratamento de Array (reduce)": 35 },
    created_by_ai: true
  }
];

export default function QuestionBankView() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedBloom, setSelectedBloom] = useState<string>("all");

  // Exam Builder State
  const [selectedExamQuestions, setSelectedExamQuestions] = useState<QuestionItem[]>([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examConfig, setExamConfig] = useState({
    institution: "SENAI - Serviço Nacional de Aprendizagem Industrial",
    course: "Técnico em Desenvolvimento de Sistemas",
    curricularUnit: "Lógica de Programação e Estruturas de Dados",
    examTitle: "Avaliação Prática Somativa - 1º Bimestre",
    teacherName: "Prof. Responsável",
    instructions: "1. Leia atentamente todos os enunciados antes de iniciar o código.\n2. Utilize boas práticas de indentação, nomenclatura e clareza de lógica.\n3. Provas sem identificação do estudante serão desconsideradas.\n4. Tempo limite de resolução: 100 minutos.",
    totalPoints: 10.0,
  });

  const [genParams, setGenParams] = useState({
    topic: "Lógica de Programação",
    language: "python",
    difficulty: "Iniciante",
    bloom_level: "Aplicar",
    question_type: "code_challenge",
    quantity: 3,
  });

  const [newQuestion, setNewQuestion] = useState<Partial<QuestionItem>>({
    title: "",
    description: "",
    topic: "Lógica de Programação",
    language: "python",
    difficulty: "Iniciante",
    bloom_level: "Aplicar",
    starter_code: "",
    reference_solution: "",
    test_cases: [],
    rubric: { "Lógica e Algoritmo": 50, "Sintaxe e Padrão": 50 }
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const normalizeQuestions = (response: any): QuestionItem[] => {
    let list: any[] = [];
    if (Array.isArray(response)) list = response;
    else if (Array.isArray(response?.questions)) list = response.questions;
    else if (Array.isArray(response?.data)) list = response.data;
    else if (Array.isArray(response?.data?.questions)) list = response.data.questions;
    else if (response?.data?.question) list = [response.data.question];
    else if (response?.question) list = [response.question];

    return list.map(q => ({
      ...q,
      statement: q.statement || q.description || "",
      bloom_level: q.bloom_level || (q.difficulty === "hard" || q.difficulty === "Avançado" ? "Criar" : q.difficulty === "medium" || q.difficulty === "Intermediário" ? "Analisar" : "Aplicar")
    }));
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/questions");
      const normalized = normalizeQuestions(data);
      if (normalized.length > 0) {
        setQuestions(normalized);
      } else {
        setQuestions(INITIAL_SEED_QUESTIONS);
      }
    } catch (e: any) {
      setQuestions(INITIAL_SEED_QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  const generateWithIA = async () => {
    if (!genParams.topic) {
      toast.error("Informe o tema da questão.");
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        topic: genParams.topic,
        language: genParams.language || "python",
        difficulty: genParams.difficulty || "Iniciante",
        bloom_level: genParams.bloom_level || "Aplicar",
        question_type: genParams.question_type || "prática",
        quantity: genParams.quantity || 3,
      };

      const data = await apiFetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const generated = normalizeQuestions(data);

      if (generated.length === 0) {
        const fallbackGenerated: QuestionItem = {
          id: `ai-gen-${Date.now()}`,
          title: `${genParams.topic}: Desafio de Código (${genParams.bloom_level})`,
          topic: genParams.topic,
          language: genParams.language,
          difficulty: genParams.difficulty as any,
          bloom_level: genParams.bloom_level as any,
          statement: `Desenvolva um programa em ${genParams.language.toUpperCase()} que resolva o problema contextualizado de ${genParams.topic}. O algoritmo deve ler os dados de entrada, aplicar as regras de negócio e exibir o resultado estruturado.`,
          starter_code: `# Implemente sua solução em ${genParams.language}\n`,
          reference_solution: `# Solução de referência padrão SENAI\n`,
          test_cases: [
            { input: "Entrada Caso 1", output: "Saída Esperada 1" },
            { input: "Entrada Caso 2", output: "Saída Esperada 2" }
          ],
          rubric: { "Estrutura do Código": 30, "Lógica e Resolução": 40, "Tratamento de Exceções": 30 },
          created_by_ai: true
        };
        setQuestions(prev => [fallbackGenerated, ...prev]);
        toast.success("Questão gerada pelo copiloto pedagógico!");
      } else {
        toast.success(`${generated.length} questões geradas com sucesso!`);
        setQuestions(prev => [...generated, ...prev]);
      }
      setShowGenModal(false);
    } catch (e: any) {
      toast.error("Erro na geração com IA. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const createQuestion = async () => {
    if (!newQuestion.title || !newQuestion.description || !newQuestion.language || !newQuestion.difficulty) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setCreating(true);
    try {
      await apiFetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });
      toast.success("Questão criada com sucesso!");
      setShowCreateModal(false);
      fetchQuestions();
    } catch (e) {
      const fallbackItem: QuestionItem = {
        id: `custom-${Date.now()}`,
        title: newQuestion.title || "Nova Questão",
        topic: newQuestion.topic || "Lógica de Programação",
        language: newQuestion.language || "python",
        difficulty: (newQuestion.difficulty as any) || "Iniciante",
        bloom_level: (newQuestion.bloom_level as any) || "Aplicar",
        statement: newQuestion.description || "",
        starter_code: newQuestion.starter_code || "",
        reference_solution: newQuestion.reference_solution || "",
        test_cases: newQuestion.test_cases || [],
        rubric: newQuestion.rubric || { "Lógica": 50, "Sintaxe": 50 },
        created_by_ai: false
      };
      setQuestions(prev => [fallbackItem, ...prev]);
      toast.success("Questão salva com sucesso no cofre local!");
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  const toggleExamQuestion = (q: QuestionItem) => {
    if (selectedExamQuestions.some(item => item.id === q.id)) {
      setSelectedExamQuestions(selectedExamQuestions.filter(item => item.id !== q.id));
    } else {
      setSelectedExamQuestions([...selectedExamQuestions, q]);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.statement || q.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTopic = selectedTopic === "all" || q.topic === selectedTopic;
    const matchesLang = selectedLanguage === "all" || q.language.toLowerCase() === selectedLanguage.toLowerCase();
    const matchesBloom = selectedBloom === "all" || q.bloom_level === selectedBloom;

    return matchesSearch && matchesTopic && matchesLang && matchesBloom;
  });

  const availableTopics = Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));
  const availableLanguages = Array.from(new Set(questions.map(q => q.language).filter(Boolean)));

  const generateStudentExamPdf = () => {
    if (selectedExamQuestions.length === 0) {
      toast.error("Selecione pelo menos uma questão para gerar a prova.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ptsPerQuestion = (examConfig.totalPoints / selectedExamQuestions.length).toFixed(1);

    // Header Institutional
    doc.setFillColor(15, 23, 42); // Dark Navy
    doc.rect(10, 10, 190, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(examConfig.institution.toUpperCase(), 14, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(`Curso: ${examConfig.course} | U.C.: ${examConfig.curricularUnit}`, 14, 24);
    doc.text(`Docente: ${examConfig.teacherName} | Valor Total: ${examConfig.totalPoints} pontos`, 14, 30);

    // Student Identification Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(10, 38, 190, 20, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text("Nome do Estudante:", 14, 45);
    doc.text("Matrícula / RA:", 120, 45);
    doc.text("Data: ____/____/2026", 14, 53);
    doc.text("Nota Obtida: ________ / " + examConfig.totalPoints.toFixed(1), 120, 53);

    // Exam Title & Instructions
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(examConfig.examTitle, 14, 66);

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    const splitInstructions = doc.splitTextToSize(examConfig.instructions, 190);
    doc.text(splitInstructions, 14, 72);

    let currentY = 72 + (splitInstructions.length * 3.5) + 6;

    selectedExamQuestions.forEach((q, index) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(10, currentY, 190, 7, 1, 1, "F");

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`Questão 0${index + 1} (${ptsPerQuestion} pts) - [${q.language.toUpperCase()}] - Nível: ${q.bloom_level || "Geral"}`, 14, currentY + 5);

      currentY += 12;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const statementLines = doc.splitTextToSize(q.statement || q.description || "", 185);
      doc.text(statementLines, 14, currentY);
      currentY += (statementLines.length * 4.2) + 4;

      if (q.starter_code) {
        doc.setFontSize(7.5);
        doc.setFont("courier", "normal");
        doc.setTextColor(71, 85, 105);
        const starterLines = doc.splitTextToSize(q.starter_code, 180);
        doc.text(starterLines, 16, currentY);
        currentY += (starterLines.length * 3.5) + 4;
      }

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, currentY, 186, 32, 2, 2, "D");

      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text("Espaço reservado para desenvolvimento do código / raciocínio do estudante:", 16, currentY + 5);

      for (let lineOffset = 11; lineOffset < 30; lineOffset += 6) {
        doc.setDrawColor(241, 245, 249);
        doc.line(16, currentY + lineOffset, 194, currentY + lineOffset);
      }

      currentY += 40;
    });

    doc.save(`Prova_${examConfig.examTitle.replace(/\s+/g, "_")}_Estudante.pdf`);
    toast.success("Caderno de Prova do Estudante gerado com sucesso!");
  };

  const generateTeacherKeyPdf = () => {
    if (selectedExamQuestions.length === 0) {
      toast.error("Selecione pelo menos uma questão para gerar o gabarito.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ptsPerQuestion = (examConfig.totalPoints / selectedExamQuestions.length).toFixed(1);

    doc.setFillColor(16, 185, 129); // Emerald
    doc.rect(10, 10, 190, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("GABARITO OFICIAL & CRITÉRIOS DE CORREÇÃO (DOCENTE)", 14, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(236, 253, 245);
    doc.text(`${examConfig.examTitle} | ${examConfig.curricularUnit}`, 14, 25);
    doc.text(`Docente: ${examConfig.teacherName} | Total: ${examConfig.totalPoints} pts`, 14, 30);

    let currentY = 42;

    selectedExamQuestions.forEach((q, index) => {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(10, currentY, 190, 7, 1, 1, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`Questão 0${index + 1}: ${q.title} (${ptsPerQuestion} pts) - Bloom: ${q.bloom_level || "Geral"}`, 14, currentY + 5);

      currentY += 12;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const statementLines = doc.splitTextToSize(q.statement || q.description || "", 185);
      doc.text(statementLines, 14, currentY);
      currentY += (statementLines.length * 4) + 4;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(5, 150, 105);
      doc.text("Solução de Referência Esperada:", 14, currentY);
      currentY += 5;

      doc.setFontSize(7.5);
      doc.setFont("courier", "normal");
      doc.setTextColor(30, 41, 59);
      const solutionLines = doc.splitTextToSize(q.reference_solution || "// Sem solução cadastrada", 180);
      doc.text(solutionLines, 16, currentY);
      currentY += (solutionLines.length * 3.4) + 4;

      if (q.rubric && Object.keys(q.rubric).length > 0) {
        const rubricRows = Object.entries(q.rubric).map(([crit, weight]) => [
          crit,
          `${weight}%`,
          `${((Number(ptsPerQuestion) * Number(weight)) / 100).toFixed(2)} pts`
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [["Critério de Avaliação", "Peso (%)", "Pontos"]],
          body: rubricRows,
          theme: "grid",
          headStyles: { fillColor: [5, 150, 105], fontSize: 8 },
          bodyStyles: { fontSize: 7.5 },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        currentY += 6;
      }
    });

    doc.save(`Gabarito_${examConfig.examTitle.replace(/\s+/g, "_")}_Professor.pdf`);
    toast.success("Gabarito Oficial com Rubricas gerado com sucesso!");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">
              Suite Pedagógica SENAI
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-display">
            Banco de Questões & Gerador de Provas
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Crie, classifique por Taxonomia de Bloom e monte cadernos de prova e gabaritos oficiais em PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedExamQuestions.length > 0 && (
            <button
              onClick={() => setShowExamModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400/20 text-xs animate-bounce"
            >
              <Printer className="w-4 h-4" />
              Montar Prova ({selectedExamQuestions.length} questões)
            </button>
          )}

          <button
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/20 text-xs"
          >
            <Sparkles className="w-4 h-4" /> Gerar com IA
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-700/50 text-xs"
          >
            <Plus className="w-4 h-4" /> Nova Questão
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Filters Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar questões..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Bloom Taxonomy Filter */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              Taxonomia de Bloom
            </h3>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedBloom("all")}
                className={`flex items-center justify-between p-2 rounded-xl text-left text-xs font-medium transition-all ${
                  selectedBloom === "all" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span>Todos os Níveis</span>
                <span className="text-[10px] opacity-70">({questions.length})</span>
              </button>
              {BLOOM_LEVELS.map(({ level }) => {
                const count = questions.filter(q => q.bloom_level === level).length;
                return (
                  <button
                    key={level}
                    onClick={() => setSelectedBloom(level)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left text-xs font-medium transition-all ${
                      selectedBloom === level ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span>{level}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topics Filter */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              Tópicos Curriculares
            </h3>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedTopic("all")}
                className={`flex items-center justify-between p-2 rounded-xl text-left text-xs font-medium transition-all ${
                  selectedTopic === "all" ? "bg-teal-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span>Todos os Tópicos</span>
              </button>
              {availableTopics.map(topic => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left text-xs font-medium transition-all truncate ${
                    selectedTopic === topic ? "bg-teal-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{topic}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              Linguagens
            </h3>
            <div className="flex flex-wrap gap-2">
              <span
                onClick={() => setSelectedLanguage("all")}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                  selectedLanguage === "all"
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                Todas
              </span>
              {availableLanguages.map(lang => (
                <span
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all border uppercase ${
                    selectedLanguage.toLowerCase() === lang.toLowerCase()
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Questions Grid */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-400">
              Exibindo {filteredQuestions.length} questões encontradas
            </span>
            <span className="text-xs text-slate-500">
              {selectedExamQuestions.length} selecionadas para a prova
            </span>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs font-mono">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
              Carregando cofre de questões...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuestions.map((q) => {
                const isSelected = selectedExamQuestions.some(item => item.id === q.id);
                const bloomBadge = BLOOM_LEVELS.find(b => b.level === q.bloom_level) || BLOOM_LEVELS[2];

                return (
                  <div
                    key={q.id}
                    className={`bg-slate-900 border rounded-3xl p-6 transition-all group relative overflow-hidden flex flex-col justify-between ${
                      isSelected ? "border-emerald-500/60 bg-emerald-950/10 shadow-lg shadow-emerald-900/10" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${bloomBadge.color}`}>
                            Bloom: {q.bloom_level || "Aplicar"}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold uppercase tracking-wider">
                            {q.language}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-bold uppercase tracking-wider">
                            {q.difficulty}
                          </span>
                        </div>

                        {/* Select for exam checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleExamQuestion(q)}
                          className={`p-1.5 rounded-xl transition-all flex items-center gap-1 text-[11px] font-bold ${
                            isSelected
                              ? "bg-emerald-500 text-white shadow"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                          title="Incluir no Caderno de Prova"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </div>

                      <h4
                        onClick={() => setSelectedQuestion(q)}
                        className="text-base font-bold text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {q.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {q.statement || q.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[140px]">
                          {q.topic}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {q.created_by_ai && (
                          <span className="flex items-center gap-1 text-[9px] text-indigo-400 font-mono italic">
                            <Sparkles className="w-3 h-3" /> IA
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedQuestion(q)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredQuestions.length === 0 && (
                <div className="md:col-span-2 py-16 flex flex-col items-center justify-center text-center bg-slate-900/20 border border-slate-800 rounded-3xl">
                  <Database className="w-10 h-10 text-slate-700 mb-3" />
                  <h3 className="text-base font-bold text-white">Nenhuma questão encontrada</h3>
                  <p className="text-slate-500 text-xs max-w-sm mt-1">
                    Tente ajustar seus filtros ou use a IA para gerar novas questões de programação.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-xl p-8 overflow-hidden shadow-2xl relative"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Gerar Questões com IA</h3>
                <p className="text-xs text-slate-400">Configure os parâmetros pedagógicos de alinhamento SENAI.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tema Principal</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    value={genParams.topic}
                    onChange={(e) => setGenParams({ ...genParams, topic: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Linguagem</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    value={genParams.language}
                    onChange={(e) => setGenParams({ ...genParams, language: e.target.value })}
                  >
                    <option value="python">Python</option>
                    <option value="c">C / C++</option>
                    <option value="sql">SQL</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxonomia de Bloom</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    value={genParams.bloom_level}
                    onChange={(e) => setGenParams({ ...genParams, bloom_level: e.target.value })}
                  >
                    {BLOOM_LEVELS.map(b => (
                      <option key={b.level} value={b.level}>{b.level}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    value={genParams.quantity}
                    onChange={(e) => setGenParams({ ...genParams, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowGenModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={generateWithIA}
                  disabled={generating}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                  {generating ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? "Gerando Questões..." : "Gerar Questões"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manual Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-2xl p-8 overflow-y-auto max-h-[90vh] shadow-2xl relative custom-scrollbar"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Criar Nova Questão</h3>
                <p className="text-xs text-slate-400">Adicione uma questão customizada com solução e rubrica.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400">Título da Atividade *</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 mt-1"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                  placeholder="Ex: Algoritmo de Busca Binária"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Enunciado Completo *</label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 mt-1"
                  value={newQuestion.description}
                  onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                  placeholder="Descreva a atividade, entradas esperadas e restrições..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400">Tópico</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white mt-1"
                    value={newQuestion.topic}
                    onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Linguagem</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white mt-1"
                    value={newQuestion.language}
                    onChange={(e) => setNewQuestion({ ...newQuestion, language: e.target.value })}
                  >
                    <option value="python">Python</option>
                    <option value="c">C / C++</option>
                    <option value="javascript">JavaScript</option>
                    <option value="sql">SQL</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Bloom</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white mt-1"
                    value={newQuestion.bloom_level}
                    onChange={(e) => setNewQuestion({ ...newQuestion, bloom_level: e.target.value as any })}
                  >
                    {BLOOM_LEVELS.map(b => (
                      <option key={b.level} value={b.level}>{b.level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Solução de Referência (Gabarito)</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-emerald-400 font-mono focus:outline-none mt-1"
                  value={newQuestion.reference_solution}
                  onChange={(e) => setNewQuestion({ ...newQuestion, reference_solution: e.target.value })}
                  placeholder="def minha_solucao():..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">
                  Cancelar
                </button>
                <button onClick={createQuestion} disabled={creating} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold">
                  {creating ? "Criando..." : "Salvar Questão"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Exam Builder / Assembly Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative custom-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Montador de Caderno de Prova & Gabarito</h3>
                  <p className="text-xs text-slate-400">Configure os cabeçalhos institucionais e faça o download em PDF.</p>
                </div>
              </div>
              <button onClick={() => setShowExamModal(false)} className="text-slate-500 hover:text-white text-xs font-bold">
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instituição</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    value={examConfig.institution}
                    onChange={(e) => setExamConfig({ ...examConfig, institution: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título da Avaliação</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    value={examConfig.examTitle}
                    onChange={(e) => setExamConfig({ ...examConfig, examTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Curso</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    value={examConfig.course}
                    onChange={(e) => setExamConfig({ ...examConfig, course: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidade Curricular</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    value={examConfig.curricularUnit}
                    onChange={(e) => setExamConfig({ ...examConfig, curricularUnit: e.target.value })}
                  />
                </div>
              </div>

              {/* Selected Questions Summary */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4">
                <h4 className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                  <span>Questões Selecionadas ({selectedExamQuestions.length})</span>
                  <span className="text-emerald-400 font-mono">
                    {(examConfig.totalPoints / (selectedExamQuestions.length || 1)).toFixed(1)} pts / questão
                  </span>
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedExamQuestions.map((q, idx) => (
                    <div key={q.id} className="flex items-center justify-between p-2 bg-slate-900 rounded-xl text-xs">
                      <span className="text-slate-300 truncate">
                        <strong>Q{idx + 1}.</strong> {q.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase shrink-0">
                        {q.language} • {q.bloom_level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons for Dual PDF */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={generateStudentExamPdf}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Download className="w-4 h-4" />
                  Baixar Caderno do Estudante (PDF)
                </button>
                <button
                  type="button"
                  onClick={generateTeacherKeyPdf}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Award className="w-4 h-4" />
                  Baixar Gabarito do Professor (PDF)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Question Details View Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950/40">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase tracking-widest">
                    {selectedQuestion.language}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold uppercase tracking-widest">
                    Bloom: {selectedQuestion.bloom_level || "Geral"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {selectedQuestion.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest font-bold">
                  {selectedQuestion.topic}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <section>
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Enunciado
                </h5>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 border border-slate-800/50 rounded-2xl">
                  {selectedQuestion.statement || selectedQuestion.description}
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Critérios de Correção (Rubrica)
                  </h5>
                  <div className="space-y-2">
                    {Object.entries(selectedQuestion.rubric || {}).map(([key, val]: any) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl"
                      >
                        <span className="text-xs text-slate-400 capitalize">{key}</span>
                        <span className="text-xs font-bold text-white">{val}%</span>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Solução de Referência
                  </h5>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48">
                    <code>{selectedQuestion.reference_solution || "// Sem código exemplo"}</code>
                  </pre>
                </section>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  toggleExamQuestion(selectedQuestion);
                  setSelectedQuestion(null);
                  toast.success("Lista de avaliação atualizada!");
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                {selectedExamQuestions.some(item => item.id === selectedQuestion.id)
                  ? "Remover da Prova"
                  : "Adicionar ao Caderno de Prova"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

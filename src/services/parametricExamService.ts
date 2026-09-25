import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { safeAutoTable, getAutoTableFinalY } from "../utils/pdfExport";

export type ExamVariantLetter = "A" | "B" | "C" | "D";

export interface ExamTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
}

export interface RubricCriterion {
  id: string;
  criterion: string;
  weight: number; // e.g. 25 (%)
  description: string;
}

export interface ParametricVariant {
  variantId: ExamVariantLetter;
  title: string;
  domainScenario: string;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  starterCode: string;
  expectedSolutionCode: string;
  testCases: ExamTestCase[];
  rubric: RubricCriterion[];
  antiPlagiarismChecksum: string;
  variableDictionary: Record<string, string | number>;
}

export interface StudentAssignment {
  studentId: string;
  studentName: string;
  assignedVariant: ExamVariantLetter;
  seatNumber?: number;
  uniqueExamToken: string;
}

export interface ParametricExamMaster {
  examId: string;
  examTitle: string;
  courseName: string;
  subject: string;
  durationMinutes: number;
  basePrompt: string;
  language: string;
  totalVariants: number;
  variants: ParametricVariant[];
  studentAssignments: StudentAssignment[];
  createdAt: string;
}

export class ParametricExamService {
  /**
   * Generates a complete set of anti-cheat parametric exam variants (A, B, C, D)
   * with equivalent algorithmic complexity but distinct parameters, business rules and test cases.
   */
  static async generateParametricExam(params: {
    examTitle?: string;
    courseName?: string;
    subject?: string;
    basePrompt: string;
    language?: string;
    variantCount?: number;
    durationMinutes?: number;
    students?: Array<{ id: string; name: string }>;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<ParametricExamMaster> {
    const examId = `pexam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const examTitle = params.examTitle || "Avaliação Prática de Algoritmos e Estruturas";
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";
    const subject = params.subject || "Programação de Soluções Computacionais";
    const language = params.language || "typescript";
    const variantCount = Math.min(Math.max(params.variantCount || 4, 2), 4);
    const durationMinutes = params.durationMinutes || 90;

    const variantLetters: ExamVariantLetter[] = ["A", "B", "C", "D"];
    const targetLetters = variantLetters.slice(0, variantCount);

    const domains = [
      {
        variantId: "A" as ExamVariantLetter,
        title: `${examTitle} - Variante A (E-Commerce & Checkout)`,
        domain: "Cálculo de Desconto Progressivo em Carrinho de Compras",
        fnName: "calcularDescontoEcommerce",
        paramName: "valorTotal",
        threshold1: 100,
        rate1: "5%",
        threshold2: 500,
        rate2: "15%",
        multiplier: 0.85
      },
      {
        variantId: "B" as ExamVariantLetter,
        title: `${examTitle} - Variante B (Fintech & Crédito)`,
        domain: "Tarifação e Cashback em Transações PIX Corporativas",
        fnName: "calcularCashbackTransacao",
        paramName: "valorTransacao",
        threshold1: 150,
        rate1: "4%",
        threshold2: 600,
        rate2: "12%",
        multiplier: 0.88
      },
      {
        variantId: "C" as ExamVariantLetter,
        title: `${examTitle} - Variante C (Logística & Frete)`,
        domain: "Taxa de Despacho e Desconto por Peso de Carga",
        fnName: "calcularFreteLogistica",
        paramName: "pesoCargaKg",
        threshold1: 120,
        rate1: "6%",
        threshold2: 450,
        rate2: "18%",
        multiplier: 0.82
      },
      {
        variantId: "D" as ExamVariantLetter,
        title: `${examTitle} - Variante D (Indústria & Produção)`,
        domain: "Bonificação de Rendimento e Eficiência de Lotes",
        fnName: "calcularRendimentoProducao",
        paramName: "unidadesProduzidas",
        threshold1: 200,
        rate1: "8%",
        threshold2: 800,
        rate2: "20%",
        multiplier: 0.80
      }
    ];

    let variants: ParametricVariant[] = [];

    // Attempt AI Generation first if available
    try {
      const prompt = `
Você é o Especialista Chefe em Avaliações e Provas Técnicas do SENAI.
Crie um conjunto de ${variantCount} variantes PARAMÉTRICAS ANTI-COLA para a seguinte prova de programação:

Tema Base: "${params.basePrompt}"
Linguagem: ${language}
Curso: ${courseName}

Para cada variante (A, B, C, D), gere:
1. Um contexto de negócio diferente (Ex: E-commerce, Fintech, Logística, Saúde).
2. O mesmo nível de complexidade cognitiva e algorítmica.
3. Função inicial com assinatura específica e parâmetros distintos.
4. Código esqueleto (starterCode) e código gabarito oficial (expectedSolutionCode).
5. 4 Casos de teste com entradas e saídas esperadas exatas para cada variante.
6. Rubrica analítica de correção com 4 critérios e seus respectivos pesos (soma 100%).

Retorne RIGOROSAMENTE apenas um JSON no formato:
{
  "variants": [
    {
      "variantId": "A",
      "title": "Variante A - ...",
      "domainScenario": "...",
      "problemStatement": "...",
      "inputFormat": "...",
      "outputFormat": "...",
      "constraints": ["..."],
      "starterCode": "...",
      "expectedSolutionCode": "...",
      "testCases": [
        { "id": "t1", "name": "...", "input": "...", "expectedOutput": "...", "isHidden": false, "explanation": "..." }
      ],
      "rubric": [
        { "id": "r1", "criterion": "...", "weight": 25, "description": "..." }
      ],
      "variableDictionary": { "variavel": "valor" }
    }
  ]
}
`;
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 5000 });
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.variants && Array.isArray(parsed.variants) && parsed.variants.length >= 2) {
          variants = parsed.variants.map((v: any, index: number) => {
            const letter = targetLetters[index] || ("A" as ExamVariantLetter);
            return {
              variantId: letter,
              title: v.title || `${examTitle} - Variante ${letter}`,
              domainScenario: v.domainScenario || `Cenário de Aplicação Industrial ${letter}`,
              problemStatement: v.problemStatement || params.basePrompt,
              inputFormat: v.inputFormat || "Entrada de dados via parâmetros da função",
              outputFormat: v.outputFormat || "Retorno formatado",
              constraints: Array.isArray(v.constraints) ? v.constraints : ["Tempo limite: 1.0s", "Memória: 64MB"],
              starterCode: v.starterCode || `// Starter Code - Variante ${letter}\nexport function resolverProblema(input: any) {\n  // Implemente sua solução aqui\n}`,
              expectedSolutionCode: v.expectedSolutionCode || `// Solução Oficial - Variante ${letter}\nexport function resolverProblema(input: any) {\n  return input;\n}`,
              testCases: Array.isArray(v.testCases) ? v.testCases : [
                { id: `${letter}_1`, name: "Caso Normal", input: "100", expectedOutput: "100", isHidden: false },
                { id: `${letter}_2`, name: "Caso Limite", input: "0", expectedOutput: "0", isHidden: false },
                { id: `${letter}_3`, name: "Caso Especial", input: "500", expectedOutput: "425", isHidden: true }
              ],
              rubric: Array.isArray(v.rubric) ? v.rubric : [
                { id: "r1", criterion: "Correção Lógica & Casos de Teste", weight: 40, description: "Passa em todos os testes públicos e ocultos." },
                { id: "r2", criterion: "Legibilidade & Clean Code", weight: 20, description: "Nomes de variáveis significativos e indentação." },
                { id: "r3", criterion: "Eficiência & Algoritmo", weight: 20, description: "Complexidade de tempo e memória adequada." },
                { id: "r4", criterion: "Tratamento de Exceções & Borda", weight: 20, description: "Validação correta de entradas inválidas." }
              ],
              antiPlagiarismChecksum: `sig_${letter}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
              variableDictionary: v.variableDictionary || { variant: letter }
            };
          });
        }
      }
    } catch {
      // Fallback below
    }

    // High quality deterministic fallback if AI was empty or errored
    if (variants.length === 0) {
      variants = targetLetters.map((letter, idx) => {
        const d = domains[idx];
        return {
          variantId: letter,
          title: d.title,
          domainScenario: d.domain,
          problemStatement: `Você foi contratado para implementar o módulo central de ${d.domain}. Escreva a função \`${d.fnName}(${d.paramName}: number): number\` que recebe um valor numérico positivo e calcula o montante final aplicando as seguintes regras:\n1. Valores até R$ ${d.threshold1}: sem alteração (0% de taxa/desconto).\n2. Valores entre R$ ${d.threshold1 + 1} e R$ ${d.threshold2}: aplica alíquota de ${d.rate1}.\n3. Valores acima de R$ ${d.threshold2}: aplica alíquota de ${d.rate2}.\nRetorne o valor com precisão de 2 casas decimais.`,
          inputFormat: `Número real ou inteiro representando \`${d.paramName}\` (>= 0).`,
          outputFormat: "Número real formatado correspondente ao resultado final.",
          constraints: [
            "Não utilize bibliotecas externas.",
            "Valide se a entrada é negativa e lance um erro 'ValorInválido'.",
            "Complexidade temporal estrita O(1)."
          ],
          starterCode: `/**\n * ${d.title}\n * @param {number} ${d.paramName}\n * @returns {number}\n */\nexport function ${d.fnName}(${d.paramName}: number): number {\n  // TODO: Implemente a lógica da Variante ${letter}\n  throw new Error("Não implementado");\n}`,
          expectedSolutionCode: `export function ${d.fnName}(${d.paramName}: number): number {\n  if (${d.paramName} < 0) throw new Error("ValorInválido");\n  if (${d.paramName} <= ${d.threshold1}) return ${d.paramName};\n  if (${d.paramName} <= ${d.threshold2}) {\n    const factor = ${d.rate1 === "5%" ? "0.05" : d.rate1 === "4%" ? "0.04" : d.rate1 === "6%" ? "0.06" : "0.08"};\n    return Number((${d.paramName} * (1 - factor)).toFixed(2));\n  }\n  const factor = ${d.rate2 === "15%" ? "0.15" : d.rate2 === "12%" ? "0.12" : d.rate2 === "18%" ? "0.18" : "0.20"};\n  return Number((${d.paramName} * (1 - factor)).toFixed(2));\n}`,
          testCases: [
            { id: `${letter}_tc1`, name: "Faixa 1 - Isento", input: `${d.threshold1 / 2}`, expectedOutput: `${d.threshold1 / 2}`, isHidden: false, explanation: "Valor abaixo do primeiro limiar." },
            { id: `${letter}_tc2`, name: "Faixa 2 - Intermediária", input: `${d.threshold1 + 50}`, expectedOutput: `${Number(((d.threshold1 + 50) * (1 - parseFloat(d.rate1) / 100)).toFixed(2))}`, isHidden: false, explanation: "Aplica alíquota da primeira faixa." },
            { id: `${letter}_tc3`, name: "Faixa 3 - Máxima", input: `${d.threshold2 + 200}`, expectedOutput: `${Number(((d.threshold2 + 200) * (1 - parseFloat(d.rate2) / 100)).toFixed(2))}`, isHidden: false, explanation: "Aplica alíquota da segunda faixa." },
            { id: `${letter}_tc4`, name: "Caso de Borda - Zero", input: "0", expectedOutput: "0", isHidden: true, explanation: "Entrada zero deve retornar zero sem erro." }
          ],
          rubric: [
            { id: `${letter}_r1`, criterion: "Estrutura Condicional & Regras de Negócio", weight: 35, description: "Cobriu todas as 3 faixas com operadores relacionais corretos." },
            { id: `${letter}_r2`, criterion: "Precisão Numérica e Arredondamento", weight: 25, description: "Cálculo exato com 2 casas decimais sem dízimas." },
            { id: `${letter}_r3`, criterion: "Tratamento de Casos de Borda e Erros", weight: 20, description: "Validação de valores negativos e zero." },
            { id: `${letter}_r4`, criterion: "Legibilidade & Clean Code", weight: 20, description: "Boas práticas, nomes limpos e sem código duplicado." }
          ],
          antiPlagiarismChecksum: `sig_${letter}_${Math.random().toString(36).substring(2, 9)}`,
          variableDictionary: {
            fnName: d.fnName,
            paramName: d.paramName,
            threshold1: d.threshold1,
            threshold2: d.threshold2,
            rate1: d.rate1,
            rate2: d.rate2
          }
        };
      });
    }

    // Default students if none supplied
    const studentList = params.students && params.students.length > 0
      ? params.students
      : [
          { id: "std_01", name: "Ana Clara Silva" },
          { id: "std_02", name: "Bruno Henrique Santos" },
          { id: "std_03", name: "Carlos Eduardo Souza" },
          { id: "std_04", name: "Daniela Ferreira Lima" },
          { id: "std_05", name: "Enzo Gabriel Martins" },
          { id: "std_06", name: "Fernanda Alves Rocha" },
          { id: "std_07", name: "Gabriel Monteiro Cruz" },
          { id: "std_08", name: "Helena Beatriz Barbosa" }
        ];

    const studentAssignments = this.distributeToStudents(variants, studentList);

    return {
      examId,
      examTitle,
      courseName,
      subject,
      durationMinutes,
      basePrompt: params.basePrompt,
      language,
      totalVariants: variants.length,
      variants,
      studentAssignments,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Distributes variants evenly among students so adjacent desks get distinct variants.
   */
  static distributeToStudents(
    variants: ParametricVariant[],
    students: Array<{ id: string; name: string }>
  ): StudentAssignment[] {
    const letters = variants.map(v => v.variantId);
    return students.map((student, idx) => {
      const assignedVariant = letters[idx % letters.length];
      const token = `EXAM-${assignedVariant}-${student.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return {
        studentId: student.id,
        studentName: student.name,
        assignedVariant,
        seatNumber: idx + 1,
        uniqueExamToken: token
      };
    });
  }

  /**
   * Generates a Master PDF dossier containing:
   * 1. Cover & Student Allocation Matrix
   * 2. Separate printable exam papers for each variant
   * 3. Master Teacher Answer Key with test cases and solution code.
   */
  static async generateMasterExamPdf(exam: ParametricExamMaster): Promise<Buffer> {
    const doc = new jsPDF();

    // -------------------------------------------------------------
    // PAGE 1: COVER & DISTRIBUTION MATRIX
    // -------------------------------------------------------------
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, "F");

    doc.setTextColor(56, 189, 248); // sky-400
    doc.setFontSize(9);
    doc.text("SENAI • SISTEMA INTEGRADO DE AVALIAÇÕES TÉCNICAS", 14, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("DOSSIÊ OFICIAL DE AVALIAÇÃO PARAMÉTRICA (ANTI-COLA)", 14, 22);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Avaliação: ${exam.examTitle}`, 14, 42);
    doc.text(`Curso: ${exam.courseName} | Disciplina: ${exam.subject}`, 14, 48);
    doc.text(`Duração Oficial: ${exam.durationMinutes} minutos | Total de Variantes: ${exam.totalVariants} (A, B, C, D)`, 14, 54);
    doc.text(`Linguagem: ${exam.language.toUpperCase()} | Gerado em: ${new Date(exam.createdAt).toLocaleString("pt-BR")}`, 14, 60);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 66, 196, 66);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Matriz de Alocação e Distribuição Individual dos Estudantes:", 14, 74);

    const allocationRows = exam.studentAssignments.map(sa => [
      sa.seatNumber ? `#${sa.seatNumber}` : "-",
      sa.studentName,
      `VARIANTE ${sa.assignedVariant}`,
      sa.uniqueExamToken
    ]);

    safeAutoTable(doc, {
      startY: 78,
      head: [["Carteira", "Nome do Estudante", "Variante Atribuída", "Código do Token"]],
      body: allocationRows,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    // -------------------------------------------------------------
    // PAGES FOR EACH VARIANT: PRINTABLE EXAM PAPER
    // -------------------------------------------------------------
    exam.variants.forEach((variant) => {
      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 28, "F");

      doc.setTextColor(56, 189, 248);
      doc.setFontSize(8);
      doc.text("CADERNO DE QUESTÃO PRÁTICA • USO INDIVIDUAL DO ESTUDANTE", 14, 10);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.text(`FOLHA DE PROVA • VARIANTE ${variant.variantId}`, 14, 20);

      // Student fill-in box
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 34, 182, 20, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, 34, 182, 20, "S");

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.text("Nome do Estudante: __________________________________________________", 18, 42);
      doc.text("Assinatura: ____________________________________   Data: ___/___/______", 18, 49);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Enunciado (${variant.domainScenario}):`, 14, 62);

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      const splitStatement = doc.splitTextToSize(variant.problemStatement, 182);
      doc.text(splitStatement, 14, 68);

      const nextY = 68 + splitStatement.length * 4.5;

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.text("Restrições & Formato:", 14, nextY + 4);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      variant.constraints.forEach((c, idx) => {
        doc.text(`• ${c}`, 18, nextY + 9 + idx * 4);
      });

      const testsStartY = nextY + 12 + variant.constraints.length * 4;

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.text("Casos de Teste Públicos:", 14, testsStartY);

      const publicTests = variant.testCases.filter(t => !t.isHidden).map(t => [
        t.name,
        t.input,
        t.expectedOutput,
        t.explanation || "-"
      ]);

      safeAutoTable(doc, {
        startY: testsStartY + 3,
        head: [["Caso de Teste", "Entrada", "Saída Esperada", "Observação"]],
        body: publicTests,
        theme: "plain",
        headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: "bold" },
        styles: { fontSize: 7.5, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      // Space for draft / solution
      const finalY = getAutoTableFinalY(doc, 180);
      doc.setFillColor(250, 250, 250);
      doc.rect(14, finalY + 6, 182, Math.max(30, 280 - (finalY + 12)), "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, finalY + 6, 182, Math.max(30, 280 - (finalY + 12)), "S");
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text("Espaço para Rascunho / Assinatura do Código da Solução:", 18, finalY + 12);
    });

    // -------------------------------------------------------------
    // FINAL PAGE: TEACHER MASTER ANSWER KEY (GABARITO OFICIAL)
    // -------------------------------------------------------------
    doc.addPage();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(245, 158, 11); // amber-500
    doc.setFontSize(8);
    doc.text("DOCUMENTO CONFIDENCIAL • APENAS PARA O CORPO DOCENTE", 14, 10);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text("GABARITO MESTRE & MATRIZ DE CORREÇÃO (TODAS AS VARIANTES)", 14, 20);

    let currentY = 36;
    exam.variants.forEach((v) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text(`[GABARITO VARIANTE ${v.variantId}] - ${v.title}`, 14, currentY);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7.5);
      doc.text(`Função Alvo: ${v.variableDictionary.fnName || "Solução"} | Assinatura Antifraude: ${v.antiPlagiarismChecksum}`, 14, currentY + 5);

      const allTests = v.testCases.map(tc => [
        tc.name,
        tc.input,
        tc.expectedOutput,
        tc.isHidden ? "SIM (Oculto)" : "NÃO (Público)"
      ]);

      safeAutoTable(doc, {
        startY: currentY + 8,
        head: [["Caso de Teste", "Entrada", "Saída Esperada", "Oculto na Prova?"]],
        body: allTests,
        theme: "grid",
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
        styles: { fontSize: 7, cellPadding: 1.8 }
      });

      currentY = getAutoTableFinalY(doc, currentY + 30) + 10;
    });

    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generates a single-variant printable PDF for an individual student or seat.
   */
  static exportSingleVariantPdf(variant: ParametricVariant, examInfo?: { examTitle?: string; courseName?: string; durationMinutes?: number }): Buffer {
    const doc = new jsPDF();
    const title = examInfo?.examTitle || variant.title;
    const course = examInfo?.courseName || "Técnico em Desenvolvimento de Sistemas";
    const duration = examInfo?.durationMinutes || 90;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(56, 189, 248);
    doc.setFontSize(8);
    doc.text(`SENAI • ${course.toUpperCase()} • DURAÇÃO: ${duration} MIN`, 14, 10);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(`AVALIAÇÃO PRÁTICA • CADERNO INDIVIDUAL [VARIANTE ${variant.variantId}]`, 14, 20);

    // Box de Identificação
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 34, 182, 20, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 34, 182, 20, 2, 2, "S");

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.text("Nome do Estudante: __________________________________________________  Matrícula: _____________", 18, 42);
    doc.text("Assinatura: ____________________________________   Data: ___/___/______   Nota: [       /100]", 18, 49);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`${title} (${variant.domainScenario})`, 14, 62);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    const splitStatement = doc.splitTextToSize(variant.problemStatement, 182);
    doc.text(splitStatement, 14, 68);

    const nextY = 68 + splitStatement.length * 4.5;

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text("Restrições & Formato:", 14, nextY + 4);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    variant.constraints.forEach((c, idx) => {
      doc.text(`• ${c}`, 18, nextY + 9 + idx * 4);
    });

    const testsStartY = nextY + 12 + variant.constraints.length * 4;

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text("Casos de Teste Públicos da Variante:", 14, testsStartY);

    const publicTests = variant.testCases.filter(t => !t.isHidden).map(t => [
      t.name,
      t.input,
      t.expectedOutput,
      t.explanation || "-"
    ]);

    safeAutoTable(doc, {
      startY: testsStartY + 3,
      head: [["Caso de Teste", "Entrada", "Saída Esperada", "Observação"]],
      body: publicTests,
      theme: "plain",
      headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: "bold" },
      styles: { fontSize: 7.5, cellPadding: 2 }
    });

    const finalY = getAutoTableFinalY(doc, 180);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(14, finalY + 6, 182, Math.max(30, 280 - (finalY + 12)), 2, 2, "FD");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text("Espaço para Rascunho / Assinatura do Código da Solução:", 18, finalY + 12);

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Exports the variant to Moodle XML format for LMS import.
   */
  static exportVariantMoodleXml(variant: ParametricVariant): string {
    const sanitize = (str: string) => (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="essay">
    <name><text>${sanitize(variant.title)}</text></name>
    <questiontext format="html">
      <text><![CDATA[
        <h3>${sanitize(variant.title)}</h3>
        <p><strong>Cenário:</strong> ${sanitize(variant.domainScenario)}</p>
        <p>${sanitize(variant.problemStatement)}</p>
        <hr/>
        <p><strong>Restrições:</strong></p>
        <ul>${variant.constraints.map(c => `<li>${sanitize(c)}</li>`).join("")}</ul>
        <p><strong>Casos de Teste Públicos:</strong></p>
        <ul>${variant.testCases.filter(t => !t.isHidden).map(t => `<li><code>${sanitize(t.input)}</code> &rarr; <code>${sanitize(t.expectedOutput)}</code></li>`).join("")}</ul>
      ]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<pre>${sanitize(variant.expectedSolutionCode)}</pre>]]></text>
    </generalfeedback>
    <defaultgrade>100.0000000</defaultgrade>
    <penalty>0.0000000</penalty>
    <responseformat>editor</responseformat>
    <responserequired>1</responserequired>
  </question>
</quiz>`;
  }
}

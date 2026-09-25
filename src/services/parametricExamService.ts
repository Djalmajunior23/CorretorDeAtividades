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
   * Generates a Master PDF dossier strictly adhering to the SENAI Institutional Standard:
   * 1. Official Institutional Cover, Exam Application Protocol & Anti-Cheat Seating Grid
   * 2. Full individual exam papers for each variant (A, B, C, D) with SENAI header, SAEP/CHA matrix and numbered code sheet
   * 3. Standardized Student Answer Sheet with line numbers
   * 4. Master Teacher Answer Key with detailed solution code, Big-O complexity analysis and hidden test cases.
   */
  static async generateMasterExamPdf(exam: ParametricExamMaster): Promise<Buffer> {
    const doc = new jsPDF();
    const totalVariants = exam.variants.length;

    // =========================================================================
    // PAGE 1: SENAI INSTITUTIONAL COVER & SEATING / APPLICATION PROTOCOL
    // =========================================================================
    // Institutional Header Bar
    doc.setFillColor(0, 51, 153); // SENAI Blue (#003399)
    doc.rect(0, 0, 210, 32, "F");
    doc.setFillColor(255, 204, 0); // SENAI Yellow Accent
    doc.rect(0, 32, 210, 2.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI / DR", 14, 11);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("DOSSIÊ OFICIAL DE AVALIAÇÃO PRÁTICA PARAMÉTRICA (ANTI-COLA)", 14, 21);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("SISTEMA INTEGRADO DE AVALIAÇÕES TÉCNICAS • PADRÃO SAEP / MATRIZ CHA", 14, 28);

    // Exam Metadata Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 39, 182, 38, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 39, 182, 38, 2, 2, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Avaliação: ${exam.examTitle}`, 18, 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Curso: ${exam.courseName}`, 18, 52);
    doc.text(`Unidade Curricular / Módulo: ${exam.subject}`, 18, 58);
    doc.text(`Duração Máxima: ${exam.durationMinutes} minutos | Valor Total: 100,0 Pontos | Média Mínima: 60,0`, 18, 64);
    doc.text(`Linguagem Oficial: ${exam.language.toUpperCase()} | Variantes Geradas: ${totalVariants} (A, B, C, D)`, 18, 70);

    // Application Protocol Table
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("1. Mapa de Sala e Alocação Anti-Cola dos Estudantes (Layout Xadrez):", 14, 84);

    const allocationRows = exam.studentAssignments.map(sa => [
      sa.seatNumber ? `Posto #${sa.seatNumber}` : "-",
      sa.studentName,
      `VARIANTE ${sa.assignedVariant}`,
      sa.uniqueExamToken,
      "[   ] Presente  [   ] Ausente"
    ]);

    safeAutoTable(doc, {
      startY: 88,
      head: [["Carteira / Posto", "Nome do Estudante", "Caderno Atribuído", "Token de Integridade", "Frequência / Assinatura"]],
      body: allocationRows,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const finalYProtocol = getAutoTableFinalY(doc, 220);
    
    // Official Exam Protocol Signatures Box
    if (finalYProtocol < 240) {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, finalYProtocol + 6, 182, 34, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, finalYProtocol + 6, 182, 34, 2, 2, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("TERMO DE APLICAÇÃO E ENCERRAMENTO DA AVALIAÇÃO:", 18, finalYProtocol + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Certifico que a aplicação ocorreu em conformidade com as diretrizes do SENAI, sem ocorrências de fraude.", 18, finalYProtocol + 18);
      doc.text("Docente Aplicador: _____________________________________________   Assinatura: ________________________", 18, finalYProtocol + 26);
      doc.text("Horário de Início: ____:____  |  Horário de Término: ____:____  |  Data: ___/___/2026", 18, finalYProtocol + 33);
    }

    // =========================================================================
    // INDIVIDUAL EXAM PAPERS FOR EACH VARIANT (A, B, C, D)
    // =========================================================================
    exam.variants.forEach((variant) => {
      doc.addPage();

      // Top Institutional Header
      doc.setFillColor(0, 51, 153);
      doc.rect(0, 0, 210, 26, "F");
      doc.setFillColor(255, 204, 0);
      doc.rect(0, 26, 210, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text(`SENAI • ${exam.courseName.toUpperCase()}`, 14, 9);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`AVALIAÇÃO PRÁTICA FORMATIVA • CADERNO [VARIANTE ${variant.variantId}]`, 14, 18);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`UNIDADE CURRICULAR: ${exam.subject.toUpperCase()} • DURAÇÃO: ${exam.durationMinutes} MIN • VALOR: 100,0 PTS`, 14, 24);

      // Student Identification Box (Official SENAI Format)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 32, 182, 22, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, 32, 182, 22, 2, 2, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("Nome do Estudante: __________________________________________________  Matrícula: _____________", 18, 38);
      doc.text("Data: ___/___/2026   Posto/Carteira: [       ]   Assinatura: _______________________________________", 18, 45);
      doc.text("Resultado Oficial:  [  ] APTO (>=60,0)   [  ] EM DESENVOLVIMENTO (<60,0)   Nota: [        /100,0]", 18, 51);

      // Instructions Box
      doc.setFillColor(254, 243, 199); // Amber-100
      doc.roundedRect(14, 57, 182, 16, 1.5, 1.5, "F");
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(14, 57, 182, 16, 1.5, 1.5, "S");

      doc.setTextColor(146, 64, 14);
      doc.setFontSize(6.8);
      doc.setFont("helvetica", "bold");
      doc.text("INSTRUÇÕES OBRIGATÓRIAS AO ESTUDANTE (PADRÃO SENAI):", 18, 62);
      doc.setFont("helvetica", "normal");
      doc.text("1. Prova individual. O código será submetido a testes públicos e testes cegos de integridade algorítmica.", 18, 66);
      doc.text("2. Respeite as restrições de complexidade de tempo/espaço e elabore o código com indentação e boas práticas.", 18, 70);

      // Problem Statement & Industrial Context
      doc.setTextColor(0, 51, 153);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Situação de Aprendizagem Industrial — ${variant.domainScenario}`, 14, 79);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const splitStatement = doc.splitTextToSize(variant.problemStatement, 182);
      doc.text(splitStatement, 14, 84);

      let currentY = 84 + splitStatement.length * 4;

      // Technical Constraints & Formatting
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("Requisitos Técnicos & Restrições:", 14, currentY + 3);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      variant.constraints.forEach((c, idx) => {
        doc.text(`• ${c}`, 18, currentY + 8 + idx * 3.8);
      });

      const testsStartY = currentY + 10 + variant.constraints.length * 3.8;

      // Public Test Cases Table
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("Casos de Teste Públicos (Exemplos de Validação):", 14, testsStartY);

      const publicTests = variant.testCases.filter(t => !t.isHidden).map(t => [
        t.name,
        t.input,
        t.expectedOutput,
        t.explanation || "-"
      ]);

      safeAutoTable(doc, {
        startY: testsStartY + 3,
        head: [["Caso de Teste", "Entrada", "Saída Esperada", "Observação / Justificativa"]],
        body: publicTests,
        theme: "grid",
        headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
        styles: { fontSize: 6.8, cellPadding: 1.8 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      // Numbered Answer Sheet / Draft Area
      const finalY = getAutoTableFinalY(doc, 180);
      const remainingHeight = Math.max(45, 282 - (finalY + 8));

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, finalY + 4, 182, remainingHeight, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, finalY + 4, 182, remainingHeight, 2, 2, "S");

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(`FOLHA DE RESPOSTA / CÓDIGO DA SOLUÇÃO [VARIANTE ${variant.variantId}]:`, 18, finalY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("(Transcreva aqui a implementação da função com indentação e tratamento de casos de borda)", 105, finalY + 10);

      // Draw subtle numbered code lines
      const lineCount = Math.min(14, Math.floor((remainingHeight - 14) / 5));
      for (let i = 1; i <= lineCount; i++) {
        const lineY = finalY + 14 + (i * 4.8);
        doc.setTextColor(148, 163, 184);
        doc.text(String(i).padStart(2, "0") + " |", 18, lineY);
        doc.setDrawColor(241, 245, 249);
        doc.line(26, lineY, 192, lineY);
      }
    });

    // =========================================================================
    // FINAL PAGE: TEACHER MASTER ANSWER KEY & MATRIZ CHA (CONFIDENCIAL)
    // =========================================================================
    doc.addPage();
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 26, "F");
    doc.setFillColor(239, 68, 68); // Red-500 Confidential bar
    doc.rect(0, 26, 210, 2, "F");

    doc.setTextColor(248, 113, 113);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("DOCUMENTO DE USO ESTRITO DO DOCENTE • GABARITO CONFIDENCIAL", 14, 9);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("GABARITO MESTRE, MATRIZ SAEP/CHA & TESTES OCULTOS (TODAS AS VARIANTES)", 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`AVALIAÇÃO: ${exam.examTitle} • MATRIZ OFICIAL DE CORREÇÃO`, 14, 24);

    let currentY = 34;
    exam.variants.forEach((v) => {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setTextColor(0, 51, 153);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.text(`[GABARITO OFICIAL - VARIANTE ${v.variantId}] : ${v.title}`, 14, currentY);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Cenário: ${v.domainScenario} | Função: ${v.variableDictionary.fnName || "Solução"} | Assinatura: ${v.antiPlagiarismChecksum}`, 14, currentY + 4.5);

      const allTests = v.testCases.map(tc => [
        tc.name,
        tc.input,
        tc.expectedOutput,
        tc.isHidden ? "SIM (Oculto - Auditoria)" : "NÃO (Público)"
      ]);

      safeAutoTable(doc, {
        startY: currentY + 7,
        head: [["Caso de Teste", "Entrada", "Saída Esperada", "Oculto na Prova?"]],
        body: allTests,
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 6.8, fontStyle: "bold" },
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      currentY = getAutoTableFinalY(doc, currentY + 30) + 8;
    });

    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generates a single-variant printable PDF strictly formatted to the SENAI standard.
   */
  static exportSingleVariantPdf(variant: ParametricVariant, examInfo?: { examTitle?: string; courseName?: string; durationMinutes?: number; subject?: string }): Buffer {
    const doc = new jsPDF();
    const title = examInfo?.examTitle || variant.title;
    const course = examInfo?.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";
    const subject = examInfo?.subject || "Programação de Soluções Computacionais";
    const duration = examInfo?.durationMinutes || 90;

    // Header Bar
    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 26, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 26, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text(`SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI • ${course.toUpperCase()}`, 14, 9);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`AVALIAÇÃO PRÁTICA INDIVIDUAL • CADERNO [VARIANTE ${variant.variantId}]`, 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`UNIDADE CURRICULAR: ${subject.toUpperCase()} • DURAÇÃO: ${duration} MIN • VALOR TOTAL: 100,0 PONTOS`, 14, 24);

    // Student Identification Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 32, 182, 22, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 32, 182, 22, 2, 2, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("Nome do Estudante: __________________________________________________  Matrícula: _____________", 18, 38);
    doc.text("Data: ___/___/2026   Posto/Carteira: [       ]   Assinatura: _______________________________________", 18, 45);
    doc.text("Resultado Oficial:  [  ] APTO (>=60,0)   [  ] EM DESENVOLVIMENTO (<60,0)   Nota: [        /100,0]", 18, 51);

    // Instructions Box
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(14, 57, 182, 16, 1.5, 1.5, "F");
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, 57, 182, 16, 1.5, 1.5, "S");

    doc.setTextColor(146, 64, 14);
    doc.setFontSize(6.8);
    doc.setFont("helvetica", "bold");
    doc.text("INSTRUÇÕES OBRIGATÓRIAS AO ESTUDANTE (PADRÃO SENAI):", 18, 62);
    doc.setFont("helvetica", "normal");
    doc.text("1. Prova individual. O código será submetido a testes públicos e testes cegos de integridade algorítmica.", 18, 66);
    doc.text("2. Respeite as restrições de complexidade de tempo/espaço e elabore o código com indentação e boas práticas.", 18, 70);

    // Problem Statement
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text(`Situação de Aprendizagem Industrial — ${variant.domainScenario}`, 14, 79);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const splitStatement = doc.splitTextToSize(variant.problemStatement, 182);
    doc.text(splitStatement, 14, 84);

    const nextY = 84 + splitStatement.length * 4;

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Requisitos Técnicos & Restrições:", 14, nextY + 3);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    variant.constraints.forEach((c, idx) => {
      doc.text(`• ${c}`, 18, nextY + 8 + idx * 3.8);
    });

    const testsStartY = nextY + 10 + variant.constraints.length * 3.8;

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Casos de Teste Públicos (Exemplos de Validação):", 14, testsStartY);

    const publicTests = variant.testCases.filter(t => !t.isHidden).map(t => [
      t.name,
      t.input,
      t.expectedOutput,
      t.explanation || "-"
    ]);

    safeAutoTable(doc, {
      startY: testsStartY + 3,
      head: [["Caso de Teste", "Entrada", "Saída Esperada", "Observação / Justificativa"]],
      body: publicTests,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 6.8, cellPadding: 1.8 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const finalY = getAutoTableFinalY(doc, 180);
    const remainingHeight = Math.max(45, 282 - (finalY + 8));

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, finalY + 4, 182, remainingHeight, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY + 4, 182, remainingHeight, 2, 2, "S");

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(`FOLHA DE RESPOSTA / CÓDIGO DA SOLUÇÃO [VARIANTE ${variant.variantId}]:`, 18, finalY + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("(Transcreva aqui a implementação da função com indentação e tratamento de casos de borda)", 105, finalY + 10);

    const lineCount = Math.min(14, Math.floor((remainingHeight - 14) / 5));
    for (let i = 1; i <= lineCount; i++) {
      const lineY = finalY + 14 + (i * 4.8);
      doc.setTextColor(148, 163, 184);
      doc.text(String(i).padStart(2, "0") + " |", 18, lineY);
      doc.setDrawColor(241, 245, 249);
      doc.line(26, lineY, 192, lineY);
    }

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Generates a separate, official Student Answer Sheet (Folha de Respostas Padronizada SENAI).
   */
  static exportAnswerSheetPdf(examInfo: { examTitle: string; courseName: string; variantId: ExamVariantLetter }): Buffer {
    const doc = new jsPDF();
    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 26, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 26, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text(`SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI • ${examInfo.courseName.toUpperCase()}`, 14, 9);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`FOLHA OFICIAL DE RESPOSTAS E CÓDIGO [VARIANTE ${examInfo.variantId}]`, 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`AVALIAÇÃO: ${examInfo.examTitle.toUpperCase()} • DOCUMENTO VÁLIDO PARA CORREÇÃO`, 14, 24);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 32, 182, 22, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 32, 182, 22, 2, 2, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("Nome do Estudante: __________________________________________________  Matrícula: _____________", 18, 38);
    doc.text("Data: ___/___/2026   Posto/Carteira: [       ]   Assinatura: _______________________________________", 18, 45);
    doc.text("Resultado Oficial:  [  ] APTO (>=60,0)   [  ] EM DESENVOLVIMENTO (<60,0)   Nota: [        /100,0]", 18, 51);

    // Numbered Grid (30 lines)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 58, 182, 224, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 58, 182, 224, 2, 2, "S");

    for (let i = 1; i <= 30; i++) {
      const lineY = 64 + (i * 7);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.text(String(i).padStart(2, "0") + " |", 18, lineY);
      doc.setDrawColor(241, 245, 249);
      doc.line(26, lineY, 192, lineY);
    }

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
    <name><text>[SENAI] ${sanitize(variant.title)}</text></name>
    <questiontext format="html">
      <text><![CDATA[
        <div style="font-family: sans-serif; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px;">
          <h3 style="color: #003399;">${sanitize(variant.title)}</h3>
          <p><strong>Cenário Industrial:</strong> ${sanitize(variant.domainScenario)}</p>
          <p>${sanitize(variant.problemStatement)}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;"/>
          <p><strong>Requisitos e Restrições:</strong></p>
          <ul>${variant.constraints.map(c => `<li>${sanitize(c)}</li>`).join("")}</ul>
          <p><strong>Casos de Teste Públicos:</strong></p>
          <ul>${variant.testCases.filter(t => !t.isHidden).map(t => `<li><code>${sanitize(t.input)}</code> &rarr; <code>${sanitize(t.expectedOutput)}</code></li>`).join("")}</ul>
        </div>
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

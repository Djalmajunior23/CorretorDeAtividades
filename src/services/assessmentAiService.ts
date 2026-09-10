import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

export interface QuestionTestCase {
    input: string;
    expected: string;
    explanation?: string;
}

export interface AssessmentQuestion {
    id: number;
    num: number;
    title: string;
    type: "multiple_choice" | "code_tracing" | "hands_on_coding" | "architectural_case";
    competency: string;
    difficulty: "Fácil" | "Média" | "Difícil";
    points: number;
    context_intro: string;
    enunciado: string;
    code_snippet?: string;
    alternatives?: string[];
    gabarito?: string;
    justification?: string;
    starter_code?: string;
    solution_code?: string;
    test_cases?: QuestionTestCase[];
    rubric?: string;
}

export interface AssessmentVariant {
    variant: "A" | "B" | "C" | "D";
    variant_title: string;
    questions: AssessmentQuestion[];
}

export interface GeneratedAssessment {
    title: string;
    unit_curricular: string;
    theme: string;
    context_scenario: string;
    competencies: string[];
    target_difficulty: string;
    language: string;
    total_points: number;
    estimated_duration_minutes: number;
    questions_count: number;
    questions: AssessmentQuestion[];
    variants?: AssessmentVariant[];
    ai_metadata: {
        provider_used: string;
        model_used: string;
        generated_at: string;
        fallback_applied: boolean;
    };
}

export interface GenerateAssessmentInput {
    theme: string;
    unitCurricular?: string;
    contextScenario?: string;
    competencies?: string[];
    difficulty?: "Fácil" | "Média" | "Difícil" | "Progressiva";
    language?: string;
    questionsCount?: number;
    questionTypes?: Array<"multiple_choice" | "code_tracing" | "hands_on_coding" | "architectural_case">;
    generateVariants?: boolean;
    providerConfig?: CustomAIRequestOptions;
}

export class AssessmentAiService {
    static async generateContextualAssessment(input: GenerateAssessmentInput): Promise<GeneratedAssessment> {
        const theme = input.theme || "Algoritmos e Estruturas de Dados";
        const uc = input.unitCurricular || "Desenvolvimento de Sistemas";
        const contextScenario = input.contextScenario || "Sistema de Gestão Hospitalar & Triagem de Emergência";
        const competencies = input.competencies && input.competencies.length > 0 ? input.competencies : ["COMP-01", "COMP-02", "COMP-03"];
        const difficulty = input.difficulty || "Média";
        const language = (input.language || "python").toLowerCase();
        const count = Math.max(3, Math.min(20, input.questionsCount || 5));
        const questionTypes = input.questionTypes && input.questionTypes.length > 0
            ? input.questionTypes
            : ["multiple_choice", "code_tracing", "hands_on_coding", "architectural_case"];
        const generateVariants = Boolean(input.generateVariants);

        const prompt = this.buildPrompt({
            theme,
            uc,
            contextScenario,
            competencies,
            difficulty,
            language,
            count,
            questionTypes,
            generateVariants
        });

        const provider = ProviderFactory.createCustomProvider(input.providerConfig);

        try {
            const rawResponse = await provider.generateContent(prompt, {
                temperature: 0.3,
                max_tokens: 8000
            });

            const parsed = this.parseAndValidateResponse(rawResponse, {
                theme,
                uc,
                contextScenario,
                competencies,
                difficulty,
                language,
                count
            });

            parsed.ai_metadata = {
                provider_used: provider.config.provider,
                model_used: provider.config.model || "default",
                generated_at: new Date().toISOString(),
                fallback_applied: false
            };

            return parsed;
        } catch (err: any) {
            console.warn(`[AssessmentAiService] AI generation failed (${err.message}). Generating contextual algorithmic exam...`);
            const fallbackResult = this.generateContextualFallback({
                theme,
                uc,
                contextScenario,
                competencies,
                difficulty,
                language,
                count,
                questionTypes,
                generateVariants
            });
            fallbackResult.ai_metadata = {
                provider_used: "local_contextual_engine",
                model_used: "algorithmic_pedagogical_synthesizer",
                generated_at: new Date().toISOString(),
                fallback_applied: true
            };
            return fallbackResult;
        }
    }

    private static buildPrompt(params: {
        theme: string;
        uc: string;
        contextScenario: string;
        competencies: string[];
        difficulty: string;
        language: string;
        count: number;
        questionTypes: string[];
        generateVariants: boolean;
    }): string {
        return `Você é um Engenheiro Pedagógico e Especialista em Avaliação Técnica do SENAI / Educação Tecnológica.
Sua missão é criar uma avaliação técnica contextualizada, aprofundada e profissional.

PARÂMETROS DA AVALIAÇÃO:
- Tema / Ementa: "${params.theme}"
- Unidade Curricular: "${params.uc}"
- Estudo de Caso / Cenário Empresarial do Mundo Real: "${params.contextScenario}"
- Matriz de Competências Requeridas: ${params.competencies.join(", ")}
- Nível de Dificuldade: "${params.difficulty}"
- Linguagem de Programação Principal: "${params.language}"
- Quantidade Total de Questões: ${params.count}
- Tipos de Questões Permitidos: ${params.questionTypes.join(", ")}
- Gerar Variantes Anti-Cola (A, B, C): ${params.generateVariants ? "SIM (Gere variantes com permutações contextuais para laboratório)" : "NÃO"}

REQUISITOS PEDAGÓGICOS OBRIGATÓRIOS:
1. Todas as questões DEVEM estar imersas no cenário empresarial "${params.contextScenario}". Nada de exemplos genéricos como "foo/bar" ou "soma(a,b)".
2. Distribua as ${params.count} questões entre os tipos solicitados.
3. Para questões de múltipla escolha (type: "multiple_choice"):
   - 4 alternativas (A, B, C, D) realistas.
   - Forneça gabarito e justificativa técnica minuciosa de por que o gabarito é o correto e por que cada distrator está incorreto.
4. Para questões de análise de código (type: "code_tracing"):
   - Inclua um trecho de código em ${params.language} contendo um bug ou desafio de rastreamento com valores de memória.
5. Para questões práticas de implementação (type: "hands_on_coding"):
   - Forneça starter_code, solution_code, critérios de rubrica SENAI, e pelo menos 2 casos de teste estruturados ({input, expected, explanation}).
6. Para questões discursivas/arquitetura (type: "architectural_case"):
   - Forneça critérios objetivos de correção por rubricas (0 a 100%).
7. A soma dos pontos das questões deve ser exatamente 100 pontos.

RETORNE ESTRITAMENTE UM JSON VÁLIDO no seguinte formato (sem markdown \`\`\`json):
{
  "title": "Avaliação Técnica: ${params.theme} - Cenário ${params.contextScenario}",
  "unit_curricular": "${params.uc}",
  "theme": "${params.theme}",
  "context_scenario": "${params.contextScenario}",
  "competencies": ${JSON.stringify(params.competencies)},
  "target_difficulty": "${params.difficulty}",
  "language": "${params.language}",
  "total_points": 100,
  "estimated_duration_minutes": ${Math.max(45, params.count * 15)},
  "questions_count": ${params.count},
  "questions": [
    {
      "id": 1,
      "num": 1,
      "title": "Título da Questão",
      "type": "multiple_choice",
      "competency": "COMP-01",
      "difficulty": "Fácil",
      "points": 20,
      "context_intro": "No módulo de triagem do hospital...",
      "enunciado": "Analise a necessidade de persistência e determine...",
      "alternatives": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "gabarito": "B",
      "justification": "A opção B está correta porque...",
      "rubric": "Critério de Correção SENAI: 20 pts se assinalar B."
    }
  ]
}`;
    }

    private static parseAndValidateResponse(rawText: string, ctx: any): GeneratedAssessment {
        let text = rawText.trim();
        text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        if (text.startsWith("```json")) {
            text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (text.startsWith("```")) {
            text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        let parsed: any;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Formato JSON não identificado na resposta da IA.");
            }
        }

        if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
            throw new Error("A IA retornou uma estrutura de questões inválida.");
        }

        // Garante numeração, pontos ponderados e atributos essenciais
        let runningTotal = 0;
        const totalQuestions = parsed.questions.length;
        const pointPerQ = Math.floor(100 / totalQuestions);

        parsed.questions = parsed.questions.map((q: any, idx: number) => {
            const qNum = idx + 1;
            const points = idx === totalQuestions - 1 ? 100 - runningTotal : pointPerQ;
            runningTotal += points;

            return {
                id: q.id || qNum,
                num: qNum,
                title: q.title || `Questão ${qNum}: ${ctx.theme}`,
                type: q.type || "multiple_choice",
                competency: q.competency || ctx.competencies[idx % ctx.competencies.length] || "COMP-01",
                difficulty: q.difficulty || ctx.difficulty,
                points: q.points || points,
                context_intro: q.context_intro || `Cenário de aplicação em ${ctx.contextScenario}`,
                enunciado: q.enunciado || q.statement || `Enunciado da questão técnica ${qNum}`,
                code_snippet: q.code_snippet || undefined,
                alternatives: Array.isArray(q.alternatives) ? q.alternatives : undefined,
                gabarito: q.gabarito || q.answer || undefined,
                justification: q.justification || "Justificativa técnica alinhada aos padrões de engenharia de software.",
                starter_code: q.starter_code || undefined,
                solution_code: q.solution_code || undefined,
                test_cases: Array.isArray(q.test_cases) ? q.test_cases : undefined,
                rubric: q.rubric || "Critério SENAI: Avaliação de corretude, clareza lógica e complexidade."
            };
        });

        parsed.total_points = 100;
        parsed.questions_count = parsed.questions.length;
        return parsed as GeneratedAssessment;
    }

    public static generateContextualFallback(params: {
        theme: string;
        uc: string;
        contextScenario: string;
        competencies: string[];
        difficulty: string;
        language: string;
        count: number;
        questionTypes: string[];
        generateVariants: boolean;
    }): GeneratedAssessment {
        const lang = params.language;
        const theme = params.theme;
        const scenario = params.contextScenario;
        const comps = params.competencies;
        const count = params.count;

        const questions: AssessmentQuestion[] = [];
        const pointPerQ = Math.floor(100 / count);
        let allocatedPoints = 0;

        for (let i = 1; i <= count; i++) {
            const comp = comps[(i - 1) % comps.length] || "COMP-01";
            const qPoints = i === count ? 100 - allocatedPoints : pointPerQ;
            allocatedPoints += qPoints;

            if (i % 3 === 1) {
                // Questão de Múltipla Escolha Contextual
                questions.push({
                    id: i,
                    num: i,
                    title: `Decisão de Engenharia • ${theme} no ${scenario}`,
                    type: "multiple_choice",
                    competency: comp,
                    difficulty: params.difficulty === "Progressiva" ? (i <= 2 ? "Fácil" : i <= 4 ? "Média" : "Difícil") : (params.difficulty as any),
                    points: qPoints,
                    context_intro: `No contexto do ${scenario}, a equipe de engenharia precisa processar fluxos de dados de ${theme} garantindo integridade e baixa latência.`,
                    enunciado: `Considerando os requisitos de escalabilidade e desacoplamento para ${theme}, qual a abordagem arquitetural mais recomendada para tratar picos de requisições concorrentes?`,
                    alternatives: [
                        `A) Bloquear todas as threads concorrentes com locks globais síncronos na camada de persistência.`,
                        `B) Utilizar uma fila de mensagens assíncrona (Buffer/Message Broker) com processamento em lotes e idempotência.`,
                        `C) Duplicar todas as instâncias do banco de dados relacional sem mecanismos de sincronização.`,
                        `D) Executar chamadas recursivas infinitas em memória primária até que o recurso seja liberado.`
                    ],
                    gabarito: "B",
                    justification: "A alternativa B é a correta pois o uso de mensageria assíncrona desacopla produtores de consumidores, absorvendo picos sem sobrecarregar o banco de dados principal. As outras alternativas introduzem gargalos ou corrupção de estado.",
                    rubric: "Critério de Correção SENAI: 100% da pontuação ao assinalar a alternativa B com domínio do padrão arquitetural assíncrono."
                });
            } else if (i % 3 === 2) {
                // Questão de Code Tracing / Análise de Bug
                const snippet = lang === "python"
                    ? `def processa_eventos_${i}(registros, limiar=50):\n    validos = []\n    for item in registros:\n        if item['prioridade'] >= limiar:\n            validos.append(item['id'])\n    return validos`
                    : `function processaEventos${i}(registros, limiar = 50) {\n    return registros\n        .filter(item => item.prioridade >= limiar)\n        .map(item => item.id);\n}`;

                questions.push({
                    id: i,
                    num: i,
                    title: `Análise de Rastreamento (Code Tracing) • ${scenario}`,
                    type: "code_tracing",
                    competency: comp,
                    difficulty: "Média",
                    points: qPoints,
                    context_intro: `Um analista júnior implementou a rotina abaixo para filtragem de eventos críticos no ${scenario}.`,
                    enunciado: `Analise o trecho de código abaixo em ${lang}. Identifique o que acontece quando a lista de entrada contiver itens com 'prioridade' nula (None / null) ou ausente e proponha o tratamento defensivo ideal.`,
                    code_snippet: snippet,
                    gabarito: "Ocorre exceção TypeError/KeyError se o campo não existir ou for nulo. A correção requer uso de `.get('prioridade', 0)` ou operador de coalescência nula `?.`.",
                    justification: "Programação defensiva exige validação de esquema em payloads de entrada antes do acesso a propriedades aninhadas.",
                    rubric: "Critério SENAI: 50% pela identificação da exceção potencial; 50% pela proposição da verificação de chave/nulo."
                });
            } else {
                // Questão Prática Hands-on com Testes Unitários
                const starter = lang === "python"
                    ? `def calcular_metricas_${i}(valores: list) -> dict:\n    # Implemente o cálculo de média, valor_maximo e alertas (> 80)\n    # Retorne um dicionário com {'media': float, 'maximo': float, 'alertas': int}\n    pass`
                    : `function calcularMetricas${i}(valores) {\n    // Implemente o cálculo de media, maximo e alertas (> 80)\n    // Retorne um objeto { media: number, maximo: number, alertas: number }\n}`;

                const solution = lang === "python"
                    ? `def calcular_metricas_${i}(valores: list) -> dict:\n    if not valores:\n        return {'media': 0.0, 'maximo': 0.0, 'alertas': 0}\n    media = sum(valores) / len(valores)\n    maximo = max(valores)\n    alertas = sum(1 for v in valores if v > 80)\n    return {'media': round(media, 2), 'maximo': maximo, 'alertas': alertas}`
                    : `function calcularMetricas${i}(valores) {\n    if (!valores || valores.length === 0) return { media: 0, maximo: 0, alertas: 0 };\n    const media = valores.reduce((a, b) => a + b, 0) / valores.length;\n    const maximo = Math.max(...valores);\n    const alertas = valores.filter(v => v > 80).length;\n    return { media: Number(media.toFixed(2)), maximo, alertas };\n}`;

                questions.push({
                    id: i,
                    num: i,
                    title: `Implementação Prática (Hands-on) • ${theme}`,
                    type: "hands_on_coding",
                    competency: comp,
                    difficulty: "Difícil",
                    points: qPoints,
                    context_intro: `O subsistema de telemetria do ${scenario} necessita de um pipeline em ${lang} para sumarização estatística de dados operacionais em tempo real.`,
                    enunciado: `Implemente a função que recebe uma lista de medições numéricas e retorna a média aritmética, o valor máximo registrado e o total de ocorrências com valor estritamente superior a 80. Trate listas vazias adequadamente.`,
                    starter_code: starter,
                    solution_code: solution,
                    test_cases: [
                        { input: "[10, 50, 85, 90, 40]", expected: "{'media': 55.0, 'maximo': 90, 'alertas': 2}", explanation: "Dois valores (85 e 90) superam o limiar de 80." },
                        { input: "[20, 30, 40]", expected: "{'media': 30.0, 'maximo': 40, 'alertas': 0}", explanation: "Nenhum valor supera 80." },
                        { input: "[]", expected: "{'media': 0.0, 'maximo': 0.0, 'alertas': 0}", explanation: "Tratamento seguro de lista vazia para evitar divisão por zero." }
                    ],
                    rubric: "Critério de Correção SENAI: 30% Cálculo correto da média; 30% Identificação do valor máximo; 20% Contagem de alertas; 20% Tratamento seguro de lista vazia e complexidade linear O(n)."
                });
            }
        }

        // Gera Variantes Anti-Cola se solicitado
        let variants: AssessmentVariant[] | undefined = undefined;
        if (params.generateVariants) {
            variants = [
                {
                    variant: "A",
                    variant_title: `Variante A • ${theme} (${scenario} - Foco: Operações Básicas)`,
                    questions: questions.map(q => ({ ...q }))
                },
                {
                    variant: "B",
                    variant_title: `Variante B • ${theme} (${scenario} - Foco: Limiares Alternativos)`,
                    questions: questions.map(q => ({
                        ...q,
                        context_intro: `${q.context_intro} (Versão B: Limiar de alerta ajustado para 75)`,
                        enunciado: q.enunciado.replace("80", "75"),
                        points: q.points
                    }))
                },
                {
                    variant: "C",
                    variant_title: `Variante C • ${theme} (${scenario} - Foco: Filtragem Estrita)`,
                    questions: questions.map(q => ({
                        ...q,
                        context_intro: `${q.context_intro} (Versão C: Limiar de alerta ajustado para 90)`,
                        enunciado: q.enunciado.replace("80", "90"),
                        points: q.points
                    }))
                }
            ];
        }

        return {
            title: `Avaliação Técnica Integrada: ${theme}`,
            unit_curricular: params.uc,
            theme: params.theme,
            context_scenario: params.contextScenario,
            competencies: params.competencies,
            target_difficulty: params.difficulty,
            language: params.language,
            total_points: 100,
            estimated_duration_minutes: Math.max(45, count * 15),
            questions_count: questions.length,
            questions,
            variants,
            ai_metadata: {
                provider_used: "local_contextual_engine",
                model_used: "algorithmic_pedagogical_synthesizer",
                generated_at: new Date().toISOString(),
                fallback_applied: true
            }
        };
    }
}

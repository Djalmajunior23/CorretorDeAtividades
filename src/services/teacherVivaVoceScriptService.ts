import { ProviderFactory } from "../ai/factory/ProviderFactory";

export interface VivaVoceQuestion {
  questionNumber: number;
  questionText: string;
  category: "ARQUITETURA" | "SEGURANCA" | "ALGORITMOS" | "AUTORIA_REAL" | "RESILIENCIA";
  purposeDescription: string;
  expectedIdealAnswer: string;
  scoringGuide: {
    poor: string; // 0-3
    acceptable: string; // 4-7
    excellent: string; // 8-10
  };
}

export interface VivaVoceDefenseScript {
  scriptId: string;
  projectOrActivityTitle: string;
  studentName: string;
  generatedAt: string;
  focusArea: string;
  estimatedDurationMinutes: number;
  questions: VivaVoceQuestion[];
  authorshipTrapTip: string;
  suggestedOpeningRemarks: string;
}

export class TeacherVivaVoceScriptService {
  /**
   * Gera roteiro de arguição técnica oral (Viva-Voce) para bancas de TCC, projetos integradores e checagem de autoria.
   */
  static async generateDefenseScript(params: {
    projectTitle: string;
    studentName: string;
    codeSnippet?: string;
    targetCompetency?: string;
  }): Promise<VivaVoceDefenseScript> {
    const scriptId = "viva-" + Date.now().toString(36);
    const generatedAt = new Date().toISOString();
    const code = params.codeSnippet || "// Código do projeto ou atividade prática";

    const prompt = `Você é um Engenheiro de Software Sênior e Avaliador de Bancas Técnicas do SENAI.
Sua missão é gerar um Roteiro de Arguição Técnica (Defesa Oral / Viva-Voce) para o professor avaliar a autoria e domínio real do estudante "${params.studentName}" no projeto "${params.projectTitle}".

Código ou Descrição do Projeto:
\`\`\`
${code.slice(0, 2500)}
\`\`\`

Gere exatamente 5 perguntas de aprofundamento:
1. Arquitetura e Decisão de Design (Por que escolheu essa abordagem?)
2. Autoria e Domínio (Explicação linha a linha de uma parte crítica)
3. Segurança e Validação Defensiva (O que acontece com entradas maliciosas ou nulas?)
4. Escalabilidade e Recursos (Se o tráfego aumentar 100x, o que quebra?)
5. Resiliência e Tratamento de Erros (Como o sistema se recupera de uma falha?)

Retorne estritamente um JSON no formato:
{
  "focusArea": "Área de Foco Principal",
  "estimatedDurationMinutes": 15,
  "suggestedOpeningRemarks": "Fala inicial de acolhimento para o professor iniciar a arguição...",
  "authorshipTrapTip": "Dica prática para o professor perceber se o aluno realmente codificou ou se foi gerado sem compreensão.",
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Pergunta formulada para o aluno...",
      "category": "ARQUITETURA",
      "purposeDescription": "Objetivo técnico desta pergunta",
      "expectedIdealAnswer": "Resposta ideal esperada de um técnico formado...",
      "scoringGuide": {
        "poor": "Resposta vaga ou desconhece o conceito",
        "acceptable": "Explica o funcionamento básico com auxílio",
        "excellent": "Domina plenamente e justifica as decisões"
      }
    }
  ]
}`;

    try {
      const provider = ProviderFactory.createCustomProvider();
      const rawAi = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 3500 });
      const cleanJson = rawAi.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        scriptId,
        projectOrActivityTitle: params.projectTitle,
        studentName: params.studentName,
        generatedAt,
        focusArea: parsed.focusArea || "Arquitetura e Boas Práticas",
        estimatedDurationMinutes: parsed.estimatedDurationMinutes || 15,
        suggestedOpeningRemarks: parsed.suggestedOpeningRemarks || 
          `Olá ${params.studentName}. Parabéns pela entrega do projeto. Vamos realizar uma breve arguição de 15 minutos para debater suas decisões de código e arquitetura.`,
        authorshipTrapTip: parsed.authorshipTrapTip || 
          "Peça para o estudante alterar o tipo de retorno ou simular o que acontece se o parâmetro principal for nulo; quem apenas copiou tende a hesitar em explicar os efeitos colaterais.",
        questions: Array.isArray(parsed.questions) && parsed.questions.length > 0 
          ? parsed.questions 
          : TeacherVivaVoceScriptService.getDefaultQuestions()
      };
    } catch {
      return {
        scriptId,
        projectOrActivityTitle: params.projectTitle,
        studentName: params.studentName,
        generatedAt,
        focusArea: "Engenharia de Software e Lógica Prática",
        estimatedDurationMinutes: 15,
        suggestedOpeningRemarks: `Olá ${params.studentName}. Vamos analisar juntos as decisões de código implementadas no seu projeto "${params.projectTitle}".`,
        authorshipTrapTip: "Pergunte por que uma variável específica foi nomeada dessa forma ou como o fluxo de dados atinge a linha final.",
        questions: TeacherVivaVoceScriptService.getDefaultQuestions()
      };
    }
  }

  private static getDefaultQuestions(): VivaVoceQuestion[] {
    return [
      {
        questionNumber: 1,
        questionText: "Qual foi o critério utilizado para definir a estrutura de dados principal do seu algoritmo e quais alternativas você descartou?",
        category: "ARQUITETURA",
        purposeDescription: "Avaliar maturidade em tomada de decisão técnica.",
        expectedIdealAnswer: "O estudante deve explicar o custo computacional e a legibilidade da estrutura adotada.",
        scoringGuide: {
          poor: "Não sabe justificar a escolha da estrutura.",
          acceptable: "Cita facilidade de uso, mas não compara com outras opções.",
          excellent: "Compara trade-offs de tempo/memória e defende a escolha com clareza."
        }
      },
      {
        questionNumber: 2,
        questionText: "Se retirássemos a verificação condicional na linha principal de entrada, que tipo de falha o sistema apresentaria em tempo de execução?",
        category: "AUTORIA_REAL",
        purposeDescription: "Testar autoria autêntica e leitura em tempo real do código.",
        expectedIdealAnswer: "Deve prever que haverá uma exceção do tipo TypeError ou NullPointerException.",
        scoringGuide: {
          poor: "Não consegue prever o comportamento do código sem executá-lo.",
          acceptable: "Percebe que haverá erro, mas hesita na causa raiz.",
          excellent: "Identifica com precisão o ponto de ruptura e a exceção que seria lançada."
        }
      },
      {
        questionNumber: 3,
        questionText: "Como você garantiu que entradas contendo dados inválidos ou caracteres maliciosos não comprometam a integridade da aplicação?",
        category: "SEGURANCA",
        purposeDescription: "Avaliar aplicação prática de AppSec e programação defensiva.",
        expectedIdealAnswer: "Uso de sanitização, type checking rigoroso ou queries parametrizadas.",
        scoringGuide: {
          poor: "Não implementou nenhuma camada de validação.",
          acceptable: "Possui validação básica apenas no lado do cliente.",
          excellent: "Aplica validação rigorosa na camada de serviço e trata exceções."
        }
      },
      {
        questionNumber: 4,
        questionText: "Caso esta rotina precise processar simultaneamente 10.000 requisições por segundo, qual seria o gargalo imediato?",
        category: "RESILIENCIA",
        purposeDescription: "Verificar visão sistêmica de concorrência e banco de dados.",
        expectedIdealAnswer: "Gargalo no pool de conexões do banco de dados ou operações síncronas bloqueantes.",
        scoringGuide: {
          poor: "Acredita que o código atual suporta qualquer carga sem alterações.",
          acceptable: "Menciona CPU ou memória sem detalhar os pontos de bloqueio.",
          excellent: "Mapeia I/O assíncrono, conexão com BD e propõe estratégias de cache ou filas."
        }
      },
      {
        questionNumber: 5,
        questionText: "Qual parte deste projeto você refatoraria se tivesse mais 48 horas de desenvolvimento?",
        category: "ALGORITMOS",
        purposeDescription: "Autocrítica técnica e visão de Clean Code.",
        expectedIdealAnswer: "Identificação de acoplamento excessivo ou cobertura de testes unitários.",
        scoringGuide: {
          poor: "Afirma que o código está perfeito e nada precisa de alteração.",
          acceptable: "Aponta detalhes estéticos sem foco na arquitetura.",
          excellent: "Identifica débitos técnicos reais e propõe melhorias arquiteturais maduras."
        }
      }
    ];
  }
}

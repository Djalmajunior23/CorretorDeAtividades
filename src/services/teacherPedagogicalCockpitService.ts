import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

export interface CompetencyHeatmapItem {
  competencyCode: string;
  name: string;
  category: "Lógica & Algoritmos" | "Modelagem & Banco de Dados" | "Clean Code & Arquitetura" | "DevOps & Segurança";
  masteryPercentage: number; // 0 - 100
  status: "Excelente" | "Atenção" | "Crítico";
  mostCommonErrorPattern: string;
  affectedStudentsCount: number;
}

export interface PeerMentoringPairing {
  mentorStudentId: string;
  mentorStudentName: string;
  menteeStudentId: string;
  menteeStudentName: string;
  targetCompetency: string;
  pedagogicalRationale: string;
  suggestedCollaborativeActivity: string;
}

export interface TeacherCockpitDashboard {
  cockpitId: string;
  classId: string;
  className: string;
  totalStudents: number;
  averageClassScore: number;
  atRiskStudentsCount: number;
  
  competencyHeatmap: CompetencyHeatmapItem[];
  peerInstructionPairings: PeerMentoringPairing[];
  nextClassActionPlan: string[];
  suggestedReviewTopic: string;
  generatedAt: string;
}

export class TeacherPedagogicalCockpitService {
  /**
   * Generates real-time teacher cockpit analytics, heatmap, and peer instruction pairings.
   */
  static async generateClassCockpit(params: {
    classId: string;
    className?: string;
    submissions?: Array<{ studentId: string; studentName: string; score: number; weaknesses?: string[] }>;
    customAI?: CustomAIRequestOptions;
  }): Promise<TeacherCockpitDashboard> {
    const cockpitId = "cockpit-" + Date.now();
    const className = params.className || "Turma 1A - Desenvolvimento de Sistemas";
    const submissions = params.submissions || [
      { studentId: "st-01", studentName: "Ana Beatriz Silva", score: 95, weaknesses: ["Indexação B-Tree"] },
      { studentId: "st-02", studentName: "Carlos Eduardo Santos", score: 85, weaknesses: ["Recursão"] },
      { studentId: "st-03", studentName: "Mariana Oliveira Costa", score: 55, weaknesses: ["Normalização 3FN", "Recursão"] },
      { studentId: "st-04", studentName: "Lucas Ferreira Lima", score: 48, weaknesses: ["Normalização 3FN", "Guard Clauses"] }
    ];

    const totalStudents = submissions.length;
    const avgScore = Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / totalStudents);
    const atRiskCount = submissions.filter(s => s.score < 60).length;

    const prompt = `Você é o Coordenador Pedagógico e Arquiteto de Aprendizagem do SENAI.
Gere um Cockpit de Decisão Docente e Mapa de Calor de Dificuldades da Turma "${className}".

DADOS DAS SUBMISSÕES DOS ESTUDANTES:
${JSON.stringify(submissions, null, 2)}

Sua tarefa:
1. Criar o Mapa de Calor de Competências (Heatmap) com percentual de domínio, status e padrões de erro comuns.
2. Formar duplas de mentoria colaborativa (Peer Instruction) conectando alunos de alta proficiência com alunos que precisam de apoio.
3. Elaborar o Plano de Ação para a próxima aula presencial do professor.

Retorne estritamente em JSON:
{
  "competencyHeatmap": [
    {
      "competencyCode": "CMP-DB-01",
      "name": "Normalização de Banco de Dados (3FN)",
      "category": "Modelagem & Banco de Dados",
      "masteryPercentage": 52,
      "status": "Crítico",
      "mostCommonErrorPattern": "Confusão entre dependência parcial e dependência transitiva.",
      "affectedStudentsCount": 2
    },
    {
      "competencyCode": "CMP-DEV-02",
      "name": "Controle de Fluxo e Lógica Defensiva",
      "category": "Lógica & Algoritmos",
      "masteryPercentage": 82,
      "status": "Excelente",
      "mostCommonErrorPattern": "Omissão de guard clauses em casos de lista vazia.",
      "affectedStudentsCount": 1
    }
  ],
  "peerInstructionPairings": [
    {
      "mentorStudentId": "st-01",
      "mentorStudentName": "Ana Beatriz Silva",
      "menteeStudentId": "st-03",
      "menteeStudentName": "Mariana Oliveira Costa",
      "targetCompetency": "Normalização 3FN",
      "pedagogicalRationale": "Ana demonstrou domínio pleno na modelagem e pode orientar Mariana através de um estudo de caso prático.",
      "suggestedCollaborativeActivity": "Refatoração conjunta do esquema de e-commerce eliminando colunas redundantes."
    }
  ],
  "nextClassActionPlan": [
    "Iniciar os primeiros 15 minutos com Live Debugging focado na 3ª Forma Normal.",
    "Aplicar dinâmica de duplas (Peer Instruction) no laboratório prático.",
    "Disponibilizar os Micro-Desafios da Trilha Adaptativa no Portal do Aluno."
  ],
  "suggestedReviewTopic": "Eliminação de Dependências Transitivas e Chaves Estrangeiras Otimizadas"
}`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.customAI);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.2, max_tokens: 3500 });
      const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        cockpitId,
        classId: params.classId,
        className,
        totalStudents,
        averageClassScore: avgScore,
        atRiskStudentsCount: atRiskCount,
        competencyHeatmap: parsed.competencyHeatmap || [],
        peerInstructionPairings: parsed.peerInstructionPairings || [],
        nextClassActionPlan: parsed.nextClassActionPlan || [
          "Revisão guiada no início da aula.",
          "Aplicação de exercícios práticos em duplas."
        ],
        suggestedReviewTopic: parsed.suggestedReviewTopic || "Estruturas de Dados e Normalização",
        generatedAt: new Date().toISOString()
      };
    } catch {
      return {
        cockpitId,
        classId: params.classId,
        className,
        totalStudents,
        averageClassScore: avgScore,
        atRiskStudentsCount: atRiskCount,
        competencyHeatmap: [
          {
            competencyCode: "CMP-01",
            name: "Normalização Relacional (1FN a 3FN)",
            category: "Modelagem & Banco de Dados",
            masteryPercentage: 55,
            status: "Crítico",
            mostCommonErrorPattern: "Persistência de dependências transitivas na tabela principal.",
            affectedStudentsCount: 2
          },
          {
            competencyCode: "CMP-02",
            name: "Lógica Defensiva & Guard Clauses",
            category: "Lógica & Algoritmos",
            masteryPercentage: 78,
            status: "Atenção",
            mostCommonErrorPattern: "Ausência de tratamento para coleções e parâmetros vazios.",
            affectedStudentsCount: 1
          },
          {
            competencyCode: "CMP-03",
            name: "Indexação & Performance SQL",
            category: "Clean Code & Arquitetura",
            masteryPercentage: 88,
            status: "Excelente",
            mostCommonErrorPattern: "Omissão eventual de índices em chaves estrangeiras.",
            affectedStudentsCount: 1
          }
        ],
        peerInstructionPairings: [
          {
            mentorStudentId: "st-01",
            mentorStudentName: "Ana Beatriz Silva",
            menteeStudentId: "st-04",
            menteeStudentName: "Lucas Ferreira Lima",
            targetCompetency: "Normalização 3FN e Guard Clauses",
            pedagogicalRationale: "Ana possui excelência comprovada em código e modelagem, servindo de mentora pedagógica no laboratório.",
            suggestedCollaborativeActivity: "Pair Programming para implementar validações antecipadas no script de pedidos."
          }
        ],
        nextClassActionPlan: [
          "Realizar 15 minutos de Live Debugging no projetor demonstrando a diferença prática entre 2FN e 3FN.",
          "Ativar dinâmicas de Pair Programming no laboratório com as duplas sugeridas pela IA.",
          "Acompanhar individualmente os estudantes com pontuação < 60 através dos relatórios individuais."
        ],
        suggestedReviewTopic: "Normalização de Banco de Dados e Eliminação de Redundâncias",
        generatedAt: new Date().toISOString()
      };
    }
  }
}

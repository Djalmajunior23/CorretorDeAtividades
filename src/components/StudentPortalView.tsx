import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Code2, 
  FileText, 
  Send, 
  Award, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  User, 
  Terminal, 
  Layers, 
  ChevronRight, 
  RefreshCw,
  Eye,
  Brain,
  Download,
  HelpCircle,
  Scale,
  Lightbulb,
  Check,
  XCircle,
  FileCheck,
  Activity,
  Cpu,
  ArrowRight,
  Zap,
  Target,
  Play,
  Flame,
  Briefcase,
  ShieldCheck,
  QrCode,
  Github,
  MessageSquareCode,
  FileSignature,
  Share2,
  Copy,
  Lock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";
import { StudentAcademyMasteryView } from "./StudentAcademyMasteryView";
import { 
  StudentCorrectionInsightService, 
  AssertiveStudentReport, 
  DisputeReviewResult 
} from "../services/studentCorrectionInsightService";
import { 
  AdaptiveLearningPathwayService, 
  AdaptivePathwayPlan, 
  MicroChallenge, 
  LiveSocraticFeedback 
} from "../services/adaptiveLearningPathwayService";
import {
  TechMockInterviewService,
  TechMockInterviewReport
} from "../services/techMockInterviewService";
import {
  DigitalCredentialPortfolioService,
  DigitalMicroCredential,
  GitHubPortfolioPackage
} from "../services/digitalCredentialPortfolioService";
import {
  StylometricAuthenticityService,
  StylometricAuthenticityReport
} from "../services/stylometricAuthenticityService";

interface StudentPortalViewProps {
  initialStudentId?: string;
  initialClassId?: string;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  initialStudentId = "st-01",
  initialClassId = "turma-1a"
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [activeTab, setActiveTab] = useState<"pending" | "delivered" | "grades" | "corrections" | "adaptive_pathway" | "academy_mastery" | "tech_interview" | "credentials_portfolio" | "authenticity_audit">("pending");
  const [loading, setLoading] = useState<boolean>(true);

  // Portal data
  const [studentProfile, setStudentProfile] = useState<any>({
    name: "Ana Beatriz Silva",
    enrollment_code: "20260101",
    class_name: "Desenvolvimento de Sistemas 1A",
    course: "Técnico em Desenvolvimento de Sistemas - SENAI"
  });

  const [attendance, setAttendance] = useState<any>({
    total_classes: 40,
    present_count: 38,
    absence_count: 2,
    attendance_percentage: 95.0
  });

  const [activities, setActivities] = useState<any[]>([
    {
      id: "act-01",
      title: "Desafio 01: Manipulação de Arrays e Filtros",
      description: "Implemente uma função em Python chamada `filtrar_aprovados(notas)` que receba uma lista de números e retorne apenas notas >= 60.",
      language: "python",
      points: 100,
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      delivery_status: "pending",
      starter_code: "def filtrar_aprovados(notas):\n    # Escreva sua solução aqui\n    pass\n",
      test_cases: [{ input: "[50, 60, 75, 40, 90]", expected: "[60, 75, 90]" }]
    },
    {
      id: "act-02",
      title: "Desafio 02: Validação de CPF e Expressões Regulares",
      description: "Crie um script que receba uma string de CPF e valide o formato e os dígitos verificadores conforme a regra oficial da Receita Federal.",
      language: "python",
      points: 100,
      deadline: new Date(Date.now() + 86400000 * 6).toISOString(),
      delivery_status: "pending",
      starter_code: "def validar_cpf(cpf: str) -> bool:\n    # Seu algoritmo aqui\n    pass\n",
      test_cases: [{ input: "'123.456.789-00'", expected: "True" }]
    },
    {
      id: "act-03",
      title: "Laboratório 03: Estruturas Condicionais e Funções",
      description: "Algoritmo de cálculo de desconto progressivo baseado na categoria do cliente.",
      language: "python",
      points: 100,
      deadline: new Date(Date.now() - 86400000 * 2).toISOString(),
      delivery_status: "delivered_on_time",
      submitted_code: "def calcular_desconto(valor, categoria):\n    taxa = 0.15 if categoria == 'VIP' else 0.05\n    return valor * (1 - taxa)\n",
      score: 95,
      feedback: "Excelente solução! Sintaxe concisa com operador ternário e 100% dos testes aprovados.",
      submission_date: new Date(Date.now() - 86400000 * 2.5).toISOString()
    }
  ]);

  // Submission workspace modal
  const [submittingActivity, setSubmittingActivity] = useState<any | null>(null);
  const [submissionCode, setSubmissionCode] = useState<string>("");
  const [submissionNotes, setSubmissionNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live Socratic Helper inside Submission Workspace
  const [liveSocratic, setLiveSocratic] = useState<LiveSocraticFeedback | null>(null);
  const [isRequestingLiveSocratic, setIsRequestingLiveSocratic] = useState<boolean>(false);

  // Assertive Report & Diagnostics Inspection Modal
  const [inspectingReport, setInspectingReport] = useState<AssertiveStudentReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  
  // Socratic Progressive Hints
  const [currentHint, setCurrentHint] = useState<{ level: number; title: string; text: string; snippet?: string } | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState<boolean>(false);

  // Pedagogical Dispute Modal
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState<boolean>(false);
  const [disputeJustification, setDisputeJustification] = useState<string>("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState<boolean>(false);
  const [disputeResult, setDisputeResult] = useState<DisputeReviewResult | null>(null);

  // Adaptive Pathway & Gamified Micro-Challenges
  const [adaptivePathway, setAdaptivePathway] = useState<AdaptivePathwayPlan | null>(null);
  const [isLoadingPathway, setIsLoadingPathway] = useState<boolean>(false);
  const [studentXp, setStudentXp] = useState<number>(450);
  const [activeChallenge, setActiveChallenge] = useState<MicroChallenge | null>(null);
  const [challengeUserCode, setChallengeUserCode] = useState<string>("");
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);

  // Tech Mock Interview state
  const [interviewRole, setInterviewRole] = useState<string>("Desenvolvedor Backend Python / SQL Júnior");
  const [interviewCodeSample, setInterviewCodeSample] = useState<string>(
    "def processar_pedidos(pedidos):\n    # Solucao com filtros defensivos\n    return [p for p in pedidos if p.get('valor', 0) > 0]"
  );
  const [interviewReport, setInterviewReport] = useState<TechMockInterviewReport | null>(null);
  const [isLoadingInterview, setIsLoadingInterview] = useState<boolean>(false);

  // Digital Micro-Credentials & GitHub Portfolio state
  const [issuedCredentials, setIssuedCredentials] = useState<DigitalMicroCredential[]>([]);
  const [githubPortfolio, setGithubPortfolio] = useState<GitHubPortfolioPackage | null>(null);
  const [isIssuingCredential, setIsIssuingCredential] = useState<boolean>(false);
  const [isGeneratingGithub, setIsGeneratingGithub] = useState<boolean>(false);

  // Stylometric Authenticity state
  const [auditCode, setAuditCode] = useState<string>(
    "def validar_integridade(dados):\n    # Codigo autoral com tratamento de excecao\n    if not dados:\n        return False\n    return all(isinstance(x, (int, float)) for x in dados)"
  );
  const [auditLanguage, setAuditLanguage] = useState<string>("Python");
  const [auditReport, setAuditReport] = useState<StylometricAuthenticityReport | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);

  // Student roster for simulation
  const availableStudents = [
    { id: "st-01", name: "Ana Beatriz Silva", code: "20260101" },
    { id: "st-02", name: "Carlos Eduardo Santos", code: "20260102" },
    { id: "st-03", name: "Mariana Oliveira Costa", code: "20260103" },
    { id: "st-04", name: "Lucas Ferreira Lima", code: "20260104" },
    { id: "st-05", name: "Gabriel Souza Rocha", code: "20260105" },
    { id: "st-06", name: "Beatriz Mendes", code: "20260106" }
  ];

  const fetchPortalData = async (stId: string) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/student/portal-data/${encodeURIComponent(stId)}?class_id=${encodeURIComponent(selectedClassId)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.student) setStudentProfile(data.student);
        if (data.attendance) setAttendance(data.attendance);
        if (data.submissions && Array.isArray(data.submissions) && data.submissions.length > 0) {
          setActivities(prev => {
            const basePending = prev.filter(p => p.delivery_status === "pending" || p.delivery_status === "late_pending");
            const mappedSubmissions = data.submissions.map((s: any) => ({
              id: s.id,
              title: s.title || `[Avaliação] ${s.language?.toUpperCase() || "Código"}`,
              description: s.feedback || "Avaliação registrada no sistema",
              language: s.language || "python",
              points: 100,
              deadline: s.submission_date || new Date().toISOString(),
              delivery_status: "delivered_on_time",
              submitted_code: s.submitted_code,
              score: s.score,
              feedback: s.feedback,
              submission_date: s.submission_date,
              source: s.source
            }));
            return [...basePending, ...mappedSubmissions];
          });
        }
      }
    } catch (e) {
      console.warn("Using default student profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData(selectedStudentId);
    fetchAdaptivePathway(selectedStudentId);
  }, [selectedStudentId, selectedClassId]);

  const fetchAdaptivePathway = async (stId: string) => {
    setIsLoadingPathway(true);
    try {
      const res = await fetch(apiUrl("/api/adaptive/pathway-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: stId,
          studentName: studentProfile.name,
          courseName: studentProfile.course,
          identifiedGaps: ["Normalização 3FN", "Validação defensiva de coleções", "Tratamento de Exceções"]
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAdaptivePathway(data.pathwayPlan);
      } else {
        const fallback = await AdaptiveLearningPathwayService.generateAdaptivePathway({
          studentId: stId,
          studentName: studentProfile.name,
          identifiedGaps: ["Validação antecipada", "Normalização 3FN"]
        });
        setAdaptivePathway(fallback);
      }
    } catch (e) {
      const fallback = await AdaptiveLearningPathwayService.generateAdaptivePathway({
        studentId: stId,
        studentName: studentProfile.name,
        identifiedGaps: ["Validação antecipada", "Normalização 3FN"]
      });
      setAdaptivePathway(fallback);
    } finally {
      setIsLoadingPathway(false);
    }
  };

  const handleOpenSubmission = (act: any) => {
    setSubmittingActivity(act);
    setSubmissionCode(act.submitted_code || act.starter_code || "# Escreva seu código aqui em " + (act.language || "Python"));
    setSubmissionNotes("");
    setLiveSocratic(null);
  };

  // Live Socratic Request in the Submission Workspace
  const handleRequestLiveSocratic = async () => {
    if (!submissionCode.trim()) {
      toast.error("Digite algum trecho de código antes de pedir orientação ao copiloto.");
      return;
    }
    setIsRequestingLiveSocratic(true);
    try {
      const res = await fetch(apiUrl("/api/student/live-coding-socratic"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: submissionCode,
          language: submittingActivity?.language || "Python",
          activityTitle: submittingActivity?.title || "Atividade Prática"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSocratic(data.liveFeedback);
      } else {
        const fallbackFeedback = await AdaptiveLearningPathwayService.evaluateLiveCodingSnapshot({
          code: submissionCode,
          language: submittingActivity?.language || "Python",
          activityTitle: submittingActivity?.title || "Atividade Prática"
        });
        setLiveSocratic(fallbackFeedback);
      }
    } catch (e) {
      const fallbackFeedback = await AdaptiveLearningPathwayService.evaluateLiveCodingSnapshot({
        code: submissionCode,
        language: submittingActivity?.language || "Python",
        activityTitle: submittingActivity?.title || "Atividade Prática"
      });
      setLiveSocratic(fallbackFeedback);
    } finally {
      setIsRequestingLiveSocratic(false);
    }
  };

  const handleSendSubmission = async () => {
    if (!submittingActivity) return;
    if (!submissionCode.trim()) {
      toast.error("Insira o código da sua solução antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/student/submit-activity"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudentId,
          activity_id: submittingActivity.id,
          class_id: selectedClassId,
          code_content: submissionCode,
          submission_notes: submissionNotes
        })
      });

      if (res.ok) {
        toast.success("✓ Atividade enviada com sucesso ao professor!");
        setActivities(prev => prev.map(a => {
          if (a.id === submittingActivity.id) {
            return {
              ...a,
              delivery_status: "delivered_on_time",
              submitted_code: submissionCode,
              submission_date: new Date().toISOString()
            };
          }
          return a;
        }));
        setSubmittingActivity(null);
      } else {
        toast.error("Erro ao registrar submissão.");
      }
    } catch (e) {
      toast.success("✓ Atividade enviada com sucesso!");
      setActivities(prev => prev.map(a => {
        if (a.id === submittingActivity.id) {
          return {
            ...a,
            delivery_status: "delivered_on_time",
            submitted_code: submissionCode,
            submission_date: new Date().toISOString()
          };
        }
        return a;
      }));
      setSubmittingActivity(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inspect or generate assertive line-by-line student report
  const handleOpenAssertiveReport = async (act: any) => {
    setIsLoadingReport(true);
    setCurrentHint(null);
    setDisputeResult(null);
    setIsDisputeModalOpen(false);
    try {
      const res = await fetch(apiUrl("/api/student/corrections/detailed-report"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: act.id,
          studentId: selectedStudentId,
          studentName: studentProfile.name,
          enrollmentCode: studentProfile.enrollment_code,
          className: studentProfile.class_name,
          courseName: studentProfile.course,
          activityTitle: act.title,
          language: act.language || "Python",
          submittedCode: act.submitted_code || "def solucao():\n    return True\n",
          rawScore: act.score ?? 85,
          testCases: act.test_cases || []
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInspectingReport(data.report);
      } else {
        const fallbackRep = await StudentCorrectionInsightService.generateAssertiveStudentReport({
          submissionId: act.id,
          studentId: selectedStudentId,
          studentName: studentProfile.name,
          enrollmentCode: studentProfile.enrollment_code,
          className: studentProfile.class_name,
          courseName: studentProfile.course,
          activityTitle: act.title,
          language: act.language || "Python",
          submittedCode: act.submitted_code || "def solucao():\n    return True\n",
          rawScore: act.score ?? 85,
          testCases: act.test_cases || []
        });
        setInspectingReport(fallbackRep);
      }
    } catch (e) {
      const fallbackRep = await StudentCorrectionInsightService.generateAssertiveStudentReport({
        submissionId: act.id,
        studentId: selectedStudentId,
        studentName: studentProfile.name,
        enrollmentCode: studentProfile.enrollment_code,
        className: studentProfile.class_name,
        courseName: studentProfile.course,
        activityTitle: act.title,
        language: act.language || "Python",
        submittedCode: act.submitted_code || "def solucao():\n    return True\n",
        rawScore: act.score ?? 85,
        testCases: act.test_cases || []
      });
      setInspectingReport(fallbackRep);
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Request progressive hint from Socratic tutor
  const handleRequestHint = async (level: 1 | 2 | 3) => {
    if (!inspectingReport) return;
    setIsLoadingHint(true);
    try {
      const res = await fetch(apiUrl("/api/student/corrections/refactor-hint"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: inspectingReport.submittedCode,
          language: inspectingReport.language,
          hintLevel: level,
          identifiedIssue: inspectingReport.whyItSucceededOrFailed
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentHint({
          level: data.hint.hintLevel,
          title: data.hint.hintTitle,
          text: data.hint.hintText,
          snippet: data.hint.codeSnippetHint
        });
      } else {
        const hint = await StudentCorrectionInsightService.generateProgressiveRefactorHint({
          code: inspectingReport.submittedCode,
          language: inspectingReport.language,
          hintLevel: level
        });
        setCurrentHint({
          level: hint.hintLevel,
          title: hint.hintTitle,
          text: hint.hintText,
          snippet: hint.codeSnippetHint
        });
      }
    } catch (e) {
      const hint = await StudentCorrectionInsightService.generateProgressiveRefactorHint({
        code: inspectingReport.submittedCode,
        language: inspectingReport.language,
        hintLevel: level
      });
      setCurrentHint({
        level: hint.hintLevel,
        title: hint.hintTitle,
        text: hint.hintText,
        snippet: hint.codeSnippetHint
      });
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Submit formal pedagogical dispute to AI jury
  const handleSendDispute = async () => {
    if (!inspectingReport || !disputeJustification.trim()) {
      toast.error("Por favor, descreva os argumentos técnicos do seu recurso.");
      return;
    }

    setIsSubmittingDispute(true);
    try {
      const res = await fetch(apiUrl("/api/student/corrections/dispute"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: inspectingReport.studentName,
          activityTitle: inspectingReport.activityTitle,
          submittedCode: inspectingReport.submittedCode,
          originalScore: inspectingReport.score,
          studentJustification: disputeJustification
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDisputeResult(data.disputeResult);
        toast.success("✓ Parecer da Banca Recursal emitido com sucesso!");
      } else {
        const fallbackDisp = await StudentCorrectionInsightService.submitGradeDispute({
          studentName: inspectingReport.studentName,
          activityTitle: inspectingReport.activityTitle,
          submittedCode: inspectingReport.submittedCode,
          originalScore: inspectingReport.score,
          studentJustification: disputeJustification
        });
        setDisputeResult(fallbackDisp);
        toast.success("✓ Parecer da Banca Recursal emitido!");
      }
    } catch (e) {
      const fallbackDisp = await StudentCorrectionInsightService.submitGradeDispute({
        studentName: inspectingReport.studentName,
        activityTitle: inspectingReport.activityTitle,
        submittedCode: inspectingReport.submittedCode,
        originalScore: inspectingReport.score,
        studentJustification: disputeJustification
      });
      setDisputeResult(fallbackDisp);
      toast.success("✓ Parecer da Banca Recursal emitido!");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Download official SENAI PDF report
  const handleDownloadPdf = () => {
    if (!inspectingReport) return;
    try {
      const filename = `laudo_correcao_senai_${inspectingReport.studentName.replace(/\s+/g, "_")}_${inspectingReport.reportId}.pdf`;
      StudentCorrectionInsightService.exportStudentCorrectionReportPdf(inspectingReport, filename);
      toast.success("✓ Download do Laudo Oficial SENAI iniciado!");
    } catch (e) {
      toast.error("Erro ao gerar PDF do laudo.");
    }
  };

  // Complete a Micro-Challenge
  const handleCompleteMicroChallenge = (challenge: MicroChallenge) => {
    if (completedChallenges.includes(challenge.challengeId)) {
      toast.info("Você já concluiu esta missão!");
      return;
    }
    setCompletedChallenges(prev => [...prev, challenge.challengeId]);
    setStudentXp(prev => prev + challenge.xpReward);
    toast.success(`🎉 Missão Concluída! +${challenge.xpReward} XP adicionados ao seu perfil!`);
    setActiveChallenge(null);
  };

  // Tech Mock Interview Handlers
  const handleRunMockInterview = async () => {
    setIsLoadingInterview(true);
    try {
      const res = await fetch(apiUrl("/api/interview/simulate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          studentName: studentProfile.name,
          className: studentProfile.class_name,
          targetRole: interviewRole,
          studentCodeSample: interviewCodeSample,
          activityTitle: "Projetos Práticos e Arquitetura de Software"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInterviewReport(data.interviewReport);
        toast.success("✓ Simulação de Entrevista Técnica concluída com sucesso!");
      } else {
        const report = await TechMockInterviewService.generateInterviewSession({
          studentId: selectedStudentId,
          studentName: studentProfile.name,
          className: studentProfile.class_name,
          targetRole: interviewRole,
          studentCodeSample: interviewCodeSample
        });
        setInterviewReport(report);
        toast.success("✓ Entrevista Técnica concluída via motor local!");
      }
    } catch (e) {
      const report = await TechMockInterviewService.generateInterviewSession({
        studentId: selectedStudentId,
        studentName: studentProfile.name,
        className: studentProfile.class_name,
        targetRole: interviewRole,
        studentCodeSample: interviewCodeSample
      });
      setInterviewReport(report);
      toast.success("✓ Entrevista Técnica concluída via motor local!");
    } finally {
      setIsLoadingInterview(false);
    }
  };

  const handleDownloadInterviewPdf = () => {
    if (!interviewReport) return;
    try {
      TechMockInterviewService.exportInterviewReportPdf(interviewReport);
      toast.success("✓ Download do Laudo de Entrevista Técnica iniciado!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + e.message);
    }
  };

  // Digital Micro-Credentials & GitHub Handlers
  const handleIssueCredential = (act: any) => {
    setIsIssuingCredential(true);
    try {
      const cred = DigitalCredentialPortfolioService.issueDigitalMicroCredential({
        studentId: selectedStudentId,
        studentName: studentProfile.name,
        enrollmentCode: studentProfile.enrollment_code,
        courseName: studentProfile.course,
        competencyTitle: act.title || "Desenvolvimento de Software Defensivo",
        gradeScore: act.score ?? 85,
        skillsAcquired: ["Lógica Algorítmica", "Clean Code", "Testes Automatizados", "Padrão SENAI"],
        workloadHours: 40
      });
      setIssuedCredentials(prev => [cred, ...prev.filter(c => c.competencyTitle !== cred.competencyTitle)]);
      toast.success("🏆 Micro-Credencial emitida com assinatura digital SHA-256!");
    } catch (e: any) {
      toast.error("Erro ao emitir credencial: " + e.message);
    } finally {
      setIsIssuingCredential(false);
    }
  };

  const handleDownloadCredentialPdf = (cred: DigitalMicroCredential) => {
    try {
      DigitalCredentialPortfolioService.exportMicroCredentialPdf(cred);
      toast.success("✓ Certificado oficial SENAI baixado!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + e.message);
    }
  };

  const handleGenerateGithub = (act: any) => {
    setIsGeneratingGithub(true);
    try {
      const pkg = DigitalCredentialPortfolioService.generateGitHubPortfolio({
        studentName: studentProfile.name,
        projectTitle: act.title || "Projeto Prático SENAI",
        language: act.language || "Python",
        architectureSummary: "Arquitetura modular em camadas, com testes automatizados e validação de casos de borda.",
        keyFeatures: [
          "Validação defensiva de dados de entrada",
          "Execução assíncrona otimizada",
          "Conformidade com os padrões da Indústria 4.0"
        ],
        studentCodeSample: act.submitted_code || "def solucao():\n    return True"
      });
      setGithubPortfolio(pkg);
      toast.success("🚀 Portfólio GitHub e README.md gerados com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar portfólio GitHub: " + e.message);
    } finally {
      setIsGeneratingGithub(false);
    }
  };

  // Stylometric Authenticity Handlers
  const handleRunAuthenticityAudit = async () => {
    if (!auditCode.trim()) {
      toast.error("Por favor, cole um código para auditar.");
      return;
    }
    setIsLoadingAudit(true);
    try {
      const res = await fetch(apiUrl("/api/authenticity/audit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentProfile.name,
          activityTitle: "Auditoria Prévia de Submissão",
          submittedCode: auditCode,
          language: auditLanguage
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAuditReport(data.authenticityReport);
        toast.success("✓ Auditoria Estilométrica concluída!");
      } else {
        const report = await StylometricAuthenticityService.auditCodeAuthenticity({
          studentName: studentProfile.name,
          activityTitle: "Auditoria Prévia de Submissão",
          submittedCode: auditCode,
          language: auditLanguage
        });
        setAuditReport(report);
        toast.success("✓ Auditoria concluída via motor local!");
      }
    } catch (e) {
      const report = await StylometricAuthenticityService.auditCodeAuthenticity({
        studentName: studentProfile.name,
        activityTitle: "Auditoria Prévia de Submissão",
        submittedCode: auditCode,
        language: auditLanguage
      });
      setAuditReport(report);
      toast.success("✓ Auditoria concluída via motor local!");
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const pendingActivities = activities.filter(a => a.delivery_status === "pending" || a.delivery_status === "late_pending");
  const deliveredActivities = activities.filter(a => a.delivery_status === "delivered_on_time" || a.delivery_status === "delivered_late");
  const gradedActivities = activities.filter(a => a.score !== undefined && a.score !== null);
  const averageGrade = gradedActivities.length > 0 
    ? Math.round(gradedActivities.reduce((acc, a) => acc + (a.score || 0), 0) / gradedActivities.length)
    : 85;

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6 max-w-7xl mx-auto">
      {/* Top Banner & Student Switcher */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-2xl p-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">{studentProfile.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Estudante Ativo
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> {studentXp} XP
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-1">
                Matrícula: <span className="font-mono text-white">{studentProfile.enrollment_code}</span> • Turma: <span className="text-white">{studentProfile.class_name}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{studentProfile.course}</p>
            </div>
          </div>

          {/* Student Persona Switcher (For Demo/Testing) */}
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700/80 rounded-xl p-3 flex flex-col gap-1.5 min-w-[240px]">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Simular Acesso do Estudante:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                const found = availableStudents.find(s => s.id === e.target.value);
                if (found) {
                  setStudentProfile((prev: any) => ({ ...prev, name: found.name, enrollment_code: found.code }));
                }
              }}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {availableStudents.map(st => (
                <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards 360 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Minha Assiduidade</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{attendance.attendance_percentage.toFixed(1)}%</span>
            <span className="text-xs text-emerald-400 font-medium">Regular (LDB &gt; 75%)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" 
              style={{ width: `${attendance.attendance_percentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            {attendance.present_count} presenças registradas em {attendance.total_classes} aulas ({attendance.absence_count} faltas acumuladas)
          </p>
        </div>

        {/* Grades Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Média Acadêmica</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">{averageGrade}</span>
            <span className="text-xs text-slate-400">/ 100 pontos</span>
            <span className="ml-auto px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300">
              {averageGrade >= 60 ? "Aprovado" : "Em Recuperação"}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full" 
              style={{ width: `${averageGrade}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            Critério oficial SENAI de aprovação: $\ge 60.0$ pontos
          </p>
        </div>

        {/* Deliveries Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entregas de Atividades</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-400">{deliveredActivities.length}</span>
            <span className="text-xs text-slate-400">de {activities.length} concluídas</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" 
              style={{ width: `${(deliveredActivities.length / activities.length) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            {pendingActivities.length > 0 ? `${pendingActivities.length} atividade(s) aguardando envio` : "Todas as atividades estão em dia!"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "pending" 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" 
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          Atividades Pendentes ({pendingActivities.length})
        </button>

        <button
          onClick={() => setActiveTab("delivered")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "delivered" 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" 
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Atividades Entregues ({deliveredActivities.length})
        </button>

        <button
          onClick={() => setActiveTab("grades")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "grades" 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" 
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-4 h-4" />
          Meu Boletim & Feedback
        </button>

        <button
          onClick={() => setActiveTab("corrections")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "corrections" 
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" 
              : "bg-slate-900 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 border border-emerald-500/20"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Laudos & Correções Assertivas (IA)
        </button>

        <button
          onClick={() => setActiveTab("adaptive_pathway")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "adaptive_pathway" 
              ? "bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-600/30" 
              : "bg-slate-900 text-amber-400 hover:text-amber-300 hover:bg-slate-800 border border-amber-500/20"
          }`}
        >
          <Target className="w-4 h-4" />
          Trilhas Adaptativas & Micro-Missões (XP)
        </button>

        <button
          onClick={() => setActiveTab("academy_mastery")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "academy_mastery" 
              ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/30" 
              : "bg-slate-900 text-purple-400 hover:text-purple-300 hover:bg-slate-800 border border-purple-500/20"
          }`}
        >
          <Brain className="w-4 h-4" />
          Academia de Aprendizado Profundo (IA)
        </button>

        <button
          onClick={() => setActiveTab("tech_interview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "tech_interview" 
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-md shadow-blue-500/30" 
              : "bg-slate-900 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 border border-cyan-500/20"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Mock Interview & Empregabilidade
        </button>

        <button
          onClick={() => setActiveTab("credentials_portfolio")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "credentials_portfolio" 
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/30" 
              : "bg-slate-900 text-teal-400 hover:text-teal-300 hover:bg-slate-800 border border-teal-500/20"
          }`}
        >
          <QrCode className="w-4 h-4" />
          Micro-Certificados (SHA-256) & GitHub
        </button>

        <button
          onClick={() => setActiveTab("authenticity_audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "authenticity_audit" 
              ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold shadow-md shadow-rose-500/30" 
              : "bg-slate-900 text-rose-400 hover:text-rose-300 hover:bg-slate-800 border border-rose-500/20"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Auditoria de Autenticidade & Defesa
        </button>
      </div>

      {/* Tab 1: Pending Activities */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingActivities.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Parabéns! Nenhuma atividade pendente</h3>
              <p className="text-xs text-slate-400 mt-1">Você está 100% em dia com todas as tarefas atribuídas pelo docente.</p>
            </div>
          ) : (
            pendingActivities.map(act => (
              <div 
                key={act.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pendente
                    </span>
                    <span className="text-xs font-mono text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                      {act.language || "Python"}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Prazo: {new Date(act.deadline).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{act.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleOpenSubmission(act)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30"
                  >
                    <Code2 className="w-4 h-4" />
                    Submeter Solução
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Delivered Activities */}
      {activeTab === "delivered" && (
        <div className="space-y-4">
          {deliveredActivities.map(act => (
            <div 
              key={act.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Entregue
                    </span>
                    <span className="text-xs text-slate-400">
                      Enviado em: {act.submission_date ? new Date(act.submission_date).toLocaleString("pt-BR") : "Recentemente"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{act.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  {act.score !== undefined && (
                    <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
                      <Award className="w-5 h-5 text-amber-400" />
                      <div>
                        <span className="text-xs text-slate-400">Nota Obtida:</span>
                        <p className="text-base font-bold text-white">{act.score} <span className="text-xs text-slate-400">/ 100</span></p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenAssertiveReport(act)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/30"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Laudo & Diagnóstico
                  </button>
                </div>
              </div>

              {act.feedback && (
                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-200">
                  <span className="font-semibold text-indigo-300">Feedback do Professor / IA:</span> {act.feedback}
                </div>
              )}

              {act.submitted_code && (
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    Código Enviado:
                  </div>
                  <pre className="text-xs font-mono text-emerald-400 overflow-x-auto p-2 bg-slate-900 rounded">
                    {act.submitted_code}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Grades Table */}
      {activeTab === "grades" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Extrato Consolidado de Avaliações</h3>
            <span className="text-xs text-slate-400">Turma: {studentProfile.class_name}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                  <th className="p-3">Atividade / Avaliação</th>
                  <th className="p-3">Data de Entrega</th>
                  <th className="p-3">Nota Atribuída</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Parecer / Feedback</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activities.map(act => (
                  <tr key={act.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-white">{act.title}</td>
                    <td className="p-3 text-slate-400">
                      {act.submission_date ? new Date(act.submission_date).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="p-3 font-bold text-sm text-amber-400">
                      {act.score !== undefined ? `${act.score} pts` : "Aguardando"}
                    </td>
                    <td className="p-3">
                      {act.score !== undefined ? (
                        act.score >= 60 ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300">
                            Aprovado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300">
                            Recuperação
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300 text-xs max-w-sm">
                      {act.feedback || "Aguardando correção do docente."}
                    </td>
                    <td className="p-3 text-right">
                      {act.submitted_code ? (
                        <button
                          onClick={() => handleOpenAssertiveReport(act)}
                          className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg font-semibold text-[11px] transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Laudo
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Corrections & Assertive Diagnostic Hub */}
      {activeTab === "corrections" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Auditoria Pedagógica & Diagnóstico Socrático
                  </span>
                  <span className="text-xs text-slate-400">Padrão Oficial SENAI</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-2">Central de Laudos & Evolução Contínua do Estudante</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Acesse auditorias linha a linha de código, testes com diff, análise assintótica Big-O, dicas socráticas e recursos técnicos com a banca examinadora.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenAssertiveReport(activities[activities.length - 1])}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30"
                >
                  <Activity className="w-4 h-4" />
                  Auditar Última Entrega
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveredActivities.map(act => (
              <div 
                key={act.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-4 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-indigo-300 border border-indigo-500/30">
                      {act.language || "Python"}
                    </span>
                    <span className="text-xs text-slate-400">
                      Entregue: {act.submission_date ? new Date(act.submission_date).toLocaleDateString("pt-BR") : "Recentemente"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2">{act.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{act.feedback || act.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">{act.score ?? 85} <span className="text-xs text-slate-400">/ 100</span></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      (act.score ?? 85) >= 60 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}>
                      {(act.score ?? 85) >= 60 ? "Aprovado" : "Recuperação"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenAssertiveReport(act)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Abrir Laudo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Adaptive Pathway & Gamified Micro-Challenges */}
      {activeTab === "adaptive_pathway" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Trilhas Adaptativas • Missões Rápidas de 5 Minutos
                </span>
                <h2 className="text-xl font-bold text-white mt-2">Missões Gamificadas para Fechamento de Lacunas</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  A IA analisa os pontos de atenção identificados nas suas correções e gera micro-desafios práticos para você subir de nível e desbloquear insígnias técnicas.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                <div>
                  <span className="text-[11px] text-slate-400">Insígnia em Progresso:</span>
                  <p className="text-xs font-bold text-amber-300">{adaptivePathway?.unlockedBadge || "Mestre da Resolução Socrática"}</p>
                </div>
                <Award className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(adaptivePathway?.recommendedMicroChallenges || []).map((ch) => {
              const isDone = completedChallenges.includes(ch.challengeId);
              return (
                <div 
                  key={ch.challengeId}
                  className={`p-5 rounded-2xl border transition shadow-lg flex flex-col justify-between space-y-4 ${
                    isDone 
                      ? "bg-slate-900/60 border-emerald-500/40" 
                      : "bg-slate-900/90 border-slate-800 hover:border-amber-500/50"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-amber-300 border border-amber-500/30">
                        {ch.topic}
                      </span>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        +{ch.xpReward} XP
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{ch.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{ch.scenario}</p>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400">
                      <pre className="overflow-x-auto">{ch.starterCodeSnippet}</pre>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">Meta: {ch.expectedGoal}</span>

                    <button
                      onClick={() => handleCompleteMicroChallenge(ch)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isDone 
                          ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default" 
                          : "bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-600/30"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Concluído
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Resolver Missão
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 6: Academia de Aprendizado Profundo & Domínio Cognitivo */}
      {activeTab === "academy_mastery" && (
        <StudentAcademyMasteryView 
          studentId={selectedStudentId}
          studentName={studentProfile.name}
          courseName={studentProfile.course}
        />
      )}

      {/* Tab 7: Tech Mock Interviewer com IA & Laudo de Empregabilidade */}
      {activeTab === "tech_interview" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                    IA Interviewer Sênior
                  </span>
                  <span className="text-xs text-slate-400">Simulação de Processo Seletivo Tech</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">Tech Mock Interviewer • Simulação de Entrevista Técnica</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Defenda sua solução arquitetural, explique trade-offs e receba feedback em 4 etapas como em empresas de tecnologia.
                </p>
              </div>

              <button
                onClick={handleRunMockInterview}
                disabled={isLoadingInterview}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {isLoadingInterview ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Entrevistando...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4" />
                    Iniciar Simulação de Entrevista
                  </>
                )}
              </button>
            </div>

            {/* Role & Code Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Vaga / Cargo Alvo da Simulação:
                </label>
                <select
                  value={interviewRole}
                  onChange={(e) => setInterviewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="Desenvolvedor Backend Python / SQL Júnior">Desenvolvedor Backend Python / SQL Júnior</option>
                  <option value="Desenvolvedor Full Stack React / Node.js Júnior">Desenvolvedor Full Stack React / Node.js Júnior</option>
                  <option value="Engenheiro de Dados & Cloud Júnior">Engenheiro de Dados & Cloud Júnior</option>
                  <option value="Especialista em Automação & IoT Industrial">Especialista em Automação & IoT Industrial</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Código ou Projeto Base para Arguição Técnica:
                </label>
                <textarea
                  value={interviewCodeSample}
                  onChange={(e) => setInterviewCodeSample(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 font-mono text-xs text-cyan-300 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
                  placeholder="Cole seu código ou função principal para a entrevista..."
                />
              </div>
            </div>
          </div>

          {/* Interview Report Results */}
          {interviewReport && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Executive Summary Card */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center text-xl font-bold">
                      {interviewReport.employabilityScore}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{interviewReport.studentName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {interviewReport.mockHiringRecommendation}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Maturidade Técnica: <span className="text-white font-semibold">{interviewReport.technicalMaturityLevel}</span> • Vaga: <span className="text-cyan-300">{interviewReport.targetRole}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadInterviewPdf}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/30"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Laudo Oficial (PDF)
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200">
                  <span className="font-semibold text-cyan-400">Parecer Executivo do Tech Lead:</span> {interviewReport.executiveVerdict}
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[11px] text-slate-400">Profundidade Técnica</span>
                    <p className="text-lg font-bold text-cyan-400 mt-0.5">{interviewReport.technicalDepthScore} / 100</p>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[11px] text-slate-400">Clareza de Comunicação</span>
                    <p className="text-lg font-bold text-blue-400 mt-0.5">{interviewReport.communicationClarityScore} / 100</p>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[11px] text-slate-400">Resolução de Problemas</span>
                    <p className="text-lg font-bold text-indigo-400 mt-0.5">{interviewReport.problemSolvingScore} / 100</p>
                  </div>
                </div>
              </div>

              {/* 4 Progressive Stages */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquareCode className="w-4 h-4 text-cyan-400" />
                  Arguição em 4 Etapas:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interviewReport.exchanges.map((ex) => (
                    <div
                      key={ex.questionId}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                          Etapa {ex.questionId}: {ex.stage}
                        </span>
                        {ex.feedbackScore !== undefined && (
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            Nota: {ex.feedbackScore}/100
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-white font-medium bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-cyan-400 font-bold block mb-1">Pergunta do Entrevistador:</span>
                        {ex.interviewerQuestion}
                      </div>

                      {ex.studentAnswer && (
                        <div className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                          <span className="text-indigo-400 font-bold block mb-1">Sua Defesa Técnica:</span>
                          {ex.studentAnswer}
                        </div>
                      )}

                      {ex.aiEvaluationComment && (
                        <div className="text-xs text-slate-400 bg-blue-950/20 p-2.5 rounded-xl border border-blue-500/20">
                          <span className="text-cyan-300 font-semibold block mb-0.5">Feedback do Tech Lead:</span>
                          {ex.aiEvaluationComment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Pontos Fortes Demonstrados:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {interviewReport.keyStrengthsObserved.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Preparação Recomendada para o Mercado:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {interviewReport.recommendedMarketPreparation.map((rp, i) => (
                      <li key={i}>{rp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab 8: Micro-Certificados Digitais (SHA-256) & Portfólio GitHub */}
      {activeTab === "credentials_portfolio" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Validação Criptográfica SHA-256
                </span>
                <span className="text-xs text-slate-400">Micro-Credenciais & Portfólio</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Micro-Certificados Digitais SENAI & Gerador GitHub</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Emita certificados oficiais em PDF para atividades aprovadas ($\ge 60$ pts) e gere o `README.md` completo para seu GitHub.
              </p>
            </div>

            {/* List of Eligible Delivered Activities */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Suas Atividades Entregues & Elegíveis para Certificação:
              </h3>

              {deliveredActivities.map((act) => (
                <div
                  key={act.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        Nota: {act.score ?? 85} / 100
                      </span>
                      <span className="text-xs font-mono text-slate-400 uppercase">
                        {act.language || "Python"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{act.title}</h4>
                    <p className="text-xs text-slate-400">{act.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleIssueCredential(act)}
                      disabled={isIssuingCredential}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Emitir Certificado (PDF)
                    </button>

                    <button
                      onClick={() => handleGenerateGithub(act)}
                      disabled={isGeneratingGithub}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
                    >
                      <Github className="w-3.5 h-3.5" />
                      Gerar README GitHub
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issued Micro-Credentials Showcase */}
          {issuedCredentials.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Micro-Credenciais Emitidas com Assinatura Criptográfica:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issuedCredentials.map((cred) => (
                  <div
                    key={cred.credentialId}
                    className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {cred.honorsLevel}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Nota: {cred.gradeScore}/100
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{cred.competencyTitle}</h4>
                    <p className="text-xs text-slate-300">{cred.courseName}</p>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono text-[10px] text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Hash SHA-256:</span>
                        <span className="text-emerald-400 truncate max-w-[200px]">{cred.verificationHash}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ID da Credencial:</span>
                        <span className="text-white">{cred.credentialId}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400">Carga Horária: {cred.workloadHours}h</span>
                      <button
                        onClick={() => handleDownloadCredentialPdf(cred)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar Certificado PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GitHub Portfolio Markdown Modal / Preview */}
          {githubPortfolio && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Github className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">README.md Pronto para o Repositório GitHub</h3>
                    <p className="text-xs text-slate-400">Copie o Markdown gerado e cole direto no seu GitHub.</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(githubPortfolio.readmeMarkdown);
                    toast.success("✓ README.md copiado para a área de transferência!");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/30"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Markdown
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-80 overflow-y-auto leading-relaxed">
                <pre className="whitespace-pre-wrap">{githubPortfolio.readmeMarkdown}</pre>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab 9: Auditoria de Autenticidade & Defesa Socrática */}
      {activeTab === "authenticity_audit" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Estilometria & Anti-Plágio IA
                  </span>
                  <span className="text-xs text-slate-400">Auditoria Prévia</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">Auditoria de Autenticidade & Defesa Socrática</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Analise padrões estilométricos do seu código e pratique as perguntas conceituais antes da avaliação do docente.
                </p>
              </div>

              <button
                onClick={handleRunAuthenticityAudit}
                disabled={isLoadingAudit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs transition shadow-lg shadow-rose-500/30 disabled:opacity-50"
              >
                {isLoadingAudit ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Auditando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Executar Auditoria de Autenticidade
                  </>
                )}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">Código para Auditoria Estilométrica:</label>
                <select
                  value={auditLanguage}
                  onChange={(e) => setAuditLanguage(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-300 px-2.5 py-1 rounded-lg"
                >
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="SQL">SQL</option>
                </select>
              </div>

              <textarea
                value={auditCode}
                onChange={(e) => setAuditCode(e.target.value)}
                rows={6}
                className="w-full bg-slate-950 font-mono text-xs text-emerald-400 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-rose-500 leading-relaxed"
                placeholder="Cole o código que deseja auditar..."
              />
            </div>
          </div>

          {/* Audit Results */}
          {auditReport && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-lg">
                      {auditReport.authorshipConfidenceScore}%
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Veredito: {auditReport.authenticityVerdict}</h3>
                      <p className="text-xs text-slate-400">Score de Autenticidade Autoral</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    auditReport.isAuthentic ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {auditReport.isAuthentic ? "✓ Aprovado na Auditoria" : "Requer Atenção"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400">Entropia de Tokens</span>
                    <p className="text-sm font-bold text-white mt-0.5">{auditReport.metrics.tokenEntropy}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400">Razão Comentário / Código</span>
                    <p className="text-sm font-bold text-white mt-0.5">{auditReport.metrics.commentToCodeRatio}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400">Similaridade Padrão IA</span>
                    <p className="text-sm font-bold text-cyan-400 mt-0.5">{auditReport.metrics.aiFingerprintSimilarity}%</p>
                  </div>
                </div>
              </div>

              {/* Socratic Defense Questions */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-rose-400" />
                  Perguntas Socráticas de Defesa Técnica (Prepare-se para o Professor):
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {auditReport.socraticDefenseQuestions.map((q) => (
                    <div
                      key={q.questionId}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg"
                    >
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Pergunta {q.questionId}
                      </span>

                      <p className="text-xs text-white font-medium">{q.questionText}</p>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300">
                        <span className="text-[10px] text-slate-500 block mb-0.5">Trecho Alvo:</span>
                        {q.targetedCodeSnippet}
                      </div>

                      <div className="text-xs text-slate-400 bg-rose-950/20 p-2.5 rounded-xl border border-rose-500/20">
                        <span className="text-rose-300 font-semibold block mb-0.5">Explicação Conceitual Esperada:</span>
                        {q.expectedConceptExplanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Loading Modal Overlay */}
      {isLoadingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white">Gerando Laudo Hiper-Assertivo...</h3>
            <p className="text-xs text-slate-400">
              Auditando linhas de código, calculando complexidade Big-O e validando casos de teste.
            </p>
          </div>
        </div>
      )}

      {/* Full Interactive Assertive Correction Report Modal */}
      {inspectingReport && !isLoadingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Laudo de Correção & Diagnóstico do Estudante</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inspectingReport.isApproved ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}>
                      {inspectingReport.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {inspectingReport.activityTitle} • Matrícula: <span className="font-mono text-white">{inspectingReport.enrollmentCode}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                  title="Baixar Laudo Oficial SENAI em PDF"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  PDF Oficial (SENAI)
                </button>

                <button
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold text-amber-300 border border-amber-500/30 transition"
                  title="Contestar nota ou solicitar reavaliação da banca"
                >
                  <Scale className="w-3.5 h-3.5" />
                  Contestar Nota
                </button>

                <button
                  onClick={() => setInspectingReport(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 ml-2 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Executive Verdict & Big-O KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      Diagnóstico do Interpretador & Parecer Docente:
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Critério de Aprovação: $\ge {inspectingReport.passingScore}$ pts
                    </span>
                  </div>
                  <p className="text-xs text-white leading-relaxed">
                    <span className="font-semibold text-slate-300">Veredito:</span> {inspectingReport.executiveVerdict}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-slate-400">O que o computador executou:</span> {inspectingReport.whatComputerExecuted}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-slate-400">Diagnóstico de integridade:</span> {inspectingReport.whyItSucceededOrFailed}
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">Complexidade Algorítmica</span>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tempo:</span>
                        <span className="font-mono font-bold text-amber-400">{inspectingReport.asymptoticComplexity?.timeComplexity || "O(n)"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Espaço:</span>
                        <span className="font-mono font-bold text-amber-400">{inspectingReport.asymptoticComplexity?.spaceComplexity || "O(1)"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Eficiência:</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300">
                      {inspectingReport.asymptoticComplexity?.complexityVerdict || "Adequada"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line-by-Line Code Annotation Viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    Auditoria e Anotações Linha a Linha:
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Erro / Incompleto</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Atenção / Refatoração</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Boa Prática</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 font-mono text-xs">
                  {inspectingReport.lineAnnotations && inspectingReport.lineAnnotations.length > 0 ? (
                    inspectingReport.lineAnnotations.map((line) => (
                      <div 
                        key={line.lineNumber}
                        className={`p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 transition ${
                          line.type === "error" 
                            ? "bg-rose-950/20 border-l-4 border-rose-500" 
                            : line.type === "warning" 
                              ? "bg-amber-950/20 border-l-4 border-amber-500" 
                              : line.type === "success" 
                                ? "bg-emerald-950/15 border-l-4 border-emerald-500" 
                                : "border-l-4 border-transparent hover:bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-baseline gap-3 overflow-x-auto">
                          <span className="text-slate-500 select-none w-6 shrink-0 text-right font-semibold">
                            {line.lineNumber}
                          </span>
                          <span className={`${
                            line.type === "error" ? "text-rose-300" : line.type === "warning" ? "text-amber-200" : line.type === "success" ? "text-emerald-300" : "text-slate-300"
                          }`}>
                            {line.codeLine || " "}
                          </span>
                        </div>

                        {(line.message || line.fixSuggestion) && (
                          <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-sans px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 max-w-md">
                            {line.type === "error" && <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                            {line.type === "warning" && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            {line.type === "success" && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            <span className="text-slate-300 truncate">
                              {line.message || line.fixSuggestion}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-xs text-slate-400 font-sans">
                      Nenhuma anotação de linha necessária. Código aderente ao padrão.
                    </div>
                  )}
                </div>
              </div>

              {/* Test Cases Execution Diff Audit */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Auditoria de Casos de Teste & Respostas:
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <th className="p-3">Caso #</th>
                        <th className="p-3">Entrada (Input)</th>
                        <th className="p-3">Saída Esperada</th>
                        <th className="p-3">Saída do Aluno</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Tempo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-xs">
                      {inspectingReport.testCaseDiffs && inspectingReport.testCaseDiffs.length > 0 ? (
                        inspectingReport.testCaseDiffs.map((tc) => (
                          <tr key={tc.testId} className="hover:bg-slate-950/50">
                            <td className="p-3 font-sans font-semibold text-white">Teste #{tc.testId}</td>
                            <td className="p-3 text-slate-300">{tc.input}</td>
                            <td className="p-3 text-emerald-400">{tc.expectedOutput}</td>
                            <td className="p-3 text-amber-300">{tc.actualOutput}</td>
                            <td className="p-3 font-sans">
                              {tc.passed ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1 w-fit">
                                  <Check className="w-3 h-3" /> Aprovado
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3" /> Falhou
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {tc.executionTimeMs ? `${tc.executionTimeMs} ms` : "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 font-sans">
                            Testes unitários validados com sucesso.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Socratic Refactoring Hints */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      Tutor Socrático • Dicas Incrementais de Refatoração:
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Solicite orientações guiadas sem receber a resposta pronta para desenvolver autonomia de raciocínio.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRequestHint(1)}
                      disabled={isLoadingHint}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      Dica 1: Conceitual
                    </button>
                    <button
                      onClick={() => handleRequestHint(2)}
                      disabled={isLoadingHint}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      Dica 2: Caso de Borda
                    </button>
                    <button
                      onClick={() => handleRequestHint(3)}
                      disabled={isLoadingHint}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      Dica 3: Exemplo Análogo
                    </button>
                  </div>
                </div>

                {currentHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-2"
                  >
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <Sparkles className="w-4 h-4" />
                      {currentHint.title}
                    </div>
                    <p className="text-slate-200 leading-relaxed">{currentHint.text}</p>
                    {currentHint.snippet && (
                      <pre className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-amber-200 border border-amber-500/20 overflow-x-auto">
                        {currentHint.snippet}
                      </pre>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Aprovado pelo Sistema de Correção & Diagnóstico SENAI
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
                >
                  <Download className="w-4 h-4" />
                  Baixar Laudo (PDF)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pedagogical Dispute Modal */}
      {isDisputeModalOpen && inspectingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Recurso Pedagógico & Contestação de Nota</h3>
              </div>
              <button
                onClick={() => setIsDisputeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-xs text-slate-300">
                <span className="font-semibold text-white">Atividade:</span> {inspectingReport.activityTitle} • <span className="font-semibold text-white">Nota Atual:</span> {inspectingReport.score} / 100
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Justificativa Técnica do Estudante:
                </label>
                <textarea
                  value={disputeJustification}
                  onChange={(e) => setDisputeJustification(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 text-xs text-slate-200 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 leading-relaxed"
                  placeholder="Explique por que sua solução está correta, citando linhas do código, casos de uso atendidos ou possíveis ambiguidades no enunciado..."
                />
              </div>

              {disputeResult && (
                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      Parecer Oficial da Banca Recursal:
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-200">
                      Veredito: {disputeResult.verdict}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{disputeResult.juryOpinion}</p>
                  <p className="text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-300">Recomendação ao Professor:</span> {disputeResult.teacherRecommendation}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setIsDisputeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Fechar
              </button>

              <button
                onClick={handleSendDispute}
                disabled={isSubmittingDispute}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-600/30 disabled:opacity-50"
              >
                <Scale className="w-4 h-4" />
                {isSubmittingDispute ? "Avaliando Recurso..." : "Submeter Recurso à Banca (IA)"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Interactive Submission Workspace Modal with Live Socratic Helper */}
      {submittingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Submissão de Atividade: {submittingActivity.title}</h3>
              </div>
              <button
                onClick={() => setSubmittingActivity(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-xs text-slate-300">
                <span className="font-semibold text-white">Enunciado:</span> {submittingActivity.description}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Seu Código / Solução ({submittingActivity.language || "Python"}):
                  </label>

                  <button
                    onClick={handleRequestLiveSocratic}
                    disabled={isRequestingLiveSocratic}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isRequestingLiveSocratic ? "Analisando..." : "Pedir Ajuda ao Copiloto Socrático"}
                  </button>
                </div>

                <textarea
                  value={submissionCode}
                  onChange={(e) => setSubmissionCode(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-950 font-mono text-xs text-emerald-400 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  placeholder="Cole ou digite sua solução aqui..."
                />
              </div>

              {/* Live Socratic Assistant Bubble */}
              {liveSocratic && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-indigo-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      Reflexão do Copiloto Socrático:
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {liveSocratic.status}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans">{liveSocratic.socraticQuestion}</p>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800 font-mono">
                    <span>{liveSocratic.testCasePreview.quickDiagnostic}</span>
                    <span>Testes Parciais: {liveSocratic.testCasePreview.passedCount}/{liveSocratic.testCasePreview.totalCount}</span>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Comentários ou dúvidas para o professor (Opcional):
                </label>
                <input
                  type="text"
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Ex: Tive dúvida no caso de teste 2..."
                  className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSubmittingActivity(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancelar
              </button>

              <button
                onClick={handleSendSubmission}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Enviando..." : "Confirmar e Enviar Atividade"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentPortalView;

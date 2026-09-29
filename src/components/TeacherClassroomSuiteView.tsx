import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  BookOpen,
  Code,
  Award,
  HelpCircle,
  Send,
  RefreshCw,
  Play,
  Users,
  BarChart2,
  Sliders,
  Cpu,
  Eye,
  CheckSquare,
  Clock,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  Plus,
  Trash2,
  Bookmark
} from "lucide-react";
import {
  TeacherClassroomExamStudioService,
  TeacherExamSuite,
  ExamVariant,
  StudentOmrSubmission,
  StudentOmrGradingResult,
  ClassOmrBatchReport,
} from "../services/teacherClassroomExamStudioService";
import {
  TeacherInteractiveLessonKitService,
  TeacherLessonKit,
  PracticalLabChallenge,
} from "../services/teacherInteractiveLessonKitService";

const MULTI_SUBJECT_PRESETS = [
  {
    name: "Simulado Geral SENAI / SAEP (40 Questões)",
    questionCount: 40,
    topic: "Simulado Integrador de Competências Técnicas em Desenvolvimento de Sistemas",
    subjects: [
      "Algoritmos & Estruturas de Dados",
      "Banco de Dados Relacional & SQL",
      "Engenharia de Software & Clean Code",
      "Segurança da Informação, DevSecOps & LGPD"
    ]
  },
  {
    name: "Maratona Técnica Full-Stack (50 Questões)",
    questionCount: 50,
    topic: "Avaliação Global de Desenvolvimento, Arquitetura e Infraestrutura",
    subjects: [
      "Algoritmos & Estruturas de Dados",
      "Banco de Dados & Modelagem",
      "Engenharia de Software & Padrões GoF",
      "Arquitetura de Microsserviços & Resiliência",
      "DevOps, CI/CD & Contêineres Docker"
    ]
  },
  {
    name: "Exame Integrador Enade / Concurso (60 Questões)",
    questionCount: 60,
    topic: "Exame Nacional Integrado de Tecnologia e Ciência da Computação",
    subjects: [
      "Algoritmos & Complexidade Big-O",
      "Bancos de Dados Relacionais & NoSQL",
      "Engenharia de Software & Metodologias Ágeis",
      "Segurança, Criptografia & LGPD",
      "Redes de Computadores & Protocolos Web",
      "Indústria 4.0, IoT & Sistemas Embarcados"
    ]
  }
];

export const TeacherClassroomSuiteView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"EXAMS" | "OMR" | "LABS" | "LESSON_PLAN">("EXAMS");

  // State: Exam Generator
  const [examSubject, setExamSubject] = useState("Desenvolvimento de Software");
  const [examTopic, setExamTopic] = useState("Simulado Integrador de Competências Técnicas");
  const [examCourse, setExamCourse] = useState("Técnico em Desenvolvimento de Sistemas - SENAI");
  const [examLevel, setExamLevel] = useState<"SENAI_TECNICO" | "SUPERIOR" | "ENSINO_MEDIO" | "CONCURSO_ENADE">("SENAI_TECNICO");
  const [questionCount, setQuestionCount] = useState(40); // Padrão 40 questões conforme solicitado
  const [variantCount, setVariantCount] = useState(4);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [generatedExamSuite, setGeneratedExamSuite] = useState<TeacherExamSuite | null>(null);
  const [selectedVariantTab, setSelectedVariantTab] = useState("A");

  // Multi-subject management
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "Algoritmos & Estruturas de Dados",
    "Banco de Dados Relacional & SQL",
    "Engenharia de Software & Clean Code",
    "Segurança da Informação, DevSecOps & LGPD"
  ]);
  const [newSubjectInput, setNewSubjectInput] = useState("");

  // State: OMR Corrector
  const [omrStudentName, setOmrStudentName] = useState("Carlos Eduardo Silva");
  const [omrStudentId, setOmrStudentId] = useState("ALUNO-2026-089");
  const [omrSelectedVariant, setOmrSelectedVariant] = useState("A");
  const [omrMarkedAnswers, setOmrMarkedAnswers] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (let i = 1; i <= 40; i++) {
      initial[i] = ["A", "B", "C", "D"][(i * 3 + 1) % 4];
    }
    return initial;
  });
  const [singleOmrResult, setSingleOmrResult] = useState<StudentOmrGradingResult | null>(null);
  const [batchOmrReport, setBatchOmrReport] = useState<ClassOmrBatchReport | null>(null);
  const [isGradingOmr, setIsGradingOmr] = useState(false);

  // State: Lesson Kit & Labs
  const [lessonTopic, setLessonTopic] = useState("APIs RESTful Resilientes com Cláusulas de Guarda e Clean Code");
  const [lessonDuration, setLessonDuration] = useState(100);
  const [lessonMethodology, setLessonMethodology] = useState<"PBL" | "SALA_INVERTIDA" | "GAMIFICACAO" | "PEER_INSTRUCTION" | "HANDS_ON_FABLAB">("PBL");
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generatedLessonKit, setGeneratedLessonKit] = useState<TeacherLessonKit | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [revealedHintTiers, setRevealedHintTiers] = useState<number[]>([]);
  const [selectedPollAnswer, setSelectedPollAnswer] = useState<string | null>(null);

  // Apply Preset
  const handleApplyPreset = (preset: typeof MULTI_SUBJECT_PRESETS[0]) => {
    setQuestionCount(preset.questionCount);
    setExamTopic(preset.topic);
    setSelectedSubjects([...preset.subjects]);
  };

  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (trimmed && !selectedSubjects.includes(trimmed)) {
      setSelectedSubjects([...selectedSubjects, trimmed]);
      setNewSubjectInput("");
    }
  };

  const handleRemoveSubject = (sub: string) => {
    if (selectedSubjects.length > 1) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    }
  };

  // Action: Gerar Suíte de Prova Multiassunto
  const handleGenerateExamSuite = async () => {
    setIsGeneratingExam(true);
    try {
      const suite = await TeacherClassroomExamStudioService.generateExamSuite({
        subject: examSubject,
        topic: examTopic,
        multiSubjects: selectedSubjects,
        courseName: examCourse,
        educationLevel: examLevel,
        questionCount,
        variantCount,
        teacherName: "Prof. Especialista SENAI",
        academicPeriod: "2026/1",
      });
      setGeneratedExamSuite(suite);
      setSelectedVariantTab(suite.variants[0]?.variantCode || "A");
    } catch (err: any) {
      alert("Erro ao gerar prova: " + err.message);
    } finally {
      setIsGeneratingExam(false);
    }
  };

  // Action: Exportar PDF da Prova Completa
  const handleExportExamPdf = async () => {
    if (!generatedExamSuite) return;
    try {
      await TeacherClassroomExamStudioService.exportExamBundlePdf(generatedExamSuite, {
        includeVariants: generatedExamSuite.variants.map((v) => v.variantCode),
        includeTeacherMasterKey: true,
        includeOmrBubbleSheets: true,
        saveFilename: `Caderno_Avaliacao_${generatedExamSuite.id}.pdf`,
      });
    } catch (err: any) {
      alert("Erro ao exportar PDF: " + err.message);
    }
  };

  // Action: Corrigir Cartão Individual OMR
  const handleGradeSingleOmr = () => {
    if (!generatedExamSuite) {
      alert("Gere uma avaliação primeiro para ter o gabarito oficial de referência.");
      return;
    }
    setIsGradingOmr(true);
    const submission: StudentOmrSubmission = {
      studentId: omrStudentId,
      studentName: omrStudentName,
      variantCode: omrSelectedVariant,
      markedAnswers: omrMarkedAnswers,
    };
    const res = TeacherClassroomExamStudioService.gradeStudentSubmission(submission, generatedExamSuite);
    setSingleOmrResult(res);
    setIsGradingOmr(false);
  };

  // Action: Simular Correção de Lote da Turma
  const handleSimulateClassBatchOmr = () => {
    if (!generatedExamSuite) {
      alert("Gere uma avaliação primeiro para ter o gabarito oficial de referência.");
      return;
    }
    const qTotal = generatedExamSuite.masterQuestions.length;
    const sampleBatch: StudentOmrSubmission[] = [
      {
        studentId: "ALU-01",
        studentName: "Ana Clara Souza",
        variantCode: "A",
        markedAnswers: Object.fromEntries(Array.from({ length: qTotal }, (_, i) => [i + 1, generatedExamSuite.variants[0]?.answerKeyMap[i + 1] || "A"])),
      },
      {
        studentId: "ALU-02",
        studentName: "Bruno Henrique Costa",
        variantCode: "B",
        markedAnswers: Object.fromEntries(Array.from({ length: qTotal }, (_, i) => [i + 1, (i % 4 === 0 ? "C" : generatedExamSuite.variants[1]?.answerKeyMap[i + 1] || "B")])),
      },
      {
        studentId: "ALU-03",
        studentName: "Camila Rodrigues Lima",
        variantCode: "C",
        markedAnswers: Object.fromEntries(Array.from({ length: qTotal }, (_, i) => [i + 1, (i % 3 === 0 ? "D" : generatedExamSuite.variants[2]?.answerKeyMap[i + 1] || "A")])),
      },
      {
        studentId: "ALU-04",
        studentName: "Diego Fernandes",
        variantCode: "A",
        markedAnswers: Object.fromEntries(Array.from({ length: qTotal }, (_, i) => [i + 1, (i % 2 === 0 ? "B" : generatedExamSuite.variants[0]?.answerKeyMap[i + 1] || "C")])),
      },
      {
        studentId: "ALU-05",
        studentName: "Elena Vasconcelos",
        variantCode: "D",
        markedAnswers: Object.fromEntries(Array.from({ length: qTotal }, (_, i) => [i + 1, generatedExamSuite.variants[3]?.answerKeyMap[i + 1] || "A"])),
      },
      {
        studentId: "ALU-06",
        studentName: "Fabio Gabriel Mendes",
        variantCode: "B",
        markedAnswers: Object.fromEntries(Array.from({ length: qTotal }, (_, i) => [i + 1, (i % 5 === 0 ? "A" : generatedExamSuite.variants[1]?.answerKeyMap[i + 1] || "D")])),
      },
    ];

    const report = TeacherClassroomExamStudioService.gradeBatchSubmissions(sampleBatch, generatedExamSuite);
    setBatchOmrReport(report);
  };

  // Action: Gerar Kit de Aula
  const handleGenerateLessonKit = async () => {
    setIsGeneratingLesson(true);
    try {
      const kit = await TeacherInteractiveLessonKitService.generateLessonKit({
        topic: lessonTopic,
        subject: examSubject,
        courseName: examCourse,
        targetDurationMinutes: lessonDuration,
        methodology: lessonMethodology,
        programmingLanguage: "TypeScript / Node.js",
      });
      setGeneratedLessonKit(kit);
      setActiveSlideIndex(0);
      setRevealedHintTiers([]);
      setSelectedPollAnswer(null);
    } catch (err: any) {
      alert("Erro ao gerar kit de aula: " + err.message);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Action: Exportar Kit de Aula em PDF
  const handleExportLessonKitPdf = async () => {
    if (!generatedLessonKit) return;
    try {
      await TeacherInteractiveLessonKitService.exportLessonKitPdf(generatedLessonKit, {
        includeTeacherSchedule: true,
        includeStudentLabGuide: true,
        includeSaepRubric: true,
        saveFilename: `Plano_Aula_${generatedLessonKit.id}.pdf`,
      });
    } catch (err: any) {
      alert("Erro ao exportar PDF da aula: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-700/50 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              SENAI Pro Suite • Multiassunto 40+Q
            </span>
            <span className="text-xs text-blue-300 font-mono">SENAI • BNCC • ENADE • SAEP Ready</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="text-amber-400 w-8 h-8" />
            Estúdio Pedagógico & Provas Multiassunto (40+ Questões)
          </h1>
          <p className="text-slate-300 text-sm max-w-3xl">
            Geração de simulados e avaliações multidisciplinares integradas (40 a 100+ questões), cadernos multiversão A/B/C/D anti-cola, leitura óptica expressa de cartões-resposta (OMR), laboratórios guiados e planos de aula.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("EXAMS")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === "EXAMS"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <FileText className="w-4 h-4" /> Provas & Gabaritos (40+Q)
          </button>
          <button
            onClick={() => setActiveTab("OMR")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === "OMR"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Printer className="w-4 h-4" /> Leitor OMR Express
          </button>
          <button
            onClick={() => setActiveTab("LABS")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === "LABS"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Code className="w-4 h-4" /> Labs & Auto-Grading
          </button>
          <button
            onClick={() => setActiveTab("LESSON_PLAN")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === "LESSON_PLAN"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Plano de Aula & Slides
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ESTÚDIO DE PROVAS & SIMULADOS MULTIVERSÃO (40+ QUESTÕES)            */}
      {/* ========================================================================= */}
      {activeTab === "EXAMS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Painel de Configuração */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Sliders className="w-5 h-5" /> Configuração Multiassunto
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                Min. 40 Questões
              </span>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-blue-400" /> Presets de Simulados Integrados
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {MULTI_SUBJECT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/60 text-left transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white group-hover:text-blue-300">
                        {preset.name}
                      </span>
                      <span className="text-[10px] font-mono bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded">
                        {preset.questionCount}Q
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {preset.subjects.join(" • ")}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-400">Título / Ementa Geral do Simulado</label>
                <input
                  type="text"
                  value={examTopic}
                  onChange={(e) => setExamTopic(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Disciplinas / Eixos Temáticos Multiassunto */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-400">
                    Eixos Temáticos Multiassunto ({selectedSubjects.length})
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ~{Math.round(questionCount / selectedSubjects.length)}q/eixo
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedSubjects.map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      className="bg-blue-950 border border-blue-700/60 text-blue-200 text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      {sub}
                      {selectedSubjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub)}
                          className="text-slate-400 hover:text-rose-400 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar novo eixo temático..."
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Nível / Padrão</label>
                  <select
                    value={examLevel}
                    onChange={(e: any) => setExamLevel(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="SENAI_TECNICO">SENAI Técnico</option>
                    <option value="SUPERIOR">Ensino Superior</option>
                    <option value="CONCURSO_ENADE">Enade / Concurso</option>
                    <option value="ENSINO_MEDIO">Ensino Médio / BNCC</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400">Variantes Anti-Cola</label>
                  <select
                    value={variantCount}
                    onChange={(e) => setVariantCount(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={2}>2 Versões (A, B)</option>
                    <option value={3}>3 Versões (A, B, C)</option>
                    <option value={4}>4 Versões (A, B, C, D)</option>
                    <option value={6}>6 Versões (A até F)</option>
                  </select>
                </div>
              </div>

              {/* Botões Rápidos de Quantidade de Questões */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-400">
                    Quantidade de Questões: <strong className="text-amber-400 font-mono text-sm">{questionCount}Q</strong>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">10 a 100 Questões</span>
                </div>

                <div className="flex gap-1.5 mt-1.5">
                  {[20, 40, 50, 60, 80, 100].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`flex-1 py-1 text-xs font-bold font-mono rounded-lg transition-all ${
                        questionCount === count
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105"
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {count}Q
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full mt-2 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateExamSuite}
              disabled={isGeneratingExam}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isGeneratingExam ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Gerando {questionCount} Questões Multiassunto...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" /> Gerar Simulado Multiassunto ({questionCount}Q)
                </>
              )}
            </button>

            {generatedExamSuite && (
              <button
                onClick={handleExportExamPdf}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" /> Baixar Caderno Completo ({generatedExamSuite.masterQuestions.length}Q) em PDF
              </button>
            )}
          </div>

          {/* Coluna 2 e 3: Visualização do Caderno de Provas & Gabarito Mestre */}
          <div className="lg:col-span-2 space-y-4">
            {!generatedExamSuite ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <FileText className="w-16 h-16 text-slate-600 mx-auto animate-pulse" />
                <h3 className="text-lg font-bold text-slate-300">Nenhum simulado gerado ainda</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Selecione um preset (ex: <strong>Simulado Geral 40Q</strong>) ou configure a lista de disciplinas à esquerda e clique em <strong>Gerar Simulado Multiassunto</strong>.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                {/* Header da Prova Gerada */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white">{generatedExamSuite.title}</h2>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="font-bold text-amber-400 font-mono">
                        {generatedExamSuite.masterQuestions.length} Questões Multidisciplinares
                      </span>
                      <span>•</span>
                      <span>Total 100 Pontos ({generatedExamSuite.masterQuestions[0]?.points} pts/q)</span>
                      <span>•</span>
                      <span>Duração: {generatedExamSuite.durationMinutes} min</span>
                    </div>
                  </div>

                  {/* Seletor de Variante A/B/C/D */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 px-1.5">Variante:</span>
                    {generatedExamSuite.variants.map((v) => (
                      <button
                        key={v.variantCode}
                        onClick={() => setSelectedVariantTab(v.variantCode)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          selectedVariantTab === v.variantCode
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Tipo {v.variantCode}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedVariantTab("MASTER_KEY")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        selectedVariantTab === "MASTER_KEY"
                          ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/40"
                          : "text-amber-400 hover:text-amber-300"
                      }`}
                    >
                      Gabarito Cruzado
                    </button>
                  </div>
                </div>

                {/* Breakdown por Disciplina */}
                {generatedExamSuite.subjectBreakdown && generatedExamSuite.subjectBreakdown.length > 0 && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Distribuição dos Eixos Temáticos na Prova
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {generatedExamSuite.subjectBreakdown.map((sb, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-center"
                        >
                          <div className="text-xs font-bold text-white truncate" title={sb.subject}>
                            {sb.subject}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                            {sb.questionCount} Questões ({sb.percentage}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exibição das Questões da Variante Selecionada */}
                {selectedVariantTab !== "MASTER_KEY" ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {generatedExamSuite.variants
                      .find((v) => v.variantCode === selectedVariantTab)
                      ?.questions.map((q) => (
                        <div
                          key={q.variantIndex}
                          className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-900/60 text-blue-300 font-bold px-2.5 py-1 rounded-md border border-blue-700/40 font-mono">
                                Questão {q.variantIndex < 10 ? "0" + q.variantIndex : q.variantIndex}
                              </span>
                              {q.subjectArea && (
                                <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-indigo-800/50">
                                  {q.subjectArea}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 font-mono text-[11px]">
                              Gabarito: <strong className="text-emerald-400">({q.correctOptionId})</strong> • {q.points} Pts
                            </span>
                          </div>

                          <p className="text-sm text-slate-200 leading-relaxed font-sans">{q.statement}</p>

                          {q.codeSnippet && (
                            <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto">
                              <code>{q.codeSnippet}</code>
                            </pre>
                          )}

                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.id}
                                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                                    opt.isCorrect
                                      ? "bg-emerald-950/30 border-emerald-600/50 text-emerald-200 font-medium"
                                      : "bg-slate-900/50 border-slate-800 text-slate-300"
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                    opt.isCorrect ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                                  }`}>
                                    {opt.id}
                                  </span>
                                  <div className="space-y-0.5">
                                    <p>{opt.text}</p>
                                    {opt.explanation && (
                                      <p className="text-[10px] text-slate-500">{opt.explanation}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  /* Painel do Gabarito Mestre com Matriz Cruzada */
                  <div className="space-y-4">
                    <div className="bg-amber-950/30 border border-amber-600/40 p-4 rounded-xl flex items-center gap-3 text-amber-300 text-xs">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <span>
                        Matriz de Resolução Cruzada ({generatedExamSuite.masterQuestions.length} Questões): Cada versão possui permutação determinística com mapeamento de gabarito sincronizado para correção em segundos.
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-[500px] border border-slate-800 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="p-3">Item</th>
                            <th className="p-3">Eixo Temático</th>
                            <th className="p-3">Competência</th>
                            {generatedExamSuite.variants.map((v) => (
                              <th key={v.variantCode} className="p-3 text-center text-blue-400">
                                Versão {v.variantCode}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-900">
                          {generatedExamSuite.masterQuestions.map((mq, idx) => (
                            <tr key={mq.id} className="hover:bg-slate-950/50">
                              <td className="p-3 font-bold text-white font-mono">Q{idx + 1 < 10 ? "0" + (idx + 1) : idx + 1}</td>
                              <td className="p-3 text-slate-300 truncate max-w-[180px]">{mq.subjectArea || "Geral"}</td>
                              <td className="p-3 font-mono text-slate-400">{mq.competencyCode}</td>
                              {generatedExamSuite.variants.map((v) => (
                                <td key={v.variantCode} className="p-3 text-center font-bold text-emerald-400 font-mono">
                                  [ {v.answerKeyMap[idx + 1] || "-"} ]
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CORREÇÃO ÓPTICA EXPRESSA DE CARTÕES-RESPOSTA (OMR ENGINE)          */}
      {/* ========================================================================= */}
      {activeTab === "OMR" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Entrada do Cartão OMR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base pb-3 border-b border-slate-800">
              <Printer className="w-5 h-5" /> Leitor Óptico de Cartão (OMR)
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Nome do Estudante</label>
                <input
                  type="text"
                  value={omrStudentName}
                  onChange={(e) => setOmrStudentName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Matrícula</label>
                  <input
                    type="text"
                    value={omrStudentId}
                    onChange={(e) => setOmrStudentId(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Versão da Prova</label>
                  <select
                    value={omrSelectedVariant}
                    onChange={(e) => setOmrSelectedVariant(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="A">Versão A</option>
                    <option value="B">Versão B</option>
                    <option value="C">Versão C</option>
                    <option value="D">Versão D</option>
                  </select>
                </div>
              </div>

              {/* Matriz de Bolhas de Resposta (40 Questões em 2 colunas compactas) */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-400">Grade de Bolhas (40 Questões)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomized: Record<number, string> = {};
                      for (let i = 1; i <= 40; i++) {
                        randomized[i] = ["A", "B", "C", "D"][Math.floor(Math.random() * 4)];
                      }
                      setOmrMarkedAnswers(randomized);
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                  >
                    Preencher Aleatório
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {Array.from({ length: 40 }, (_, i) => i + 1).map((qNum) => (
                    <div
                      key={qNum}
                      className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800"
                    >
                      <span className="text-[11px] font-bold text-slate-300 font-mono">
                        Q{qNum < 10 ? "0" + qNum : qNum}
                      </span>
                      <div className="flex gap-1">
                        {["A", "B", "C", "D"].map((opt) => {
                          const isSelected = omrMarkedAnswers[qNum] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setOmrMarkedAnswers((prev) => ({
                                  ...prev,
                                  [qNum]: isSelected ? "" : opt,
                                }))
                              }
                              className={`w-5 h-5 rounded-full text-[10px] font-bold transition-all ${
                                isSelected
                                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/50 scale-110"
                                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleGradeSingleOmr}
                disabled={isGradingOmr}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all text-xs"
              >
                <CheckCircle className="w-4 h-4" /> Corrigir Cartão Instantaneamente
              </button>

              <button
                onClick={handleSimulateClassBatchOmr}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all text-xs"
              >
                <Users className="w-4 h-4" /> Simular Correção em Lote da Turma (6 Alunos)
              </button>
            </div>
          </div>

          {/* Painel de Resultados do Aluno & Turma */}
          <div className="lg:col-span-2 space-y-4">
            {singleOmrResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-white">{singleOmrResult.studentName}</h3>
                    <p className="text-xs text-slate-400">
                      Matrícula: {singleOmrResult.studentId} • Caderno Versão {singleOmrResult.variantCode}
                    </p>
                  </div>

                  <div className={`px-4 py-2 rounded-xl text-center font-bold ${
                    singleOmrResult.isApproved
                      ? "bg-emerald-950/60 border border-emerald-600 text-emerald-400"
                      : "bg-rose-950/60 border border-rose-600 text-rose-400"
                  }`}>
                    <div className="text-2xl font-black">{singleOmrResult.scorePercentage}%</div>
                    <div className="text-[10px] tracking-wider uppercase">
                      {singleOmrResult.isApproved ? "Aprovado (≥ 60%)" : "Recuperação"}
                    </div>
                  </div>
                </div>

                {/* Resumo de Acertos / Erros */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl text-emerald-300">
                    <strong className="text-lg font-black block font-mono">{singleOmrResult.correctCount}</strong>
                    Acertos
                  </div>
                  <div className="bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-xl text-rose-300">
                    <strong className="text-lg font-black block font-mono">{singleOmrResult.wrongCount}</strong>
                    Erros
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-300">
                    <strong className="text-lg font-black block font-mono">{singleOmrResult.blankCount}</strong>
                    Em Branco
                  </div>
                </div>

                {/* Feedback Formativo */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" /> Diagnóstico Pedagógico Automático
                  </div>
                  <p>{singleOmrResult.pedagogicalFeedback}</p>
                </div>
              </div>
            )}

            {/* Relatório de Lote da Turma */}
            {batchOmrReport && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-base pb-3 border-b border-slate-800">
                  <BarChart2 className="w-5 h-5" /> Relatório Consolidado de Desempenho no Simulado
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-2xl font-black text-white">{batchOmrReport.classAverage}%</div>
                    <div className="text-[11px] text-slate-400">Média da Turma</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-2xl font-black text-emerald-400">{batchOmrReport.approvalRate}%</div>
                    <div className="text-[11px] text-slate-400">Taxa de Aprovação</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-2xl font-black text-blue-400">{batchOmrReport.highestScore}%</div>
                    <div className="text-[11px] text-slate-400">Maior Nota</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-2xl font-black text-rose-400">{batchOmrReport.lowestScore}%</div>
                    <div className="text-[11px] text-slate-400">Menor Nota</div>
                  </div>
                </div>

                {/* Questões Mais Erradas */}
                {batchOmrReport.hardestQuestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Questões com Maior Índice de Erro (Alerta Docente)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {batchOmrReport.hardestQuestions.map((hq) => (
                        <div
                          key={hq.questionIndex}
                          className="bg-rose-950/20 border border-rose-800/40 p-3 rounded-xl text-xs space-y-1 text-rose-200"
                        >
                          <div className="font-bold flex justify-between">
                            <span>Questão #{hq.questionIndex} ({hq.topicDescription})</span>
                            <span className="text-rose-400 font-mono font-bold">{hq.errorRatePercentage}% Erro</span>
                          </div>
                          <div className="text-[11px] text-rose-300/80">
                            Distrator Mais Marcado: <strong>{hq.mostCommonWrongAnswer}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ESTÚDIO DE LABS & AUTO-GRADING                                     */}
      {/* ========================================================================= */}
      {activeTab === "LABS" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Code className="w-6 h-6 text-emerald-400" />
                  Estúdio de Laboratórios Práticos Guiados com Auto-Grading
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gere desafios práticos com starter code, suíte de testes unitários para validação imediata e dicas escalonadas para evitar bloqueio cognitivo.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGenerateLessonKit}
                  disabled={isGeneratingLesson}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGeneratingLesson ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Gerar Novo Laboratório Prático
                </button>
                {generatedLessonKit && (
                  <button
                    onClick={handleExportLessonKitPdf}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" /> Baixar Roteiro em PDF
                  </button>
                )}
              </div>
            </div>

            {generatedLessonKit?.practicalLab && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Lado Esquerdo: Cenário & Starter Code */}
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      Cenário da Indústria
                    </span>
                    <h3 className="text-sm font-bold text-white">{generatedLessonKit.practicalLab.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {generatedLessonKit.practicalLab.scenarioContext}
                    </p>
                  </div>

                  {/* Starter Code Block */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="font-mono">Starter Code ({generatedLessonKit.practicalLab.starterCode.filename})</span>
                      <span className="text-emerald-400 font-bold text-[11px]">Pronto para os Alunos</span>
                    </div>
                    <pre className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto max-h-72">
                      <code>{generatedLessonKit.practicalLab.starterCode.content}</code>
                    </pre>
                  </div>
                </div>

                {/* Lado Direito: Testes Unitários & Dicas Escalonadas */}
                <div className="space-y-4">
                  {/* Testes de Auto-Grading */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4" /> Testes Unitários Automatizados (Auto-Grading)
                      </span>
                      <span className="text-[11px] text-slate-400">Total: 100 Pts</span>
                    </div>

                    <div className="space-y-2">
                      {generatedLessonKit.practicalLab.unitTests.map((t, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs flex justify-between items-start gap-2"
                        >
                          <div>
                            <div className="font-bold text-white">{t.testName}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">{t.expectedResult}</div>
                          </div>
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                            {t.weight} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dicas Escalonadas */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" /> Sistema de Dicas Escalonadas (Tiered Hints)
                    </span>

                    <div className="space-y-2">
                      {generatedLessonKit.practicalLab.tieredHints.map((h) => {
                        const isRevealed = revealedHintTiers.includes(h.tier);
                        return (
                          <div
                            key={h.tier}
                            className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-amber-300">
                                [Nível {h.tier}] {h.title}
                              </span>
                              <button
                                onClick={() =>
                                  setRevealedHintTiers((prev) =>
                                    isRevealed ? prev.filter((t) => t !== h.tier) : [...prev, h.tier]
                                  )
                                }
                                className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                              >
                                {isRevealed ? "Ocultar" : "Revelar Dica"}
                              </button>
                            </div>
                            {isRevealed && <p className="text-slate-300 text-[11px] pt-1">{h.hintText}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PLANO DE AULA & SLIDES INTERATIVOS                                 */}
      {/* ========================================================================= */}
      {activeTab === "LESSON_PLAN" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel Esquerdo: Cronograma Minuto a Minuto */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-base pb-3 border-b border-slate-800">
              <Clock className="w-5 h-5" /> Roteiro Minuto a Minuto da Aula
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Tema da Aula</label>
                <input
                  type="text"
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Duração Total</label>
                  <select
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none"
                  >
                    <option value={50}>50 Min (1 Aula)</option>
                    <option value={100}>100 Min (2 Aulas)</option>
                    <option value={200}>200 Min (4 Aulas)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Metodologia</label>
                  <select
                    value={lessonMethodology}
                    onChange={(e: any) => setLessonMethodology(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none"
                  >
                    <option value="PBL">PBL (Problemas)</option>
                    <option value="SALA_INVERTIDA">Sala Invertida</option>
                    <option value="PEER_INSTRUCTION">Peer Instruction</option>
                    <option value="GAMIFICACAO">Gamificação</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateLessonKit}
                disabled={isGeneratingLesson}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
              >
                {isGeneratingLesson ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Gerar Plano de Aula Completo
              </button>
            </div>

            {/* Lista das Fases */}
            {generatedLessonKit && (
              <div className="space-y-2.5 pt-2">
                {generatedLessonKit.lessonSchedule.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-blue-400">{item.timeBlock}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {item.phase}
                      </span>
                    </div>
                    <div className="font-bold text-white">{item.title}</div>
                    <p className="text-[11px] text-slate-400">
                      <strong>Ação Docente:</strong> {item.teacherActions}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Painel Direito: Projeção de Slides Interativos */}
          <div className="lg:col-span-2 space-y-4">
            {generatedLessonKit?.interactiveSlides && generatedLessonKit.interactiveSlides.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">
                      Projeção em Sala: Slide {activeSlideIndex + 1} de {generatedLessonKit.interactiveSlides.length}
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                      disabled={activeSlideIndex === 0}
                      className="px-3 py-1 bg-slate-800 text-xs rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() =>
                        setActiveSlideIndex((prev) =>
                          Math.min(generatedLessonKit.interactiveSlides.length - 1, prev + 1)
                        )
                      }
                      disabled={activeSlideIndex === generatedLessonKit.interactiveSlides.length - 1}
                      className="px-3 py-1 bg-blue-600 text-xs rounded-lg text-white font-bold hover:bg-blue-500 disabled:opacity-40"
                    >
                      Próximo
                    </button>
                  </div>
                </div>

                {/* Slide Card */}
                {(() => {
                  const currentSlide = generatedLessonKit.interactiveSlides[activeSlideIndex];
                  return (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 min-h-[300px] flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="bg-blue-900/60 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {currentSlide.type}
                        </span>
                        <h2 className="text-xl font-extrabold text-white">{currentSlide.title}</h2>

                        <ul className="space-y-2 pt-2">
                          {currentSlide.bullets.map((b, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>

                        {currentSlide.codeBlock && (
                          <pre className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">
                            <code>{currentSlide.codeBlock.snippet}</code>
                          </pre>
                        )}

                        {/* Quick Poll Interativo */}
                        {currentSlide.interactivePoll && (
                          <div className="bg-indigo-950/30 border border-indigo-700/40 p-4 rounded-xl space-y-3 mt-4">
                            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                              {currentSlide.interactivePoll.question}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {currentSlide.interactivePoll.options.map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => setSelectedPollAnswer(opt.id)}
                                  className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                                    selectedPollAnswer === opt.id
                                      ? opt.isCorrect
                                        ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                                        : "bg-rose-950/60 border-rose-500 text-rose-200"
                                      : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                                  }`}
                                >
                                  <strong>({opt.id})</strong> {opt.text}
                                </button>
                              ))}
                            </div>
                            {selectedPollAnswer && (
                              <p className="text-xs text-amber-300 pt-1">
                                {currentSlide.interactivePoll.revealExplanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Notas do Professor */}
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                        <strong className="text-amber-400">Notas do Docente: </strong>
                        {currentSlide.speakerNotesForTeacher}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto animate-pulse" />
                <h3 className="text-lg font-bold text-slate-300">Nenhum plano de aula ativo</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Clique no botão à esquerda para gerar o cronograma completo com slides e dinâmicas de sala de aula.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

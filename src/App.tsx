import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from 'sonner';
import Sidebar from "./components/layout/Sidebar";
import GeneratorView from "./components/GeneratorView";
import ActivityBankView from "./components/ActivityBankView";
import CompetencyMapView from "./components/CompetencyMapView";
import ReportsInterventionsView from "./components/ReportsInterventionsView";
import AIAssistantView from "./components/AIAssistantView";
import AutomationActionCenterView from "./components/AutomationActionCenterView";
import TeacherCommandCenterView from "./components/TeacherCommandCenterView";
import SmartClassDiaryView from "./components/SmartClassDiaryView";
import CompetenciesManagerView from "./components/CompetenciesManagerView";
import DashboardView from "./components/DashboardView";
import PlanejamentoView from "./components/PlanejamentoView";
import TurmasView from "./components/TurmasView";
import { ClassManagerView } from "./components/ClassManagerView";
import { StudentsManagerView } from "./components/StudentsManagerView";
import AvaliacoesView from "./components/AvaliacoesView";
import RecuperacaoView from "./components/RecuperacaoView";
import MateriaisView from "./components/MateriaisView";
import PedagogicalDashboard from "./components/dashboard/PedagogicalDashboard";
import BatchCorrectionView from "./components/BatchCorrectionView";
import SimilarityView from "./components/SimilarityView";
import EducationalAnalyticsView from "./components/EducationalAnalyticsView";
import QuestionBankView from "./components/QuestionBankView";
import SmartLabsView from "./components/SmartLabsView";
import PedagogicalTracksView from "./components/PedagogicalTracksView";
import ResourceLibraryView from "./components/ResourceLibraryView";
import ReportsView from "./components/ReportsView";
import HelpCenterView from "./components/HelpCenterView";
import SystemHealthView from "./components/SystemHealthView";
import { 
  Play, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Clock, 
  Activity, 
  Layers, 
  Award,
  ChevronRight,
  Code2,
  FileText,
  UploadCloud,
  Sparkles,
  BookOpen,
  LineChart,
  BarChart3,
  Download,
  Briefcase,
  Bell,
  Eye,
  EyeOff,
  Sun,
  Moon
} from "lucide-react";
import { TestCase, CorrectionResult, SubmissionLog } from "./types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const CODE_TEMPLATES: Record<string, string> = {
  python: `a, b = map(int, input().split())
print(a + b)`,
  javascript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(" ").map(Number);
console.log(input[0] + input[1]);`,
  typescript: `import * as fs from "fs";
const input = fs.readFileSync(0, "utf8").trim().split(" ").map(Number);
console.log(input[0] + input[1]);`,
  java: `import java.util.*;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(String);
    int a = sc.nextInt();
    int b = sc.nextInt();
    System.out.println(a + b);
  }
}`,
  c: `#include <stdio.h>

int main() {
  int a, b;
  scanf("%d %d", &a, &b);
  printf("%d\\n", a + b);
  return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
  int a, b;
  cin >> a >> b;
  cout << a + b << endl;
  return 0;
}`,
  csharp: `using System;

class Program {
  static void Main() {
    string[] tokens = Console.ReadLine().Split(' ');
    int a = int.Parse(tokens[0]);
    int b = int.Parse(tokens[1]);
    Console.WriteLine(a + b);
  }
}`,
  php: `<?php
$tokens = explode(" ", trim(fgets(STDIN)));
echo intval($tokens[0]) + intval($tokens[1]) . "\\n";`,
  go: `package main
import (
  "fmt"
  "os"
)

func main() {
  var a, b int
  fmt.Fscan(os.Stdin, &a, &b)
  fmt.Println(a + b)
}`,
  rust: `use std::io;

fn main() {
  let mut input = String::new();
  io::stdin().read_line(&mut input).unwrap();
  let parts: Vec<i32> = input.trim().split_whitespace().map(|s| s.parse().unwrap()).collect();
  println!("{}", parts[0] + parts[1]);
}`,
  kotlin: `import java.util.Scanner

fn main() {
  val sc = Scanner(System.\`in\`)
  val a = sc.nextInt()
  val b = sc.nextInt()
  println(a + b)
}`,
  sql: `CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(50), age INT);
INSERT INTO employees VALUES (1, 'Alice', 25);
INSERT INTO employees VALUES (2, 'Bob', 32);
SELECT name, age FROM employees WHERE age > 30;`,
  portugol: `programa {
  funcao inicio() {
    inteiro a, b, resultado
    leia(a)
    leia(b)
    resultado = a + b
    escreva(resultado)
  }
}`,
  pseudocode: `Algoritmo SomaValores
Var
  a, b, resultado : inteiro
Inicio
  leia(a)
  leia(b)
  resultado <- a + b
  escreva(resultado)
Fimalgoritmo`
};

// Target execution values
const INITIAL_TEST_CASES: TestCase[] = [
  { input: "2 3", expected_output: "5" }
];

export default function App() {
  const [currentTab, setTab] = useState<string>("dashboard");
  const [selectedCorrectorClass, setSelectedCorrectorClass] = useState<string>('');
  const [selectedCorrectorStudent, setSelectedCorrectorStudent] = useState<string>('');
  const [showCorrectorStudentWarning, setShowCorrectorStudentWarning] = useState<boolean>(false);
  const [correctorClasses, setCorrectorClasses] = useState<any[]>([]);
  const [correctorStudents, setCorrectorStudents] = useState<any[]>([]);
  const [correctorActivities, setCorrectorActivities] = useState<any[]>([]);
  const [selectedCorrectorActivity, setSelectedCorrectorActivity] = useState<string>('');
  const [productivityFocused, setProductivityFocused] = useState<boolean>(() => {
    try {
      return localStorage.getItem("codecheck_productivity_focused") === "true";
    } catch {
      return false;
    }
  });
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(CODE_TEMPLATES["python"]);
  const [testCases, setTestCases] = useState<TestCase[]>(INITIAL_TEST_CASES);
  
  // Correction responses
  const [correcting, setCorrecting] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<string>("idle");
  const [result, setResult] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionLog[]>([]);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  // Teacher portal state variables
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [healthData, setHealthData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState<boolean>(false);

  // Custom weights setup (Priority 3: Rubricas Pedagógicas)
  const [rubricWeights, setRubricWeights] = useState({
    syntax_weight: 30,
    tests_weight: 50,
    quality_weight: 20
  });

  // Question Creation State
  const [newQuestionForm, setNewQuestionForm] = useState({
    title: "",
    description: "",
    language: "python",
    difficulty: "Iniciante",
    starter_code: "",
    input_test_1: "",
    output_test_1: "",
    input_test_2: "",
    output_test_2: ""
  });

  // CodeCheck AI System Evolutionary State Hooks
  const [featureFlags, setFeatureFlags] = useState({
    ENABLE_RUBRIC_CORRECTION: true,
    ENABLE_AI_FEEDBACK: true,
    ENABLE_CLASS_ERROR_DASHBOARD: true,
    ENABLE_STUDENT_EVOLUTION: true,
    ENABLE_ACTIVITY_GENERATOR: true,
    ENABLE_AI_TEST_CASES: true,
    ENABLE_ACTIVITY_BANK: true,
    ENABLE_SANDBOX_EXECUTOR: true,
    ENABLE_MULTILANGUAGE_GRADING: true,
    ENABLE_EXECUTION_AUDIT_LOGS: true,
    ENABLE_QUESTION_BANK: true,
    ENABLE_COMPETENCY_TAGGING: true,
    ENABLE_LEARNING_PATHS: true,
    ENABLE_AI_QUESTION_SUGGESTIONS: true,
    ENABLE_TEACHER_REPORTS: true,
    ENABLE_AI_PEDAGOGICAL_OPINION: true,
    ENABLE_INTERVENTION_PLAN: true,
    ENABLE_COORDINATOR_DASHBOARD: true,
    ENABLE_CLASS_ANALYTICS: true,
    ENABLE_STUDENT_ANALYTICS: true,
    ENABLE_PDF_EXPORT: true,
    ENABLE_TEACHER_AI_ASSISTANT: true,
    ENABLE_AI_LESSON_PLANNER: true,
    ENABLE_AI_ACTIVITY_BUILDER: true,
    ENABLE_AI_RECOVERY_PLAN: true,
    ENABLE_AI_RUBRIC_BUILDER: true,
    ENABLE_AI_SIMULATED_EXAMS: true,
    ENABLE_AI_CLASS_DIAGNOSIS: true,
    ENABLE_AI_STUDENT_RECOMMENDATIONS: true,
    ENABLE_PEDAGOGICAL_AUTOMATION: true,
    ENABLE_STUDENT_NOTIFICATIONS: false, // Disabled for teacher productivity focus
    ENABLE_RECOVERY_AUTOMATION: true,
    ENABLE_DEADLINE_REMINDERS: true,
    ENABLE_EMAIL_COMMUNICATION: true,
    ENABLE_IN_APP_ALERTS: true,
    ENABLE_TEACHER_ACTION_CENTER: true,
    ENABLE_TEACHER_COMMAND_CENTER: true,
    ENABLE_BULK_OPERATIONS: true,
    ENABLE_TEACHER_TEMPLATES: true,
    ENABLE_QUICK_FEEDBACK: true,
    ENABLE_CLASS_COMPARISON: true,
    ENABLE_WEEKLY_PLANNER: true,
    ENABLE_RECOVERY_WORKBENCH: true,
    ENABLE_COORDINATION_REPORTS: true,
    ENABLE_TEACHER_PRODUCTIVITY_ANALYTICS: true,
    // FASE 2: Controlled teacher-centric complexity isolation
    ENABLE_STUDENT_PORTAL: false,
    ENABLE_STUDENT_DASHBOARD: false,
    ENABLE_STUDENT_MISSIONS: false,
    ENABLE_STUDENT_GAMIFICATION: false,
    ENABLE_STUDENT_RANKING: false,
    ENABLE_STUDENT_BADGES: false,
    ENABLE_STUDENT_SOCIAL_FEATURES: false,
    ENABLE_STUDENT_ACHIEVEMENTS: false
  });

  const [lintSettings, setLintSettings] = useState({
    requireComments: true,
    requireIndentation: true,
    maxLinesLimit: 80,
    requireNoSingleLetterVars: true,
    requireFunctions: false
  });

  const [analyticsSubTab, setAnalyticsSubTab] = useState<"general" | "errors" | "student" | "competencies" | "comparison" | "pedagogical">("general");
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("Vinícius Souza");
  const [studentEvolutionData, setStudentEvolutionData] = useState<any>(null);
  const [classErrorData, setClassErrorData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loadingClassErrors, setLoadingClassErrors] = useState(false);
  const [loadingStudentPromo, setLoadingStudentPromo] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [classA, setClassA] = useState("");
  const [classB, setClassB] = useState("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sandboxStatus, setSandboxStatus] = useState<any>(null);

  // Fetch audit logs helper (Regras de auditoria)
  const fetchAuditLogs = () => {
    fetch("/api/audit-logs")
      .then(res => res.json())
      .then(data => setAuditLogs(data))
      .catch(e => console.error("Error loading audits:", e));
  };

  const fetchSandboxStatus = () => {
    fetch("/api/execution/status")
      .then(res => res.json())
      .then(data => setSandboxStatus(data))
      .catch(e => console.error("Error loading sandbox status:", e));
  };

  const handleCompareClasses = async () => {
    if (!classA || !classB) {
      toast.error("Por favor, informe o nome das duas turmas.");
      return;
    }

    setLoadingComparison(true);
    try {
      const resA = await fetch(`/api/analytics/class-average?name=${encodeURIComponent(classA)}`);
      const dataA = await resA.json();
      
      const resB = await fetch(`/api/analytics/class-average?name=${encodeURIComponent(classB)}`);
      const dataB = await resB.json();

      setComparisonData([
        { name: dataA.className || classA, media: dataA.average },
        { name: dataB.className || classB, media: dataB.average }
      ]);
    } catch (e) {
      console.error("Error comparing classes:", e);
      toast.error("Erro ao carregar dados comparativos.");
    } finally {
      setLoadingComparison(false);
    }
  };

  // Fetch system health telemetry
  const fetchHealthStatus = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/health-status");
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          const data = await res.json();
          setHealthData(data);
        } else {
          console.warn("[App] Received non-JSON status response during server standby/startup");
        }
      }
    } catch (err) {
      console.error("Error fetching health metrics", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  // Fetch teaching questions bank
  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/questions");
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          const data = await res.json();
          setQuestions(data);
        }
      }
    } catch (err) {
      console.error("Error fetching question bank", err);
    }
  };

  // Fetch pedagogical dashboard statistics
  const fetchTeacherAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/teacher-analytics");
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          const data = await res.json();
          setAnalyticsData(data);
        } else {
          console.warn("[App] Received non-JSON analytics response during server standby/startup");
        }
      }
    } catch (err) {
      console.error("Error loading panel analytics", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch comparison analytics
  const fetchComparisonAnalytics = async () => {
    setLoadingComparison(true);
    try {
      const res = await fetch("/api/class-comparison-analytics");
      if (res.ok) {
        const data = await res.json();
        setComparisonData(data);
        if (data.length >= 2) {
          if (!classA) setClassA(data[0].class_name);
          if (!classB) setClassB(data[1].class_name);
        }
      }
    } catch (err) {
      console.error("Error loading comparison analytics", err);
    } finally {
      setLoadingComparison(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchSandboxStatus();
    
    // Fetch initial feature flags and linting settings
    fetch("/api/feature-flags")
      .then(res => res.json())
      .then(data => setFeatureFlags(data))
      .catch(e => console.error("Error loading features:", e));

    fetch("/api/settings/linting")
      .then(res => res.json())
      .then(data => setLintSettings(data))
      .catch(e => console.error("Error loading linting settings:", e));
  }, []);

  useEffect(() => {
    if (currentTab === "health") {
      fetchHealthStatus();
    } else if (currentTab === "analytics") {
      fetchTeacherAnalytics();

      if (analyticsSubTab === "comparison") {
        fetchComparisonAnalytics();
      }

      if (analyticsSubTab === "errors" && !featureFlags.ENABLE_CLASS_ERROR_DASHBOARD) {
        setAnalyticsSubTab("general");
      }
      if (analyticsSubTab === "student" && !featureFlags.ENABLE_STUDENT_EVOLUTION) {
        setAnalyticsSubTab("general");
      }
      if (analyticsSubTab === "competencies" && !featureFlags.ENABLE_COMPETENCY_TAGGING) {
        setAnalyticsSubTab("general");
      }

      // Fetch Class error analytics
      if (featureFlags.ENABLE_CLASS_ERROR_DASHBOARD) {
        setLoadingClassErrors(true);
        fetch("/api/class-error-analytics")
          .then(res => res.json())
          .then(data => {
            setClassErrorData(data);
            setLoadingClassErrors(false);
          })
          .catch(e => {
            console.error("Error loading class error analytics:", e);
            setLoadingClassErrors(false);
          });
      }
    }
  }, [currentTab, featureFlags.ENABLE_CLASS_ERROR_DASHBOARD]);

  useEffect(() => {
    if ((currentTab === "analytics" && featureFlags.ENABLE_STUDENT_EVOLUTION) && selectedStudent) {
      setLoadingStudentPromo(true);
      fetch(`/api/student-evolution?studentName=${encodeURIComponent(selectedStudent)}`)
        .then(res => res.json())
        .then(data => {
          setStudentEvolutionData(data);
          setLoadingStudentPromo(false);
        })
        .catch(e => {
          console.error("Error loading student evolution data:", e);
          setLoadingStudentPromo(false);
        });
    }
  }, [currentTab, selectedStudent, featureFlags.ENABLE_STUDENT_EVOLUTION]);

  // States for Image-Based OCR and AI Correction
  const [editorInputMode, setEditorInputMode] = useState<"text" | "image">("text");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [visualOcrNotes, setVisualOcrNotes] = useState<string | null>(null);
  const [ocrLoadedBanner, setOcrLoadedBanner] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [roiImage, setRoiImage] = useState<string | null>(null);

  // Dynamic settings save & feature flag toggle dispatchers
  const handleSaveLintSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings/linting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lintSettings)
      });
      if (res.ok) {
        alert("Configurações de Codestyle e Linting da Turma salvas com sucesso!");
        fetchAuditLogs();
      } else {
        alert("Erro detectado ao salvar configurações.");
      }
    } catch (e: any) {
      console.error("Error saving settings:", e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleFeature = async (flagName: string, val: boolean) => {
    const updatedFlags = { ...featureFlags, [flagName]: val };
    setFeatureFlags(updatedFlags);
    try {
      await fetch("/api/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFlags)
      });
      fetchAuditLogs();
    } catch (e: any) {
      console.error("Error saving feature flag state:", e.message);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, envie apenas arquivos de imagem (PNG, JPG, JPEG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);

      // Algoritmo de Visão Computacional Cliente - Detecção de ROI (Cabeçalho com Nome)
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const width = img.width;
          const height = img.height;
          // Crop focado na parte superior da prova (22% da altura), onde o padrão 'Nome'/'Aluno' sempre reside
          const cropHeight = height * 0.22;
          canvas.width = width;
          canvas.height = cropHeight;
          ctx.drawImage(img, 0, 0, width, cropHeight, 0, 0, width, cropHeight);
          try {
            const croppedBase64 = canvas.toDataURL("image/jpeg", 0.85);
            setRoiImage(croppedBase64);
          } catch (e) {
            console.warn("[ComputerVision] Falha ao processar canvas ROI no navegador:", e);
          }
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    document.getElementById("image-file-input")?.click();
  };

  const handleTranscribeImage = async () => {
    if (!selectedImage) return;
    setTranscribing(true);
    setVisualOcrNotes(null);
    setStudentName(null);
    try {
      const response = await fetch("/corrections/transcribe-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: selectedImage,
          roiImage: roiImage, // Passamos a ROI pré-calculada pelo navegador!
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCode(data.text || data.transcribedCode || '');
          
          if (data.ai_analysis_available === false) {
             setVisualOcrNotes('Texto extraído com sucesso. A análise com IA está temporariamente indisponível.');
             setStudentName('');
          } else {
             setVisualOcrNotes(data.visualOcrNotes);
             setStudentName(data.studentName);
          }
          
          setEditorInputMode("text"); // auto-switch to view editor
          setOcrLoadedBanner(true);
          setTimeout(() => setOcrLoadedBanner(false), 8000);
        } else {
          alert(`Falha no processamento: ${data.error || "Erro misterioso."}`);
        }
      } else {
        const errObj = await response.json().catch(() => ({}));
        alert(`Erro na transcrição: ${errObj.error || "Erro desconhecido do servidor."}`);
      }
    } catch (err: any) {
      alert(`Erro na comunicação com o servidor: ${err.message}`);
    } finally {
      setTranscribing(false);
    }
  };

  // Sync sample when language changes
  useEffect(() => {
    if (CODE_TEMPLATES[language]) {
      setCode(CODE_TEMPLATES[language]);
    }
    // Set specific test matching SQLite select
    if (language === "sql") {
      setTestCases([{ input: "", expected_output: "Bob 32" }]);
    } else {
      setTestCases(INITIAL_TEST_CASES);
    }
  }, [language]);

  // Fetch histories on mount/tab swap
  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          const data = await res.json();
          setSubmissions(data);
          setDbConnected(true);
        }
      }
    } catch (err) {
      console.warn("DB offline fallback reading active", err);
      setDbConnected(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 10000);
    return () => clearInterval(interval);
  }, []);

  // Synchronously fetch classes when the user enters the corrector tab
  useEffect(() => {
    if (currentTab === "corrector") {
      fetch("/api/classes")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCorrectorClasses(data);
          }
        })
        .catch(err => console.error("Error loading corrector classes:", err));
    }
  }, [currentTab]);

  // Synchronously fetch students and activities for the selected corrector class
  useEffect(() => {
    if (selectedCorrectorClass) {
      // 1. Fetch Students of this class
      fetch(`/api/students?class_id=${selectedCorrectorClass}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCorrectorStudents(data);
          }
        })
        .catch(err => console.error("Error loading corrector students:", err));

      // 2. Fetch Activities for this class
      fetch("/api/activities")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const filtered = data.filter((a: any) => a.class_id === selectedCorrectorClass);
            setCorrectorActivities(filtered);
          }
        })
        .catch(err => console.error("Error loading activities:", err));
    } else {
      setCorrectorStudents([]);
      setCorrectorActivities([]);
      setSelectedCorrectorStudent("");
      setSelectedCorrectorActivity("");
    }
  }, [selectedCorrectorClass]);

  // Helper to construct historical performance data from actual database/in-memory records
  const getSubmissionsHistory = () => {
    const valid = submissions
      .filter(s => s && s.result && s.submission && typeof s.result.final_score === "number")
      .slice(0, 10)
      .reverse();

    if (valid.length === 0) {
      return [
        { name: "Envio 1", nota: 65, linguagem: "PYTHON", data: "01/06 10:15", testes: "3/5" },
        { name: "Envio 2", nota: 50, linguagem: "SQL", data: "01/06 11:00", testes: "2/5" },
        { name: "Envio 3", nota: 75, linguagem: "JAVASCRIPT", data: "02/06 09:30", testes: "4/5" },
        { name: "Envio 4", nota: 83, linguagem: "PYTHON", data: "02/06 10:45", testes: "4/5" },
        { name: "Envio 5", nota: 68, linguagem: "TYPESCRIPT", data: "03/06 14:22", testes: "3/5" },
        { name: "Envio 6", nota: 90, linguagem: "PYTHON", data: "04/06 15:40", testes: "5/5" },
        { name: "Envio 7", nota: 72, linguagem: "SQL", data: "05/06 08:30", testes: "3/5" },
        { name: "Envio 8", nota: 88, linguagem: "PYTHON", data: "05/06 11:12", testes: "5/5" },
        { name: "Envio 9", nota: 95, linguagem: "JAVASCRIPT", data: "06/06 09:05", testes: "5/5" },
        { name: "Envio 10", nota: 100, linguagem: "TYPESCRIPT", data: "06/06 10:00", testes: "5/5" }
      ];
    }

    return valid.map((s, index) => {
      const d = new Date(s.submission.created_at || new Date());
      const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return {
        name: s.submission.student_name || `Envio ${submissions.length - valid.length + index + 1}`,
        nota: s.result.final_score,
        linguagem: (s.submission.language || "N/A").toUpperCase(),
        data: `${dateStr} ${timeStr}`,
        testes: `${s.result.tests_passed || 0}/${s.result.total_tests || 0}`
      };
    });
  };

  // Dispatch run code
  const handleRunCorrection = async () => {
    if (!selectedCorrectorClass || !selectedCorrectorStudent) {
      setShowCorrectorStudentWarning(true);
      return;
    }
    setCorrecting(true);
    setResult(null);
    setCurrentStage("security");

    // Simulating progress step transitions for perfect user experience
    const steps = ["security", "tests", "quality", "feedback"];
    let stepIndex = 0;

    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setCurrentStage(steps[stepIndex]);
      }
    }, 600);

    try {
      const response = await fetch("/corrections/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language,
          code,
          test_cases: testCases,
          rubric: rubricWeights,
          studentName: studentName,
          className: correctorClasses.find(c => c.id === selectedCorrectorClass)?.name || null,
          activity_id: selectedCorrectorActivity || null,
          class_id: selectedCorrectorClass || null,
          student_id: selectedCorrectorStudent || null
        })
      });

      clearInterval(progressInterval);

      if (response.ok) {
        setCurrentStage("completed");
        const evalResult = await response.json();
        setResult(evalResult);
        fetchSubmissions(); // reload logs list
      } else {
        const errText = await response.text();
        alert(`Erro ao executar endpoint: ${errText}`);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      alert(`Falha na requisição de rede: ${err.message}`);
    } finally {
      setCorrecting(false);
      setCurrentStage("idle");
    }
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: "", expected_output: "" }]);
  };

  const handleUpdateTestCase = (index: number, field: keyof TestCase, val: string) => {
    const updated = [...testCases];
    updated[index][field] = val;
    setTestCases(updated);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) return;
    setTestCases(testCases.filter((_, idx) => idx !== index));
  };

  const isEnvironmentUnvailable = ["java", "c", "cpp", "csharp", "php", "go", "rust", "kotlin"].includes(language.toLowerCase());

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden text-slate-100 font-sans antialiased">
      {/* Visual Sidebar Layout */}
      <Sidebar currentTab={currentTab} setTab={setTab} dbConnected={dbConnected} featureFlags={featureFlags} />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#070a1a]">
        
        {/* Top bar header */}
        <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-[#040815] relative z-45">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h2 className="text-sm font-bold tracking-tight text-white font-display flex items-center gap-2">
                {(() => {
                  const hr = new Date().getHours();
                  if (hr < 12) {
                    return (
                      <>
                        <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                        <span>Bom dia, Professor Djalma</span>
                      </>
                    );
                  } else if (hr < 18) {
                    return (
                      <>
                        <Sun className="w-4 h-4 text-emerald-400" />
                        <span>Boa tarde, Professor Djalma</span>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <Moon className="w-4 h-4 text-indigo-400 animate-pulse" />
                        <span>Boa noite, Professor Djalma</span>
                      </>
                    );
                  }
                })()}
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">Última conexão: {new Date().toLocaleDateString("pt-BR")}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Modo Produtividade Toggle */}
            <button 
              onClick={() => {
                const newVal = !productivityFocused;
                setProductivityFocused(newVal);
                localStorage.setItem("codecheck_productivity_focused", String(newVal));
              }}
              title={productivityFocused ? "Desativar Modo Foco" : "Ativar Modo Foco (Produtividade)"}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold tracking-tight transition-all uppercase font-mono ${
                productivityFocused
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-md shadow-emerald-500/5 neon-glow-emerald"
                  : "bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-300"
              }`}
            >
              {productivityFocused ? (
                <>
                  <Eye className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>Modo Foco: Ativo</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Modo Foco</span>
                </>
              )}
            </button>

            {/* Notification triggers */}
            <button 
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:text-white transition-all text-slate-400 relative"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            </button>

            <span className="text-xs text-slate-500 font-mono hidden sm:inline">Status Host:</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
        </header>

        {/* MÓDULO 8: Notification Panel Sidebar Draweer */}
        <AnimatePresence>
          {notificationOpen && (
            <>
              {/* overlay mask */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setNotificationOpen(false)}
                className="absolute inset-0 bg-[#030712]/60 backdrop-blur-xs z-40"
              />

              {/* panel slider from right */}
              <motion.div 
                initial={{ opacity: 0, x: 360 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 360 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="absolute right-0 top-0 bottom-0 w-85 bg-[#090e21] border-l border-slate-800 shadow-2xl p-6 z-50 flex flex-col justify-between"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Central de Notificações</h3>
                    </div>
                    <button 
                      onClick={() => setNotificationOpen(false)}
                      className="text-xs font-mono font-bold text-slate-500 hover:text-white uppercase transition-colors"
                    >
                      Fechar
                    </button>
                  </div>

                  {/* notifications items */}
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] scrollbar-thin">
                    <div className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/80 hover:border-emerald-500/20 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">Nova Submissão</span>
                        <span className="text-[9px] text-slate-500 font-mono">há 2 min</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">Aluno Ana Rodrigues Silva enviou Lista 3: Pilhas e Filas.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/80 hover:border-rose-500/20 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-rose-400 font-mono">Risco Crítico</span>
                        <span className="text-[9px] text-slate-500 font-mono">há 10 min</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">O estudante Matheus Pereira apresentou taxa de acerto de 45% nas atividades recentes.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/80 hover:border-amber-500/20 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-amber-400 font-mono">Atividade Vencida</span>
                        <span className="text-[9px] text-slate-500 font-mono">há 1 dia</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">Item "Exploração Prática em SQLite" atingiu o prazo máximo de envios.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/80 hover:border-indigo-500/20 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono">IA Sandbox</span>
                        <span className="text-[9px] text-slate-500 font-mono">há 2 horas</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">As conexões com o interpretador mantiveram latência de 0.01s sob carga média.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-2">
                  <button 
                    onClick={() => setNotificationOpen(false)}
                    className="w-full bg-slate-900 hover:bg-slate-800 transition)all border border-slate-800 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Marcar Todas como Lidas
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* View switching panel */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">

          {currentTab === "dashboard" && (
            <DashboardView onNavigate={(tab) => setTab(tab)} />
          )}

          {currentTab === "planejamento" && (
            <PlanejamentoView />
          )}

          {currentTab === "turmas" && (
            <ClassManagerView />
          )}

          {currentTab === "students" && (
            <StudentsManagerView />
          )}

          {currentTab === "batch" && (
            <BatchCorrectionView />
          )}

          {currentTab === "similarity" && (
            <SimilarityView />
          )}

          {currentTab === "analytics" && (
            <EducationalAnalyticsView />
          )}

          {currentTab === "question_bank" && (
            <QuestionBankView />
          )}
          
          {currentTab === "smart_labs" && (
            <SmartLabsView />
          )}

          {currentTab === "pedagogical_tracks" && (
            <PedagogicalTracksView />
          )}

          {currentTab === "resource_library" && (
            <ResourceLibraryView />
          )}

          {currentTab === "reports" && (
            <ReportsView />
          )}

          {currentTab === "help_center" && (
            <HelpCenterView />
          )}

          {currentTab === "system_health" && (
            <SystemHealthView />
          )}

          {currentTab === "avaliacoes" && (
            <AvaliacoesView />
          )}

          {currentTab === "recuperacao" && (
            <RecuperacaoView />
          )}

          {currentTab === "materiais" && (
            <MateriaisView />
          )}

          {currentTab === "activities" && (
            <div className="flex flex-col gap-8">
              <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-xs font-mono font-bold tracking-widest text-[#10b981] uppercase">Fase 5: Banco de Questões Inteligente</span>
                  <h2 className="text-2xl font-bold tracking-tight text-white font-display">Gerenciador de Atividades e Questões</h2>
                  <p className="text-sm text-slate-400 mt-1">Gere novas atividades com nosso Copiloto IA ou gerencie o acervo institucional cadastrado.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-8">
                <GeneratorView />
                <div className="border-t border-slate-800 pb-2" />
                <ActivityBankView />
              </div>
            </div>
          )}

          {currentTab === "generator" && featureFlags.ENABLE_ACTIVITY_GENERATOR && (
            <GeneratorView />
          )}

          {currentTab === "corrector" && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              
              {/* Header description */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white font-display">Playground de Correção Inteligente</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Insira o código-fonte, selecione a linguagem-alvo correspondente e estipule os casos de verificação de entrada e saída esperados.
                  </p>
                </div>
                
                {/* Sandbox Monitor - Professional UI */}
                <div className="bg-[#0f172a] border border-[#1e295b]/30 rounded-xl px-4 py-2.5 flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Sandbox Core</span>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${sandboxStatus?.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700 animate-pulse'}`} />
                       <span className="text-xs font-bold text-slate-200 capitalize">{sandboxStatus?.status || 'Processando...'}</span>
                    </div>
                  </div>
                  
                  <div className="h-8 w-px bg-slate-800/50" />
                  
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Isolamento</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">SUBPROCESS_JAIL</span>
                  </div>

                  <div className="h-8 w-px bg-slate-800/50" />

                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Engines</span>
                    <div className="flex gap-1.5 mt-0.5">
                       {sandboxStatus?.engines?.python === 'available' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Python 3" />}
                       {sandboxStatus?.engines?.node === 'available' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Node.js" />}
                       {sandboxStatus?.engines?.gcc === 'available' && <span className="w-1.5 h-1.5 rounded-full bg-slate-400" title="GCC/C" />}
                       {sandboxStatus?.engines?.gplusplus === 'available' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="G++/C++" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left panel edit */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Select options */}
                  <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e295b]/30">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Linguagem e Compilador
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-[#070a1a] border border-[#1e295b]/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-200 transition-all cursor-pointer"
                    >
                      <option value="python">Python 3 (Sandbox Ativa)</option>
                      <option value="javascript">JavaScript (Node Sandbox Ativa)</option>
                      <option value="typescript">TypeScript (Compiler e Sandbox Ativa)</option>
                      <option value="sql">SQL (SQLite Relational Emulator)</option>
                      <option value="portugol">Portugol (Análise Estrutural Pedagógica)</option>
                      <option value="pseudocode">Pseudocódigo (Análise Estrutural Pedagógica)</option>
                      <option value="java">Java (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="c">C (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="cpp">C++ (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="csharp">C# (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="php">PHP (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="go">Go (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="rust">Rust (Análise Sintática, Sandbox no Local Indisponível)</option>
                      <option value="kotlin">Kotlin (Análise Sintática, Sandbox no Local Indisponível)</option></select>

                    <div className="mt-4">
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Turma Base</label>
                      <select value={selectedCorrectorClass} onChange={e => { setSelectedCorrectorClass(e.target.value); setShowCorrectorStudentWarning(false); }} className="w-full bg-[#070a1a] border border-[#1e295b]/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-200 transition-all cursor-pointer">
                        <option value="">(Selecione a Turma)</option>
                        {correctorClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {selectedCorrectorClass && (
                      <div className="mt-3">
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Aluno(a)</label>
                        <select 
                          value={selectedCorrectorStudent} 
                          onChange={e => { 
                            const val = e.target.value;
                            setSelectedCorrectorStudent(val); 
                            const st = correctorStudents.find(student => student.id === val);
                            if (st) {
                              setStudentName(st.name);
                            } else {
                              setStudentName(null);
                            }
                            setShowCorrectorStudentWarning(false); 
                          }} 
                          className="w-full bg-[#070a1a] border border-[#1e295b]/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-200 transition-all cursor-pointer"
                        >
                          <option value="">Selecione o Aluno...</option>
                          {correctorStudents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    {selectedCorrectorClass && (
                      <div className="mt-3">
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Atividade Vinculada</label>
                        <select 
                          value={selectedCorrectorActivity} 
                          onChange={e => { 
                            const actId = e.target.value;
                            setSelectedCorrectorActivity(actId);
                            const actObj = correctorActivities.find(a => a.id === actId);
                            if (actObj) {
                              if (actObj.language) {
                                setLanguage(actObj.language);
                              }
                            }
                          }} 
                          className="w-full bg-[#070a1a] border border-[#1e295b]/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-200 transition-all cursor-pointer"
                        >
                          <option value="">Instrução Livre (Sem atividade específica)</option>
                          {correctorActivities.map(a => (
                            <option key={a.id} value={a.id}>{a.title} ({a.language?.toUpperCase()})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {showCorrectorStudentWarning && (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>Por favor, para manter o histórico pedagógico e o Analytics funcionando, selecione obrigatoriamente a turma e o aluno da submissão antes de continuar.</div>
                      </div>
                    )}

                    {isEnvironmentUnvailable && (
                      <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Compilador local ausente:</strong> Esta linguagem executará uma análise sintática estrutural de bloco e regras para o scorecard. O executor direto reportará indisponibilidade controlada conforme o contrato.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rubrica Pedagógica Custom Weights Adjusters (Priority 3) */}
                  <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e295b]/30 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[#1e295b]/20 pb-2">
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                        Pesos da Rubrica Didática
                      </label>
                      <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/20 font-bold">Customizável</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      
                      {/* Syntax Weight */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-mono text-slate-300">
                          <span>Sintaxe & Compilação:</span>
                          <span className="font-bold text-white">{rubricWeights.syntax_weight}%</span>
                        </div>
                        <input 
                          type="range" 
                          min={0} 
                          max={100} 
                          className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                          value={rubricWeights.syntax_weight}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const remaining = 100 - val;
                            setRubricWeights({
                              syntax_weight: val,
                              tests_weight: Math.round(remaining * 0.6),
                              quality_weight: Math.round(remaining * 0.4)
                            });
                          }}
                        />
                      </div>

                      {/* Tests Weight */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-mono text-slate-300">
                          <span>Casos de Testes:</span>
                          <span className="font-bold text-white">{rubricWeights.tests_weight}%</span>
                        </div>
                        <input 
                          type="range" 
                          min={0} 
                          max={100} 
                          className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                          value={rubricWeights.tests_weight}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const remaining = 100 - val;
                            setRubricWeights({
                              tests_weight: val,
                              syntax_weight: Math.round(remaining * 0.6),
                              quality_weight: Math.round(remaining * 0.4)
                            });
                          }}
                        />
                      </div>

                      {/* Quality Weight */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-mono text-slate-300">
                          <span>Qualidade & DRY:</span>
                          <span className="font-bold text-white">{rubricWeights.quality_weight}%</span>
                        </div>
                        <input 
                          type="range" 
                          min={0} 
                          max={100} 
                          className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                          value={rubricWeights.quality_weight}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const remaining = 100 - val;
                            setRubricWeights({
                              quality_weight: val,
                              tests_weight: Math.round(remaining * 0.6),
                              syntax_weight: Math.round(remaining * 0.4)
                            });
                          }}
                        />
                      </div>

                    </div>
                    {/* Sum feedback indicator */}
                    <div className="text-[10px] text-slate-500 font-mono text-center border-t border-[#1e295b]/10 pt-2 flex justify-between items-center">
                      <span>Proporção total da nota:</span>
                      <span className="font-bold text-emerald-400">
                        {rubricWeights.syntax_weight + rubricWeights.tests_weight + rubricWeights.quality_weight}%
                      </span>
                    </div>
                  </div>

                  {/* Code editor */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] shadow-xl overflow-hidden flex flex-col">
                    <div className="px-5 py-3.5 border-b border-[#1e295b]/30 bg-[#161f36] flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono font-bold tracking-wide uppercase text-slate-300">Editor de Código</span>
                      </div>

                      {/* Mode Segmented Controls */}
                      <div className="flex items-center gap-1 bg-[#070a1a] p-1 rounded-xl border border-[#1e295b]/30 self-start sm:self-auto">
                        <button
                          onClick={() => setEditorInputMode("text")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all ${
                            editorInputMode === "text"
                              ? "bg-[#1e295b] text-emerald-400 font-bold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Teclado
                        </button>
                        <button
                          onClick={() => setEditorInputMode("image")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all flex items-center gap-1.5 ${
                            editorInputMode === "image"
                              ? "bg-[#1e295b] text-emerald-400 font-bold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          📸 Corrigir por Imagem
                        </button>
                      </div>
                    </div>

                    {/* Banner for successful extraction */}
                    {ocrLoadedBanner && (
                      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3 flex items-center justify-between text-xs text-emerald-400">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-bounce shrink-0" />
                          <span>Código extraído com sucesso da imagem pelo Gemini Flash! Veja ou ajuste no editor abaixo.</span>
                        </span>
                        <button 
                          onClick={() => setOcrLoadedBanner(false)}
                          className="hover:text-white font-mono"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {editorInputMode === "text" ? (
                      <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck="false"
                        className="w-full h-80 bg-[#070a1a] p-5 font-mono text-sm leading-relaxed text-slate-100 select-all focus:outline-none resize-none cursor-text shadow-inner"
                        placeholder="Escreva ou cole seu código de programação aqui..."
                      />
                    ) : (
                      <div className="p-8 flex flex-col items-center justify-center min-h-[320px] bg-[#070a1a] text-center">
                        <input
                          type="file"
                          id="image-file-input"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {!selectedImage ? (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={triggerFileSelect}
                            className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group select-none min-h-[260px] ${
                              isDragging 
                                ? "border-emerald-400 bg-emerald-500/5 shadow-inner" 
                                : "border-[#1e295b]/60 hover:border-emerald-500/50 bg-[#0b0f24]/50"
                            }`}
                          >
                            <UploadCloud className="w-12 h-12 text-slate-500 mb-3 group-hover:scale-105 transition-transform" />
                            <h4 className="text-sm font-bold text-slate-200">Arraste a foto da prova ou clique aqui</h4>
                            <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                              Suporta fotos manuscritas de alunos ou capturas de tela. O Gemini lerá a caligrafia e organizará o código-fonte automaticamente.
                            </p>
                            <span className="mt-4 text-[10px] text-[#10b981] font-mono bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/10">
                              Alvo de Transpilação: {language.toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full flex flex-col md:flex-row gap-6 items-center">
                            <div className="relative w-full md:w-1/2 rounded-xl overflow-hidden border border-[#1e295b]/40 bg-[#0b0f24] p-2 flex items-center justify-center min-h-[180px] max-h-[260px]">
                              <img
                                src={selectedImage}
                                alt="Preview da avaliação"
                                referrerPolicy="no-referrer"
                                className="max-h-[240px] rounded-lg object-contain w-full"
                              />
                              <button
                                onClick={() => { setSelectedImage(null); setRoiImage(null); }}
                                className="absolute top-4 right-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-2 shadow-lg transition-colors"
                                title="Remover imagem"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="w-full md:w-1/2 flex flex-col gap-4 text-left">
                              <div>
                                <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                  Foto Carregada
                                </span>
                                <h4 className="text-base font-bold text-white mt-1.5">Imagem pronta para transcrição</h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  Nós usaremos o LLM multimodal para transcrever este código na linguagem <strong>{language.toUpperCase()}</strong>.
                                </p>
                              </div>

                              {roiImage && (
                                <div className="border border-emerald-500/10 bg-[#0d1527] rounded-lg p-3 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                                      ROI Cabeçalho Detectada
                                    </span>
                                    <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Foco: Topo 22%</span>
                                  </div>
                                  <div className="relative h-14 w-full rounded border border-emerald-500/20 overflow-hidden bg-slate-950 flex items-center justify-center">
                                    <img src={roiImage} className="w-full h-full object-cover opacity-75" alt="ROI Cabeçalho" />
                                    <div className="absolute inset-x-0 h-0.5 bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                  </div>
                                  <p className="text-[9px] text-slate-400 leading-normal">
                                    Análise estrutural isolou o campo do estudante para aumentar precisão e reduzir custo computacional da chamada de IA multimodal.
                                  </p>
                                </div>
                              )}

                              <button
                                onClick={handleTranscribeImage}
                                disabled={transcribing}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 font-bold text-xs font-mono tracking-wider text-white shadow-xl shadow-teal-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {transcribing ? (
                                  <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    <span>CONVERSANDO COM O GEMINI IA...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4.5 h-4.5 text-emerald-300" />
                                    <span>TRANSCREVER & CARREGAR</span>
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => { setSelectedImage(null); setRoiImage(null); }}
                                className="text-xs text-slate-500 hover:text-slate-300 text-center font-semibold transition-colors mt-1"
                              >
                                Escolher outra prova...
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Visual Quality Review from OCR */}
                  {(visualOcrNotes || studentName) && (
                    <div className="p-5 rounded-2xl bg-teal-950/10 border border-teal-500/20 text-xs text-slate-300">
                      {studentName && (
                        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
                          <span className="text-emerald-400 font-bold uppercase tracking-widest font-mono text-[10px]">Nome Identificado na Prova</span>
                          <span className="text-white font-semibold text-sm">{studentName}</span>
                        </div>
                      )}

                      {visualOcrNotes && (
                        <>
                          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest font-mono text-[10px] mb-1.5">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            Relatório Visual e Caligrafia (Gemini Flash OCR)
                          </div>
                          <p className="italic leading-relaxed text-slate-200">"{visualOcrNotes}"</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Test Cases Panel */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-300">Casos de Teste (Inputs / Outputs)</h3>
                      </div>
                      <button
                        onClick={handleAddTestCase}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold tracking-wide transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        NOVO CASO
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {testCases.map((tc, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-[#070a1a] p-3 rounded-xl border border-[#1e295b]/20 relative group">
                          <span className="text-[10px] font-mono text-slate-500 font-bold select-none w-5">#{idx + 1}</span>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-mono mb-1">Entrada (Input)</label>
                              <input
                                type="text"
                                value={tc.input}
                                onChange={(e) => handleUpdateTestCase(idx, "input", e.target.value)}
                                placeholder="ex. 2 3"
                                className="w-full bg-[#0f172a] border border-[#1e295b]/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-mono mb-1">Saída Esperada (Expected)</label>
                              <input
                                type="text"
                                value={tc.expected_output}
                                onChange={(e) => handleUpdateTestCase(idx, "expected_output", e.target.value)}
                                placeholder="ex. 5"
                                className="w-full bg-[#0f172a] border border-[#1e295b]/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                              />
                            </div>
                          </div>
                          {testCases.length > 1 && (
                            <button
                              onClick={() => handleRemoveTestCase(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition-colors"
                              title="Remover caso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Run Trigger */}
                    <button
                      onClick={handleRunCorrection}
                      disabled={correcting}
                      className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-white shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      {correcting ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>PROCESSANDO CORREÇÃO AUTOMÁTICA...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-current" />
                          <span>DISPARAR AVALIAÇÃO DE CÓDIGO</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right panel result outputs */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                  
                  {/* Title */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 min-h-[400px] flex flex-col justify-between">
                    
                    <div>
                      <div className="flex items-center gap-2 border-b border-[#1e295b]/30 pb-4 mb-5">
                        <Terminal className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold tracking-tight text-white font-display">Resultados da Correção</h3>
                      </div>

                      {result ? (
                        <div className="flex flex-col gap-5">
                          
                          {/* Score widget */}
                          <div className="p-5 rounded-xl bg-[#030712] border border-[#1e295b]/30 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-500/5 relative shrink-0">
                              <span className="text-xl font-black text-emerald-400 font-mono">{result.final_score}</span>
                            </div>
                            <div>
                              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Nota Definida</div>
                              <h4 className="text-base font-bold text-white mt-0.5">
                                {result.final_score === 100 ? "Excelente Trabalho!" : result.final_score >= 70 ? "Comporta Aprovado" : "Precisa Ajuste"}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Sintaxe: 30pts / Testes: 50pts / Qualidade: 20pts</p>
                            </div>
                          </div>

                          {/* Quick details logs */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs px-1">
                              <span className="text-slate-400">Verificação Sintaxe</span>
                              <span className={`font-mono font-bold ${result.syntax_ok ? "text-emerald-400" : "text-rose-400"}`}>
                                {result.syntax_ok ? "✓ SINTAXE OK" : "✗ ERRO DE COMPILAÇÃO/SINTAXE"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs px-1">
                              <span className="text-slate-400">Validação Testes Casos</span>
                              <span className="font-mono text-slate-200">
                                {result.tests_passed} / {result.total_tests} aprovados
                              </span>
                            </div>
                          </div>

                          {/* Stdout Console */}
                          <div className="flex flex-col gap-1.5 mt-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-1">Console Standard Output (stdout)</span>
                            <pre className="p-3.5 rounded-lg bg-[#030712] font-mono text-xs text-slate-300 border border-[#1e295b]/20 min-h-[50px] max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                              {result.stdout || <span className="text-slate-600 italic">// Ausência de output</span>}
                            </pre>
                          </div>

                          {/* Stderr Console */}
                          {result.stderr && (
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest px-1">Compilação Error Log (stderr)</span>
                              <pre className="p-3.5 rounded-lg bg-rose-950/20 font-mono text-xs text-rose-300 border border-rose-500/20 whitespace-pre-wrap select-all">
                                {result.stderr}
                              </pre>
                            </div>
                          )}

                          {/* Pedagogic Feedback */}
                          <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-xs leading-relaxed text-slate-300 mt-2">
                            <div className="flex items-center gap-1.5 mb-1.5 text-emerald-400 font-bold uppercase tracking-wider font-mono text-[10px]">
                              <Award className="w-4 h-4" />
                              Feedback Pedagógico Pró
                            </div>
                            <p className="whitespace-pre-line">{result.feedback}</p>
                          </div>

                          {/* PRIORITY 5: Competencies Breakdown Card */}
                          {result.competencies && (
                            <div className="p-5 rounded-xl bg-[#030712] border border-[#1e295b]/30 flex flex-col gap-3">
                              <div className="flex items-center justify-between border-b border-[#1e295b]/20 pb-2">
                                <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#a5f3fc]">Desempenho por Competência Técnica (SENAI)</h4>
                                <span className="text-[10px] bg-[#1e293b] text-cyan-400 px-2 py-0.5 rounded font-mono">SAEP Alinhado</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                  { label: "Variáveis & Tipagem", val: result.competencies.variables },
                                  { label: "Estruturas Condicionais", val: result.competencies.conditionals },
                                  { label: "Laços de Repetição", val: result.competencies.loops },
                                  { label: "Funções & Métodos", val: result.competencies.functions },
                                  { label: "Vetores / Vetores Dinâmicos", val: result.competencies.arrays }
                                ].map((skill, sIdx) => (
                                  <div key={sIdx} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-300">{skill.label}</span>
                                      <span className="font-mono font-bold text-slate-200">{skill.val}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#172554] rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${
                                          skill.val >= 70 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : skill.val >= 40 ? "bg-amber-400" : "bg-rose-500"
                                        }`}
                                        style={{ width: `${skill.val}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* PRIORITY 6: IA Code Generation Probability Shield */}
                          {result.ai_detection && (
                            <div className={`p-4 rounded-xl border ${
                              result.ai_detection.probability === "HIGH" 
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                                : result.ai_detection.probability === "MEDIUM"
                                  ? "bg-amber-500/5 border-amber-500/15 text-slate-300"
                                  : "bg-emerald-500/5 border-emerald-500/15 text-slate-300"
                            } text-xs leading-relaxed`}>
                              <div className="flex items-center justify-between gap-2 mb-2 font-mono">
                                <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4 text-amber-400" />
                                  Detecção de código sintético por IA
                                </span>
                                <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                  result.ai_detection.probability === "HIGH" 
                                    ? "bg-amber-500/20 text-amber-300" 
                                    : result.ai_detection.probability === "MEDIUM"
                                      ? "bg-amber-500/10 text-amber-200"
                                      : "bg-emerald-500/20 text-emerald-400"
                                }`}>
                                  NÍVEL {result.ai_detection.probability} ({result.ai_detection.ai_score}%)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 bg-black/30 p-2.5 rounded-lg border border-slate-800/40">
                                {result.ai_detection.justification}
                              </p>
                            </div>
                          )}

                          {/* PRIORITY 2: Secure Sandbox Enclosure metrics */}
                          {result.sandbox_metrics && (
                            <div className="p-4 rounded-xl bg-[#0b0f24] border border-[#1e295b]/30 text-[11px] font-mono grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="flex flex-col">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider">CPU isolada (lim)</span>
                                <span className="font-bold text-slate-200 mt-0.5">{result.sandbox_metrics.cpu_limit_ghz} GHz vCPU</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider">RAM isolante</span>
                                <span className="font-bold text-slate-200 mt-0.5">{result.sandbox_metrics.ram_limit_mb} MB Max</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider">Serviços Rede</span>
                                <span className="font-bold text-rose-400 mt-0.5">{result.sandbox_metrics.network_firewall}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider">Segurança Sandbox</span>
                                <span className="font-bold text-emerald-400 mt-0.5">{result.sandbox_metrics.os_sandbox}</span>
                              </div>
                            </div>
                          )}

                          {/* PRIORITY 3: Rubric-Based Grading scorecard */}
                          {featureFlags.ENABLE_RUBRIC_CORRECTION && result.rubric_criteria && (
                            <div className="p-5 rounded-xl bg-[#030712] border border-[#1e295b]/30 flex flex-col gap-3">
                              <div className="flex items-center justify-between border-b border-[#1e295b]/20 pb-2">
                                <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#a5f3fc]">Critérios de Correção (Rubricas Pedagógicas)</h4>
                                <span className="text-[10px] bg-[#1e293b] text-emerald-400 px-2 py-0.5 rounded font-mono">Correção Automática</span>
                              </div>
                              <div className="flex flex-col gap-3">
                                {result.rubric_criteria.map((rc: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-[#0f172a]/40 border border-[#1e295b]/10 rounded-lg flex flex-col gap-1.5 hover:border-[#1e295b]/30 transition-all">
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-200">{rc.nome || rc.criterion_name}</span>
                                        <span className="text-[10px] text-slate-400">{rc.descricao || rc.description}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                                          rc.status === 'Excelente' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                                          rc.status === 'Aprovado' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' :
                                          'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                        }`}>
                                          {rc.status}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-white shrink-0 bg-[#1e293b] px-2 py-0.5 rounded">
                                          {(rc.nota_obtida !== undefined ? rc.nota_obtida : rc.score_obtained) ?? 0} / {(rc.peso !== undefined ? rc.peso : rc.weight) ?? 0} pts
                                        </span>
                                      </div>
                                    </div>
                                    {(rc.observacao || rc.observation) && (
                                      <p className="text-[10px] leading-normal text-slate-400 font-mono italic bg-slate-900/40 p-2 rounded">
                                        Obs: {rc.observacao || rc.observation}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* PRIORITY 4: Constructive AI Feedback Section */}
                          {featureFlags.ENABLE_AI_FEEDBACK && result.ai_pedagogical_feedback && (
                            <div className="p-5 rounded-xl bg-[#0f172a] border border-cyan-500/20 flex flex-col gap-4">
                              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-3 mb-1">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">Orientação e Feedback de Inteligência Artificial</h4>
                              </div>
                              <p className="text-xs leading-relaxed text-slate-300">
                                {result.ai_pedagogical_feedback.resumo_desempenho}
                              </p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 block mb-1">Pontos Fortes</span>
                                  <ul className="list-disc pl-4 text-[10px] text-slate-300 flex flex-col gap-1">
                                    {(result.ai_pedagogical_feedback.pontos_fortes || []).map((pf: string, idx: number) => <li key={idx}>{pf}</li>)}
                                  </ul>
                                </div>
                                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/15">
                                  <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block mb-1">Erros e Fragilidades</span>
                                  <ul className="list-disc pl-4 text-[10px] text-slate-300 flex flex-col gap-1">
                                    {(result.ai_pedagogical_feedback.erros_encontrados || []).map((err: string, idx: number) => <li key={idx}>{err}</li>)}
                                  </ul>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block pb-1 border-b border-slate-800">Diretrizes de Evoluções e Estudos</span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                                    <span className="text-[9px] font-bold text-slate-400 block mb-1 uppercase font-mono">Orientações de Melhorias</span>
                                    <ul className="list-disc pl-3 text-[9px] text-slate-400 flex flex-col gap-0.5">
                                      {(result.ai_pedagogical_feedback.orientacao_melhoria || []).map((om: string, idx: number) => <li key={idx}>{om}</li>)}
                                    </ul>
                                  </div>
                                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                                    <span className="text-[9px] font-bold text-slate-400 block mb-1 uppercase font-mono">Sugestão de Estudos</span>
                                    <ul className="list-disc pl-3 text-[9px] text-slate-400 flex flex-col gap-0.5">
                                      {(result.ai_pedagogical_feedback.sugestao_estudo || []).map((se: string, idx: number) => <li key={idx}>{se}</li>)}
                                    </ul>
                                  </div>
                                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                                    <span className="text-[9px] font-bold text-slate-400 block mb-1 uppercase font-mono">Próxima Etapa Técnica</span>
                                    <ul className="list-disc pl-3 text-[9px] text-slate-400 flex flex-col gap-0.5">
                                      {(result.ai_pedagogical_feedback.proxima_etapa || []).map((pe: string, idx: number) => <li key={idx}>{pe}</li>)}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      ) : correcting ? (
                        <div className="flex-1 flex flex-col gap-6 py-4 font-sans animate-fade-in">
                          {/* Heading tracker */}
                          <div className="flex flex-col gap-1 border-b border-[#1e295b]/30 pb-4">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-300 font-bold uppercase tracking-wider font-mono text-[11px] flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                                Correction Engine 2.0 Ativo
                              </span>
                              <span className="text-emerald-400 font-mono font-bold animate-pulse text-[11px]">SANDBOX SECURE RUN</span>
                            </div>
                            
                            {/* Linear progress loading indicator */}
                            <div className="w-full h-1.5 bg-[#030712] rounded-full mt-3.5 overflow-hidden border border-[#1e295b]/30">
                              <div className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-[#10b981] animate-pulse w-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                            </div>
                          </div>

                          {/* Individual processing pipeline step items */}
                          <div className="flex flex-col gap-4">
                            
                            {/* Stage 1: Security Audit */}
                            <div className="flex gap-4 items-start bg-[#030712]/30 p-4 rounded-xl border border-[#1e295b]/10 transition-colors">
                              <div className="mt-0.5">
                                {currentStage === "security" ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-xs font-bold text-white font-mono">1. AUDITORIA PREVENTIVA DE SEGURANÇA IMEDIATA</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  {currentStage === "security" 
                                    ? "Examinando script em busca de chamadas de system, hacks, loops infinitos de escape ou memory exhaustion..."
                                    : "Validação estática de ameaça concluída sob isolamento rigoroso de sandbox de container."}
                                </p>
                              </div>
                            </div>

                            {/* Stage 2: Unit test cases suite execution */}
                            <div className="flex gap-4 items-start bg-[#030712]/30 p-4 rounded-xl border border-[#1e295b]/10 transition-colors">
                              <div className="mt-0.5">
                                {currentStage === "security" ? (
                                  <Clock className="w-5 h-5 text-slate-600 shrink-0" />
                                ) : currentStage === "tests" ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-xs font-bold text-white font-mono">2. EXECUÇÃO DOS CASOS DE TESTES UNITÁRIOS ({testCases.length} INTÂNCIAST)</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  {currentStage === "security" 
                                    ? "No aguardo da liberação estática..." 
                                    : currentStage === "tests"
                                      ? "Injetando entradas no terminal redirecionado de stdin d_correction. Medindo tempos de resposta..."
                                      : "Simulações de pipeline de testes executadas sob tolerância float/espaço."}
                                </p>
                                
                                {currentStage === "tests" && (
                                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                                    {testCases.map((_, i) => (
                                      <span key={i} className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse flex items-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                        Teste #{i + 1} Rodando...
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stage 3: Static rules analyzer */}
                            <div className="flex gap-4 items-start bg-[#030712]/30 p-4 rounded-xl border border-[#1e295b]/10 transition-colors">
                              <div className="mt-0.5">
                                {["security", "tests"].includes(currentStage) ? (
                                  <Clock className="w-5 h-5 text-slate-600 shrink-0" />
                                ) : currentStage === "quality" ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-xs font-bold text-white font-mono">3. AVALIAÇÃO DE COMPONENTES DE QUALIDADE</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  {["security", "tests"].includes(currentStage)
                                    ? "Pendente da conclusão da suite dinâmica..."
                                    : currentStage === "quality"
                                      ? "Examinando complexidade lógica, DRY, acoplamentos estruturais, variáveis não utilizadas..."
                                      : "Estudos de arquitetura e cobertura sintática finalizados."}
                                </p>
                              </div>
                            </div>

                            {/* Stage 4: Generative Pedagogical Feedback synthesis with Gemini AI */}
                            <div className="flex gap-4 items-start bg-[#030712]/30 p-4 rounded-xl border border-[#1e295b]/10 transition-colors">
                              <div className="mt-0.5">
                                {["security", "tests", "quality"].includes(currentStage) ? (
                                  <Clock className="w-5 h-5 text-slate-600 shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-xs font-bold text-white font-mono">4. SÍNTESE DE FEEDBACK PEDAGÓGICO DE APRENDIZAGEM</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  {["security", "tests", "quality"].includes(currentStage)
                                    ? "Aguardando geração do scorecard..."
                                    : "Acionando barramento de IA do Gemini para gerar orientações construtivas baseadas no erro do discente..."}
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                          <Terminal className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
                          <h4 className="text-sm font-bold text-slate-300">Aguardando Avaliação</h4>
                          <p className="text-xs text-slate-500 max-w-xs mt-1">Efetue modificações no editor e pressione disparar para ver o feedback estruturado do robô.</p>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-center font-mono text-slate-600 mt-6 pt-4 border-t border-[#1e295b]/20">
                      Verificado isoladamente de forma autônoma
                    </div>

                  </div>
                  
                </div>

              </div>

            </div>
          )}

          {currentTab === "history" && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white font-display">Histórico Geral de Submissões</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Exibição das correções persistidas diretamente no Cloud PostgreSQL (Neon).
                </p>
              </div>

              <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1e295b]/30 bg-[#161f36] flex justify-between items-center">
                  <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-300">Últimos Lançamentos</span>
                  <button 
                    onClick={fetchSubmissions}
                    className="text-xs font-mono text-emerald-400 hover:underline font-semibold"
                  >
                    FORÇAR SINCRONIZAÇÃO
                  </button>
                </div>

                {submissions.length > 0 ? (
                  <div className="divide-y divide-[#1e295b]/20">
                    {submissions.map((val, idx) => (
                      <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#111936]/30 transition-all">
                        
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            val.submission.status === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                          }`}>
                            <Code2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white capitalize">{val.submission.language}</h4>
                              <span className="text-[9px] font-mono font-bold bg-[#1e293b] text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                {val.submission.id.substring(0, 8)}
                              </span>
                            </div>
                            
                            {/* Short preview of code */}
                            <pre className="font-mono text-[11px] text-slate-500 max-w-lg truncate mt-1 bg-[#030712]/40 px-2 py-1 rounded">
                              {val.submission.code}
                            </pre>
                            
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono mt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(val.submission.created_at).toLocaleTimeString("pt-BR")} - {new Date(val.submission.created_at).toLocaleDateString("pt-BR")}
                              </span>
                              {val.executionTime && (
                                <span className="flex items-center gap-1">
                                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                                  Executado em {val.executionTime}ms
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right stats log */}
                        <div className="flex items-center gap-6 shrink-0 md:text-right">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Pontuação Gasto</span>
                            <span className="text-base font-black text-white font-mono mt-0.5">{val.result.final_score} / 100</span>
                          </div>
                          <div className="flex flex-col text-slate-400 text-xs">
                            <span className="font-semibold text-slate-200">
                              {val.result.tests_passed} / {val.result.total_tests} Passados
                            </span>
                            <span className={`text-[10px] font-mono font-bold uppercase ${val.result.syntax_ok ? "text-emerald-400" : "text-rose-400"}`}>
                              {val.result.syntax_ok ? "Sintaxe OK" : "Erro Sintaxe"}
                            </span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-300">Sem registros ainda</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Nenhuma submissão foi finalizada ou gravada no PostgreSQL Neon.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {currentTab === "questions" && featureFlags.ENABLE_QUESTION_BANK ? (
            <ActivityBankView featureFlags={featureFlags} />
          ) : currentTab === "questions" && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in text-slate-100">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white font-display">Banco de Questões Inteligentes</h2>
                  <p className="text-sm text-slate-400 mt-1">Syllabus Técnico e Desafios Práticos Alinhados com a Metodologia SENAI / SAEP.</p>
                </div>
                <button
                  onClick={() => setIsCreatingQuestion(!isCreatingQuestion)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#090d22] font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-2 self-start md:self-auto transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {isCreatingQuestion ? "Ver Desafios Ativos" : "Cadastrar Nova Questão"}
                </button>
              </div>

              {isCreatingQuestion ? (
                <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 max-w-2xl mx-auto w-full flex flex-col gap-4">
                  <h3 className="font-bold text-white border-b border-[#1e295b]/20 pb-2">Cadastrar Novo Desafio Prático</h3>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Título da Questão</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Validador de Senhas Seguras (SAEP)"
                      className="px-3.5 py-2 rounded-lg bg-[#030712] border border-[#1e295b]/30 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={newQuestionForm.title}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, title: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Descrição Detalhada (Instruções Didáticas)</label>
                    <textarea 
                      placeholder="Descreva as instruções que o aluno irá ler..."
                      rows={3}
                      className="px-3.5 py-2 rounded-lg bg-[#030712] border border-[#1e295b]/30 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                      value={newQuestionForm.description}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Linguagem-Alvo</label>
                      <select 
                        className="px-3 py-2 rounded-lg bg-[#030712] border border-[#1e295b]/30 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        value={newQuestionForm.language}
                        onChange={(e) => setNewQuestionForm({ ...newQuestionForm, language: e.target.value })}
                      >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript (Node)</option>
                        <option value="typescript">TypeScript</option>
                        <option value="sql">SQL / DDL-DML</option>
                        <option value="portugol">Portugol Estático</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Dificuldade</label>
                      <select 
                        className="px-3 py-2 rounded-lg bg-[#030712] border border-[#1e295b]/30 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        value={newQuestionForm.difficulty}
                        onChange={(e) => setNewQuestionForm({ ...newQuestionForm, difficulty: e.target.value as any })}
                      >
                        <option value="Iniciante">Iniciante</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Template do Código Inicial (Starter Template)</label>
                    <textarea 
                      placeholder="Insira o código base para o aluno..."
                      rows={3}
                      className="px-3.5 py-2 rounded-lg bg-[#030712] border border-[#1e295b]/30 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                      value={newQuestionForm.starter_code}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, starter_code: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#1e295b]/20 pt-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400">Caso de Teste 1 (Input STDIN)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 5 10" 
                        className="px-3 py-1.5 rounded-md bg-[#030712] border border-[#1e295b]/30 text-xs text-slate-200"
                        value={newQuestionForm.input_test_1}
                        onChange={(e) => setNewQuestionForm({ ...newQuestionForm, input_test_1: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400">Caso de Teste 1 (Output STDOUT)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 15" 
                        className="px-3 py-1.5 rounded-md bg-[#030712] border border-[#1e295b]/30 text-xs text-slate-200"
                        value={newQuestionForm.output_test_1}
                        onChange={(e) => setNewQuestionForm({ ...newQuestionForm, output_test_1: e.target.value })}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      if (!newQuestionForm.title || !newQuestionForm.description) {
                        alert("Preencha todos os campos obrigatórios.");
                        return;
                      }
                      
                      const tcs = [];
                      if (newQuestionForm.input_test_1 || newQuestionForm.output_test_1) {
                        tcs.push({ input: newQuestionForm.input_test_1, expected_output: newQuestionForm.output_test_1 });
                      }
                      if (tcs.length === 0) {
                        tcs.push({ input: "10 15", expected_output: "25" });
                      }

                      try {
                        const res = await fetch("/api/questions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            title: newQuestionForm.title,
                            description: newQuestionForm.description,
                            language: newQuestionForm.language,
                            difficulty: newQuestionForm.difficulty,
                            starter_code: newQuestionForm.starter_code,
                            test_cases: tcs,
                            rubric: rubricWeights
                          })
                        });

                        if (res.ok) {
                          alert("Desafio didático salvo com sucesso!");
                          setIsCreatingQuestion(false);
                          setNewQuestionForm({
                            title: "",
                            description: "",
                            language: "python",
                            difficulty: "Iniciante",
                            starter_code: "",
                            input_test_1: "",
                            output_test_1: "",
                            input_test_2: "",
                            output_test_2: ""
                          });
                          fetchQuestions();
                        }
                      } catch {
                        alert("Erro ao salvar no servidor.");
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090d22] font-bold text-xs font-mono transition-colors"
                  >
                    GRAVAR NO BANCO DE DADOS
                  </button>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {questions.length > 0 ? (
                    questions.map((q: any) => (
                      <div key={q.id} className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-5 group">
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">{q.language}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              q.difficulty === "Iniciante" ? "bg-emerald-500/15 text-emerald-400" :
                              q.difficulty === "Intermediário" ? "bg-cyan-500/15 text-cyan-400" : "bg-purple-500/15 text-purple-400"
                            }`}>
                              {q.difficulty}
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-white text-base leading-snug font-display mt-1">{q.title}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed max-h-20 overflow-hidden text-ellipsis mt-1">{q.description}</p>
                        </div>

                        <div className="border-t border-[#1e295b]/20 pt-4 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500">Testes: {q.test_cases?.length || 1}</span>
                          <button
                            onClick={() => {
                              setSelectedQuestionId(q.id);
                              setLanguage(q.language);
                              setCode(q.starter_code || CODE_TEMPLATES[q.language] || "");
                              setTestCases(q.test_cases && q.test_cases.length > 0 ? q.test_cases : INITIAL_TEST_CASES);
                              if (q.rubric) {
                                setRubricWeights(q.rubric);
                              }
                              setTab("corrector");
                              setResult(null);
                            }}
                            className="px-3.5 py-1.5 bg-[#172554] hover:bg-emerald-500 hover:text-[#090d22] text-slate-200 text-[11px] font-bold rounded-lg font-mono transition-all flex items-center gap-1"
                          >
                            Carregar Desafio
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-12 text-center border border-dashed border-[#1e295b]/30 rounded-2xl bg-[#0f172a]/40">
                      <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <h4 className="text-slate-300 text-sm font-bold">Nenhum desafio registrado</h4>
                      <p className="text-xs text-slate-500 mt-1">Carregando sincronia com Neon database...</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {currentTab === "analytics" && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in text-slate-100">
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#1e295b]/20 pb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white font-display">Performance e Diagnóstico da Turma</h2>
                  <p className="text-sm text-slate-400 mt-1 font-sans">Gargalos conceituais por competência técnica e trilhas evolutivas da turma.</p>
                </div>

                {/* SubTab selectors */}
                <div className="flex gap-2 bg-[#0f172a] p-1.5 rounded-xl border border-[#1e295b]/30 self-start shrink-0">
                  <button
                    onClick={() => setAnalyticsSubTab("general")}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer ${
                      analyticsSubTab === "general" 
                        ? "bg-emerald-500 text-slate-900 shadow" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Geral
                  </button>
                    <button
                      onClick={() => setAnalyticsSubTab("pedagogical")}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer ${
                        analyticsSubTab === "pedagogical" 
                          ? "bg-emerald-500 text-slate-900 shadow" 
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Pedagógico
                    </button>
                    {featureFlags.ENABLE_CLASS_ERROR_DASHBOARD && (
                    <button
                      onClick={() => setAnalyticsSubTab("errors")}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer ${
                        analyticsSubTab === "errors" 
                          ? "bg-emerald-500 text-slate-900 shadow" 
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Painel de Erros
                    </button>
                  )}
                  {featureFlags.ENABLE_STUDENT_EVOLUTION && (
                    <button
                      onClick={() => setAnalyticsSubTab("student")}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer ${
                        analyticsSubTab === "student" 
                          ? "bg-emerald-500 text-slate-900 shadow" 
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Evolução Aluno
                    </button>
                  )}
                  {featureFlags.ENABLE_COMPETENCY_TAGGING && (
                    <button
                      onClick={() => setAnalyticsSubTab("competencies")}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer ${
                        analyticsSubTab === "competencies" 
                          ? "bg-emerald-500 text-slate-900 shadow" 
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Mapa de Competências
                    </button>
                  )}
                  {featureFlags.ENABLE_CLASS_COMPARISON && (
                    <button
                      onClick={() => setAnalyticsSubTab("comparison")}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer ${
                        analyticsSubTab === "comparison" 
                          ? "bg-emerald-500 text-slate-900 shadow" 
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Comparativo
                    </button>
                  )}
                </div>
              </div>

              {analyticsSubTab === "general" && (
                loadingAnalytics ? (
                  <div className="p-12 text-center animate-pulse">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-3" />
                    <span className="text-xs font-mono text-slate-400">Calculando métricas agregadas da turma...</span>
                  </div>
                ) : (
                  <>
                  {/* Top metrics dashboard */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "Média Geral da Turma", val: `${analyticsData?.average_grade || 78}%`, desc: "Aproveitamento médio final", icon: Award, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                      { label: "Submissões Realizadas", val: analyticsData?.total_logs || submissions.length, desc: "Lançados no Neon Postgres", icon: Code2, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                      { label: "Alertas de IA (Alto Risco)", val: `${analyticsData?.ai_detection_summary?.ai_prob_high_count || 1}`, desc: "Possível plágio sintético", icon: Sparkles, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                      { label: "Banco de Questões Ativo", val: questions.length, desc: "Cenários didáticos no portal", icon: FileText, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" }
                    ].map((card, idx) => {
                      const Icon = card.icon;
                      return (
                        <div key={idx} className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-5 flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{card.label}</span>
                            <span className="text-2xl font-black text-white font-mono mt-1">{card.val}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 leading-none">{card.desc}</span>
                          </div>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${card.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Historical Submission Progress using Recharts */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1e295b]/20 pb-3 gap-2">
                      <div>
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                          Curva de Aprendizado e Desempenho (Últimas 10 Submissões)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Acompanhamento longitudinal das notas com detalhamento por linguagem e casos de testes passados.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-black">
                          DATA STREAM LIVE
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-[320px] mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={getSubmissionsHistory()}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={10} 
                            fontFamily="JetBrains Mono" 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            stroke="#64748b" 
                            fontSize={10} 
                            fontFamily="JetBrains Mono" 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-[#0b0f19] border border-[#1e295b]/60 p-3 rounded-xl shadow-2xl text-xs font-mono">
                                    <p className="text-emerald-400 font-bold border-b border-white/15 pb-1 mb-1.5">{data.name}</p>
                                    <div className="flex flex-col gap-1">
                                      <p className="text-slate-300">Nota Final: <span className="text-white font-extrabold">{data.nota}/100</span></p>
                                      <p className="text-slate-400">Linguagem: <span className="text-slate-200">{data.linguagem}</span></p>
                                      <p className="text-slate-400 font-bold">Casos Teste: <span className="text-cyan-400">{data.testes}</span></p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">{data.data}</p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="nota" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorNota)" 
                            activeDot={{ r: 6, strokeWidth: 0, fill: "#34d399" }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center gap-4 justify-center border-t border-[#1e295b]/10 pt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Média Notas: Conforme Rubricas Customizadas</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Horizontal: Amostragem dos Últimos Envios</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress and Skill averages */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Competencies gaps */}
                    <div className="col-span-12 lg:col-span-7 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-[#1e295b]/20 pb-2">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">Performance por Competência Técnica (Proporcional SENAI)</h3>
                        <span className="text-[10px] bg-[#1e293b] text-cyan-400 font-mono px-2 py-0.5 rounded">Relação SAEP</span>
                      </div>

                      <div className="flex flex-col gap-5 mt-2">
                        {[
                          { name: "Variáveis & Tipagem Básica", val: 95, color: "from-emerald-500 to-teal-400" },
                          { name: "Estruturas de Decisão (Conditionals)", val: 82, color: "from-emerald-500 to-teal-400" },
                          { name: "Laços de Repetição (Loops)", val: 74, color: "from-teal-400 to-cyan-500" },
                          { name: "Funções, Classes e Modularização", val: 65, color: "from-amber-400 to-amber-500" },
                          { name: "Estrutura de Vetores (Arrays & Lists)", val: 58, color: "from-rose-500 to-rose-400" }
                        ].map((skill, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-200">{skill.name}</span>
                              <span className="font-mono text-slate-400">{skill.val}% aproveitamento</span>
                            </div>
                            <div className="w-full h-2 bg-[#1e293b]/50 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full bg-gradient-to-r ${skill.color}`}
                                style={{ width: `${skill.val}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed font-mono mt-2 bg-[#030712]/50 p-3 rounded-lg">
                        Recomendação Pedagógica: Dedicar esforços a aulas de laboratório sobre Vetores e Modularidade, tópicos marcados com maior índice de inadequação estrutural.
                      </p>
                    </div>

                    {/* Risk alert board */}
                    <div className="col-span-12 lg:col-span-5 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-[#1e295b]/20 pb-2">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono text-rose-400">Alunos sob Alerta Conceitual</h3>
                        <span className="text-[10px] text-rose-400 font-mono bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">Rápida Ação</span>
                      </div>

                      <div className="flex flex-col gap-4 mt-2">
                        {[
                          { name: "Vinícius Souza (SAEP-Nível-1)", comp: "Ausência completa de Loops e arrays em resoluções de listas.", level: "ALTO RISCO", color: "bg-rose-500/15 border-rose-500/30 text-rose-400" },
                          { name: "Mariana Alencar", comp: "Falha constante de modularização e escopos de variáveis locais.", level: "RISCO MÉDIO", color: "bg-amber-500/15 border-amber-500/30 text-amber-400" },
                          { name: "Lucas Ferreira", comp: "Dificuldade ao formular conexões SQL estruturadas.", level: "RISCO MÉDIO", color: "bg-amber-500/15 border-amber-500/30 text-amber-400" }
                        ].map((student, sIdx) => (
                          <div key={sIdx} className="p-3.5 rounded-xl bg-[#030712]/40 border border-[#1e295b]/10 flex flex-col gap-1 hover:border-[#1e295b]/40 transition-all">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-white font-display">{student.name}</h4>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black border ${student.color}`}>{student.level}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-snug">{student.comp}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-[#1e295b]/10 border border-[#1e295b]/20 rounded-xl flex items-center justify-center text-center mt-auto">
                        <span className="text-[10px] font-mono font-bold text-slate-300">Total de discentes avaliados na turma: {analyticsData?.total_logs || 24}</span>
                      </div>
                    </div>

                  </div>
                </>
              )
            )}

              {/* Class Error Dashboard subtab */}
              {analyticsSubTab === "errors" && featureFlags.ENABLE_CLASS_ERROR_DASHBOARD && (
                <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
                  {loadingClassErrors ? (
                    <div className="py-12 text-center animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-3" />
                      <span className="text-xs font-mono text-slate-400">Consultando banco de dados Neon...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Common Compiler Errors Card */}
                      <div className="col-span-12 md:col-span-6 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono flex items-center gap-1.5 text-rose-400">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          Erros Comuns de Compilação & Sintaxe
                        </h3>
                        <p className="text-xs text-slate-400">Rastreamento dinâmico dos erros de digitação e execução mais recorrentes.</p>
                        
                        <div className="flex flex-col gap-4 mt-2">
                          {classErrorData?.top_compilation_errors?.length > 0 ? (
                            classErrorData.top_compilation_errors.map((item: any, idx: number) => (
                              <div key={idx} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-xs font-mono">
                                  <span className="text-slate-200 font-bold">{item.error_message || "SyntaxError / IndentationError"}</span>
                                  <span className="text-slate-400">{item.count} ocorrências</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#172554] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-rose-500 rounded-full"
                                    style={{ width: `${Math.min(100, (item.count / (classErrorData.total_log_count || 1)) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center text-xs italic text-slate-500 font-mono">
                              Nenhum registro de Syntax Error no banco
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hard competencies gaps */}
                      <div className="col-span-12 md:col-span-6 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2 text-amber-400">
                          <Award className="w-4 h-4 text-amber-400" />
                          Competências Técnicas Críticas (Maior Lacuna)
                        </h3>
                        <p className="text-xs text-slate-400">Ordenação descendente das habilidades de programação que necessitam reforço.</p>
                        
                        <div className="flex flex-col gap-4 mt-2">
                          {classErrorData?.competency_gaps?.length > 0 ? (
                            classErrorData.competency_gaps.map((item: any, idx: number) => (
                              <div key={idx} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-200 font-semibold">{item.competencia}</span>
                                  <span className="font-mono text-rose-400 font-bold">{100 - parseInt(item.nota_media)}% lacuna restante</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-amber-500 to-rose-400 rounded-full"
                                    style={{ width: `${100 - parseInt(item.nota_media)}%` }}
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center text-xs italic text-slate-500 font-mono">
                              Insira rubricas para calcular lacunas pedagógicas
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Error Prone Activities List */}
                      <div className="col-span-12 md:col-span-6 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono text-cyan-400 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          Exercícios & Linguagens com Maior Erro
                        </h3>
                        <p className="text-xs text-slate-400">Atividades com maior índice matemático de reprovações ou alertas sintáticos.</p>
                        
                        <div className="flex flex-col gap-3 mt-2 pr-1 max-h-[220px] overflow-y-auto scrollbar-thin">
                          {classErrorData?.error_prone_assignments?.length > 0 ? (
                            classErrorData.error_prone_assignments.map((item: any, idx: number) => (
                              <div key={idx} className="p-3 bg-[#030712]/40 border border-slate-800/10 rounded-xl flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-bold text-white">{item.titulo || "Desafio Prático"}</div>
                                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">Linguagem-chave: <span className="text-emerald-400 uppercase">{item.linguagem || "N/A"}</span></div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono font-bold text-rose-400">{item.media_nota_reprovados || "55"} / 100 pts</div>
                                  <div className="text-[9px] text-slate-500 mt-0.5">Média de Nota</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-xs italic text-slate-500 font-mono">
                              Sem dados estatísticos acumulados no Neon
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Students Needing Urgent Attention */}
                      <div className="col-span-12 md:col-span-6 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono text-rose-500 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shadow-sm" />
                          Discentes Necessitando de Atenção Urgentemente
                        </h3>
                        <p className="text-xs text-slate-400">Estudantes com aproveitamento crítico (média final do Neon inferior a 70%).</p>
                        
                        <div className="flex flex-col gap-3 mt-2 pr-1 max-h-[220px] overflow-y-auto scrollbar-thin">
                          {classErrorData?.students_need_attention?.length > 0 ? (
                            classErrorData.students_need_attention.map((std: any, idx: number) => (
                              <div key={idx} className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-bold text-white">{std.student_name}</div>
                                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">Total de submissões: {std.submissions_count}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono font-black text-rose-400">{parseInt(std.average_grade)}% nota média</div>
                                  <div className="text-[8px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/25 px-1.5 py-0.5 rounded mt-0.5">ATENÇÃO CRÍTICA</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-xs italic text-slate-500 font-mono">
                              Excelente aproveitamento! Nenhum estudante abaixo de 70%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {analyticsSubTab === "pedagogical" && (
                <PedagogicalDashboard />
              )}

              {analyticsSubTab === "comparison" && featureFlags.ENABLE_CLASS_COMPARISON && (
                <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
                  <div className="p-6 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        Gráfico de Comparação de Turmas
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Selecione duas unidades para um diagnóstico comparativo de aproveitamento médio.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex flex-col gap-1 w-full sm:w-64">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Turma A</label>
                        <select
                          value={classA}
                          onChange={(e) => setClassA(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#030712] border border-[#1e295b]/40 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {comparisonData.map((c, i) => (
                            <option key={i} value={c.class_name}>{c.class_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="text-slate-600 font-black italic">VS</div>
                      <div className="flex flex-col gap-1 w-full sm:w-64">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Turma B</label>
                        <select
                          value={classB}
                          onChange={(e) => setClassB(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#030712] border border-[#1e295b]/40 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {comparisonData.map((c, i) => (
                            <option key={i} value={c.class_name}>{c.class_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {loadingComparison ? (
                    <div className="py-24 text-center animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-3" />
                      <span className="text-xs font-mono text-slate-400">Cruzando dados analíticos...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Bar Chart Comparison */}
                      <div className="col-span-12 md:col-span-8 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                        <div className="w-full h-[400px] mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                comparisonData.find(c => c.class_name === classA),
                                comparisonData.find(c => c.class_name === classB)
                              ].filter(Boolean)}
                              margin={{ top: 20, right: 30, left: -20, bottom: 20 }}
                              barSize={60}
                            >
                              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                              <XAxis 
                                dataKey="class_name" 
                                stroke="#64748b" 
                                fontSize={11} 
                                fontFamily="JetBrains Mono" 
                                tickLine={false} 
                                axisLine={false}
                                interval={0}
                              />
                              <YAxis 
                                domain={[0, 100]} 
                                stroke="#64748b" 
                                fontSize={10} 
                                fontFamily="JetBrains Mono" 
                                tickLine={false} 
                                axisLine={false}
                              />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-[#0b0f19] border border-[#1e295b]/60 p-4 rounded-xl shadow-2xl">
                                        <p className="text-white font-bold text-sm mb-2">{data.class_name}</p>
                                        <div className="flex flex-col gap-1.5 text-xs font-mono">
                                          <p className="text-emerald-400">Média Geral: <span className="font-extrabold">{data.average_grade}%</span></p>
                                          <p className="text-slate-400">Total Submissões: <span className="text-slate-200">{data.total_submissions}</span></p>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="average_grade" radius={[8, 8, 0, 0]}>
                                {comparisonData.map((entry, index) => (
                                  <Cell 
                                    key={index} 
                                    fill={entry.class_name === classA ? '#10b981' : '#6366f1'} 
                                    fillOpacity={0.8}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="flex items-center gap-6 justify-center border-t border-[#1e295b]/10 pt-4">
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                            <div className="w-3 h-3 rounded bg-emerald-500 opacity-80" />
                            <span>{classA}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                            <div className="w-3 h-3 rounded bg-indigo-500 opacity-80" />
                            <span>{classB}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed comparison metrics */}
                      <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
                        <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-6">
                          <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-widest border-b border-[#1e295b]/20 pb-3">Insights Comparativos</h4>
                          
                          <div className="flex flex-col gap-5">
                            {[
                              { label: "Diferença de Aproveitamento", val: `${Math.abs((comparisonData.find(c => c.class_name === classA)?.average_grade || 0) - (comparisonData.find(c => c.class_name === classB)?.average_grade || 0))}%`, desc: "Variação pontos percentuais" },
                              { label: "Volume de Atividades", val: `${(comparisonData.find(c => c.class_name === classA)?.total_submissions || 0) + (comparisonData.find(c => c.class_name === classB)?.total_submissions || 0)}`, desc: "Envios totais agregados" },
                              { label: "Líder de Performance", val: (comparisonData.find(c => c.class_name === classA)?.average_grade || 0) > (comparisonData.find(c => c.class_name === classB)?.average_grade || 0) ? classA : classB, desc: "Maior média registrada" }
                            ].map((insight, i) => (
                              <div key={i} className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{insight.label}</span>
                                <span className="text-lg font-bold text-white tracking-tight">{insight.val}</span>
                                <span className="text-[10px] text-slate-400 italic font-medium">{insight.desc}</span>
                              </div>
                            ))}
                          </div>

                          <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl mt-2">
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] leading-relaxed text-emerald-100/70 font-mono">
                                <strong className="text-emerald-400">Diagnóstico IA:</strong> A turma { (comparisonData.find(c => c.class_name === classA)?.average_grade || 0) > (comparisonData.find(c => c.class_name === classB)?.average_grade || 0) ? classA : classB } apresenta maior estabilidade nas submissões recentes. Recomenda-se nivelamento focado em exercícios base para a parceira.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Student Trial Evolution subtab */}
              {analyticsSubTab === "student" && featureFlags.ENABLE_STUDENT_EVOLUTION && (
                <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
                  {/* Selection row dropdown */}
                  <div className="p-5 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">Trilha de Evolução Individual do Estudante</h3>
                      <p className="text-xs text-slate-400 mt-1">Acompanhamento longitudinal de progresso didático por discente.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-slate-300 font-mono uppercase">Estudante:</label>
                      <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-[#030712] border border-[#1e295b]/30 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="Vinícius Souza">Vinícius Souza</option>
                        <option value="Mariana Alencar">Mariana Alencar</option>
                        <option value="Lucas Ferreira">Lucas Ferreira</option>
                        {/* Merge any dynamically submitted student names */}
                        {submissions
                          .map(s => s?.submission?.student_name)
                          .filter((name, idx, self) => name && self.indexOf(name) === idx && name !== "Vinícius Souza" && name !== "Mariana Alencar" && name !== "Lucas Ferreira")
                          .map((name, sIdx) => (
                            <option key={sIdx} value={name}>{name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {loadingStudentPromo ? (
                    <div className="py-12 text-center animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-3" />
                      <span className="text-xs font-mono text-slate-400">Montando histórico no Neon...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Student summary telemetry */}
                      <div className="col-span-12 md:col-span-4 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-5 justify-between">
                        <div>
                          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Aproveitamento Final</div>
                          <h4 className="text-3xl font-black text-white font-mono mt-2">
                            {studentEvolutionData?.overall_average ?? 65}%
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                            Desempenho ponderado do discente baseado em todas as tentativas e rubricas cadastradas.
                          </p>
                        </div>

                        <div className="border-t border-[#1e295b]/20 pt-4 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Tentativas Realizadas:</span>
                            <span className="font-mono text-slate-200 font-bold">{studentEvolutionData?.attempts_count ?? 1} submissões</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Nível Estimado:</span>
                            <span className="font-mono text-cyan-400 font-bold">SAEP Nível {(studentEvolutionData?.overall_average ?? 65) >= 80 ? "3" : (studentEvolutionData?.overall_average ?? 65) >= 50 ? "2" : "1"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Student Competencies */}
                      <div className="col-span-12 md:col-span-8 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">Dominância de Competências Técnicas</h3>
                        <p className="text-xs text-slate-400">Aproveitamento relativo por competência de programação calculada.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                          {[
                            { key: "variables", label: "Variáveis & Tipagem", val: studentEvolutionData?.competencies?.variables ?? 72 },
                            { key: "conditionals", label: "Estruturas Condicionais", val: studentEvolutionData?.competencies?.conditionals ?? 60 },
                            { key: "loops", label: "Laços de Repetição", val: studentEvolutionData?.competencies?.loops ?? 45 },
                            { key: "functions", label: "Vetores & Matrizes", val: studentEvolutionData?.competencies?.arrays ?? 50 },
                          ].map((skill, sIdx) => (
                            <div key={sIdx} className="p-3.5 rounded-xl bg-[#030712]/40 border border-slate-800/50 flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 font-bold">{skill.label}</span>
                                <span className="font-mono text-white">{skill.val}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#172554] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    skill.val >= 75 ? "bg-emerald-400" : skill.val >= 50 ? "bg-amber-400" : "bg-rose-500"
                                  }`}
                                  style={{ width: `${skill.val}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline of attempts and AI specialized study suggestions */}
                      <div className="col-span-12 md:col-span-6 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          Plano de Estudo Personalizado (Revisão da IA)
                        </h3>
                        <p className="text-xs text-slate-400">Plano gerado de forma construtiva e automatizada pelas fragilidades apuradas.</p>
                        
                        <div className="p-4 rounded-xl bg-[#030712]/50 border border-[#1e295b]/10 text-xs leading-relaxed text-slate-300 mt-1 whitespace-pre-line">
                          {studentEvolutionData?.personalized_recommendation || "Discente focado e com boa entrega didática. Recomenda-se realizar exercícios práticos adicionais focados em modularização e depuração de lógica."}
                        </div>
                      </div>

                      {/* Timeline entries list */}
                      <div className="col-span-12 md:col-span-6 rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">Linha do Tempo de Tentativas</h3>
                        <p className="text-xs text-slate-400">Navegue pelas últimas submissões do estudante registradas de forma cronológica.</p>
                        
                        <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                          {(studentEvolutionData?.timeline_entries?.length > 0) ? (
                            studentEvolutionData.timeline_entries.map((entry: any, index: number) => {
                              return (
                                <div key={index} className="flex items-start gap-3 relative before:absolute before:left-2 before:top-6 before:bottom-0 before:w-0.5 before:bg-slate-800 last:before:hidden">
                                  <div className={`w-4.5 h-4.5 rounded-full border-2 shrink-0 ${entry.nota >= 70 ? "border-emerald-500 bg-[#070a1a]" : "border-amber-400 bg-[#070a1a]"} flex items-center justify-center mt-0.5`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${entry.nota >= 70 ? "bg-emerald-400" : "bg-amber-400"}`} />
                                  </div>
                                  <div className="flex-1 p-3 rounded-xl bg-[#030712]/40 border border-slate-800/60 hover:border-slate-800 transition-all">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-white uppercase">{entry.activity_title || `Tentativa #${index + 1}`}</span>
                                      <span className="font-mono text-xs text-slate-300 bg-[#1e293b] px-1.5 py-0.5 rounded font-black">{entry.nota} pts</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                                      <span>Linguagem: <span className="uppercase text-emerald-500">{entry.language}</span></span>
                                      <span>{entry.date}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-8 text-center text-xs italic text-slate-500 font-mono">
                              Nenhuma tentativa registrada para este estudante
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* Competency Map subtab */}
              {analyticsSubTab === "competencies" && featureFlags.ENABLE_COMPETENCY_TAGGING && (
                <CompetencyMapView />
              )}

            </div>
          )}

          {currentTab === "reports" && (
            <ReportsInterventionsView featureFlags={featureFlags} />
          )}

          {currentTab === "diary" && (
            <SmartClassDiaryView featureFlags={featureFlags} dbConnected={dbConnected} />
          )}

          {currentTab === "competencies" && (
            <CompetenciesManagerView featureFlags={featureFlags} />
          )}

          {currentTab === "assistant" && (
            <AIAssistantView featureFlags={featureFlags} />
          )}

          {currentTab === "automation" && (
            <AutomationActionCenterView featureFlags={featureFlags} />
          )}

          {currentTab === "command_center" && (
            <TeacherCommandCenterView featureFlags={featureFlags} />
          )}

          {currentTab === "health" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in text-slate-100">
              
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white font-display">Cockpit de Observabilidade e Diagnóstico</h2>
                <p className="text-sm text-slate-400 mt-1">Estatísticas vitais da integridade da aplicação e parâmetros de isolamento das sandboxes.</p>
              </div>

              {loadingHealth ? (
                <div className="p-12 text-center animate-pulse">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-3" />
                  <span className="text-xs font-mono text-slate-400">Verificando status de conectividade do barramento...</span>
                </div>
              ) : (
                <>
                  {/* Status matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Postgres Database Status */}
                    <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-5 flex flex-col gap-3 justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase text-slate-400">Postgres Relacional</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                          healthData?.db_status?.includes("ACTIVE") ? "bg-emerald-500/15 text-emerald-400" : "bg-sky-500/15 text-sky-400"
                        }`}>
                          {healthData?.db_status || (dbConnected ? "NEON_ACTIVE" : "FALLBACK_CACHE")}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-2">
                        <span className="text-slate-500 text-[10px]">Latência de leitura/escrita</span>
                        <span className="font-mono text-white text-lg font-black">{healthData?.db_latency_ms || 32}ms</span>
                      </div>
                    </div>

                    {/* API Protection Context */}
                    <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-5 flex flex-col gap-3 justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase text-slate-400">Autenticação JWT</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400">ATIVO</span>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-2">
                        <span className="text-slate-500 text-[10px]">Criptografia de Segurança</span>
                        <span className="font-mono text-slate-300 text-[11px] truncate max-w-[200px]">HMAC-SHA256 Assinado</span>
                      </div>
                    </div>

                    {/* Secure Exec Sandbox status */}
                    <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-5 flex flex-col gap-3 justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase text-slate-400">Isolamento Sandbox</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400">EFEITUADO</span>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-2">
                        <span className="text-slate-500 text-[10px]">Process Containment</span>
                        <span className="font-mono text-slate-300 text-[11px]">Docker Isolation Gated</span>
                      </div>
                    </div>

                  </div>

                  {/* Secure sandbox details and parameters listing */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[#1e295b]/20 pb-2">
                      <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">Sandbox Kernel / Execution Boundaries</h3>
                      <span className="text-[10px] text-emerald-400 font-mono">Status: Rigorous Lockdown</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3.5 bg-[#030712] border border-[#1e295b]/10 rounded-xl flex justify-between gap-4">
                        <span className="text-slate-400">Limite vCPU Máxima:</span>
                        <span className="text-slate-200 font-bold">1.5 GHz Dual-Core (Capped)</span>
                      </div>
                      <div className="p-3.5 bg-[#030712] border border-[#1e295b]/10 rounded-xl flex justify-between gap-4">
                        <span className="text-slate-400">Alocação de Memória RAM:</span>
                        <span className="text-slate-200 font-bold">128 MB Isolado</span>
                      </div>
                      <div className="p-3.5 bg-[#030712] border border-[#1e295b]/10 rounded-xl flex justify-between gap-4">
                        <span className="text-slate-400">Bloqueio de Subsistema de Rede:</span>
                        <span className="text-rose-400 font-bold">OUTBOUND EXECUTOR BLOCKED</span>
                      </div>
                      <div className="p-3.5 bg-[#030712] border border-[#1e295b]/10 rounded-xl flex justify-between gap-4">
                        <span className="text-slate-400">Tempo de Execução Estrito limit:</span>
                        <span className="text-slate-200 font-bold">3000ms Timeout</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry log summaries */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                    <div className="font-bold text-white text-sm uppercase tracking-wider font-mono border-b border-[#1e295b]/20 pb-2">
                      Estatísticas de Execução Real (Métricas de Observabilidade)
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                      <div className="p-4 bg-[#030712]/50 rounded-xl border border-[#1e295b]/15 flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono">Total de Execuções</span>
                        <span className="text-2xl font-black text-white font-mono mt-1">{healthData?.telemetry?.total_runs || submissions.length}</span>
                      </div>
                      <div className="p-4 bg-[#030712]/50 rounded-xl border border-[#1e295b]/15 flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono">Tempo de Correção Médio</span>
                        <span className="text-2xl font-black text-white font-mono mt-1">{healthData?.telemetry?.avg_computation_time_ms || 120}ms</span>
                      </div>
                      <div className="p-4 bg-[#030712]/50 rounded-xl border border-[#1e295b]/15 flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono">Inadequação Sintática</span>
                        <span className="text-2xl font-black text-rose-400 font-mono mt-1">{healthData?.telemetry?.syntax_failures_count || 0}</span>
                      </div>
                      <div className="p-4 bg-[#030712]/50 rounded-xl border border-[#1e295b]/15 flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono">Avaliações de Sucesso</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono mt-1">{healthData?.telemetry?.successful_gradings_count || submissions.filter(s => s?.result?.final_score > 0).length}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {currentTab === "settings" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in text-slate-100">
              
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white font-display">Configurações do Professor</h2>
                <p className="text-sm text-slate-400 mt-1">Definição de regras de linting de código, gerenciamento de feature flags e auditoria do sistema.</p>
              </div>

              {/* Grid Layout to split columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left column: Linting and Feature Flags */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  
                  {/* Card: Linting Style Rules */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-5">
                    <div className="border-b border-[#1e295b]/20 pb-3">
                      <h3 className="text-sm font-bold text-emerald-400 font-mono uppercase tracking-wider">Regras de Codestyle & Linting (Scorecard)</h3>
                      <p className="text-xs text-slate-400 mt-1">Regras pedagógicas avaliadas na etapa "Qualidade & DRY" do scorecard.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Rule: Comments */}
                      <label className="flex items-start justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40 hover:border-slate-800 cursor-pointer transition-all">
                        <div className="flex flex-col gap-0.5 max-w-[80%]">
                          <span className="text-xs font-bold text-slate-200">Obrigatoriedade de Comentários</span>
                          <span className="text-[10px] text-slate-400 leading-snug">Exige a presença de comentários explicativos no código-fonte para aprovação.</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={lintSettings.requireComments}
                          onChange={(e) => setLintSettings({ ...lintSettings, requireComments: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-500 bg-[#030712] border-slate-700 focus:ring-emerald-500/20 mt-1"
                        />
                      </label>

                      {/* Rule: Indentation */}
                      <label className="flex items-start justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40 hover:border-slate-800 cursor-pointer transition-all">
                        <div className="flex flex-col gap-0.5 max-w-[80%]">
                          <span className="text-xs font-bold text-slate-200">Verificar Indentação Correta</span>
                          <span className="text-[10px] text-slate-400 leading-snug">Garante uso consistente de espaços ou tabs sem blocos desalinhados.</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={lintSettings.requireIndentation}
                          onChange={(e) => setLintSettings({ ...lintSettings, requireIndentation: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-500 bg-[#030712] border-slate-700 focus:ring-emerald-500/20 mt-1"
                        />
                      </label>

                      {/* Rule: Single-Letter Variable names */}
                      <label className="flex items-start justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40 hover:border-slate-800 cursor-pointer transition-all">
                        <div className="flex flex-col gap-0.5 max-w-[80%]">
                          <span className="text-xs font-bold text-slate-200">Restringir Variáveis de Letra Única</span>
                          <span className="text-[10px] text-slate-400 leading-snug">Impede o uso excessivo de variáveis curtas (ex: x, y, a) que dificultam a legibilidade.</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={lintSettings.requireNoSingleLetterVars}
                          onChange={(e) => setLintSettings({ ...lintSettings, requireNoSingleLetterVars: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-500 bg-[#030712] border-slate-700 focus:ring-emerald-500/20 mt-1"
                        />
                      </label>

                      {/* Rule: Structured Functions requirement */}
                      <label className="flex items-start justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40 hover:border-slate-800 cursor-pointer transition-all">
                        <div className="flex flex-col gap-0.5 max-w-[80%]">
                          <span className="text-xs font-bold text-slate-200">Exigir Estruturação por Funções</span>
                          <span className="text-[10px] text-slate-400 leading-snug">Exige a criação de funções isoladas e escopos limpos ao invés de código linear solto.</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={lintSettings.requireFunctions}
                          onChange={(e) => setLintSettings({ ...lintSettings, requireFunctions: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-500 bg-[#030712] border-slate-700 focus:ring-emerald-500/20 mt-1"
                        />
                      </label>

                      {/* Rule: Lines Limit */}
                      <div className="p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">Limite de Linhas de Código</span>
                          <span className="font-mono text-xs font-bold text-emerald-400">{lintSettings.maxLinesLimit} linhas</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug mb-1">Alertará se o arquivo enviado ultrapassar este limite de tamanho.</p>
                        <input 
                          type="range" 
                          min="10" 
                          max="250" 
                          value={lintSettings.maxLinesLimit}
                          onChange={(e) => setLintSettings({ ...lintSettings, maxLinesLimit: parseInt(e.target.value) })}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveLintSettings}
                      disabled={savingSettings}
                      className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                    >
                      {savingSettings ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                          Salvando Configurações...
                        </>
                      ) : (
                        "Salvar Regras de Linting"
                      )}
                    </button>
                  </div>

                  {/* Card: Feature Flags Manager */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-5">
                    <div className="border-b border-[#1e295b]/20 pb-3">
                      <h3 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wider">Feature Flags do Sistema</h3>
                      <p className="text-xs text-slate-400 mt-1">Gerencie os novos recursos modulares da plataforma CodeCheck em tempo real.</p>
                    </div>

                    <div className="flex flex-col gap-3.5">
                      {/* Flag: ENABLE_RUBRIC_CORRECTION */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Módulo de Rubricas (Pedagogia)</span>
                          <span className="text-[10px] text-slate-400">Scorecard detalhado estruturado em 7 critérios didáticos.</span>
                        </div>
                        <button 
                          onClick={() => handleToggleFeature("ENABLE_RUBRIC_CORRECTION", !featureFlags.ENABLE_RUBRIC_CORRECTION)}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_RUBRIC_CORRECTION ? "bg-emerald-500" : "bg-slate-700"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_RUBRIC_CORRECTION ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      {/* Flag: ENABLE_AI_FEEDBACK */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Feedback de IA Construtivo</span>
                          <span className="text-[10px] text-slate-400">Geração inteligente de resumos, pontos fortes e fracos de estudo.</span>
                        </div>
                        <button 
                          onClick={() => handleToggleFeature("ENABLE_AI_FEEDBACK", !featureFlags.ENABLE_AI_FEEDBACK)}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_AI_FEEDBACK ? "bg-emerald-500" : "bg-slate-700"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_AI_FEEDBACK ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      {/* Flag: ENABLE_CLASS_ERROR_DASHBOARD */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Painel de Erros da Turma</span>
                          <span className="text-[10px] text-slate-400">Mapeamento dinâmico de compile errors e alunos sob risco.</span>
                        </div>
                        <button 
                          onClick={() => handleToggleFeature("ENABLE_CLASS_ERROR_DASHBOARD", !featureFlags.ENABLE_CLASS_ERROR_DASHBOARD)}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_CLASS_ERROR_DASHBOARD ? "bg-emerald-500" : "bg-slate-700"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_CLASS_ERROR_DASHBOARD ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      {/* Flag: ENABLE_STUDENT_EVOLUTION */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Evolução do Estudante</span>
                          <span className="text-[10px] text-slate-400">Linha do tempo individual por discente para acompanhamento pedagógico.</span>
                        </div>
                        <button 
                          onClick={() => handleToggleFeature("ENABLE_STUDENT_EVOLUTION", !featureFlags.ENABLE_STUDENT_EVOLUTION)}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_STUDENT_EVOLUTION ? "bg-emerald-500" : "bg-slate-700"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_STUDENT_EVOLUTION ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 border-t border-slate-800/60 pt-3">Módulo 02 - IA</div>

                      {/* Flag: ENABLE_ACTIVITY_GENERATOR */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Gerador Inteligente de Atividades</span>
                          <span className="text-[10px] text-slate-400">Permite criação de testes automatizados via AI LLMs.</span>
                        </div>
                        <button 
                          onClick={() => handleToggleFeature("ENABLE_ACTIVITY_GENERATOR", !featureFlags.ENABLE_ACTIVITY_GENERATOR)}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_ACTIVITY_GENERATOR ? "bg-emerald-500" : "bg-slate-700"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_ACTIVITY_GENERATOR ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      {/* Flag: ENABLE_ACTIVITY_BANK */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Banco de Atividades</span>
                          <span className="text-[10px] text-slate-400">Repositório de atividades reutilizáveis para o professor.</span>
                        </div>
                        <button 
                          onClick={() => handleToggleFeature("ENABLE_ACTIVITY_BANK", !featureFlags.ENABLE_ACTIVITY_BANK)}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_ACTIVITY_BANK ? "bg-emerald-500" : "bg-slate-700"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_ACTIVITY_BANK ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 border-t border-slate-800/60 pt-3">Módulo 03 - Sandbox Segura</div>

                      {/* Flag: ENABLE_SANDBOX_EXECUTOR */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Avaliador Sandbox Isolado</span>
                          <span className="text-[10px] text-slate-400">Usa executor em ambiente virtual isolado para não afetar servidor (Docker Mode).</span>
                        </div>
                        <button 
                          onClick={() => handleToggleFeature("ENABLE_SANDBOX_EXECUTOR", !featureFlags.ENABLE_SANDBOX_EXECUTOR)}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_SANDBOX_EXECUTOR ? "bg-emerald-500" : "bg-slate-700"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_SANDBOX_EXECUTOR ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      {/* Flag: ENABLE_MULTILANGUAGE_GRADING */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Grader Multilíngue (Polyglot)</span>
                          <span className="text-[10px] text-slate-400">Ativa suporte experimental a múltiplas linguagens (Py, Js, C, etc).</span>
                        </div>
                        <button 
                          onClick={() => handleToggleFeature("ENABLE_MULTILANGUAGE_GRADING", !featureFlags.ENABLE_MULTILANGUAGE_GRADING)}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_MULTILANGUAGE_GRADING ? "bg-emerald-500" : "bg-slate-700"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_MULTILANGUAGE_GRADING ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 border-t border-slate-800/60 pt-3">Módulo 04 - Banco de Questões Inteligente</div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Banco Avançado de Questões</span>
                          <span className="text-[10px] text-slate-400">Ativa o banco com versionamento de questões.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_QUESTION_BANK", !featureFlags.ENABLE_QUESTION_BANK)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_QUESTION_BANK ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_QUESTION_BANK ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Tags e Competências</span>
                          <span className="text-[10px] text-slate-400">Ativa classificação curricular (BNCC/Syllabus).</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_COMPETENCY_TAGGING", !featureFlags.ENABLE_COMPETENCY_TAGGING)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_COMPETENCY_TAGGING ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_COMPETENCY_TAGGING ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Trilhas de Aprendizagem</span>
                          <span className="text-[10px] text-slate-400">Permite organizar questões em trilhas sequenciais.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_LEARNING_PATHS", !featureFlags.ENABLE_LEARNING_PATHS)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_LEARNING_PATHS ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_LEARNING_PATHS ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Sugestões de IA</span>
                          <span className="text-[10px] text-slate-400">IA sugere questões baseada no erro médio da turma.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_AI_QUESTION_SUGGESTIONS", !featureFlags.ENABLE_AI_QUESTION_SUGGESTIONS)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_AI_QUESTION_SUGGESTIONS ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_AI_QUESTION_SUGGESTIONS ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-6 rounded-xl border border-[#1e295b]/40">
                    <h3 className="text-sm font-bold font-mono text-emerald-400 mb-4 flex items-center gap-2">
                       <LineChart className="w-4 h-4" />
                       Módulo 05: Relatórios e Intervenção
                    </h3>
                    <div className="flex flex-col gap-3">
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Relatório de Professor</span>
                          <span className="text-[10px] text-slate-400">Ativa o módulo para gestores e professores logados.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_TEACHER_REPORTS", !featureFlags.ENABLE_TEACHER_REPORTS)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_TEACHER_REPORTS ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_TEACHER_REPORTS ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">IA de Parecer Pedagógico</span>
                          <span className="text-[10px] text-slate-400">Geração LLM de textos opinativos baseados no desempenho.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_AI_PEDAGOGICAL_OPINION", !featureFlags.ENABLE_AI_PEDAGOGICAL_OPINION)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_AI_PEDAGOGICAL_OPINION ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_AI_PEDAGOGICAL_OPINION ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Plano de Intervenção Automático</span>
                          <span className="text-[10px] text-slate-400">Sistema injeta atividades recomendadas baseado nas lacunas.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_INTERVENTION_PLAN", !featureFlags.ENABLE_INTERVENTION_PLAN)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_INTERVENTION_PLAN ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_INTERVENTION_PLAN ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Visão Coordenador Escolar</span>
                          <span className="text-[10px] text-slate-400">Dashboards agregados multidimensionais de turmas.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_COORDINATOR_DASHBOARD", !featureFlags.ENABLE_COORDINATOR_DASHBOARD)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_COORDINATOR_DASHBOARD ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_COORDINATOR_DASHBOARD ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Relatório da Turma e Estudante</span>
                          <span className="text-[10px] text-slate-400">Ativa o módulo de visão consolidada e acompanhamento.</span>
                        </div>
                        <button onClick={() => {
                          handleToggleFeature("ENABLE_CLASS_ANALYTICS", !featureFlags.ENABLE_CLASS_ANALYTICS);
                          handleToggleFeature("ENABLE_STUDENT_ANALYTICS", !featureFlags.ENABLE_STUDENT_ANALYTICS);
                        }} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_CLASS_ANALYTICS ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_CLASS_ANALYTICS ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Exportação PDF</span>
                          <span className="text-[10px] text-slate-400">Permitir download e exportação.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_PDF_EXPORT", !featureFlags.ENABLE_PDF_EXPORT)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_PDF_EXPORT ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_PDF_EXPORT ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-6 rounded-xl border border-[#1e295b]/40">
                    <h3 className="text-sm font-bold font-mono text-emerald-400 mb-4 flex items-center gap-2">
                       <Sparkles className="w-4 h-4" />
                       Módulo 06: Assistente Pedagógico IA
                    </h3>
                    <div className="flex flex-col gap-3">
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Assistente IA Global</span>
                          <span className="text-[10px] text-slate-400">Ativa o módulo para gestores logados.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_TEACHER_AI_ASSISTANT", !featureFlags.ENABLE_TEACHER_AI_ASSISTANT)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_TEACHER_AI_ASSISTANT ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_TEACHER_AI_ASSISTANT ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Planejador de Aulas</span>
                          <span className="text-[10px] text-slate-400">Geração de script de aula, tempo, objetivos...</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_AI_LESSON_PLANNER", !featureFlags.ENABLE_AI_LESSON_PLANNER)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_AI_LESSON_PLANNER ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_AI_LESSON_PLANNER ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Gerador de Rubricas</span>
                          <span className="text-[10px] text-slate-400">Rubricas matriciais por critérios com IA.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_AI_RUBRIC_BUILDER", !featureFlags.ENABLE_AI_RUBRIC_BUILDER)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_AI_RUBRIC_BUILDER ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_AI_RUBRIC_BUILDER ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Simulados / Recuperação</span>
                          <span className="text-[10px] text-slate-400">Ativa endpoints IA de simulado e recuperação.</span>
                        </div>
                        <button onClick={() => {
                          handleToggleFeature("ENABLE_AI_SIMULATED_EXAMS", !featureFlags.ENABLE_AI_SIMULATED_EXAMS);
                          handleToggleFeature("ENABLE_AI_RECOVERY_PLAN", !featureFlags.ENABLE_AI_RECOVERY_PLAN);
                        }} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_AI_SIMULATED_EXAMS ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_AI_SIMULATED_EXAMS ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-6 rounded-xl border border-[#1e295b]/40">
                    <h3 className="text-sm font-bold font-mono text-emerald-400 mb-4 flex items-center gap-2">
                       <Sparkles className="w-4 h-4" />
                       Módulo 07: Automação e Notificações
                    </h3>
                    <div className="flex flex-col gap-3">
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Automação Pedagógica Global</span>
                          <span className="text-[10px] text-slate-400">Ativa o módulo de automação.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_PEDAGOGICAL_AUTOMATION", !featureFlags.ENABLE_PEDAGOGICAL_AUTOMATION)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_PEDAGOGICAL_AUTOMATION ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_PEDAGOGICAL_AUTOMATION ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Recuperação Automática</span>
                          <span className="text-[10px] text-slate-400">Geração de planos com IA com base no andamento diário.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_RECOVERY_AUTOMATION", !featureFlags.ENABLE_RECOVERY_AUTOMATION)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_RECOVERY_AUTOMATION ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_RECOVERY_AUTOMATION ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Comunicação e Notificações</span>
                          <span className="text-[10px] text-slate-400">Alertas in-app, lembretes de prazo e email (Resend).</span>
                        </div>
                        <button onClick={() => {
                          handleToggleFeature("ENABLE_STUDENT_NOTIFICATIONS", !featureFlags.ENABLE_STUDENT_NOTIFICATIONS);
                          handleToggleFeature("ENABLE_DEADLINE_REMINDERS", !featureFlags.ENABLE_DEADLINE_REMINDERS);
                          handleToggleFeature("ENABLE_EMAIL_COMMUNICATION", !featureFlags.ENABLE_EMAIL_COMMUNICATION);
                          handleToggleFeature("ENABLE_IN_APP_ALERTS", !featureFlags.ENABLE_IN_APP_ALERTS);
                        }} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_STUDENT_NOTIFICATIONS ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_STUDENT_NOTIFICATIONS ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-6 rounded-xl border border-[#1e295b]/40">
                    <h3 className="text-sm font-bold font-mono text-fuchsia-400 mb-4 flex items-center gap-2">
                       <Briefcase className="w-4 h-4" />
                       Módulo 08: Central de Operações & Produtividade
                    </h3>
                    <div className="flex flex-col gap-3">
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Central de Comando (Visão Global)</span>
                          <span className="text-[10px] text-slate-400">Ativa o hub unificado de gestão docente.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_TEACHER_COMMAND_CENTER", !featureFlags.ENABLE_TEACHER_COMMAND_CENTER)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_TEACHER_COMMAND_CENTER ? "bg-fuchsia-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_TEACHER_COMMAND_CENTER ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Operações e Correção em Lote</span>
                          <span className="text-[10px] text-slate-400">Ações massivas em relatórios e submissões.</span>
                        </div>
                        <button onClick={() => handleToggleFeature("ENABLE_BULK_OPERATIONS", !featureFlags.ENABLE_BULK_OPERATIONS)} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_BULK_OPERATIONS ? "bg-fuchsia-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_BULK_OPERATIONS ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#030712]/50 border border-slate-800/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200">Produtividade & Analytics (Opcionais)</span>
                          <span className="text-[10px] text-slate-400">Biblioteca, Planejadores, Workbenches.</span>
                        </div>
                        <button onClick={() => {
                          handleToggleFeature("ENABLE_TEACHER_TEMPLATES", !featureFlags.ENABLE_TEACHER_TEMPLATES);
                          handleToggleFeature("ENABLE_QUICK_FEEDBACK", !featureFlags.ENABLE_QUICK_FEEDBACK);
                          handleToggleFeature("ENABLE_CLASS_COMPARISON", !featureFlags.ENABLE_CLASS_COMPARISON);
                          handleToggleFeature("ENABLE_WEEKLY_PLANNER", !featureFlags.ENABLE_WEEKLY_PLANNER);
                          handleToggleFeature("ENABLE_RECOVERY_WORKBENCH", !featureFlags.ENABLE_RECOVERY_WORKBENCH);
                          handleToggleFeature("ENABLE_COORDINATION_REPORTS", !featureFlags.ENABLE_COORDINATION_REPORTS);
                          handleToggleFeature("ENABLE_TEACHER_PRODUCTIVITY_ANALYTICS", !featureFlags.ENABLE_TEACHER_PRODUCTIVITY_ANALYTICS);
                        }} className={`w-11 h-6 rounded-full transition-all duration-300 relative p-1 ${featureFlags.ENABLE_TEACHER_PRODUCTIVITY_ANALYTICS ? "bg-fuchsia-500" : "bg-slate-700"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${featureFlags.ENABLE_TEACHER_PRODUCTIVITY_ANALYTICS ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Right column: DB, Security, and Audit Logs */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* Card: Connection Details */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                    <div className="border-b border-[#1e295b]/20 pb-3">
                      <h3 className="text-sm font-bold text-slate-300 font-mono uppercase tracking-wider">Infraestrutura</h3>
                    </div>

                    <div className="p-4 rounded-xl bg-[#030712] border border-[#1e295b]/30 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Database Driver:</span>
                        <span className="font-mono text-slate-200 font-bold">Node-Postgres (PG)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Hospedagem Postgres:</span>
                        <span className="font-mono text-emerald-400 font-semibold truncate max-w-[150px]">Neon DB Cluster</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Isolamento Sandbox:</span>
                        <span className="font-mono text-emerald-400 font-bold">CONTAINER SECURE</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1e295b]/20">
                        <span className="text-slate-400">Timeout por Comando:</span>
                        <span className="font-mono text-slate-300 text-xs truncate">3000ms Estrito</span>
                      </div>
                    </div>
                  </div>

                  {/* Card: Audit Logs */}
                  <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-4">
                    <div className="border-b border-[#1e295b]/20 pb-2 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-amber-400 font-mono uppercase tracking-wider">Auditoria do Sistema</h3>
                      <button 
                        onClick={fetchAuditLogs}
                        className="text-[10px] font-mono text-slate-400 hover:text-white transition-all underline shrink-0 cursor-pointer"
                      >
                        Recarregar
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">Rastreamento de controle de alterações para conformidade pedagógica super-admin.</p>

                    <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log: any, index: number) => {
                          const dateObj = new Date(log.created_at);
                          const formattedTime = isNaN(dateObj.getTime()) 
                            ? "Hoje" 
                            : dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                          return (
                            <div key={index} className="p-2.5 rounded bg-[#030712]/60 border border-slate-800/40 text-[10px] font-mono leading-relaxed transition-all hover:border-[#1e295b]/30">
                              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-1 mb-1">
                                <span className="font-bold text-amber-500/90 truncate max-w-[120px]">{log.action || "AÇÃO"}</span>
                                <span>{formattedTime}</span>
                              </div>
                              <p className="text-slate-300 truncate font-sans text-[11px]" title={log.meta}>{log.meta || "Nenhum detalhe associado"}</p>
                              <div className="text-right text-[8px] text-slate-500 mt-1">Responsável: {log.user_id || "sistema"}</div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-[11px] text-slate-500 italic font-mono">
                          Nenhum log persistido no cluster
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

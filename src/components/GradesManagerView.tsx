import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { 
  Award, 
  Calculator, 
  Download, 
  Search, 
  Save, 
  Plus, 
  FileText, 
  CheckCircle2, 
  User, 
  Trash2, 
  BarChart2, 
  TrendingUp, 
  AlertTriangle, 
  Filter, 
  ArrowUpDown, 
  Sparkles, 
  MessageSquare, 
  Eye, 
  FileSpreadsheet, 
  Printer, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X,
  RefreshCw,
  Users
} from "lucide-react";
import { apiUrl } from "../config/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface GradesManagerViewProps {
  classes: any[];
  selectedClass: string;
  setSelectedClass: (id: string) => void;
  students: any[];
}

type CalculationMethod = "average" | "weighted" | "sum";
type SortOption = "name_asc" | "name_desc" | "grade_desc" | "grade_asc";
type FilterStatus = "all" | "approved" | "recovery" | "failing" | "ungraded";

export default function GradesManagerView({ classes, selectedClass, setSelectedClass, students }: GradesManagerViewProps) {
  // Activities list
  const [activities, setActivities] = useState<string[]>([]);
  // Activity weights (for weighted average)
  const [activityWeights, setActivityWeights] = useState<Record<string, number>>({});
  // grades map: "studentId_activityName" -> { id, grade, feedback, isAuto, isDirty, ... }
  const [gradesMap, setGradesMap] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passingGrade, setPassingGrade] = useState<number>(60);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>("sum");
  const [refreshKey, setRefreshKey] = useState(0);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityWeight, setNewActivityWeight] = useState<number>(1);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [showCharts, setShowCharts] = useState(true);
  
  // Modal for editing individual cell feedback
  const [editingCell, setEditingCell] = useState<{ studentId: string; studentName: string; activityName: string } | null>(null);
  const [modalData, setModalData] = useState<{ grade: string; feedback: string }>({ grade: "", feedback: "" });

  // Load passing grade and calculation method from localStorage
  useEffect(() => {
    if (selectedClass) {
      const savedGrade = localStorage.getItem(`passingGrade_${selectedClass}`);
      if (savedGrade !== null && !isNaN(parseFloat(savedGrade))) {
        setPassingGrade(parseFloat(savedGrade));
      } else {
        setPassingGrade(60);
      }

      const savedMethod = localStorage.getItem(`calcMethod_${selectedClass}`) as CalculationMethod;
      if (savedMethod && ["average", "weighted", "sum"].includes(savedMethod)) {
        setCalculationMethod(savedMethod);
      } else {
        setCalculationMethod("sum");
      }

      const savedWeights = localStorage.getItem(`actWeights_${selectedClass}`);
      if (savedWeights) {
        try {
          setActivityWeights(JSON.parse(savedWeights));
        } catch {
          setActivityWeights({});
        }
      }
    }
  }, [selectedClass]);

  const handlePassingGradeChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 60 : val));
    setPassingGrade(clamped);
    if (selectedClass) {
      localStorage.setItem(`passingGrade_${selectedClass}`, clamped.toString());
    }
  };

  const handleCalculationMethodChange = (method: CalculationMethod) => {
    setCalculationMethod(method);
    if (selectedClass) {
      localStorage.setItem(`calcMethod_${selectedClass}`, method);
    }
    toast.success(`Método de cálculo alterado para: ${
      method === "average" ? "Média Aritmética" : method === "weighted" ? "Média Ponderada" : "Soma de Pontos"
    }`);
  };

  // Fetch grades from backend and correction vault
  useEffect(() => {
    if (!selectedClass) {
      setActivities([]);
      setGradesMap({});
      return;
    }
    setLoading(true);
    
    Promise.all([
      fetch(apiUrl(`/api/grades/${encodeURIComponent(selectedClass)}`)).then(r => r.json()).catch(() => []),
      fetch(apiUrl(`/api/correction-vault?class_id=${encodeURIComponent(selectedClass)}`)).then(r => r.json()).catch(() => ({ success: false, data: [] }))
    ])
    .then(([gradesData, vaultRes]) => {
      const gMap: Record<string, any> = {};
      const actSet = new Set<string>();
      
      // 1. Import auto-grades from Correction Vault
      if (vaultRes?.success && Array.isArray(vaultRes.data)) {
        vaultRes.data.forEach((v: any) => {
          const actName = v.activity_title || `Prática ${v.activity_id || ''}`.trim();
          if (!v.student_id) return;
          
          const key = `${v.student_id}_${actName}`;
          const currentScore = v.score !== null && v.score !== undefined ? v.score : (v.percentage || 0);
          
          if (!gMap[key] || parseFloat(gMap[key].grade) < parseFloat(currentScore)) {
            gMap[key] = {
              student_id: v.student_id,
              activity_name: actName,
              grade: currentScore,
              feedback: v.feedback || v.ai_feedback || '',
              isAuto: true,
              vault_id: v.id,
              isDirty: false
            };
            actSet.add(actName);
          }
        });
      }

      // 2. Import stored manual grades
      if (Array.isArray(gradesData)) {
        gradesData.forEach((g: any) => {
          const key = `${g.student_id}_${g.activity_name}`;
          gMap[key] = {
            ...gMap[key],
            ...g,
            isDirty: false
          };
          actSet.add(g.activity_name);
        });
      }
      
      setGradesMap(gMap);
      const actList = Array.from(actSet);
      setActivities(actList);

      // Initialize default weights if not set
      setActivityWeights(prev => {
        const next = { ...prev };
        actList.forEach(act => {
          if (!next[act]) next[act] = 1;
        });
        return next;
      });
    })
    .catch(e => {
      console.error("Error fetching grades data", e);
      toast.error("Erro ao sincronizar notas da turma.");
    })
    .finally(() => setLoading(false));
  }, [selectedClass, refreshKey]);

  // Open modal for editing feedback on a cell
  const openCellModal = (studentId: string, studentName: string, activityName: string) => {
    const key = `${studentId}_${activityName}`;
    const item = gradesMap[key] || {};
    setEditingCell({ studentId, studentName, activityName });
    setModalData({
      grade: item.grade !== undefined && item.grade !== null ? String(item.grade) : "",
      feedback: item.feedback || ""
    });
  };

  const closeCellModal = () => {
    setEditingCell(null);
  };

  const saveCellModal = () => {
    if (!editingCell) return;
    const { studentId, activityName } = editingCell;
    const key = `${studentId}_${activityName}`;
    setGradesMap(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { student_id: studentId, activity_name: activityName }),
        grade: modalData.grade === "" ? null : parseFloat(modalData.grade),
        feedback: modalData.feedback,
        isDirty: true
      }
    }));
    toast.success("Feedback e nota atualizados localmente.");
    closeCellModal();
  };

  const handleGradeChange = (studentId: string, activityName: string, value: string) => {
    const key = `${studentId}_${activityName}`;
    const numVal = value === "" ? "" : parseFloat(value);
    setGradesMap(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { student_id: studentId, activity_name: activityName }),
        grade: numVal,
        isDirty: true
      }
    }));
  };

  const handleWeightChange = (actName: string, weightVal: number) => {
    const validWeight = Math.max(0.1, isNaN(weightVal) ? 1 : weightVal);
    const updated = { ...activityWeights, [actName]: validWeight };
    setActivityWeights(updated);
    if (selectedClass) {
      localStorage.setItem(`actWeights_${selectedClass}`, JSON.stringify(updated));
    }
  };

  const handleAddActivity = () => {
    const trimmed = newActivityName.trim();
    if (!trimmed) {
      toast.error("Informe um nome para a avaliação.");
      return;
    }
    if (activities.includes(trimmed)) {
      toast.error("Já existe uma avaliação com este nome.");
      return;
    }
    setActivities(prev => [...prev, trimmed]);
    handleWeightChange(trimmed, newActivityWeight || 1);
    setNewActivityName("");
    setNewActivityWeight(1);
    setShowAddActivityModal(false);
    toast.success(`Avaliação "${trimmed}" adicionada!`);
  };

  const handleDeleteActivity = async (actName: string) => {
    // Collect DB IDs to delete
    const toDeleteIds: string[] = [];
    for (const st of students) {
      const key = `${st.id}_${actName}`;
      if (gradesMap[key]?.id) {
        toDeleteIds.push(gradesMap[key].id);
      }
    }
    
    for (const id of toDeleteIds) {
      try {
        await fetch(apiUrl(`/api/grades/${id}`), { method: "DELETE" });
      } catch (e) {}
    }
    
    setActivities(prev => prev.filter(a => a !== actName));
    setGradesMap(prev => {
      const nextMap = { ...prev };
      for (const st of students) {
        delete nextMap[`${st.id}_${actName}`];
      }
      return nextMap;
    });

    const nextWeights = { ...activityWeights };
    delete nextWeights[actName];
    setActivityWeights(nextWeights);

    toast.success(`Avaliação "${actName}" removida.`);
  };

  // Save changes to PostgreSQL
  const saveGrades = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const dirtyKeys = Object.keys(gradesMap).filter(k => gradesMap[k].isDirty);
      
      const updatesToSave = dirtyKeys.map(key => {
        const item = gradesMap[key];
        return {
          student_id: item.student_id,
          class_id: selectedClass,
          activity_name: item.activity_name,
          grade: item.grade === "" || item.grade === null || item.grade === undefined ? null : parseFloat(item.grade),
          feedback: item.feedback || ""
        };
      }).filter(item => item.grade !== undefined);

      if (updatesToSave.length > 0) {
        const res = await fetch(apiUrl("/api/grades/update"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grades: updatesToSave })
        });
        const result = await res.json();
        
        if (result.success && result.results) {
          result.results.forEach((r: any, idx: number) => {
            const reqItem = updatesToSave[idx];
            const key = `${reqItem.student_id}_${reqItem.activity_name}`;
            if (gradesMap[key]) {
              gradesMap[key].id = r.id;
              gradesMap[key].isDirty = false;
            }
          });
        }
      }
      
      setGradesMap({ ...gradesMap });
      setSaveSuccess(true);
      toast.success(`${updatesToSave.length} notas salvas no banco com sucesso!`);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving grades", err);
      toast.error("Houve um erro ao salvar as notas.");
    } finally {
      setSaving(false);
    }
  };

  // Calculation of student final grade
  const calculateStudentFinalGrade = (studentId: string): number | null => {
    if (activities.length === 0) return null;
    
    const validActs = activities.filter(act => act !== "Nota Final");
    if (validActs.length === 0) return null;

    if (calculationMethod === "sum") {
      let sum = 0;
      let count = 0;
      validActs.forEach(act => {
        const key = `${studentId}_${act}`;
        const g = gradesMap[key]?.grade;
        if (g !== undefined && g !== null && g !== "") {
          sum += parseFloat(g);
          count++;
        }
      });
      return count > 0 ? Number(sum.toFixed(1)) : null;
    }

    if (calculationMethod === "weighted") {
      let weightedSum = 0;
      let totalWeight = 0;
      validActs.forEach(act => {
        const key = `${studentId}_${act}`;
        const g = gradesMap[key]?.grade;
        const weight = activityWeights[act] || 1;
        if (g !== undefined && g !== null && g !== "") {
          weightedSum += parseFloat(g) * weight;
          totalWeight += weight;
        }
      });
      return totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(1)) : null;
    }

    // Default: simple average
    let sum = 0;
    let count = 0;
    validActs.forEach(act => {
      const key = `${studentId}_${act}`;
      const g = gradesMap[key]?.grade;
      if (g !== undefined && g !== null && g !== "") {
        sum += parseFloat(g);
        count++;
      }
    });
    return count > 0 ? Number((sum / count).toFixed(1)) : null;
  };

  // Calculate and apply "Nota Final" column for all students
  const handleApplyFinalGradesColumn = () => {
    if (activities.length === 0) {
      toast.error("Adicione avaliações antes de calcular a média final.");
      return;
    }

    const colName = "Nota Final";
    if (!activities.includes(colName)) {
      setActivities(prev => [...prev, colName]);
    }

    setGradesMap(prev => {
      const next = { ...prev };
      students.forEach(st => {
        const finalVal = calculateStudentFinalGrade(st.id);
        if (finalVal !== null) {
          const key = `${st.id}_${colName}`;
          next[key] = {
            ...(next[key] || { student_id: st.id, activity_name: colName }),
            grade: finalVal,
            isDirty: true
          };
        }
      });
      return next;
    });

    toast.success("Coluna 'Nota Final' calculada e preenchida para toda a turma!");
  };

  // Student metrics & situations
  const studentMetrics = useMemo(() => {
    return students.map(st => {
      const finalGrade = calculateStudentFinalGrade(st.id);
      let status: "approved" | "recovery" | "failing" | "ungraded" = "ungraded";
      
      if (finalGrade !== null) {
        if (finalGrade >= passingGrade) {
          status = "approved";
        } else if (finalGrade >= passingGrade - 20) {
          status = "recovery";
        } else {
          status = "failing";
        }
      }

      return {
        student: st,
        finalGrade,
        status
      };
    });
  }, [students, activities, gradesMap, calculationMethod, activityWeights, passingGrade]);

  // Overall Class Statistics
  const classStats = useMemo(() => {
    const gradedList = studentMetrics.filter(m => m.finalGrade !== null);
    if (gradedList.length === 0) {
      return {
        totalStudents: students.length,
        gradedCount: 0,
        average: 0,
        approvedCount: 0,
        recoveryCount: 0,
        failingCount: 0,
        approvalRate: 0,
        highestGrade: 0,
        lowestGrade: 0,
        distribution: [
          { range: "80 - 100 (Excelente)", count: 0, color: "#10b981" },
          { range: "60 - 79 (Aprovado)", count: 0, color: "#6366f1" },
          { range: "40 - 59 (Recuperação)", count: 0, color: "#f59e0b" },
          { range: "0 - 39 (Crítico)", count: 0, color: "#ef4444" }
        ]
      };
    }

    const grades = gradedList.map(m => m.finalGrade as number);
    const sum = grades.reduce((acc, g) => acc + g, 0);
    const avg = Number((sum / grades.length).toFixed(1));
    const approved = gradedList.filter(m => m.status === "approved").length;
    const recovery = gradedList.filter(m => m.status === "recovery").length;
    const failing = gradedList.filter(m => m.status === "failing").length;
    const approvalRate = Number(((approved / gradedList.length) * 100).toFixed(1));

    const distribution = [
      { range: "80 - 100 (Excelente)", count: grades.filter(g => g >= 80).length, color: "#10b981" },
      { range: "60 - 79 (Aprovado)", count: grades.filter(g => g >= 60 && g < 80).length, color: "#6366f1" },
      { range: "40 - 59 (Recuperação)", count: grades.filter(g => g >= 40 && g < 60).length, color: "#f59e0b" },
      { range: "0 - 39 (Crítico)", count: grades.filter(g => g < 40).length, color: "#ef4444" }
    ];

    return {
      totalStudents: students.length,
      gradedCount: gradedList.length,
      average: avg,
      approvedCount: approved,
      recoveryCount: recovery,
      failingCount: failing,
      approvalRate,
      highestGrade: Math.max(...grades),
      lowestGrade: Math.min(...grades),
      distribution
    };
  }, [studentMetrics, students]);

  // Activity-by-activity averages
  const activityAverages = useMemo(() => {
    return activities.map(act => {
      let sum = 0;
      let count = 0;
      students.forEach(st => {
        const g = gradesMap[`${st.id}_${act}`]?.grade;
        if (g !== undefined && g !== null && g !== "") {
          sum += parseFloat(g);
          count++;
        }
      });
      return {
        activityName: act,
        weight: activityWeights[act] || 1,
        average: count > 0 ? Number((sum / count).toFixed(1)) : null,
        count
      };
    });
  }, [activities, students, gradesMap, activityWeights]);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let list = studentMetrics.filter(m => {
      const matchSearch = m.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.student.enrollment_code && m.student.enrollment_code.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchSearch) return false;
      if (filterStatus === "all") return true;
      return m.status === filterStatus;
    });

    list.sort((a, b) => {
      if (sortBy === "name_asc") return a.student.name.localeCompare(b.student.name);
      if (sortBy === "name_desc") return b.student.name.localeCompare(a.student.name);
      if (sortBy === "grade_desc") return (b.finalGrade ?? -1) - (a.finalGrade ?? -1);
      if (sortBy === "grade_asc") return (a.finalGrade ?? 999) - (b.finalGrade ?? 999);
      return 0;
    });

    return list;
  }, [studentMetrics, searchQuery, filterStatus, sortBy]);

  const hasUnsavedChanges = Object.values(gradesMap).some((item: any) => item.isDirty);
  const selectedClassObj = classes.find(c => c.id === selectedClass);
  const className = selectedClassObj ? selectedClassObj.name : "Turma";

  // Export official PDF Caderneta
  const handleExportOfficialPDF = () => {
    if (!selectedClass || students.length === 0) {
      toast.error("Selecione uma turma com alunos matriculados.");
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const dateStr = new Date().toLocaleDateString("pt-BR");

      // Institutional Header
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, 297, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("SENAI - SISTEMA DE AVALIAÇÃO E GESTÃO DE NOTAS", 14, 11);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(`Caderneta Oficial de Avaliação • Emitido em: ${dateStr}`, 14, 18);

      // Class Information Banner
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text(`Turma: ${className}`, 14, 32);
      doc.setFont("helvetica", "normal");
      doc.text(`Curso: ${selectedClassObj?.course || "Desenvolvimento de Sistemas"} | Módulo: ${selectedClassObj?.module || "Semestral"}`, 14, 38);
      doc.text(`Nota de Corte: ${passingGrade} | Média da Turma: ${classStats.average} | Taxa de Aprovação: ${classStats.approvalRate}%`, 14, 44);

      // Table preparation
      const tableHeaders = [
        "Matrícula",
        "Estudante",
        ...activities.map(a => `${a} (P:${activityWeights[a] || 1})`),
        "Média Final",
        "Situação"
      ];

      const tableRows = filteredAndSortedStudents.map(m => {
        const st = m.student;
        const actGrades = activities.map(act => {
          const g = gradesMap[`${st.id}_${act}`]?.grade;
          return g !== undefined && g !== null && g !== "" ? String(g) : "-";
        });

        const situationStr = m.status === "approved" ? "Aprovado" : m.status === "recovery" ? "Recuperação" : m.status === "failing" ? "Reprovado" : "Pendente";

        return [
          st.enrollment_code || "N/A",
          st.name,
          ...actGrades,
          m.finalGrade !== null ? String(m.finalGrade) : "-",
          situationStr
        ];
      });

      // Activity average row
      const avgRow = [
        "-",
        "MÉDIA DA TURMA",
        ...activityAverages.map(a => a.average !== null ? String(a.average) : "-"),
        String(classStats.average),
        `${classStats.approvalRate}% Aprov.`
      ];
      tableRows.push(avgRow);

      autoTable(doc, {
        startY: 48,
        head: [tableHeaders],
        body: tableRows,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          lineColor: [226, 232, 240],
          textColor: [30, 41, 59]
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold"
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didParseCell: (data) => {
          // Highlight situation column
          if (data.section === "body" && data.column.index === tableHeaders.length - 1) {
            const val = String(data.cell.raw);
            if (val === "Aprovado") data.cell.styles.textColor = [16, 185, 129];
            if (val === "Recuperação") data.cell.styles.textColor = [245, 158, 11];
            if (val === "Reprovado") data.cell.styles.textColor = [239, 68, 68];
          }
          // Highlight footer row
          if (data.section === "body" && data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [241, 245, 249];
          }
        }
      });

      // Footer signature space
      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      if (finalY < 180) {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("____________________________________________", 40, finalY + 18);
        doc.text("Assinatura do Docente Responsável", 52, finalY + 23);

        doc.text("____________________________________________", 180, finalY + 18);
        doc.text("Coordenação Pedagógica SENAI", 195, finalY + 23);
      }

      doc.save(`Caderneta_Notas_${className.replace(/\s+/g, "_")}_${dateStr.replace(/\//g, "-")}.pdf`);
      toast.success("Caderneta em PDF gerada com sucesso!");
    } catch (e: any) {
      console.error("PDF Export error:", e);
      toast.error("Erro ao gerar PDF da caderneta.");
    }
  };

  // Export Excel (XLSX)
  const handleExportXLSX = () => {
    if (!selectedClass || students.length === 0) {
      toast.error("Selecione uma turma com alunos matriculados.");
      return;
    }

    try {
      const dataRows = filteredAndSortedStudents.map(m => {
        const row: Record<string, any> = {
          "Matrícula": m.student.enrollment_code || "N/A",
          "Nome do Aluno": m.student.name
        };

        activities.forEach(act => {
          const key = `${m.student.id}_${act}`;
          const g = gradesMap[key]?.grade;
          row[act] = g !== undefined && g !== null && g !== "" ? parseFloat(g) : "";
        });

        row["Média Final"] = m.finalGrade !== null ? m.finalGrade : "";
        row["Situação"] = m.status === "approved" ? "Aprovado" : m.status === "recovery" ? "Recuperação" : m.status === "failing" ? "Reprovado" : "Sem Notas";
        
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Notas");

      XLSX.writeFile(workbook, `Caderneta_${className.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Planilha Excel exportada com sucesso!");
    } catch (e: any) {
      console.error("XLSX Export Error:", e);
      toast.error("Erro ao exportar planilha Excel.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Top Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#1e295b]/30 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white font-display">Caderneta & Gestão de Notas</h2>
              <p className="text-xs text-slate-400 mt-0.5">Matriz de avaliações, cálculo dinâmico de médias e pareceres por competência.</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Class selector */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-[#0f172a] border border-[#1e295b] hover:border-emerald-500/40 text-xs font-mono font-bold text-white rounded-xl px-4 py-2.5 outline-none cursor-pointer pr-9 shadow-inner transition-all"
            >
              <option value="">Selecione uma Turma...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.course ? `(${cls.course})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          {selectedClass && (
            <>
              {/* Save Button */}
              <button
                onClick={saveGrades}
                disabled={saving || !hasUnsavedChanges}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  hasUnsavedChanges 
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 animate-pulse" 
                    : "bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed"
                }`}
                title="Salvar alterações no banco de dados"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? "Salvando..." : saveSuccess ? "Salvo!" : hasUnsavedChanges ? "Salvar Alterações" : "Notas Salvas"}</span>
              </button>

              {/* Add Activity Button */}
              <button
                onClick={() => setShowAddActivityModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-[#172554] hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all border border-blue-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Avaliação
              </button>

              {/* Export Dropdown / Buttons */}
              <button
                onClick={handleExportOfficialPDF}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                title="Exportar Caderneta em PDF Oficial"
              >
                <Printer className="w-4 h-4" /> PDF Oficial
              </button>

              <button
                onClick={handleExportXLSX}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                title="Exportar Planilha Excel"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel (XLSX)
              </button>
            </>
          )}
        </div>
      </div>

      {!selectedClass ? (
        <div className="p-16 text-center border border-dashed border-[#1e295b]/40 rounded-3xl bg-[#0f172a]/40 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-white text-base font-bold">Nenhuma turma selecionada</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Escolha uma turma no seletor acima para visualizar e gerenciar as notas, médias e feedbacks de todos os estudantes.
          </p>
        </div>
      ) : (
        <>
          {/* Cockpit Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Card 1: Média Geral */}
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold uppercase">
                <span>Média Geral</span>
                <Calculator className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono ${
                  classStats.average >= passingGrade ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {classStats.average}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">/ 100</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                {classStats.gradedCount} de {classStats.totalStudents} alunos avaliados
              </div>
            </div>

            {/* Card 2: Taxa de Aprovação */}
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold uppercase">
                <span>Taxa de Aprovação</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">{classStats.approvalRate}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${classStats.approvalRate}%` }} 
                />
              </div>
            </div>

            {/* Card 3: Aprovados */}
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold uppercase">
                <span>Aprovados</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">{classStats.approvedCount}</span>
                <span className="text-[10px] text-slate-500 font-mono">alunos</span>
              </div>
              <div className="mt-2 text-[10px] text-emerald-400/80 font-mono">
                Média &ge; {passingGrade} pts
              </div>
            </div>

            {/* Card 4: Recuperação / Risco */}
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold uppercase">
                <span>Em Atenção / Risco</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {classStats.recoveryCount + classStats.failingCount}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">alunos</span>
              </div>
              <div className="mt-2 text-[10px] text-amber-400/80 font-mono">
                {classStats.recoveryCount} recup. • {classStats.failingCount} crítico
              </div>
            </div>

            {/* Card 5: Extremos */}
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold uppercase">
                <span>Amplitude de Notas</span>
                <BarChart2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Maior</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{classStats.highestGrade}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 uppercase block">Menor</span>
                  <span className="text-lg font-bold font-mono text-rose-400">{classStats.lowestGrade}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                {activities.length} avaliações cadastradas
              </div>
            </div>

          </div>

          {/* Quick Config Bar: Passing Grade & Calc Method */}
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Passing Grade Slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-300">Nota de Corte:</span>
                <input
                  type="range"
                  min="40"
                  max="80"
                  step="5"
                  value={passingGrade}
                  onChange={(e) => handlePassingGradeChange(parseFloat(e.target.value))}
                  className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {passingGrade} pts
                </span>
              </div>

              {/* Calculation Method Selection */}
              <div className="flex items-center gap-2 border-l border-[#1e295b]/60 pl-4">
                <span className="text-xs font-mono font-bold text-slate-300">Cálculo:</span>
                <div className="flex items-center bg-[#030712] rounded-xl p-1 border border-slate-800">
                  <button
                    onClick={() => handleCalculationMethodChange("average")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      calculationMethod === "average" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Média Simples
                  </button>
                  <button
                    onClick={() => handleCalculationMethodChange("weighted")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      calculationMethod === "weighted" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Média Ponderada
                  </button>
                  <button
                    onClick={() => handleCalculationMethodChange("sum")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      calculationMethod === "sum" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Soma de Pontos
                  </button>
                </div>
              </div>
            </div>

            {/* Right Tools: Calculate all & Toggle Charts */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyFinalGradesColumn}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Calcular e fixar coluna de Média Final"
              >
                <Calculator className="w-3.5 h-3.5" /> Calcular Médias da Turma
              </button>
              
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>{showCharts ? "Ocultar Gráficos" : "Ver Gráficos"}</span>
              </button>
            </div>
          </div>

          {/* Performance Charts (Toggleable) */}
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution Chart */}
              <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col">
                <div className="flex items-center justify-between border-b border-[#1e295b]/20 pb-3 mb-4">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    Distribuição de Desempenho da Turma
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Faixas de Aproveitamento</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classStats.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e295b" vertical={false} opacity={0.5} />
                      <XAxis dataKey="range" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e295b", borderRadius: 12, fontSize: 11 }} 
                        formatter={(val) => [`${val} estudantes`, "Quantidade"]}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {classStats.distribution.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Difficulty Averages Chart */}
              <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e295b]/40 flex flex-col">
                <div className="flex items-center justify-between border-b border-[#1e295b]/20 pb-3 mb-4">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Média por Avaliação / Atividade
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Identificação de Gargalos</span>
                </div>
                <div className="h-56 w-full">
                  {activityAverages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                      Nenhuma avaliação registrada ainda.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityAverages} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e295b" vertical={false} opacity={0.5} />
                        <XAxis dataKey="activityName" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                        <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e295b", borderRadius: 12, fontSize: 11 }} 
                          formatter={(val) => [`${val} pts`, "Média"]}
                        />
                        <Bar dataKey="average" fill="#6366f1" radius={[6, 6, 0, 0]}>
                          {activityAverages.map((entry, idx) => (
                            <Cell key={`act-${idx}`} fill={(entry.average || 0) >= passingGrade ? "#10b981" : "#f59e0b"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Table Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#0f172a] p-4 rounded-2xl border border-[#1e295b]/40">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome ou matrícula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter and Sort options */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="bg-[#030712] border border-slate-800 text-xs font-bold text-slate-300 rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="all">Todos os Alunos ({students.length})</option>
                  <option value="approved">Aprovados ({classStats.approvedCount})</option>
                  <option value="recovery">Recuperação ({classStats.recoveryCount})</option>
                  <option value="failing">Reprovados ({classStats.failingCount})</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-[#030712] border border-slate-800 text-xs font-bold text-slate-300 rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="name_asc">Nome (A &rarr; Z)</option>
                  <option value="name_desc">Nome (Z &rarr; A)</option>
                  <option value="grade_desc">Maior Média</option>
                  <option value="grade_asc">Menor Média</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grades Matrix Table */}
          <div className="rounded-2xl border border-[#1e295b]/40 bg-[#0f172a] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1e295b] bg-[#030712]/70 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5 pl-5 font-bold w-12 text-center">#</th>
                    <th className="p-3.5 font-bold min-w-[200px]">Estudante</th>
                    <th className="p-3.5 font-bold min-w-[120px]">Matrícula</th>
                    
                    {/* Activity dynamic columns */}
                    {activities.map((act) => (
                      <th key={act} className="p-3.5 text-center min-w-[140px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-white text-xs truncate max-w-[120px]" title={act}>
                            {act}
                          </span>
                          <div className="flex items-center gap-1">
                            {calculationMethod === "weighted" && act !== "Nota Final" && (
                              <input
                                type="number"
                                min="0.1"
                                max="10"
                                step="0.5"
                                value={activityWeights[act] || 1}
                                onChange={(e) => handleWeightChange(act, parseFloat(e.target.value))}
                                className="w-12 bg-slate-900 border border-slate-700 text-[10px] text-center text-emerald-400 rounded px-1 py-0.5 font-mono"
                                title="Peso da avaliação"
                              />
                            )}
                            <button
                              onClick={() => handleDeleteActivity(act)}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                              title={`Excluir avaliação "${act}"`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}

                    <th className="p-3.5 text-center font-bold text-emerald-400 min-w-[120px] bg-emerald-500/5">
                      Média Final
                    </th>
                    <th className="p-3.5 text-center font-bold min-w-[130px] pr-5">
                      Situação
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1e295b]/30 text-xs font-mono">
                  {filteredAndSortedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={activities.length + 5} className="p-12 text-center text-slate-500 italic">
                        Nenhum estudante encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedStudents.map((m, idx) => {
                      const st = m.student;
                      const finalGrade = m.finalGrade;

                      return (
                        <tr 
                          key={st.id} 
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="p-3 pl-5 text-center text-slate-500 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-sans font-semibold text-slate-200">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-mono text-emerald-400 font-bold border border-slate-700">
                                {st.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[180px]">{st.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {st.enrollment_code || "N/A"}
                          </td>

                          {/* Grades input cells */}
                          {activities.map((act) => {
                            const key = `${st.id}_${act}`;
                            const item = gradesMap[key] || {};
                            const gradeVal = item.grade !== undefined && item.grade !== null ? item.grade : "";
                            const hasFeedback = !!item.feedback;
                            const isAuto = !!item.isAuto;

                            // Dynamic cell color based on score
                            let inputColorClass = "border-slate-800 bg-[#030712] text-slate-200";
                            if (gradeVal !== "") {
                              const num = parseFloat(gradeVal);
                              if (num >= 60) inputColorClass = "border-emerald-500/30 bg-emerald-500/5 text-emerald-300 font-bold";
                              else if (num >= 40) inputColorClass = "border-amber-500/30 bg-amber-500/5 text-amber-300 font-bold";
                              else inputColorClass = "border-rose-500/30 bg-rose-500/5 text-rose-400 font-bold";
                            }

                            return (
                              <td key={act} className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={gradeVal}
                                    onChange={(e) => handleGradeChange(st.id, act, e.target.value)}
                                    placeholder="-"
                                    className={`w-16 h-8 text-center text-xs rounded-lg border outline-none transition-all focus:ring-1 focus:ring-emerald-500 ${inputColorClass}`}
                                  />
                                  
                                  {/* Feedback modal toggle button */}
                                  <button
                                    onClick={() => openCellModal(st.id, st.name, act)}
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                      hasFeedback 
                                        ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" 
                                        : "text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100"
                                    }`}
                                    title={hasFeedback ? `Feedback: ${item.feedback}` : "Adicionar parecer/feedback"}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            );
                          })}

                          {/* Final Average Column */}
                          <td className="p-3 text-center bg-emerald-500/5">
                            <span className={`font-mono text-sm font-black ${
                              finalGrade === null ? "text-slate-600" :
                              finalGrade >= passingGrade ? "text-emerald-400" :
                              finalGrade >= passingGrade - 20 ? "text-amber-400" : "text-rose-400"
                            }`}>
                              {finalGrade !== null ? finalGrade : "-"}
                            </span>
                          </td>

                          {/* Situation Badge */}
                          <td className="p-3 text-center pr-5">
                            {m.status === "approved" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Aprovado
                              </span>
                            )}
                            {m.status === "recovery" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Recuperação
                              </span>
                            )}
                            {m.status === "failing" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                Reprovado
                              </span>
                            )}
                            {m.status === "ungraded" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                                Sem Notas
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Footer with activity averages */}
                {activities.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#1e295b] bg-[#030712] font-mono text-xs">
                      <td colSpan={3} className="p-3.5 pl-5 font-bold text-slate-300 text-right uppercase">
                        Média da Turma:
                      </td>
                      {activityAverages.map((a) => (
                        <td key={`foot-${a.activityName}`} className="p-3 text-center font-bold">
                          <span className={`${
                            a.average === null ? "text-slate-600" :
                            a.average >= passingGrade ? "text-emerald-400" : "text-amber-400"
                          }`}>
                            {a.average !== null ? a.average : "-"}
                          </span>
                        </td>
                      ))}
                      <td className="p-3 text-center font-black text-emerald-400 bg-emerald-500/10">
                        {classStats.average}
                      </td>
                      <td className="p-3 text-center text-slate-400 text-[11px] pr-5">
                        {classStats.approvalRate}% Aprov.
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Adicionar Nova Avaliação */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Nova Avaliação / Coluna
              </h3>
              <button 
                onClick={() => setShowAddActivityModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1">
                  Nome da Avaliação / Instrumento:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Prova 01, Projeto Final, Lista 03..."
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="w-full bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1">
                  Peso da Avaliação (Ponderação):
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.5"
                  value={newActivityWeight}
                  onChange={(e) => setNewActivityWeight(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Usado para cálculo quando o método "Média Ponderada" estiver selecionado.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddActivityModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddActivity}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Feedback e Observação Individual da Célula */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  Parecer & Nota da Avaliação
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estudante: <span className="text-white font-bold">{editingCell.studentName}</span> • Atividade: <span className="text-emerald-400 font-bold">{editingCell.activityName}</span>
                </p>
              </div>
              <button 
                onClick={closeCellModal}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1">
                  Nota Obtida (0 a 100):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={modalData.grade}
                  onChange={(e) => setModalData({ ...modalData, grade: e.target.value })}
                  placeholder="Ex: 85.0"
                  className="w-full bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1">
                  Parecer Pedagógico / Feedback Individual:
                </label>
                <textarea
                  rows={4}
                  placeholder="Escreva comentários qualitativos, pontos fortes demonstrados pelo aluno e recomendações de evolução..."
                  value={modalData.feedback}
                  onChange={(e) => setModalData({ ...modalData, feedback: e.target.value })}
                  className="w-full bg-[#030712] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={closeCellModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={saveCellModal}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

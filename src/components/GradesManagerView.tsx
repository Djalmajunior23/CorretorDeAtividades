import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { BookOpen, Calculator, Download, Search, Save, Plus, FileText, CheckCircle2, User, Award, Trash2, BarChart2 } from "lucide-react";
import { apiUrl } from "../config/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export interface GradesManagerViewProps {
  classes: any[];
  selectedClass: string;
  setSelectedClass: (id: string) => void;
  students: any[];
}

export default function GradesManagerView({ classes, selectedClass, setSelectedClass, students }: GradesManagerViewProps) {
        
  // Data structures for grades matrix
  // activities is just a list of activity names
  const [activities, setActivities] = useState<string[]>([]);
  // grades map: "studentId_activityName" -> { id, grade, feedback }
  const [gradesMap, setGradesMap] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newActivityName, setNewActivityName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [editingCell, setEditingCell] = useState<{studentId: string, activityName: string} | null>(null);
  const [modalData, setModalData] = useState<{grade: string, feedback: string}>({ grade: "", feedback: "" });
  
  
  useEffect(() => {
    if (!selectedClass) {
      
      setActivities([]);
      setGradesMap({});
      return;
    }
    setLoading(true);
    
        // Using students passed from App.tsx (correctorStudents)
    Promise.all([
      
      fetch(apiUrl(`/api/grades/${encodeURIComponent(selectedClass)}`)).then(r => r.json()),
      fetch(apiUrl(`/api/correction-vault?class_id=${encodeURIComponent(selectedClass)}`)).then(r => r.json())
    ])
    .then(([gradesData, vaultRes]) => {
      // Students are now from props
      
      const gMap: Record<string, any> = {};
      const actSet = new Set<string>();
      
      // 1. Import auto-grades from Correction Vault
      if (vaultRes?.success && Array.isArray(vaultRes.data)) {
        vaultRes.data.forEach((v: any) => {
          const actName = v.activity_title || `Sandbox ${v.activity_id || ''}`.trim();
          if (!v.student_id) return; // Skip if no student ID linked
          
          const key = `${v.student_id}_${actName}`;
          
          // If student has multiple submissions for same activity, keep the highest score
          const currentScore = v.score !== null && v.score !== undefined ? v.score : (v.percentage || 0);
          
          if (!gMap[key] || parseFloat(gMap[key].grade) < parseFloat(currentScore)) {
            gMap[key] = {
              student_id: v.student_id,
              activity_name: actName,
              grade: currentScore,
              feedback: v.feedback || '',
              isAuto: true,
              vault_id: v.id,
              isDirty: false
            };
            actSet.add(actName);
          }
        });
      }

      // 2. Import manual overrides
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
      setActivities(Array.from(actSet));
    })
    .catch(e => console.error("Error fetching grades data", e))
    .finally(() => setLoading(false));
  }, [selectedClass, refreshKey]);

  const openCellModal = (studentId: string, activityName: string) => {
    const key = `${studentId}_${activityName}`;
    const item = gradesMap[key] || {};
    setEditingCell({ studentId, activityName });
    setModalData({
      grade: item.grade ?? "",
      feedback: item.feedback ?? ""
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
        grade: modalData.grade,
        feedback: modalData.feedback,
        isDirty: true
      }
    }));
    closeCellModal();
  };

  const handleGradeChange = (studentId: string, activityName: string, value: string) => {
    const key = `${studentId}_${activityName}`;
    setGradesMap(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { student_id: studentId, activity_name: activityName }),
        grade: value,
        isDirty: true
      }
    }));
  };

  
  
  const handleAutoFillFinalGradeForStudent = (studentId: string) => {
    if (activities.length === 0) {
      toast.error("Não há avaliações para calcular a média deste aluno.");
      return;
    }
    
    const colName = "Nota Final";
    if (!activities.includes(colName)) {
      setActivities(prev => [...prev, colName]);
    }
    
    const actsToAvg = activities.filter(a => a !== colName);
    
    setGradesMap(prev => {
      let sum = 0;
      let count = 0;
      actsToAvg.forEach(act => {
        const g = prev[`${studentId}_${act}`]?.grade;
        if (g !== undefined && g !== null && g !== "") {
          sum += parseFloat(g);
          count++;
        }
      });
      
      if (count > 0) {
        const avg = (sum / count).toFixed(1);
        toast.success("Média aplicada para o aluno.");
        const key = `${studentId}_${colName}`;
        return {
          ...prev,
          [key]: {
            ...(prev[key] || { student_id: studentId, activity_name: colName }),
            grade: avg,
            isDirty: true
          }
        };
      }
      return prev;
    });
  };

  const handleAutoFillFinalGrade = () => {
    if (activities.length === 0) {
      toast.error("Não há avaliações para calcular a média.");
      return;
    }
    
    toast.success("Média calculada para a turma.");
    
    const colName = "Nota Final";
    
    if (!activities.includes(colName)) {
      setActivities(prev => [...prev, colName]);
    }
    
    const actsToAvg = activities.filter(a => a !== colName);
    
    setGradesMap(prev => {
      const nextMap = { ...prev };
      students.forEach(st => {
        let sum = 0;
        let count = 0;
        actsToAvg.forEach(act => {
          const g = prev[`${st.id}_${act}`]?.grade;
          if (g !== undefined && g !== null && g !== "") {
            sum += parseFloat(g);
            count++;
          }
        });
        
        if (count > 0) {
          const avg = (sum / count).toFixed(1);
          const key = `${st.id}_${colName}`;
          nextMap[key] = {
            ...(nextMap[key] || { student_id: st.id, activity_name: colName }),
            grade: avg,
            isDirty: true
          };
        }
      });
      return nextMap;
    });
  };

  const handleAddActivity = () => {
    if (!newActivityName.trim() || activities.includes(newActivityName.trim())) return;
    setActivities(prev => [...prev, newActivityName.trim()]);
    setNewActivityName("");
    toast.success("Coluna adicionada! Insira notas para fixa-la no banco.");
  };

  const handleDeleteActivity = async (actName: string) => {
    // Removed window.confirm to avoid iframe blocks. We'll proceed directly.
    
    // Attempt to delete from DB if we have IDs
    const toDeleteIds = [];
    for (const st of students) {
      const key = `${st.id}_${actName}`;
      if (gradesMap[key]?.id) {
        toDeleteIds.push(gradesMap[key].id);
      }
    }
    
    for (const id of toDeleteIds) {
      await fetch(apiUrl(`/api/grades/${id}`), { method: "DELETE" });
    }
    
    setActivities(prev => prev.filter(a => a !== actName));
    setGradesMap(prev => {
      const newMap = { ...prev };
      for (const st of students) {
        delete newMap[`${st.id}_${actName}`];
      }
      return newMap;
    });
  };

  const filteredStudents = students.filter(st => st.name.toLowerCase().includes(searchQuery.toLowerCase()));

  
  
  const hasUnsavedChanges = Object.values(gradesMap).some((item: any) => item.isDirty);

  const handleResetGrades = () => {
    if (!hasUnsavedChanges) {
      toast.info("Não há alterações não salvas para descartar.");
      return;
    }
    setShowResetDialog(true);
  };

  const handleExportCSV = () => {
    if (!selectedClass || students.length === 0) return;

    const cls = classes.find((c: any) => c.id === selectedClass);
    const className = cls ? cls.name : "Turma";

    const headers = [
      "Matrícula",
      "Nome do Aluno",
      ...activities,
      "Média Final",
      "Situação",
      "Observações Qualitativas"
    ];

    const rows = filteredStudents.map(st => {
      const row = [];
      row.push(st.enrollment_code || "N/A");
      row.push(`"${st.name}"`);

      let obsList: string[] = [];

      activities.forEach(act => {
        const key = `${st.id}_${act}`;
        const g = gradesMap[key];
        row.push(g?.grade !== undefined && g?.grade !== null ? g.grade : "");
        if (g?.feedback) {
          obsList.push(`[${act}]: ${g.feedback.replace(/"/g, '""')}`);
        }
      });

      const avg = calculateAverage(st.id);
      row.push(avg);
      
      const avgNum = parseFloat(avg);
      const situation = isNaN(avgNum) ? "-" : (avgNum >= 70 ? "Aprovado" : (avgNum >= 50 ? "Recuperação" : "Reprovado"));
      row.push(situation);

      const allObs = obsList.length > 0 ? `"${obsList.join(" | ")}"` : "";
      row.push(allObs);

      return row.join(";");
    });

    const csvContent = [headers.join(";"), ...rows].join("\n");
    // Add BOM for Excel UTF-8
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Diario_SENAI_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


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
          grade: item.grade === "" ? null : parseFloat(item.grade),
          feedback: item.feedback || ""
        };
      }).filter(item => item.grade !== undefined && item.grade !== null);

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
      
      setGradesMap({ ...gradesMap }); // trigger re-render
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving grades", err);
      alert("Houve um erro ao salvar as notas.");
    } finally {
      setSaving(false);
    }
  };

  const calculateAverage = (studentId: string) => {
    if (activities.length === 0) return "-";
    let sum = 0;
    let count = 0;
    activities.forEach(act => {
      const key = `${studentId}_${act}`;
      const g = gradesMap[key]?.grade;
      if (g !== undefined && g !== null && g !== "") {
        sum += parseFloat(g);
        count++;
      }
    });
    if (count === 0) return "-";
    
  return (sum / count).toFixed(1);
  };

  const chartData = filteredStudents.map(st => {
    const avgStr = calculateAverage(st.id);
    const avgNum = avgStr === "-" ? 0 : parseFloat(avgStr);
    return {
      name: st.name.split(" ")[0] || st.name,
      fullName: st.name,
      media: avgNum
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-wider flex items-center gap-3">
            <Award className="w-7 h-7 text-emerald-400" />
            Módulo de Notas
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Gestão unificada de avaliações, médias e pareceres por turma.
          </p>
        </div>
        <div id="grades-manager-toolbar" className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-emerald-400 text-sm flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Notas Salvas
            </span>
          )}
          
          <button
            onClick={handleResetGrades}
            disabled={!hasUnsavedChanges || saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e295b] hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold border border-[#2a3a7c] hover:border-red-500/50"
            title="Descartar alterações não salvas"
          >
            <Trash2 className="w-4 h-4" />
            Resetar Notas
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!selectedClass || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e295b] hover:bg-[#2a3a7c] text-slate-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold border border-[#2a3a7c]"
            title="Exportar Diário de Classe (Padrão SENAI)"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={saveGrades}
            disabled={saving || !selectedClass}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-lg shadow-emerald-500/20"
          >
            {saving ? <span className="animate-spin text-lg block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="bg-[#161f36] border border-[#1e295b] p-5 rounded-2xl flex flex-col justify-center">
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Turma / Disciplina</label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar turma..."
              value={classSearch}
              onChange={e => setClassSearch(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#1e295b] text-white rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#1e295b] text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="">Selecione uma turma...</option>
              {classes.filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase())).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedClass && (
          <div className="bg-[#161f36] border border-[#1e295b] p-5 rounded-2xl flex flex-col justify-center">
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Buscar Aluno</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Nome do aluno..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b1120] border border-[#1e295b] text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
        
        {selectedClass && (
          <div className="bg-[#161f36] border border-[#1e295b] p-5 rounded-2xl flex flex-col justify-center lg:col-span-2">
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Adicionar Avaliação</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Prova 1, Projeto Final..."
                value={newActivityName}
                onChange={e => setNewActivityName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddActivity()}
                className="flex-1 bg-[#0b1120] border border-[#1e295b] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddActivity}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Criar Coluna
              </button>
              <button
                onClick={handleAutoFillFinalGrade}
                className="px-4 py-2.5 bg-[#1e295b] hover:bg-[#2a3a7c] text-white rounded-xl transition-all text-sm font-semibold flex items-center gap-2 border border-[#2a3a7c]"
                title="Preencher coluna 'Nota Final' com a média das atividades"
              >
                <Calculator className="w-4 h-4" />
                Auto-Média
              </button>

            </div>
          </div>
        )}
      </div>

      
      {/* Chart Section */}
      {!loading && selectedClass && filteredStudents.length > 0 && (
        <div className="bg-[#161f36] border border-[#1e295b] p-6 rounded-2xl">
          <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Distribuição de Médias
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e295b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#1e295b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0b1120', borderColor: '#1e295b', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value) => [`${value} pontos`, 'Média']}
                />
                <Bar dataKey="media" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.media >= 70 ? '#34d399' : entry.media >= 50 ? '#fbbf24' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Grid */}

      {loading ? (
        <div className="p-12 flex justify-center text-indigo-400">
           <span className="animate-spin text-4xl block w-8 h-8 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full" />
        </div>
      ) : selectedClass && students.length > 0 ? (
        <div className="bg-[#161f36] border border-[#1e295b] rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#0b1120] border-b border-[#1e295b]">
                <th className="py-4 px-6 font-mono text-xs text-slate-400 uppercase tracking-wider sticky left-0 bg-[#0b1120] z-10 w-[300px]">
                  Aluno
                </th>
                {activities.map(act => (
                  <th key={act} className="py-4 px-4 font-mono text-xs text-slate-300 font-semibold min-w-[140px] text-center border-l border-[#1e295b]/50">
                    <div className="flex items-center justify-between group">
                      <span className="truncate max-w-[100px]" title={act}>{act}</span>
                      <button 
                        onClick={() => handleDeleteActivity(act)}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover Coluna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="py-4 px-6 font-mono text-xs text-emerald-400 uppercase tracking-wider text-center border-l border-[#1e295b]/50 bg-[#0b1120] w-[120px]">
                  Média
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map((st, i) => (
                <tr key={st.id} className={`border-b border-[#1e295b]/50 hover:bg-[#1a233d] transition-colors ${i % 2 === 0 ? "bg-[#161f36]" : "bg-[#12192e]"}`}>
                  <td className="py-3 px-6 sticky left-0 z-10 bg-inherit border-r border-[#1e295b]/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {st.name.substring(0, 2)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-slate-200 font-medium truncate">{st.name}</span>
                        <span className="text-xs text-slate-500 font-mono">{st.enrollment_code || "Sem Matrícula"}</span>
                      </div>
                    </div>
                  </td>
                  
                  {activities.map(act => {
                    const key = `${st.id}_${act}`;
                    const item = gradesMap[key] || {};
                    const isDirty = item.isDirty;
                    return (
                      <td key={act} className="py-3 px-4 border-l border-[#1e295b]/50 text-center relative group">
                        <div className="relative inline-block w-full h-full" onDoubleClick={() => openCellModal(st.id, act)}>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={item.grade ?? ""}
                            onChange={(e) => handleGradeChange(st.id, act, e.target.value)}
                            className={`w-[80px] bg-[#0b1120] border ${isDirty ? 'border-amber-500' : (item.isAuto && !item.id ? 'border-indigo-500/40' : 'border-[#1e295b]')} group-hover:border-indigo-500/50 text-center text-sm font-mono text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:bg-[#161f36] transition-colors`}
                            placeholder="-"
                            title={`${item.isAuto && !item.id ? "Nota automática (Cofre de Correções)\n" : "Nota inserida manualmente\n"}${item.feedback ? 'Observação: ' + item.feedback : 'Duplo clique para adicionar observação'}`}
                          />
                          {item.isAuto && !item.id && !isDirty && (
                            <span className="absolute -top-1 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#12192e] group-hover:scale-110 transition-transform" title="Vindo do Sandbox/Cofre de Correção" />
                          )}
                          {item.feedback && (
                            <div className="absolute top-0 -left-1 w-2.5 h-2.5 bg-sky-400 rounded-full border-2 border-[#12192e]" title="Possui observação qualitativa" />
                          )}
                          {isDirty && (
                            <span className="absolute top-1 right-0 text-[8px] text-amber-500 font-bold uppercase">M</span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-3 px-6 border-l border-[#1e295b]/50 text-center bg-emerald-500/5 group/avg">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono font-bold text-emerald-400 text-base">{calculateAverage(st.id)}</span>
                      <button 
                        onClick={() => handleAutoFillFinalGradeForStudent(st.id)}
                        className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all opacity-0 group-hover/avg:opacity-100"
                        title="Aplicar Auto-Média para este aluno (cria/atualiza coluna 'Nota Final')"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={activities.length + 2} className="py-8 text-center text-slate-500 font-mono text-sm">
                    Nenhum aluno encontrado para "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : selectedClass ? (
        <div className="bg-[#161f36] border border-[#1e295b] p-12 rounded-2xl flex flex-col items-center justify-center text-center">
          <User className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-300">Nenhum aluno encontrado</h3>
          <p className="text-sm text-slate-500 mt-2">Adicione alunos à esta turma no menu "Alunos".</p>
        </div>
      ) : (
        <div className="bg-[#161f36] border border-[#1e295b] p-12 rounded-2xl flex flex-col items-center justify-center text-center opacity-70">
          <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-300">Selecione uma turma</h3>
          <p className="text-sm text-slate-500 mt-2">Para iniciar o gerenciamento de notas, escolha a disciplina acima.</p>
        </div>
      )}
    
      {/* Edit Cell Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12192e] border border-[#1e295b] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button onClick={closeCellModal} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 className="text-lg font-bold text-white mb-1">
              Editar Avaliação
            </h3>
            <p className="text-sm text-slate-400 mb-6 font-mono truncate">
              {students.find(s => s.id === editingCell.studentId)?.name} • {editingCell.activityName}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Nota Final</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={modalData.grade}
                  onChange={(e) => setModalData({...modalData, grade: e.target.value})}
                  className="w-full bg-[#0b1120] border border-[#1e295b] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="0 - 100"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Observação Qualitativa</label>
                <textarea
                  value={modalData.feedback}
                  onChange={(e) => setModalData({...modalData, feedback: e.target.value})}
                  rows={4}
                  className="w-full bg-[#0b1120] border border-[#1e295b] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Feedback sobre o desempenho (opcional)..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeCellModal}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-[#1e295b] transition-colors text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={saveCellModal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-indigo-500/20"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12192e] border border-[#1e295b] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">Descartar Alterações?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Você perderá todas as notas e observações qualitativas não salvas. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-[#1e295b] transition-colors text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setRefreshKey(prev => prev + 1);
                  setShowResetDialog(false);
                  toast.success("Notas e observações restauradas com sucesso.");
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-red-500/20"
              >
                Sim, Descartar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

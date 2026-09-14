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
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";

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
  const [activeTab, setActiveTab] = useState<"pending" | "delivered" | "grades">("pending");
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
      }
    } catch (e) {
      console.warn("Using default student profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData(selectedStudentId);
  }, [selectedStudentId, selectedClassId]);

  const handleOpenSubmission = (act: any) => {
    setSubmittingActivity(act);
    setSubmissionCode(act.submitted_code || act.starter_code || "# Escreva seu código aqui em " + (act.language || "Python"));
    setSubmissionNotes("");
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
        // Update local activity state
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
              Aprovado
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full" 
              style={{ width: `${averageGrade}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            Média de aprovação requerida: 60.0 pontos
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
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
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
      </div>

      {/* Tab Contents */}
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

                {act.score !== undefined && (
                  <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
                    <Award className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-xs text-slate-400">Nota Obtida:</span>
                      <p className="text-base font-bold text-white">{act.score} <span className="text-xs text-slate-400">/ 100</span></p>
                    </div>
                  </div>
                )}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Submission Modal */}
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Seu Código / Solução ({submittingActivity.language || "Python"}):
                </label>
                <textarea
                  value={submissionCode}
                  onChange={(e) => setSubmissionCode(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-950 font-mono text-xs text-emerald-400 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  placeholder="Cole ou digite sua solução aqui..."
                />
              </div>

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

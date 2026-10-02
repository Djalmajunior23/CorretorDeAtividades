import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Edit3,
  Save,
  Plus,
  ShieldCheck,
  FileCheck,
  Users,
  Sparkles,
  Terminal,
  Download
} from "lucide-react";
import { toast } from "sonner";
import {
  AssistedClassDiaryService,
  ClassDiaryDraft
} from "../services/assistedClassDiaryService";

interface AssistedClassDiaryViewProps {
  onNavigate?: (tab: string) => void;
}

export default function AssistedClassDiaryView({ onNavigate }: AssistedClassDiaryViewProps) {
  const [diaryRecords, setDiaryRecords] = useState<ClassDiaryDraft[]>(() =>
    AssistedClassDiaryService.getDiaryRecords()
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    diaryRecords[0]?.id || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedTopic, setEditedTopic] = useState("");
  const [teacherOfficialNotes, setTeacherOfficialNotes] = useState("");

  const selectedRecord = diaryRecords.find(d => d.id === selectedRecordId) || diaryRecords[0];

  const handleHomologate = () => {
    if (!selectedRecord) return;
    const ok = AssistedClassDiaryService.homologateRecord(selectedRecord.id, teacherOfficialNotes);
    if (ok) {
      toast.success("Registro de Aula homologado oficialmente!", {
        description: "Os dados foram confirmados e persistidos no diário oficial da instituição."
      });
      setDiaryRecords([...AssistedClassDiaryService.getDiaryRecords()]);
      setIsEditing(false);
    }
  };

  const handleSaveEdits = () => {
    if (!selectedRecord) return;
    const updated: ClassDiaryDraft = {
      ...selectedRecord,
      confirmedTaughtTopic: editedTopic || selectedRecord.confirmedTaughtTopic
    };
    AssistedClassDiaryService.updateDiaryDraft(updated);
    toast.success("Rascunho atualizado pelo docente!");
    setDiaryRecords([...AssistedClassDiaryService.getDiaryRecords()]);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Registro de Aula Assistido & Diário Oficial
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Evidências Reais
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Geração de rascunhos com base em atividades realizadas, separando conteúdo planejado de conteúdo efetivamente ministrado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedRecord && selectedRecord.status !== "HOMOLOGADO_DOCENTE" && (
            <button
              onClick={handleHomologate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Homologar Registro Oficial</span>
            </button>
          )}
        </div>
      </div>

      {/* Zero Synthetic Data Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Fidedignidade Institucional:</strong> O CodeCheck não inventa frequências, notas ou acontecimentos. O rascunho é montado com base nas tarefas executadas e exige validação e assinatura do professor responsável.
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Log Entries List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Aulas Registradas ({diaryRecords.length})</span>
          </h2>

          <div className="space-y-3">
            {diaryRecords.map(d => {
              const isSelected = d.id === selectedRecord?.id;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedRecordId(d.id);
                    setIsEditing(false);
                    setEditedTopic(d.confirmedTaughtTopic);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {d.className}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        d.status === "HOMOLOGADO_DOCENTE"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {d.status === "HOMOLOGADO_DOCENTE" ? "Homologado" : "Rascunho Assistido"}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {d.confirmedTaughtTopic}
                  </h3>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {d.timeSlot}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" />
                      {d.dateIso}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Diary Record Document */}
        {selectedRecord && (
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-5">
              {/* Document Title Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      {selectedRecord.className}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedRecord.roomOrLab}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white font-display mt-0.5">
                    Registro de Aula: {selectedRecord.dateIso} ({selectedRecord.timeSlot})
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {selectedRecord.status === "HOMOLOGADO_DOCENTE" ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Assinado & Homologado</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditedTopic(selectedRecord.confirmedTaughtTopic);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Editar Rascunho</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Planned vs Confirmed Taught Content Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Conteúdo Planejado Originalmente
                  </span>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {selectedRecord.plannedTopic}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                    Conteúdo Confirmado como Ministrado
                  </span>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedTopic}
                        onChange={(e) => setEditedTopic(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleSaveEdits}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold cursor-pointer"
                      >
                        Salvar Alteração
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-200 font-semibold leading-relaxed">
                      {selectedRecord.confirmedTaughtTopic}
                    </p>
                  )}
                </div>
              </div>

              {/* Strategies and Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-teal-400 font-bold block">
                    Estratégias Metodológicas
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {selectedRecord.methodologicalStrategies.map((strat, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{strat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
                    Recursos & Ferramentas Utilizadas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRecord.resourcesAndToolsUsed.map((tool, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Observed Evidences & Difficulties */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                  Evidências de Aprendizagem & Dificuldades Observadas
                </span>
                {selectedRecord.observedEvidences.activityTitle && (
                  <div className="text-xs text-slate-300">
                    <strong className="text-white">Atividade Prática:</strong> {selectedRecord.observedEvidences.activityTitle} ({selectedRecord.observedEvidences.completionRatio})
                  </div>
                )}
                {selectedRecord.observedEvidences.frequentDifficulties && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-amber-400 font-bold">Gaps Recorrentes:</span>
                    <ul className="text-xs text-slate-300 space-y-0.5">
                      {selectedRecord.observedEvidences.frequentDifficulties.map((gap, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-slate-400 italic">
                  "{selectedRecord.observedEvidences.highlightNotes}"
                </p>
              </div>

              {/* Official Attendance Status */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Frequência da Turma: {selectedRecord.officialAttendance.presentCount} Presentes / {selectedRecord.officialAttendance.absentCount} Ausentes (Total: {selectedRecord.officialAttendance.totalEnrolled})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {selectedRecord.officialAttendance.isAttendanceValidatedByTeacher ? "Frequência conferida e validada pelo professor" : "Frequência pendente de validação"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pending Referrals for Next Class */}
              {selectedRecord.pendingIssuesAndNextSteps.length > 0 && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/30 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-purple-300 font-bold block">
                    Encaminhamentos & Pendências para a Próxima Aula
                  </span>
                  <ul className="text-xs text-purple-200 space-y-1">
                    {selectedRecord.pendingIssuesAndNextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-purple-400 font-bold">➔</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

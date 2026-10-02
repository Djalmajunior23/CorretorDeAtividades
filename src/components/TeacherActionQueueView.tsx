import React, { useState } from "react";
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  ArrowRight, 
  MoreVertical, 
  Sparkles, 
  RefreshCw, 
  EyeOff,
  Flame,
  User,
  BookOpen,
  Terminal,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { TeacherActionQueueService, TeacherActionTask, TeacherTaskCategory, TeacherTaskPriority } from "../services/teacherActionQueueService";

interface TeacherActionQueueViewProps {
  onNavigate?: (tabId: string, params?: any) => void;
}

export default function TeacherActionQueueView({ onNavigate = () => {} }: TeacherActionQueueViewProps) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tasks, setTasks] = useState<TeacherActionTask[]>(() => {
    return TeacherActionQueueService.getTasks();
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reloadTasks = () => {
    setTasks(TeacherActionQueueService.getTasks({
      category: categoryFilter,
      priority: priorityFilter
    }));
  };

  const handleComplete = (taskId: string) => {
    TeacherActionQueueService.completeTask(taskId);
    reloadTasks();
    setToastMessage("Tarefa concluída e sincronizada com sucesso!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSnooze = (taskId: string) => {
    TeacherActionQueueService.snoozeTask(taskId, 4);
    reloadTasks();
    setToastMessage("Tarefa adiada por 4 horas.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePriorityChange = (taskId: string, priority: TeacherTaskPriority) => {
    TeacherActionQueueService.updatePriority(taskId, priority);
    reloadTasks();
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1829] to-[#040817] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              FILA INTELIGENTE DE TRABALHO
            </span>
            <span className="text-xs text-slate-400 font-mono">• {tasks.length} pendências ativas</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-cyan-400" />
            Central de Ações & Fila Docente
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Priorização transparente de pendências pedagógicas, dúvidas de alunos e diários de aula sem duplicidades operacionais.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setTimeout(reloadTasks, 50);
              }}
              className="bg-transparent text-slate-200 focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              <option value="CORRECAO_PENDENTE">Correções & Recursos</option>
              <option value="DUVIDA_ALUNO">Dúvidas de Alunos</option>
              <option value="PLANEJAMENTO_AULA">Planejamento de Aula</option>
              <option value="DIARIO_ASSISTIDO">Diário de Classe</option>
              <option value="INTERVENCAO_REFORCO">Intervenção / Reforço</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setTimeout(reloadTasks, 50);
              }}
              className="bg-transparent text-slate-200 focus:outline-none"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="ALTA">Prioridade Alta</option>
              <option value="MEDIA">Prioridade Média</option>
              <option value="BAIXA">Prioridade Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Task List */}
      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/60" />
            <span className="text-sm font-bold text-white">Tudo em dia!</span>
            <p className="text-xs text-slate-400">Nenhuma tarefa pendente com os filtros selecionados.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                  task.priority === "ALTA" ? "bg-rose-500 animate-pulse" : task.priority === "MEDIA" ? "bg-amber-400" : "bg-cyan-400"
                }`} title={`Prioridade ${task.priority}`} />

                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {task.className}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      task.priority === "ALTA" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-slate-800 text-slate-400"
                    }`}>
                      Prioridade: {task.priority}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Espera: {task.waitTimeHours}h
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-0.5">{task.title}</h3>
                  <p className="text-xs text-slate-300">{task.description}</p>
                  
                  <span className="text-[10px] text-slate-500 font-mono italic mt-1">
                    Motivo da ordenação: {task.orderingReason}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <button
                  onClick={() => handleSnooze(task.id)}
                  title="Adiar por 4 horas"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  Adiar
                </button>

                <button
                  onClick={() => handleComplete(task.id)}
                  title="Concluir tarefa"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-300 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate(task.targetTabId, { relatedId: task.relatedEntityId })}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{task.targetActionLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

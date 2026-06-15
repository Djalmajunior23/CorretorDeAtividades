import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Sparkles,
  Award,
  FileText,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Users,
  BookOpen,
  Download,
} from "lucide-react";

export default function RecuperacaoView() {
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>(
    "Carlos Henrique Souza",
  );

  // Real-time student alarms list (Fase 8 / 13)
  const [studentsInAlarms, setStudentsInAlarms] = useState([
    {
      name: "Carlos Henrique Souza",
      class: "Desenvolvimento Web 1A",
      score: "5.0",
      deficiency: "Laços de Repetição e Condicionais",
    },
    {
      name: "Vinícius Souza",
      class: "Desenvolvimento Web 1A",
      score: "5.8",
      deficiency: "Parâmetros por Referência",
    },
    {
      name: "Daniel Santos Ramos",
      class: "Sistemas Embarcados 1C",
      score: "4.5",
      deficiency: "Matrizes Bidimensionais",
    },
  ]);

  const [aiRecoveryPlanText, setAiRecoveryPlanText] = useState<string | null>(
    null,
  );

  const handleGeneratePlan = () => {
    setLoading(true);
    setAiRecoveryPlanText(null);

    // Simulates an IA tailored plan
    setTimeout(() => {
      setAiRecoveryPlanText(
        `PLANO DE RECUPERAÇÃO INDIVIDUALIZADA\n\n` +
          `Estudante: ${selectedStudent}\n` +
          `Deficiência Técnica: Laços de Repetição e Condicionais Encadeados\n\n` +
          `Etapa 1: Leitura dirigida e vídeo aula recomendada sobre repetições While vs For.\n` +
          `Etapa 2: Exercício complementar simplificado (Lado das Estrelas com decremento).\n` +
          `Etapa 3: Submeter código na trilha de acompanhamento do CodeCheck.\n\n` +
          `Próxima Avaliação Vinculada: Prova Teórica Prática Simplificada dia 18/Jun.`,
      );
      setLoading(false);
    }, 1200);
  };

  const handleApprovePlan = () => {
    // Moves student to passive recovery, resets alarm/shows feedback
    alert(
      `Plano de Recuperação para ${selectedStudent} publicado com sucesso!`,
    );
    setAiRecoveryPlanText(null);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 text-slate-100 animate-fade-in">
      {/* Header Title */}
      <div>
        <span className="text-xs font-mono font-bold tracking-widest text-[#10b981] uppercase">
          Fase 8 / 13: Planos de Recuperação Paralela
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display mt-0.5">
          Planos de Recuperação Contínua
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Acompanhe estudantes com aproveitamento insuficiente e gere planos de
          atividades complementares individualizados baseados nas lacunas do
          diário.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List of students needing recovery */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <h3 className="font-bold text-white text-base mb-2">
              Estudantes sob Alerta (Rendimento &lt; 6.0)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Selecione para processar intervenção oportuna de aprendizagem.
            </p>

            <div className="flex flex-col gap-4">
              {studentsInAlarms.map((std, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex justify-between gap-4 cursor-pointer transition-all ${
                    selectedStudent === std.name
                      ? "bg-[#10b981]/5 border-emerald-500/30"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-750"
                  }`}
                  onClick={() => setSelectedStudent(std.name)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-white uppercase">
                      {std.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Turma: {std.class}
                    </span>
                    <span className="text-[10px] text-rose-400 font-mono font-bold">
                      Lacuna: {std.deficiency}
                    </span>
                  </div>

                  <div className="flex flex-col items-end justify-between text-right">
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase shrink-0">
                      Aproveitamento
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-500 mt-1">
                      {std.score}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: IA interactive recovery engine */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">
                Gerador de Roteiro Adaptativo IA
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-normal font-mono">
              O Copiloto IA analisará o diário e o histórico da turma para
              montar um roteiro de estudos prático para{" "}
              <strong>{selectedStudent}</strong>.
            </p>

            <div className="flex justify-end pt-2 border-t border-slate-900">
              <button
                onClick={handleGeneratePlan}
                className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-emerald-600 font-bold text-[#030712] text-xs rounded-xl flex items-center gap-2 hover:from-emerald-500 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Montar Recuperação IA
              </button>
            </div>

            <AnimatePresence>
              {aiRecoveryPlanText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-slate-950 border border-emerald-500/15 rounded-xl flex flex-col gap-4 overflow-hidden"
                >
                  <pre className="text-[11px] font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {aiRecoveryPlanText}
                  </pre>

                  <div className="flex justify-end gap-2 border-t border-slate-900 pt-3">
                    <button
                      onClick={() => setAiRecoveryPlanText(null)}
                      className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-semibold"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={handleApprovePlan}
                      className="px-4 py-1.5 bg-emerald-500 text-slate-955 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Aprovar e Liberar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Trophy, Award, Sparkles, Star, Users, CheckCircle2, Shield, Flame } from "lucide-react";
import { toast } from "sonner";

interface GamificationBadgesModalProps {
  onClose: () => void;
  students?: any[];
}

export function GamificationBadgesModal({ onClose, students = [] }: GamificationBadgesModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>(students[0]?.student_name || "Carlos Souza");
  const [badges, setBadges] = useState<any[]>([
    { id: "b1", name: "Mestre dos Loops", description: "Dominou estruturas de repetição com código otimizado.", icon: "🔄", category: "Lógica", awardedDate: "2026-08-10" },
    { id: "b2", name: "Código Limpo", description: "Manteve complexidade ciclomática abaixo de 5 em todas as entregas.", icon: "✨", category: "Qualidade", awardedDate: "2026-08-12" },
    { id: "b3", name: "Pontualidade SLA", description: "100% das entregas realizadas antes do prazo limite.", icon: "⚡", category: "Performance", awardedDate: "2026-08-15" },
    { id: "b4", name: "Refatorador Nato", description: "Reduziu linhas duplicadas e melhorou legibilidade.", icon: "🛠️", category: "Arquitetura", awardedDate: "2026-08-16" }
  ]);

  const availableBadgesToAward = [
    { name: "Zero Bugs", description: "Passou em todos os testes unitários de primeira.", icon: "🎯", category: "Precisão" },
    { name: "Colaborador Destaque", description: "Ajudou colegas no fórum da turma.", icon: "🌟", category: "Comunidade" },
    { name: "Velocista SQL", description: "Criou queries complexas otimizadas.", icon: "🗄️", category: "Banco de Dados" }
  ];

  const handleAwardBadge = (badgeTemplate: any) => {
    const newBadge = {
      id: `badge-${Date.now()}`,
      ...badgeTemplate,
      awardedDate: new Date().toISOString().split("T")[0]
    };
    setBadges([newBadge, ...badges]);
    toast.success(`Insígnia "${badgeTemplate.name}" concedida com sucesso para ${selectedStudent}!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-[#1e295b]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Sistema de Conquistas & Gamificação (Badges)</h3>
              <p className="text-xs text-slate-400">Reconheça o destaque técnico e o engajamento dos discentes.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm px-2 py-1 rounded-lg bg-slate-800">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Student Selector */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Discente Selecionado:</span>
            </div>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="Carlos Souza">Carlos Souza</option>
              <option value="Ana Beatriz">Ana Beatriz</option>
              <option value="Lucas Oliveira">Lucas Oliveira</option>
              <option value="Mariana Costa">Mariana Costa</option>
              {students.map((s, i) => (
                <option key={i} value={s.student_name}>{s.student_name}</option>
              ))}
            </select>
          </div>

          {/* Awarded Badges List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Insígnias Conquistadas por {selectedStudent} ({badges.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3.5 group hover:border-amber-500/40 transition-all">
                  <div className="text-3xl p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                    {b.icon}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{b.name}</span>
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">{b.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{b.description}</p>
                    <div className="text-[9px] text-slate-500 font-mono pt-1">Conquistado em: {b.awardedDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Award New Badge Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/30 to-purple-950/30 border border-indigo-500/20 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Conceder Nova Insígnia Manualmente
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {availableBadgesToAward.map((badge, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 hover:border-indigo-500/40 transition-all">
                  <div className="space-y-1">
                    <div className="text-2xl">{badge.icon}</div>
                    <div className="text-xs font-bold text-white">{badge.name}</div>
                    <p className="text-[10px] text-slate-400">{badge.description}</p>
                  </div>
                  <button
                    onClick={() => handleAwardBadge(badge)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                  >
                    Atribuir Insígnia
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#1e295b]/30 bg-[#161f36] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}

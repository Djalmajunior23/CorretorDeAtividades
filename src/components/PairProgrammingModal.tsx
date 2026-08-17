import React, { useState } from "react";
import { Users, MessageSquare, Send, Radio, Shield, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PairProgrammingModalProps {
  onClose: () => void;
}

export function PairProgrammingModal({ onClose }: PairProgrammingModalProps) {
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: "Prof. Djalma", text: "Olá! Vamos revisar a estrutura de funções do exercício.", time: "16:00" },
    { sender: "Aluno (Vinícius)", text: "Professor, estou com dúvida no retorno da função principal.", time: "16:01" }
  ]);
  const [inputMsg, setInputMsg] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const newMsg = {
      sender: "Você (Professor)",
      text: inputMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMsg]);
    setInputMsg("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-[#1e295b]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Modo Colaborativo - Pair Programming / Code Review ao Vivo</h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Sessão Ativa com Turma A (Vinícius Souza)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm">✕</button>
        </div>

        <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Active Participants */}
          <div className="w-full md:w-1/3 flex flex-col gap-4 border-r border-[#1e295b]/30 pr-4">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Participantes Conectados</span>
            <div className="flex flex-col gap-2">
              <div className="p-3 rounded-xl bg-[#030712]/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">VS</div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Vinícius Souza</span>
                    <span className="text-[10px] text-slate-400">Aluno (Editor Principal)</span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Online" />
              </div>

              <div className="p-3 rounded-xl bg-[#030712]/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">PD</div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Prof. Djalma</span>
                    <span className="text-[10px] text-slate-400">Moderador / Revisor</span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Online" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mt-auto">
              <span className="text-xs font-bold text-indigo-300 block mb-1">Dica de Orientação</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Utilize o chat ao lado para enviar dicas de refatoração ou marcar trechos de código para revisão conjunta.
              </p>
            </div>
          </div>

          {/* Chat / Comments Panel */}
          <div className="flex-1 flex flex-col justify-between h-[340px] md:h-auto bg-[#030712]/50 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Chat de Revisão de Código
              </span>
              <span className="text-[10px] font-mono text-slate-500">Criptografado E2E</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
              {messages.map((m, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="font-bold text-slate-200">{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#161f36] border border-slate-800 text-xs text-slate-200 leading-relaxed">
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Digite sua orientação ou comentário sobre o código..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Enviar
              </button>
            </form>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[#1e295b]/30 bg-[#070a1a] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
          >
            Encerrar Sessão
          </button>
        </div>
      </div>
    </div>
  );
}

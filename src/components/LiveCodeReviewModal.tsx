import React, { useState } from "react";
import { Radio, Users, Send, CheckCircle2, MessageSquare, Terminal, RefreshCw, Code } from "lucide-react";
import { toast } from "sonner";

interface LiveCodeReviewModalProps {
  onClose: () => void;
}

export function LiveCodeReviewModal({ onClose }: LiveCodeReviewModalProps) {
  const [activeSession, setActiveSession] = useState(true);
  const [studentName, setStudentName] = useState("Carlos Souza");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([
    { sender: "Professor", text: "Olá Carlos, notei um pequeno bug no seu loop na linha 14.", time: "11:24" },
    { sender: "Carlos Souza", text: "Obrigado professor! Já ajustei a condição de parada.", time: "11:25" }
  ]);

  const [liveCode, setLiveCode] = useState(`// Sessão Ativa de Pair Programming / Code Review
function processStudentGrades(scores) {
  let total = 0;
  for (let i = 0; i < scores.length; i++) {
    total += scores[i];
  }
  return total / scores.length;
}

console.log("Média:", processStudentGrades([80, 90, 100]));`);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const newMsg = { sender: "Professor", text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages([...messages, newMsg]);
    setChatMessage("");
    toast.success("Mensagem enviada para o aluno em tempo real!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-[#0f172a] border border-[#1e295b]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 relative">
              <Radio className="w-6 h-6 animate-pulse" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Modo de Revisão ao Vivo (Live Code Review & Pair Programming)</h3>
              <p className="text-xs text-slate-400">Sessão síncrona com {studentName} em tempo real.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm px-2 py-1 rounded-lg bg-slate-800">✕</button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1">
          {/* Left: Live Code Editor View */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                Editor do Aluno (Streaming Ao Vivo)
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado (WebSocket)
              </span>
            </div>

            <textarea
              value={liveCode}
              onChange={(e) => setLiveCode(e.target.value)}
              rows={16}
              className="w-full bg-[#030712] border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* Right: Live Chat / Instructor Feedback */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300">Chat & Orientações</h4>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[260px] pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-xl text-xs space-y-1 ${m.sender === 'Professor' ? 'bg-indigo-950/40 border border-indigo-500/20 ml-4' : 'bg-slate-900 border border-slate-800 mr-4'}`}>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="font-bold text-slate-200">{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="text-slate-300 leading-snug">{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Enviar dica ou feedback..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">Dica: Alterações feitas no editor são sincronizadas instantaneamente com a tela do aluno.</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Encerrar Sessão
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Users, Radio, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function CollaborativeSandboxView() {
  const [activeUsers] = useState([
    { name: "Professor Djalma (Você)", role: "Host / Instrutor", status: "Editando linha 12" },
    { name: "Vinícius Souza", role: "Aluno", status: "Visualizando" },
    { name: "Ana Clara Lima", role: "Monitora", status: "Revisando testes" },
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1 font-bold">
            <Users className="w-4 h-4" /> Evolução 03 • Multiplayer Real-Time Sandbox
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ambiente de Programação Colaborativo ao Vivo</h1>
          <p className="text-sm text-slate-400 mt-1">Conecte alunos e monitores na mesma sessão de código em tempo real.</p>
        </div>
        <button
          onClick={() => toast.success("Link de convite colaborativo copiado para a área de transferência!")}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-2xl text-xs uppercase font-mono tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
        >
          <Share2 className="w-4 h-4" /> Convidar Turma
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-400 uppercase font-bold">Sessão Ativa: Laboratório Python ao Vivo</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">3 participantes conectados</span>
          </div>

          <div className="bg-[#030712] border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 min-h-[300px]">
            <span className="text-slate-500"># Sala colaborativa CodeCheck Live Session</span><br/>
            <span className="text-purple-400">def</span> <span className="text-yellow-300">analisar_desempenho</span>(turma_id):<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;dados = carregar_dados_turma(turma_id)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> [d <span className="text-purple-400">for</span> d <span className="text-purple-400">in</span> dados <span className="text-purple-400">if</span> d[<span className="text-green-300">'nota'</span>] &gt;= 7.0]
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" /> Participantes na Sessão
          </h3>
          <div className="space-y-3">
            {activeUsers.map((user, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-[#030712] border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{user.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{user.role}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">{user.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

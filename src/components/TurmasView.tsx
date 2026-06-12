import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Users, Award, Shield, User, Clock, AlertTriangle, CheckCircle2,
  Lock, Settings, RefreshCw, BarChart3, LineChart
} from "lucide-react";

export default function TurmasView() {
  // Simulating RBAC permissions (FASE 6 / Módulo 10 & 13)
  const [profile, setProfile] = useState<"professor" | "coordinator" | "admin" | "super_admin">("professor");
  const [selectedClass, setSelectedClass] = useState<string>("Turma Web 1A");

  const classesMap = {
    professor: [
      { id: "class_1", name: "Turma de Desenvolvimento Web 1A", students: 24, uc: "Lógica e Algoritmos", avgGrade: "7.8", alertCount: 1 },
      { id: "class_2", name: "Análise de Sistemas 2B", students: 18, uc: "Bancos de Dados Relacionais", avgGrade: "6.2", alertCount: 3 }
    ],
    coordinator: [
      { id: "class_1", name: "Turma de Desenvolvimento Web 1A", students: 24, uc: "Lógica e Algoritmos", avgGrade: "7.8", alertCount: 1 },
      { id: "class_2", name: "Análise de Sistemas 2B", students: 18, uc: "Bancos de Dados Relacionais", avgGrade: "6.2", alertCount: 3 },
      { id: "class_3", name: "Sistemas Embarcados 1C", students: 15, uc: "Arquitetura e I/O", avgGrade: "8.5", alertCount: 0 },
      { id: "class_4", name: "Programação Mobile 4A", students: 20, uc: "Android Native", avgGrade: "5.5", alertCount: 4 }
    ],
    admin: [
      { id: "class_1", name: "Turma de Desenvolvimento Web 1A", students: 24, uc: "Lógica e Algoritmos", avgGrade: "7.8", schoolUnit: "SENAI Porto Alegre" },
      { id: "class_2", name: "Análise de Sistemas 2B", students: 18, uc: "Bancos de Dados Relacionais", schoolUnit: "SENAI Porto Alegre" },
      { id: "class_3", name: "Sistemas Embarcados 1C", students: 15, uc: "Arquitetura e I/O", schoolUnit: "SENAI Porto Alegre" },
      { id: "class_4", name: "Programação Mobile 4A", students: 20, uc: "Android Native", schoolUnit: "SENAI Porto Alegre" },
      { id: "class_5", name: "Cybersecurity Advanced 3B", students: 30, uc: "Segurança de Redes", schoolUnit: "SENAI Porto Alegre" }
    ],
    super_admin: [
      { id: "class_1", name: "Turma de Desenvolvimento Web 1A", students: 24, uc: "Lógica e Algoritmos", schoolUnit: "SENAI RS Regional" },
      { id: "class_2", name: "Análise de Sistemas 2B", students: 18, uc: "Bancos de Dados Relacionais", schoolUnit: "SENAI RS Regional" },
      { id: "class_3", name: "Sistemas Embarcados 1C", students: 15, uc: "Arquitetura e I/O", schoolUnit: "SENAI RS Regional" }
    ]
  };

  const currentClasses = classesMap[profile];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 text-slate-100 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10b981] uppercase">FASE 6 / 7: Controle de Acesso e Perfis</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display mt-0.5">Gestão de Turmas e Perfis Docentes</h1>
          <p className="text-sm text-slate-400 mt-1">
            Simule permissões institucionais baseadas nos níveis hierárquicos do SENAI e filtre dados analíticos em tempo real.
          </p>
        </div>

        {/* Profile Toggler Selector */}
        <div className="flex flex-col gap-1.5 shrink-0 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400 font-bold" />
            Perfil em Execução (RBAC):
          </label>
          <div className="flex gap-1 mt-1 text-[10px] font-mono font-bold">
            <button 
              onClick={() => setProfile("professor")} 
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${profile === "professor" ? "bg-emerald-500 text-[#030712]" : "text-slate-400 hover:text-white"}`}
            >
              Professor
            </button>
            <button 
              onClick={() => setProfile("coordinator")} 
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${profile === "coordinator" ? "bg-emerald-500 text-[#030712]" : "text-slate-400 hover:text-white"}`}
            >
              Coordenador
            </button>
            <button 
              onClick={() => setProfile("admin")} 
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${profile === "admin" ? "bg-emerald-500 text-[#030712]" : "text-slate-400 hover:text-white"}`}
            >
              Admin
            </button>
            <button 
              onClick={() => setProfile("super_admin")} 
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${profile === "super_admin" ? "bg-emerald-500 text-[#030712]" : "text-slate-400 hover:text-white"}`}
            >
              Super Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area based on RBAC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: List of accessible classes */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Unidades de Atendimento sob Responsabilidade</h3>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">{currentClasses.length} Turmas Ativas</span>
            </div>

            <div className="flex flex-col gap-4">
              {currentClasses.map((cls: any) => (
                <div 
                  key={cls.id} 
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all ${
                    selectedClass === cls.name ? "bg-[#10b981]/5 border-emerald-500/30" : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                  onClick={() => setSelectedClass(cls.name)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-800 text-slate-300 rounded-xl shrink-0 mt-0.5">
                      <Users className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white uppercase">{cls.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">UC Ativa: {cls.uc}</span>
                      {cls.schoolUnit && (
                        <span className="text-[10px] text-[#a5f3fc] font-mono leading-none mt-1">Unidade: {cls.schoolUnit}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase leading-none">Aproveitamento Médio</span>
                      <span className={`text-xs font-mono font-bold mt-1 ${cls.avgGrade && parseFloat(cls.avgGrade) < 7.0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {cls.avgGrade ? `${cls.avgGrade}/10` : "Auditado"}
                      </span>
                    </div>

                    {cls.alertCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className={`w-4 h-4 ${cls.alertCount > 0 ? "text-amber-500 animate-pulse" : "text-slate-600"}`} />
                        <span className="text-[11px] font-mono text-slate-400">{cls.alertCount} Alertas</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Coordination level high value indicators (FASE 7) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <h3 className="text-base font-bold text-white mb-1">
              {profile === "professor" ? "Indicadores Docente" : "Indicadores de Coordenação"}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-mono">Visão crítica consolidada por nível de privilégio.</p>

            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">Índice Geral de Evasão</span>
                <span className="text-xl font-extrabold text-white">2.1%</span>
                <span className="text-[9px] font-mono text-emerald-400 ml-1.5 font-bold">● DENTRO DA META</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">Carga Horária Sincronizada</span>
                <span className="text-xl font-extrabold text-white">94%</span>
                <span className="text-[9px] font-mono text-emerald-400 ml-1.5 font-bold">● VINCULADO</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">Índice de Correção em D+1</span>
                <span className="text-xl font-extrabold text-white">88%</span>
                <span className="text-[9px] font-mono text-cyan-400 ml-1.5 font-bold">● EXCELENTE</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

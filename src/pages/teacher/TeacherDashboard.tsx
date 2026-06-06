import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import {
  BookOpen,
  Code,
  Trophy,
  Users,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[#0F111A] text-slate-200">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text">
              Dashboard Principal
            </h1>
            <p className="text-slate-400 mt-2">
              Bem-vindo, {user?.name || "Professor"}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1A1D27] p-6 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Correção Rápida</h3>
              <Code className="text-emerald-400 w-6 h-6" />
            </div>
            <p className="text-slate-400 mb-4 text-sm">
              Teste e corrija códigos Python em tempo real de forma isolada.
            </p>
            <Link
              to="/teacher/quick-correction"
              className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
            >
              Acessar Laboratório →
            </Link>
          </div>

          <div className="bg-[#1A1D27] p-6 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Correção por Imagem</h3>
              <Camera className="text-emerald-400 w-6 h-6" />
            </div>
            <p className="text-slate-400 mb-4 text-sm">
              Extraia e corrija código escrito de lousas ou cadernos via OCR.
            </p>
            <Link
              to="/teacher/image-correction"
              className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
            >
              Importar Imagem →
            </Link>
          </div>

          <div className="bg-[#1A1D27] p-6 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Correção em Lote</h3>
              <Users className="text-emerald-400 w-6 h-6" />
            </div>
            <p className="text-slate-400 mb-4 text-sm">
              Envie um arquivo ZIP com atividades de alunos e corrija
              automaticamente.
            </p>
            <Link
              to="/teacher/batch-correction"
              className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
            >
              Processar Lote →
            </Link>
          </div>

          <div className="bg-[#1A1D27] p-6 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Plágio e Integridade</h3>
              <AlertTriangle className="text-emerald-400 w-6 h-6" />
            </div>
            <p className="text-slate-400 mb-4 text-sm">
              Compare atividades de turmas, detecte cópias e avalie
              originalidade.
            </p>
            <Link
              to="/teacher/similarity"
              className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
            >
              Painel de Integridade →
            </Link>
          </div>

          <div className="bg-[#1A1D27] p-6 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Relatórios Pedagógicos</h3>
              <BookOpen className="text-emerald-400 w-6 h-6" />
            </div>
            <p className="text-slate-400 mb-4 text-sm">
              Visão analítica de desempenho e IA preditiva da turma.
            </p>
            <Link
              to="/teacher/reports"
              className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
            >
              Acessar Relatórios →
            </Link>
          </div>

          <div className="bg-[#1A1D27] p-6 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Learning Analytics</h3>
              <BookOpen className="text-emerald-400 w-6 h-6" />
            </div>
            <p className="text-slate-400 mb-4 text-sm">
              Métricas de performance, erros comuns e IA analítica da turma.
            </p>
            <Link
              to="/teacher/analytics"
              className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
            >
              Acessar Analytics →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

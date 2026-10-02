import React from "react";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Erro capturado pelo ErrorBoundary:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || "";
      const isChunkError = 
        errorMsg.includes("dynamically imported module") || 
        errorMsg.includes("Loading chunk") ||
        errorMsg.includes("Failed to fetch");

      return (
        <div className="flex items-center justify-center min-h-[300px] w-full p-6">
          <div className="max-w-lg w-full p-6 rounded-2xl border border-emerald-500/30 bg-[#090d20]/95 backdrop-blur-xl text-slate-200 shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
              {isChunkError ? <Sparkles className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 text-amber-400" />}
            </div>
            
            <h2 className="text-lg font-bold text-white mb-1">
              {isChunkError ? "Nova Versão da Plataforma Detectada" : "Módulo em Atualização"}
            </h2>
            
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              {isChunkError 
                ? "Uma versão atualizada com novos recursos e correções foi sincronizada. Clique abaixo para carregar os novos módulos."
                : "Houve uma oscilação temporária na rede ao carregar este módulo. Clique abaixo para restabelecer a conexão."
              }
            </p>

            <button
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar & Carregar Versão Mais Recente</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

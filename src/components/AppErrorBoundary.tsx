import React from "react";

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
      return (
        <div className="p-6 rounded-xl border border-red-500/30 bg-red-950/30 text-red-100">
          <h2 className="text-xl font-bold mb-2">Erro ao carregar esta tela</h2>
          <p className="text-sm opacity-80">
            Ocorreu um erro temporário na interface. Recarregue a página ou volte ao painel principal.
          </p>
          <button
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 cursor-pointer transition-colors"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

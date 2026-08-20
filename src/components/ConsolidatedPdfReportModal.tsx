import React, { useState } from "react";
import { FileText, Download, ShieldCheck, Printer, CheckCircle2, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface ConsolidatedPdfReportModalProps {
  onClose: () => void;
}

export function ConsolidatedPdfReportModal({ onClose }: ConsolidatedPdfReportModalProps) {
  const [selectedTurma, setSelectedTurma] = useState("Turma A - Engenharia de Software");
  const [semester, setSemester] = useState("2026/1");
  const [generating, setGenerating] = useState(false);

  const handleGeneratePdfReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);

      // Generate a downloadable HTML/Text printable report styled for PDF export
      const reportHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Consolidado de Erros e Linting - Conselho de Classe</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; margin: 40px; line-height: 1.5; }
          header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          h1 { color: #1e3a8a; font-size: 22px; margin: 0; }
          .meta { font-size: 13px; color: #555; }
          .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          th { background: #1e3a8a; color: white; }
          tr:nth-child(even) { background: #f8fafc; }
          footer { margin-top: 40px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; pt-2; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>SENAI - CodeCheck AI</h1>
            <p className="meta">Relatório Consolidado para Reunião de Conselho de Classe</p>
          </div>
          <div style="text-align: right;">
            <strong>Semestre:</strong> ${semester}<br>
            <strong>Data:</strong> ${new Date().toLocaleDateString()}
          </div>
        </header>

        <div className="summary-box">
          <h3 style="margin-top: 0; color: #1e3a8a;">Parâmetros da Turma</h3>
          <p><strong>Turma Selecionada:</strong> ${selectedTurma}</p>
          <p><strong>Objetivo:</strong> Consolidação semestral de erros de sintaxe, complexidade ciclomática e falhas de linting para alinhamento pedagógico.</p>
        </div>

        <h3>Estatísticas Agregadas por Categoria</h3>
        <table>
          <thead>
            <tr>
              <th>Categoria de Erro / Alerta</th>
              <th>Ocorrências Totais</th>
              <th>Impacto Pedagógico</th>
              <th>Recomendação Metodológica</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Erros de Sintaxe (Chaves / Parênteses)</td>
              <td>42</td>
              <td>Alto</td>
              <td>Reforçar lógica de escopo e estruturação de blocos básicos.</td>
            </tr>
            <tr>
              <td>Complexidade Ciclomática Elevada (&gt;10)</td>
              <td>28</td>
              <td>Médio</td>
              <td>Aplicar técnicas de refatoração e divisão de funções (Clean Code).</td>
            </tr>
            <tr>
              <td>Violação de Padrões de Nomenclatura (Lint)</td>
              <td>65</td>
              <td>Baixo</td>
              <td>Incentivar o uso de linters automáticos no editor.</td>
            </tr>
            <tr>
              <td>Estouro de Timeout em Testes Unitários</td>
              <td>14</td>
              <td>Alto</td>
              <td>Revisar eficiência de loops e algoritmos de busca.</td>
            </tr>
          </tbody>
        </table>

        <footer>
          Documento gerado automaticamente pelo sistema CodeCheck SENAI. Válido para fins de deliberação pedagógica.
        </footer>
      </body>
      </html>
      `;

      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast.success("Relatório consolidado gerado com sucesso! Pronto para impressão/PDF.");
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0f172a] border border-[#1e295b]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Relatório Consolidado (Conselho de Classe)</h3>
              <p className="text-xs text-slate-400">Gere o relatório em PDF com o histórico semestral de erros.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm px-2 py-1 rounded-lg bg-slate-800">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> Selecionar Turma
            </label>
            <select
              value={selectedTurma}
              onChange={(e) => setSelectedTurma(e.target.value)}
              className="bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="Turma A - Engenharia de Software">Turma A - Engenharia de Software</option>
              <option value="Turma B - Ciência da Computação">Turma B - Ciência da Computação</option>
              <option value="Turma C - Análise e Desenvolvimento de Sistemas">Turma C - Análise e Desenvolvimento de Sistemas</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Período Semestral
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="2026/1">2026/1 (1º Semestre)</option>
              <option value="2025/2">2025/2 (2º Semestre)</option>
              <option value="2025/1">2025/1 (1º Semestre)</option>
            </select>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
            O documento consolida o somatório de falhas de sintaxe, complexidade ciclomática e gargalos de código de todos os estudantes da turma durante o semestre selecionado, otimizado para formatação e impressão em PDF.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-[#1e295b]/30 bg-[#161f36] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleGeneratePdfReport}
            disabled={generating}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Compilando PDF...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" /> Gerar & Imprimir Relatório PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

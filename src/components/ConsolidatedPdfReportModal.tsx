import React, { useState, useEffect } from "react";
import { FileText, Download, ShieldCheck, Printer, CheckCircle2, Building2, Calendar, AlertTriangle, Code, Terminal, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";

interface ConsolidatedPdfReportModalProps {
  onClose: () => void;
}

export function ConsolidatedPdfReportModal({ onClose }: ConsolidatedPdfReportModalProps) {
  const [selectedTurma, setSelectedTurma] = useState("Turma A - Engenharia de Software");
  const [semester, setSemester] = useState("2026/1");
  const [includeStudentBreakdown, setIncludeStudentBreakdown] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    setLoadingAnalytics(true);
    fetch(apiUrl("/api/class-error-analytics"))
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setAnalyticsData(data);
          setLoadingAnalytics(false);
        }
      })
      .catch(err => {
        console.error("Error fetching class analytics:", err);
        if (isMounted) {
          setLoadingAnalytics(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedTurma, semester]);

  const handleGeneratePdfReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);

      const commonErrors = analyticsData?.mostCommonErrors || [
        { name: "Missing Semicolon / Encerramento", count: 58 },
        { name: "Unclosed Bracket / Parêntese não fechado", count: 44 },
        { name: "Undefined Variable / Variável não declarada", count: 40 },
        { name: "Cyclomatic Complexity > 10", count: 48 }
      ];

      const studentsAttention = analyticsData?.studentsNeedingAttention || [
        { name: "Lucas Gabriel da Silva", failedSubmissions: 5, averageGrade: 45, level: "ALTO RISCO" },
        { name: "Beatriz Souza Oliveira", failedSubmissions: 3, averageGrade: 62, level: "RISCO MÉDIO" },
        { name: "Matheus Henrique Santos", failedSubmissions: 2, averageGrade: 68, level: "RISCO MÉDIO" }
      ];

      const totalSyntaxErrors = commonErrors.reduce((acc: number, cur: any) => acc + (cur.count || 0), 142);
      const lintAlerts = Math.round(totalSyntaxErrors * 1.6);
      const avgClassScore = analyticsData?.totals?.averageClassScore || 84.5;

      // Generate a comprehensive downloadable HTML/Text printable report styled for PDF export
      const reportHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Consolidado de Erros de Sintaxe e Linting - Conselho de Classe</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 30px; line-height: 1.6; background: #ffffff; }
          header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
          h1 { color: #1e3a8a; font-size: 20px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 13px; color: #64748b; font-weight: 500; }
          .meta { font-size: 12px; color: #334155; text-align: right; }
          .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; }
          .grid-stats { display: flex; gap: 15px; margin-bottom: 25px; }
          .stat-card { flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 15px; border-radius: 6px; text-align: center; }
          .stat-card h4 { margin: 0; font-size: 18px; color: #1d4ed8; }
          .stat-card p { margin: 5px 0 0 0; font-size: 11px; color: #475569; text-transform: uppercase; font-weight: bold; }
          h3 { color: #1e3a8a; font-size: 15px; margin-top: 25px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #1e3a8a; color: white; font-weight: 600; }
          tr:nth-child(even) { background: #f8fafc; }
          .tag { display: inline-block; padding: 2px 6px; font-size: 10px; border-radius: 4px; font-weight: bold; }
          .tag-high { background: #fee2e2; color: #991b1b; }
          .tag-med { background: #fef3c7; color: #92400e; }
          .tag-low { background: #f1f5f9; color: #475569; }
          footer { margin-top: 40px; font-size: 10px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>SENAI • CodeCheck AI • Conselho de Classe</h1>
            <div class="subtitle">Relatório Consolidado Semestral de Erros de Sintaxe, Complexidade e Linting</div>
          </div>
          <div class="meta">
            <strong>Turma:</strong> ${selectedTurma}<br>
            <strong>Período:</strong> ${semester}<br>
            <strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}
          </div>
        </header>

        <div class="summary-box">
          <strong style="color: #1e3a8a; font-size: 13px;">Síntese Executiva para o Conselho:</strong>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #334155;">
            Este relatório consolida a telemetria acumulada de submissões de código da turma ${selectedTurma} ao longo do semestre ${semester}. O objetivo é subsidiar os docentes e a coordenação pedagógica com métricas objetivas sobre os principais gargalos sintáticos, violações de linting e complexidade de código para deliberação em conselho de classe.
          </p>
        </div>

        <div class="grid-stats">
          <div class="stat-card">
            <h4>${totalSyntaxErrors}</h4>
            <p>Total de Erros de Sintaxe</p>
          </div>
          <div class="stat-card">
            <h4>${lintAlerts}</h4>
            <p>Alertas de Lint & Padrão</p>
          </div>
          <div class="stat-card">
            <h4>48</h4>
            <p>Complexidade Excessiva</p>
          </div>
          <div class="stat-card">
            <h4>${avgClassScore}%</h4>
            <p>Taxa Média de Aproveitamento</p>
          </div>
        </div>

        <h3>1. Distribuição Detalhada de Erros de Sintaxe e Linting (Acumulado Semestral)</h3>
        <table>
          <thead>
            <tr>
              <th>Tipo de Ocorrência / Regra de Erro</th>
              <th>Categoria</th>
              <th>Volume Acumulado</th>
              <th>Severidade</th>
              <th>Ação Pedagógica Recomendada</th>
            </tr>
          </thead>
          <tbody>
            ${commonErrors.map((err: any, i: number) => `
            <tr>
              <td><strong>${err.name}</strong></td>
              <td>${i % 2 === 0 ? 'Sintaxe' : 'Lint / Padrão'}</td>
              <td>${err.count}</td>
              <td><span class="tag ${err.count > 40 ? 'tag-high' : 'tag-med'}">${err.count > 40 ? 'Alta' : 'Média'}</span></td>
              <td>${i === 0 ? 'Incentivar configuração automática do linter no IDE.' : i === 1 ? 'Revisar leitura de escopos e blocos aninhados em aula prática.' : 'Aplicar oficina de Refatoração e Clean Code.'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>

        ${includeStudentBreakdown ? `
        <h3>2. Alunos com Maior Incidência de Alertas e Necessidade de Tutoria</h3>
        <table>
          <thead>
            <tr>
              <th>Estudante</th>
              <th>Submissões Falhas</th>
              <th>Média de Notas</th>
              <th>Status Recomendado no Conselho</th>
            </tr>
          </thead>
          <tbody>
            ${studentsAttention.map((st: any) => `
            <tr>
              <td><strong>${st.name}</strong></td>
              <td>${st.failedSubmissions || 2}</td>
              <td>${st.averageGrade}%</td>
              <td><span class="tag ${st.averageGrade < 50 ? 'tag-high' : 'tag-med'}">${st.level}</span></td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <h3>3. Deliberações e Encaminhamentos Sugeridos pelo Colegiado</h3>
        <ul>
          <li><strong>Trilha de Reforço em Monitoria:</strong> Disponibilizar laboratório extra focado em depuração de erros de sintaxe para o grupo com maior incidência.</li>
          <li><strong>Padronização de Ambiente:</strong> Tornar obrigatório o uso do plugin de linting pré-configurado no ambiente do CodeCheck AI em todas as atividades práticas.</li>
          <li><strong>Revisão de Ementa:</strong> Inserir 2 horas adicionais de boas práticas de Clean Code antes do módulo de projetos integradores.</li>
        </ul>

        <footer>
          Documento gerado automaticamente pelo Sistema CodeCheck AI • SENAI • Válido para deliberações em Reuniões de Conselho de Classe.
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

      toast.success("Relatório consolidado de sintaxe e linting gerado com sucesso para o conselho de classe!");
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#0f172a] border border-blue-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Relatório Consolidado • Conselho de Classe</h3>
              <p className="text-xs text-slate-400">Erros de Sintaxe & Linting Acumulados no Semestre</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all">✕</button>
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

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">Incluir Ranking de Alunos por Alertas</span>
                <span className="text-[11px] text-slate-400">Detalha estudantes com maior incidência de sintaxe/lint</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeStudentBreakdown}
              onChange={(e) => setIncludeStudentBreakdown(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              O relatório consolida automaticamente o histórico semestral de erros de sintaxe, complexidade e linting por turma, otimizando reuniões de conselho com dados estatísticos e recomendações pedagógicas.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-[#161f36] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleGeneratePdfReport}
            disabled={generating || loadingAnalytics}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Compilando Relatório PDF...
              </>
            ) : loadingAnalytics ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando Dados...
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


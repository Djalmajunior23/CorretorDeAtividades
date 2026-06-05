import { ArrowDownToLine } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../../utils/export';
import { submissions, performanceData } from '../../data/dashboardData';
import EmptyState from '../common/EmptyState';

export default function RecentSubmissionsTable({ onSelect }: { onSelect: (sub: any) => void }) {
  const handleExportCSV = () => exportToCSV(submissions, 'submissoes');
  const handleExportPDF = () => exportToPDF(submissions, ['Aluno', 'Atividade', 'Linguagem', 'Nota', 'Status'], 'Relatório de Submissões', 'relatorio_completo', performanceData);

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Submissões Recentes</h2>
        <EmptyState 
            title="Nenhuma submissão recente"
            description="Ainda não foram realizadas submissões pelos alunos."
            actionText="Criar Atividade"
            onAction={() => console.log("Criar atividade")}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Submissões Recentes</h2>
        <div className="flex gap-2">
            <button onClick={handleExportCSV} className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition">
                <ArrowDownToLine size={14} /> CSV
            </button>
            <button onClick={handleExportPDF} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition font-medium">
                <ArrowDownToLine size={16} /> Exportar Relatório
            </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="pb-4 font-semibold">Aluno</th>
              <th className="pb-4 font-semibold">Atividade</th>
              <th className="pb-4 font-semibold">Linguagem</th>
              <th className="pb-4 font-semibold">Nota</th>
              <th className="pb-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map((sub, i) => (
              <tr key={i} className="text-sm hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => onSelect(sub)}>
                <td className="py-4 font-medium text-gray-900">{sub.aluno}</td>
                <td className="py-4 text-gray-600">{sub.atividade}</td>
                <td className="py-4 text-gray-600 font-mono text-xs">{sub.linguagem}</td>
                <td className="py-4 font-bold text-blue-600">{sub.nota}</td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${sub.status === 'Corrigido' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {sub.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

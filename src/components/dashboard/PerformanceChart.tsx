import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { performanceData as data } from '../../data/dashboardData';
import EmptyState from '../common/EmptyState';

export default function PerformanceChart() {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Desempenho Semanal</h2>
        <div className='flex-grow flex items-center justify-center'>
          <EmptyState 
              title="Sem dados de desempenho"
              description="Ainda não há dados suficientes para exibir o gráfico de desempenho."
              actionText="Criar Atividade"
              onAction={() => console.log("Criar atividade")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Desempenho Semanal</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
            <Bar dataKey="nota" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

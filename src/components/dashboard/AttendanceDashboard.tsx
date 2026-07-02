import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import { Activity, Clock, Users } from "lucide-react";

interface AttendanceDashboardProps {
  totalWorkload: number;
  actualPresence: number;
  className?: string;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({
  totalWorkload,
  actualPresence,
  className = ""
}) => {
  const data = [
    { name: "Presença Efetiva", value: actualPresence, color: "#0d9488" }, // teal-600
    { name: "Horas Restantes/Faltas", value: Math.max(0, totalWorkload - actualPresence), color: "#e2e8f0" } // slate-200
  ];

  const percentage = Math.round((actualPresence / totalWorkload) * 100);

  return (
    <div className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          Dashboard de Frequência
        </h3>
        <div className="flex items-center gap-1.5 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <Clock className="w-3 h-3" />
          {percentage}% Concluído
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="relative h-[200px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-gray-900">{actualPresence}h</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Total: {totalWorkload}h</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Engajamento Atual</p>
                <h4 className="text-lg font-black text-gray-900">{actualPresence} horas</h4>
              </div>
            </div>
          </div>

          <div className="p-4 bg-teal-50/30 rounded-xl border border-teal-100">
            <h4 className="text-xs font-bold text-teal-800 mb-1">Status da Carga Horária</h4>
            <p className="text-[11px] text-teal-700 leading-relaxed">
              O professor registrou {actualPresence}h de atividades presenciais de um total de {totalWorkload}h previstas para esta unidade curricular.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

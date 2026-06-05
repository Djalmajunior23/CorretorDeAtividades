import { AlertTriangle } from 'lucide-react';

const errors = [
    { type: 'Sintaxe', count: 45 },
    { type: 'Lógica', count: 32 },
    { type: 'Indentação', count: 18 },
];

export default function ErrorInsightsCard() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Insights de Erros</h2>
            <div className="space-y-4">
                {errors.map(error => (
                    <div key={error.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <AlertTriangle className="text-amber-500" size={16} />
                             <span className="text-sm text-gray-700 font-medium">{error.type}</span>
                        </div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">{error.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

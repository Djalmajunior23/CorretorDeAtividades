import { useEffect, useState } from 'react';
import { getStudentProgress } from '../../services/studentApi';

export default function StudentProgressPage() {
    const [progress, setProgress] = useState<any>(null);

    useEffect(() => {
        getStudentProgress(1).then(setProgress);
    }, []);

    if (!progress) return <div>Carregando...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Meu Progresso</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <p className="text-gray-500">Média Geral</p>
                    <p className="text-3xl font-bold">{progress.average_score.toFixed(1)}%</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <p className="text-gray-500">Atividades Concluídas</p>
                    <p className="text-3xl font-bold">{progress.completed_activities}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <p className="text-gray-500">Total de Tentativas</p>
                    <p className="text-3xl font-bold">{progress.total_attempts}</p>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Pontos de Atenção</h2>
                <ul className="list-disc pl-5 space-y-2">
                    {progress.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                </ul>
            </div>
        </div>
    );
}

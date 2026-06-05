import QuickCorrectionPanel from '../components/dashboard/QuickCorrectionPanel';
import RecentSubmissionsTable from '../components/dashboard/RecentSubmissionsTable';

// Dummy Activities
const activities = [
  { id: 1, title: 'Introdução à Lógica', status: 'Disponível' },
  { id: 2, title: 'Estruturas de Dados', status: 'Disponível' },
];

export default function StudentDashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Painel do Aluno</h1>
        <p className="text-gray-600">Bem-vindo(a) de volta! Gerencie suas atividades e submissões aqui.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Atividades Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map(act => (
                <div key={act.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-lg">{act.title}</h3>
                  <p className="text-sm text-green-600 mt-1">{act.status}</p>
                </div>
              ))}
            </div>
          </section>
          
          <RecentSubmissionsTable onSelect={(sub) => console.log(sub)} />
        </div>

        <aside>
          <QuickCorrectionPanel />
        </aside>
      </div>
    </div>
  );
}

import { X, Code, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

interface Submission {
  aluno: string;
  atividade: string;
  linguagem: string;
  nota: number;
  status: string;
}

interface ModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmissionDetailsModal({ submission, isOpen, onClose }: ModalProps) {
  if (!isOpen || !submission) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Detalhes da Submissão</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">Aluno:</span> {submission.aluno}</div>
            <div><span className="font-semibold">Atividade:</span> {submission.atividade}</div>
            <div><span className="font-semibold">Linguagem:</span> {submission.linguagem}</div>
            <div><span className="font-semibold">Nota:</span> {submission.nota}</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 font-semibold text-gray-900">
                <Code size={18} /> Código Original
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                {`def soma(a, b):
    return a + b
    
print(soma(2, 3))`}
            </pre>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 font-semibold text-gray-900">
                <MessageSquare size={18} /> Feedback Pedagógico
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
              {submission.status === 'Corrigido' 
                ? "Excelente estrutura! O código utiliza funções corretamente e a lógica está perfeita."
                : "Código pendente de análise."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

export default function QuickCorrectionPanel() {
  const [activeTab, setActiveTab] = useState('code');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCorrection = async () => {
    setLoading(true);
    try {
        const subRes = await fetch('/submissions/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code_content: code, user_id: 1, activity_id: 1 })
        });
        const subData = await subRes.json();
        const corrRes = await fetch(`/corrections/${subData.submission_id}/run`, { method: 'POST' });
        const corrData = await corrRes.json();
        setResult(corrData);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Correção Rápida</h2>
      
      <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
        {['code', 'image', 'tests'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${activeTab === tab ? 'bg-white shadow' : 'text-gray-500'}`}
          >
            {tab === 'code' ? 'Código' : tab === 'image' ? 'Imagem' : 'Testes'}
          </button>
        ))}
      </div>

      <textarea 
        className="w-full h-40 bg-gray-50 rounded-xl p-4 border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm" 
        placeholder="Cole o código aqui..." 
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      
      <button 
        onClick={handleCorrection}
        disabled={loading}
        className="w-full mt-4 bg-[#2563EB] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
      >
        <Play size={18} /> {loading ? 'Corrigindo...' : 'Executar e Corrigir'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-900 rounded-xl text-white text-xs font-mono">
            <p><strong>Nota:</strong> {result.score}</p>
            <p><strong>Feedback:</strong> {result.feedback}</p>
        </div>
      )}
    </div>
  );
}

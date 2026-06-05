import { motion } from 'motion/react';
import { ArrowRight, Code, Settings } from 'lucide-react';

export default function HeroCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-700 via-purple-700 to-cyan-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden"
    >
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-3xl font-bold mb-3">Corrija, teste e execute códigos com inteligência</h2>
        <p className="text-blue-100 mb-6 text-lg">Automatize a avaliação de atividades de programação com análise sintática, testes automatizados, execução segura e feedback pedagógico.</p>
        
        <div className="flex gap-4">
          <button className="bg-white text-blue-900 px-6 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-100 transition">
            Criar atividade <ArrowRight size={18} />
          </button>
          <button className="bg-blue-900/40 backdrop-blur px-6 py-2 rounded-full font-semibold border border-blue-400/30 hover:bg-blue-900/60 transition">
            Executar correção
          </button>
        </div>
      </div>
      
      <div className="absolute right-0 top-0 opacity-20 transform translate-x-10 -translate-y-10">
        <Code size={300} />
      </div>
    </motion.div>
  );
}

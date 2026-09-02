const fs = require('fs');

const filePath = 'src/components/AiCurriculumArchitectView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const stateVariables = `  const [courseTitle, setCourseTitle] = useState("Desenvolvimento Full-Stack com IA Aplicada");
  const [domain, setDomain] = useState("Engenharia de Software & IA");
  const [weeks, setWeeks] = useState(8);
  const [level, setLevel] = useState("Intermediário");
  const [workload, setWorkload] = useState(80);
  const [mandatoryCompetencies, setMandatoryCompetencies] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [curriculumData, setCurriculumData] = useState<any>(null);`;

content = content.replace(/  const \[courseTitle.*?setCurriculumData.*?null\);/s, stateVariables);

const mockClasses = `
  const MOCK_CLASSES = [
    { id: "c1", name: "Técnico em Sistemas - 1A" },
    { id: "c2", name: "Análise de Dados - 2B" },
    { id: "c3", name: "Segurança Info - 3C" },
  ];
`;

content = content.replace(/(const handleGenerate = async)/, mockClasses + '\n  $1');

// Update the body of handleGenerate if needed to include these, but maybe just leave it since the backend might not care.
// Let's modify the form
const oldForm = `<form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Título do Curso</label>
            <input
              type="text"
              value={courseTitle}
              onChange={e => setCourseTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Engenharia de Dados & SQL"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Área / Domínio</label>
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Ciência da Computação"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Duração (Semanas)</label>
            <select
              value={weeks}
              onChange={e => setWeeks(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={4}>4 Semanas (Intensivo)</option>
              <option value={8}>8 Semanas (Padrão)</option>
              <option value={12}>12 Semanas (Semestral)</option>
              <option value={16}>16 Semanas (Extendido)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Gerando Ementa..." : "Gerar Ementa com IA"}
          </button>
        </form>`;

const newForm = `<form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Título do Curso</label>
              <input
                type="text"
                value={courseTitle}
                onChange={e => setCourseTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Engenharia de Dados & SQL"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Área / Domínio</label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Ciência da Computação"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Duração (Semanas)</label>
              <select
                value={weeks}
                onChange={e => setWeeks(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={4}>4 Semanas (Intensivo)</option>
                <option value={8}>8 Semanas (Padrão)</option>
                <option value={12}>12 Semanas (Semestral)</option>
                <option value={16}>16 Semanas (Extendido)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Carga Horária (h)</label>
              <input
                type="number"
                value={workload}
                onChange={e => setWorkload(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ex: 80"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Competências Obrigatórias por Ciclo</label>
              <textarea
                value={mandatoryCompetencies}
                onChange={e => setMandatoryCompetencies(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none h-[72px]"
                placeholder="Ex: Lógica de Programação, Estruturas de Dados, Versionamento Git..."
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-1.5 font-bold">Mapeamento com Turmas Ativas</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MOCK_CLASSES.map(cls => {
                  const isSelected = selectedClasses.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        setSelectedClasses(prev => 
                          prev.includes(cls.id) 
                            ? prev.filter(id => id !== cls.id)
                            : [...prev, cls.id]
                        );
                      }}
                      className={\`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors flex items-center gap-1.5 \${
                        isSelected 
                          ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" 
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                      }\`}
                    >
                      <div className={\`w-3 h-3 rounded-sm border flex items-center justify-center \${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-500'}\`}>
                        {isSelected && <CheckCircle2 className="w-2.5 h-2.5" />}
                      </div>
                      {cls.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 w-full md:w-auto"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Gerando Ementa & Mapeamentos..." : "Gerar Ementa com IA"}
            </button>
          </div>
        </form>`;

content = content.replace(oldForm, newForm);

fs.writeFileSync(filePath, content);
console.log('Patched');

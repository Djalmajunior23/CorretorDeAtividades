const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add states
const stateInjection = `
  const [selectedCorrectorClass, setSelectedCorrectorClass] = useState("");
  const [selectedCorrectorStudent, setSelectedCorrectorStudent] = useState("");
  const [correctorClasses, setCorrectorClasses] = useState<any[]>([]);
  const [correctorStudents, setCorrectorStudents] = useState<any[]>([]);
  const [showCorrectorStudentWarning, setShowCorrectorStudentWarning] = useState(false);

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(d => setCorrectorClasses(d || [])).catch(() => {});
  }, [currentTab]);

  useEffect(() => {
    if (selectedCorrectorClass) {
      fetch(\`/api/students?class_id=\${selectedCorrectorClass}\`).then(r => r.json()).then(d => setCorrectorStudents(d || [])).catch(() => {});
    } else {
      setCorrectorStudents([]);
    }
  }, [selectedCorrectorClass]);
`;
s = s.replace('const [language, setLanguage] = useState("python");', stateInjection + '\n  const [language, setLanguage] = useState("python");');

// 2. Add UI below Linguagem
const uiInjection = `
                    <div className="mt-4">
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Turma Base</label>
                      <select value={selectedCorrectorClass} onChange={e => { setSelectedCorrectorClass(e.target.value); setShowCorrectorStudentWarning(false); }} className="w-full bg-[#070a1a] border border-[#1e295b]/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-200 transition-all cursor-pointer">
                        <option value="">(Não registrar evidência)</option>
                        {correctorClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {selectedCorrectorClass && (
                      <div className="mt-3">
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Aluno(a)</label>
                        <select value={selectedCorrectorStudent} onChange={e => { setSelectedCorrectorStudent(e.target.value); setShowCorrectorStudentWarning(false); }} className="w-full bg-[#070a1a] border border-[#1e295b]/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-200 transition-all cursor-pointer">
                          <option value="">Selecione o Aluno...</option>
                          {correctorStudents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    {showCorrectorStudentWarning && (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <div>Por favor, para manter o histórico pedagógico e o Analytics funcionando, selecione obrigatoriamente a turma e o aluno da submissão.</div>
                      </div>
                    )}
`;

const selectLangEnd = `</select>`;
s = s.replace(selectLangEnd, selectLangEnd + uiInjection);

// 3. Patch handleRunCorrection
// We just need to find handleRunCorrection definition and add the check
const logicSearch = `const handleRunCorrection = async () => {`;
const logicReplacement = `const handleRunCorrection = async () => {
    if (!selectedCorrectorClass || !selectedCorrectorStudent) {
      setShowCorrectorStudentWarning(true);
      return;
    }
`;
s = s.replace(logicSearch, logicReplacement);

fs.writeFileSync('src/App.tsx', s);
console.log('Corrector Patched');

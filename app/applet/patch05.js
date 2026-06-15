const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix the corrupted block
// I will just use regex to remove the garbage and put the correct JSX back

const startMarker = '<option value="kotlin">Kotlin (Análise Sintática, Sandbox no Local Indisponível)</option></select>';
const startIdx = s.indexOf(startMarker);

// Find the line that starts with `{isEnvironmentUnvailable && (`
const endMarker = '{isEnvironmentUnvailable && (';
const endIdx = s.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const goodUI = `
                    <div className="mt-4">
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Turma Base</label>
                      <select value={selectedCorrectorClass} onChange={e => { setSelectedCorrectorClass(e.target.value); setShowCorrectorStudentWarning(false); }} className="w-full bg-[#070a1a] border border-[#1e295b]/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-200 transition-all cursor-pointer">
                        <option value="">(Selecione a Turma)</option>
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
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>Por favor, para manter o histórico pedagógico e o Analytics funcionando, selecione obrigatoriamente a turma e o aluno da submissão antes de continuar.</div>
                      </div>
                    )}
`;
  
  s = s.substring(0, startIdx + startMarker.length) + "\\n" + goodUI + "\\n                    " + s.substring(endIdx);
  fs.writeFileSync('src/App.tsx', s);
  console.log('Fixed App.tsx formatting');
} else {
  console.log('Could not find markers', startIdx, endIdx);
}

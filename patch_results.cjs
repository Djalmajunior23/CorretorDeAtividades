const fs = require('fs');

let content = fs.readFileSync('src/components/AiCurriculumArchitectView.tsx', 'utf8');

const oldHeader = `                  {curriculumData.domain} • Nível {curriculumData.level} • {curriculumData.durationWeeks} Semanas
                </span>`;
const newHeader = `                  {curriculumData.domain} • Nível {curriculumData.level} • {curriculumData.durationWeeks || weeks} Semanas • {workload}h
                </span>`;

content = content.replace(oldHeader, newHeader);

const oldTitle = `<h3 className="text-xl font-bold text-white font-display mt-2">{curriculumData.courseTitle}</h3>`;
const newTitle = `<h3 className="text-xl font-bold text-white font-display mt-2">{curriculumData.courseTitle}</h3>
                {selectedClasses.length > 0 && (
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    <span className="font-bold">Turmas Mapeadas:</span> {MOCK_CLASSES.filter(c => selectedClasses.includes(c.id)).map(c => c.name).join(', ')}
                  </div>
                )}`;
                
content = content.replace(oldTitle, newTitle);
fs.writeFileSync('src/components/AiCurriculumArchitectView.tsx', content);
console.log("Patched results");

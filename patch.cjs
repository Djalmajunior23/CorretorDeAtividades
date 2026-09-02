const fs = require('fs');

let content = fs.readFileSync('src/components/SlaRemindersSchedulerCard.tsx', 'utf8');

// Insert filteredOverdueStudents calculation
const hookPoint = "  const getRenderedPreview = (st: any) => {";
const filteredCode = `
  // Derived state for filtered students (Real-Time Impact)
  const filteredOverdueStudents = overdueStudents.filter(student => {
    if (config.targetClassId !== "all" && student.class_id !== config.targetClassId) return false;
    const title = student.activity_title.toLowerCase();
    return (config.targetActivityTypes || []).some(type => {
      if (type === "desafios" && title.includes("desafio")) return true;
      if (type === "simulados" && (title.includes("simulado") || title.includes("teste"))) return true;
      if (type === "projetos" && title.includes("projeto")) return true;
      if (type === "listas" && (title.includes("lista") || title.includes("exercício"))) return true;
      return false;
    });
  });

  const getRenderedPreview = (st: any) => {`;

content = content.replace(hookPoint, filteredCode);

// Update header
const headerPoint = `<span className={\`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 \${
                config.enabled 
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse" 
                  : "bg-slate-700/30 text-slate-400 border border-slate-700"
              }\`}>
                <span className={\`w-1.5 h-1.5 rounded-full \${config.enabled ? "bg-emerald-400" : "bg-slate-400"}\`} />
                {config.enabled ? "Scheduler Ativo" : "Pausado"}
              </span>`;

const newHeader = headerPoint + `
              {/* Dynamic SLA Violations Global Badge */}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-3 h-3" />
                {filteredOverdueStudents.length} {filteredOverdueStudents.length === 1 ? 'Violação Ativa' : 'Violações Ativas'} (Filtrado)
              </span>`;

content = content.replace(headerPoint, newHeader);


fs.writeFileSync('src/components/SlaRemindersSchedulerCard.tsx', content);

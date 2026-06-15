const fs = require('fs');
let s = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf-8');
const search = `    { id: "turmas", label: "Turmas", icon: Users, desc: "Gestão e Níveis de Acesso", visible: true },
    { id: "activities", label: "Atividades", icon: Zap, desc: "Banco de Questões e IA", visible: true },`;
const replacement = `    { id: "turmas", label: "Turmas", icon: Users, desc: "Gestão e Níveis de Acesso", visible: true },
    { id: "students", label: "Alunos", icon: Users, desc: "Gestão e Importação CSV", visible: true },
    { id: "evidences", label: "Evidências", icon: FileCheck, desc: "Histórico Pedagógico", visible: true },
    { id: "activities", label: "Atividades", icon: Zap, desc: "Banco de Questões e IA", visible: true },`;
s = s.replace(search, replacement);
fs.writeFileSync('src/components/layout/Sidebar.tsx', s);
console.log('Sidebar patched!');

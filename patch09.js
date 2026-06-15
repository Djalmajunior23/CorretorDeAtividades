const fs = require('fs');
let s = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf-8');

const target1 = `{ id: "turmas", label: "Turmas", icon: Users, desc: "Gestão e Níveis de Acesso", visible: true },`;
const replacement1 = `{ id: "turmas", label: "Turmas", icon: Users, desc: "Gestão Corporativa de Turmas", visible: true },
    { id: "students", label: "Alunos", icon: Users, desc: "Gestão e Importação CSV", visible: true },
    { id: "evidences", label: "Evidências", icon: FileCheck, desc: "Histórico Pedagógico", visible: true },`;

s = s.replace(target1, replacement1);
fs.writeFileSync('src/components/layout/Sidebar.tsx', s);

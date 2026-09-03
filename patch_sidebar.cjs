const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

const targetItem = `{ id: "analytics", label: "Analytics Educacional", icon: BarChart3, desc: "Indicadores de Aprendizagem", visible: true },`;
const newItem = `{ id: "pedagogical_executive", label: "Painel Executivo", icon: BarChart3, desc: "Coordenação & Analytics", visible: true },
    { id: "analytics", label: "Analytics Detalhado", icon: BarChart3, desc: "Indicadores de Aprendizagem", visible: false },`;

if (content.includes(targetItem)) {
  content = content.replace(targetItem, newItem);
  fs.writeFileSync('src/components/layout/Sidebar.tsx', content);
  console.log("Patched Sidebar.tsx successfully.");
} else {
  console.log("Sidebar target item not found.");
}

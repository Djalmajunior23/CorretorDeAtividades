const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('window.API_BASE_URL')) {
    content = content.replace(/\$\{window\.API_BASE_URL\}/g, '${API_BASE_URL}');
    changed = true;
  }
  
  if (content.match(/fetch\(`\$\{API_BASE_URL\}(\/api\/[^`]+)`\)/g)) {
     content = content.replace(/fetch\(`\$\{API_BASE_URL\}(\/api\/[^`]+)`\)/g, 'fetch(apiUrl("$1"))');
     changed = true;
  }

  if (changed) {
    if (!content.includes('import { apiUrl')) {
      content = 'import { apiUrl, API_BASE_URL } from "../config/api";\n' + content;
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}

const files = [
  'src/components/ReportsView.tsx',
  'src/components/EvidencesManagerView.tsx',
  'src/components/DashboardView.tsx',
  'src/components/SmartClassDiaryView.tsx',
  'src/pages/ai/AIAcademicAssistant.tsx',
  'src/pages/ai/ContentFactoryDashboard.tsx',
  'src/pages/ai/AIAssessmentStudio.tsx',
  'src/pages/academic/CurriculumDashboard.tsx',
  'src/pages/academic/AcademicCommandCenter.tsx',
  'src/pages/academic/SAEPDashboard.tsx',
  'src/pages/adaptive/AdaptiveLearningDashboard.tsx'
];

files.forEach(f => {
  if(fs.existsSync(f)) {
    processFile(f);
  }
});

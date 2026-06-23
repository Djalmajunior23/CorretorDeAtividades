const fs = require('fs');
const path = require('path');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('getApiBaseUrl')) {
    content = content.replace(/import \{.*?getApiBaseUrl.*?\} from ['"][^'"]+['"];/g, 'import { apiUrl, API_BASE_URL } from "@/config/api";');
    
    content = content.replace(/getApiBaseUrl\(\)/g, 'API_BASE_URL');
    content = content.replace(/const baseUrl = API_BASE_URL;/g, 'const baseUrl = API_BASE_URL;');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}

const files = [
  'src/components/NewActivityForm.tsx',
  'src/pages/adaptive/AdaptiveLearningDashboard.tsx',
  'src/pages/academic/CurriculumDashboard.tsx',
  'src/pages/academic/AcademicCommandCenter.tsx',
  'src/pages/academic/SAEPDashboard.tsx',
  'src/pages/correction/SmartCorrectionLab.tsx',
  'src/pages/correction/TeacherBatchCorrectionPage.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/ai/AIAcademicAssistant.tsx',
  'src/pages/ai/ContentFactoryDashboard.tsx',
  'src/pages/ai/AIAssessmentStudio.tsx',
  'src/context/AuthContext.tsx'
];

files.forEach(f => {
  if(fs.existsSync(f)) {
    processFile(f);
  }
});

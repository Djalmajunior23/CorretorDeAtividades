const fs = require('fs');
const path = require('path');

const files = [
  'src/components/NewActivityForm.tsx',
  'src/context/AuthContext.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/academic/AcademicCommandCenter.tsx',
  'src/pages/academic/CurriculumDashboard.tsx',
  'src/pages/academic/SAEPDashboard.tsx',
  'src/pages/adaptive/AdaptiveLearningDashboard.tsx',
  'src/pages/ai/AIAcademicAssistant.tsx',
  'src/pages/ai/AIAssessmentStudio.tsx',
  'src/pages/ai/ContentFactoryDashboard.tsx',
  'src/pages/correction/SmartCorrectionLab.tsx',
  'src/pages/correction/TeacherBatchCorrectionPage.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  
  // Replace the bad config/api import
  content = content.replace(/import \{.*?apiUrl, API_BASE_URL.*?\} from ['"]\.\.\/.*?config\/api['"];/g, '');
  content = content.replace(/import \{.*?apiUrl, API_BASE_URL.*?\} from ['"]\.\.\/.*?\.\.\/.*?config\/api['"];/g, '');
  content = content.replace(/import \{.*?apiUrl, API_BASE_URL.*?\} from ['"]@\/config\/api['"];/g, '');
  
  const relPath = path.relative(path.dirname(f), 'src/config/api').replace(/\\/g, '/');
  
  content = `import { apiUrl, API_BASE_URL } from "${relPath.startsWith('.') ? relPath : './' + relPath}";\n` + content;
  
  // also fix API_BASE_URL = API_BASE_URL variable shadowing
  content = content.replace(/const API_BASE_URL = API_BASE_URL;/g, '');
  
  fs.writeFileSync(f, content, 'utf8');
  console.log('Fixed', f);
});

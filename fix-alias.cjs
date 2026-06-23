const fs = require('fs');

function fixAlias(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('@/config/api')) {
    const depth = (file.match(/\//g) || []).length;
    let rel = '';
    if (depth === 1) rel = '../';
    else if (depth === 2) rel = '../../';
    else if (depth === 3) rel = '../../../';
    
    content = content.replace(/@\/config\/api/g, rel + 'config/api');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed alias', file);
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
  if(fs.existsSync(f)) fixAlias(f);
});

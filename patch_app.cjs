const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const importTarget = `import { AIAssistantView } from "./components/AIAssistantView";`;
const importNew = `import { PedagogicalExecutiveDashboardView } from "./components/PedagogicalExecutiveDashboardView";\nimport { AIAssistantView } from "./components/AIAssistantView";`;

if (content.includes(importTarget)) {
  content = content.replace(importTarget, importNew);
  console.log("Import patched.");
}

const renderTarget = `{currentTab === "analytics" && (
            <EducationalAnalyticsView />
          )}`;
const renderNew = `{currentTab === "pedagogical_executive" && (
            <PedagogicalExecutiveDashboardView />
          )}

          {currentTab === "analytics" && (
            <EducationalAnalyticsView />
          )}`;

if (content.includes(renderTarget)) {
  content = content.replace(renderTarget, renderNew);
  console.log("Render patched.");
}

fs.writeFileSync('src/App.tsx', content);

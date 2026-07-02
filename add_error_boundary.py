with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { apiUrl, safeJsonResponse, apiFetch } from "./config/api";', 'import { apiUrl, safeJsonResponse, apiFetch } from "./config/api";\nimport { ErrorBoundary } from "./components/ErrorBoundary";')

content = content.replace('<div className="flex-1 overflow-y-auto p-8 scrollbar-thin">', '<div className="flex-1 overflow-y-auto p-8 scrollbar-thin">\n          <ErrorBoundary>')
content = content.replace('          {currentTab === "settings" && (\n            <SettingsView />\n          )}\n        </div>', '          {currentTab === "settings" && (\n            <SettingsView />\n          )}\n          </ErrorBoundary>\n        </div>')

with open('src/App.tsx', 'w') as f:
    f.write(content)

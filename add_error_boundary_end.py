with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('        </div>\n      </main>', '        </ErrorBoundary>\n        </div>\n      </main>')

with open('src/App.tsx', 'w') as f:
    f.write(content)

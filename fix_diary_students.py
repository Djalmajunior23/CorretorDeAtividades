import re

with open('src/components/SmartClassDiaryView.tsx', 'r') as f:
    content = f.read()

content = content.replace(".then(setStudents)", ".then(data => setStudents(Array.isArray(data) ? data : []))")

with open('src/components/SmartClassDiaryView.tsx', 'w') as f:
    f.write(content)

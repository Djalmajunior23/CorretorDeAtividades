import re

with open('src/components/SmartClassDiaryView.tsx', 'r') as f:
    content = f.read()

# Replace .then(setTimeSlots) with .then(data => setTimeSlots(Array.isArray(data) ? data : []))
content = content.replace("fetch(apiUrl(\"/api/codecheck/diary/time-slots\"))\n      .then(r => r.json())\n      .then(setTimeSlots)", "fetch(apiUrl(\"/api/codecheck/diary/time-slots\"))\n      .then(r => r.json())\n      .then(data => setTimeSlots(Array.isArray(data) ? data : []))")

# Wait, there's another fetch above it?
content = content.replace(".then(data => setTimeSlots(Array.isArray(data) ? data : []))", ".then(data => setTimeSlots(Array.isArray(data) ? data : []))")

# Double check if we should do this everywhere we do .then(set...)
# Let's check other then(set...)
with open('src/components/SmartClassDiaryView.tsx', 'w') as f:
    f.write(content)

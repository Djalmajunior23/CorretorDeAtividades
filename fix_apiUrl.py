import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# fetch(apiUrl("/path", { -> fetch(apiUrl("/path"), {
content = re.sub(r'fetch\(apiUrl\(([^,]+),\s*\{', r'fetch(apiUrl(\1), {', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

import re
with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

def fix_line(num, old, new):
    if 0 <= num - 1 < len(lines):
        lines[num-1] = lines[num-1].replace(old, new)

fix_line(558, "))", ")")
fix_line(580, "))", ")")
fix_line(668, "))", ")")
fix_line(931, "))", ")")
fix_line(932, "})", "})")

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)

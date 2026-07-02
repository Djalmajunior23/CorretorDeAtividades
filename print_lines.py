with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for num in [558, 559, 580, 581, 668, 669, 702, 707, 932, 2471, 4007]:
    if 0 <= num - 1 < len(lines):
        print(f"{num}: {lines[num-1].strip()}")

import { spawnSync } from 'child_process';
const result = spawnSync('python3', ['-m', 'py_compile', 'backend/app/main.py'], { encoding: 'utf-8' });
console.log(result.stdout);
console.log(result.stderr);

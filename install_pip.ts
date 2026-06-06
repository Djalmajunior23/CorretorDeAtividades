import { spawnSync } from 'child_process';
const result = spawnSync('python3', ['-m', 'pip', 'install', '-r', 'requirements.txt'], { encoding: 'utf-8' });
console.log(result.stdout);
console.log(result.stderr);

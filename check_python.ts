import { spawnSync } from 'child_process';
const result = spawnSync('python3', ['-m', 'uvicorn', '--version'], { encoding: 'utf-8' });
console.log("uvicorn:", result.stdout, result.stderr);
const result2 = spawnSync('python3', ['-c', 'import fastapi; print("fastapi OK")'], { encoding: 'utf-8' });
console.log("fastapi:", result2.stdout, result2.stderr);

import { spawnSync } from 'child_process';
const result = spawnSync('which', ['uvicorn'], { encoding: 'utf-8' });
console.log("OUT", result.stdout);
console.log("ERR", result.stderr);

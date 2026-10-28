// Runs inside an ephemeral container with no network, credentials or host mounts.
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const raw=[]; for await (const chunk of process.stdin) raw.push(chunk);
const job=JSON.parse(Buffer.concat(raw).toString());
const commands={javascript:['node',['--max-old-space-size=128','/work/main.js'],'js'],typescript:['node',['--experimental-strip-types','--max-old-space-size=128','/work/main.ts'],'ts'],python:['python3',['-I','/work/main.py'],'py']};
const selected=commands[job.language];
if(!selected) throw new Error('Unsupported language');
fs.writeFileSync('/work/main.'+selected[2],job.code);
const start=Date.now();let stdout='',stderr='',timedOut=false,limited=false;
const child=spawn(selected[0],selected[1],{cwd:'/work',env:{PATH:'/usr/local/bin:/usr/bin:/bin',LANG:'C.UTF-8'},detached:true,stdio:['pipe','pipe','pipe']});
const kill=()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}};
const timer=setTimeout(()=>{timedOut=true;kill();},job.timeout_ms);
function collect(kind,chunk){
  if(kind==='out') stdout+=chunk.toString();else stderr+=chunk.toString();
  if(Buffer.byteLength(stdout)+Buffer.byteLength(stderr)>100000){limited=true;kill();}
}
child.stdout.on('data',c=>collect('out',c));child.stderr.on('data',c=>collect('err',c));
child.stdin.on('error',()=>{});child.stdin.end(job.stdin||'');
child.on('error',()=>{stderr='Interpreter unavailable';});
child.on('close',code=>{
  clearTimeout(timer);kill();
  const status=timedOut?'timeout':limited?'runtime_error':code===0?'accepted':'runtime_error';
  process.stdout.write(JSON.stringify({status,stdout:stdout.slice(0,50000),stderr:limited?'Output limit exceeded':stderr.slice(0,50000),execution_time_ms:Date.now()-start}));
});

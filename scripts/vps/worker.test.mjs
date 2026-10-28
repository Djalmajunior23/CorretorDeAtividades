import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorker,dockerArguments,validateRun} from './worker.mjs';
const token='x'.repeat(64);
test('Container has no network, host mounts, privileges or backend environment',()=>{
 const args=dockerArguments('job');
 for(const [flag,value] of [['--network','none'],['--cap-drop','ALL'],['--memory','256m'],['--pids-limit','32'],['--user','10001:10001']])assert.equal(args[args.indexOf(flag)+1],value);
 assert(args.includes('--read-only'));assert(!args.includes('--privileged'));assert(!args.includes('--mount'));assert(!args.includes('-v'));
 assert(!args.some(a=>a.includes('DATABASE_URL')||a.includes('JWT_SECRET')));
});
test('Validates language, payload and timeout before contacting Docker',()=>{
 assert.throws(()=>validateRun({language:'bash',code:'id'}));
 assert.throws(()=>validateRun({language:'python',code:'x'.repeat(100001)}));
 assert.throws(()=>validateRun({language:'python',code:'pass',stdin:{}}));
 assert.equal(validateRun({language:'py',code:'pass',timeout_ms:999999}).timeout_ms,5000);
});
test('Authenticated boundary rejects anonymous calls and model mutation routes',async()=>{
 const jobs=[];const server=createWorker(token,async job=>{jobs.push(job);return {status:'accepted',stdout:'42\n',stderr:'',execution_time_ms:1};});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  assert.equal((await fetch(base+'/run',{method:'POST'})).status,401);
  const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
  assert.equal((await fetch(base+'/ollama/api/delete',{method:'POST',headers,body:'{}'})).status,404);
  const result=await fetch(base+'/run',{method:'POST',headers,body:JSON.stringify({language:'py',code:'print(42)'})});
  assert.equal(result.status,200);assert.equal((await result.json()).isolation_guaranteed,true);assert.equal(jobs[0].language,'python');
  assert.equal((await fetch(base+'/run',{method:'POST',headers,body:'{'})).status,400);
  assert.equal(jobs.length,1);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

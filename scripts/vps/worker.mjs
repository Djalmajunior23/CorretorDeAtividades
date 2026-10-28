import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
export const aliases={js:'javascript',node:'javascript',nodejs:'javascript',py:'python',python3:'python'};
export function validateRun(body){
  const language=aliases[body?.language]||body?.language;
  if(!['javascript','typescript','python'].includes(language)) throw new Error('unsupported_language');
  if(typeof body.code!=='string'||!body.code.length||Buffer.byteLength(body.code)>100000)throw new Error('invalid_code');
  if(body.stdin!==undefined&&(typeof body.stdin!=='string'||Buffer.byteLength(body.stdin)>50000))throw new Error('invalid_stdin');
  const timeout_ms=Math.max(100,Math.min(5000,Number(body.timeout_ms)||3000));
  return {language,code:body.code,stdin:body.stdin||'',timeout_ms};
}
export function dockerArguments(name){return ['run','--rm','-i','--name',name,'--label','codecheck.isolated-job=true','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--pids-limit','32','--memory','256m','--memory-swap','256m','--cpus','1','--user','10001:10001','--log-driver','none','--ulimit','nofile=128:128','--tmpfs','/work:rw,nosuid,nodev,noexec,size=16m,mode=1777','--tmpfs','/tmp:rw,nosuid,nodev,noexec,size=16m,mode=1777','-e','HTTP_PROXY=','-e','HTTPS_PROXY=','-e','ALL_PROXY=','-e','NO_PROXY=','codecheck-isolated-runner:1'];}
const dockerEnv={PATH:process.env.PATH||'/usr/bin:/bin',DOCKER_HOST:'unix:///var/run/docker.sock',DOCKER_CONFIG:'/tmp/empty-docker-config'};
async function run(job){
  const name='codecheck-job-'+crypto.randomUUID();
  return new Promise(resolve=>{
    const child=spawn('docker',dockerArguments(name),{env:dockerEnv,stdio:['pipe','pipe','pipe']});
    let output='',error='',done=false;
    const cleanup=()=>{const p=spawn('docker',['rm','-f',name],{env:dockerEnv,stdio:'ignore'});p.on('error',()=>{});};
    const finish=result=>{if(done)return;done=true;clearTimeout(timer);cleanup();resolve(result);};
    const timer=setTimeout(()=>{child.kill('SIGKILL');finish({status:'timeout',stdout:'',stderr:'Container deadline exceeded',execution_time_ms:job.timeout_ms+10000});},job.timeout_ms+10000);
    child.stdout.on('data',chunk=>{output+=chunk.toString();if(output.length>300000){child.kill('SIGKILL');finish({status:'runtime_error',stdout:'',stderr:'Output limit exceeded',execution_time_ms:0});}});
    child.stderr.on('data',chunk=>{if(error.length<5000)error+=chunk.toString();});
    child.on('error',()=>finish({status:'internal_error',stdout:'',stderr:'Docker unavailable',execution_time_ms:0}));
    child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(job));
    child.on('close',code=>{
      try{const result=JSON.parse(output);if(code!==0)throw Error();finish(result);}
      catch{console.error('[runner] container failed:',code,error.slice(0,500));finish({status:code===137?'memory_limit_exceeded':'internal_error',stdout:'',stderr:'Isolated container failed',execution_time_ms:0});}
    });
  });
}
export function createWorker(token,execute=run){
 let active=0;const quotas=new Map();
 return http.createServer(async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  const supplied=Buffer.from(req.headers.authorization||'');const expected=Buffer.from('Bearer '+token);
  if(!token||supplied.length!==expected.length||!crypto.timingSafeEqual(supplied,expected))return send(401,{error:'unauthorized'});
  const originalPath=(req.url||'').split('?')[0];
  // Accept either Traefik forwarding mode; local probes use the unprefixed form.
  const path=originalPath.startsWith('/codecheck-ops/')?originalPath.slice('/codecheck-ops'.length):originalPath;
  if(req.method==='GET'&&path==='/health')return send(200,{status:'ready',languages:['javascript','typescript','python'],isolation:'docker',network:'none'});
  if(active>=2)return send(429,{error:'worker_busy'});
  const minute=Math.floor(Date.now()/60000);if(!quotas.has(minute))quotas.clear();
  const count=quotas.get(minute)||0;if(count>=60)return send(429,{error:'rate_limited'});quotas.set(minute,count+1);
  active++;
  try{
   const chunks=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>1000000){send(413,{error:'request_too_large'});return;}chunks.push(chunk);}
   let body={};if(size){try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{return send(400,{error:'invalid_json'});}}
   if(req.method==='POST'&&path==='/run'){
    let job;try{job=validateRun(body);}catch(error){return send(400,{error:error.message});}
    return send(200,{...await execute(job),isolation_guaranteed:true});
   }
   const allowed=(req.method==='GET'&&path==='/ollama/api/tags')||(req.method==='POST'&&['/ollama/api/generate','/ollama/api/chat'].includes(path));
   if(!allowed)return send(404,{error:'not_found'});
   const upstream=process.env.OLLAMA_UPSTREAM||'http://host.docker.internal:11434';
   const response=await fetch(upstream+path.slice('/ollama'.length),{method:req.method,headers:{'Content-Type':'application/json'},body:req.method==='POST'?JSON.stringify({...body,stream:false}):undefined,signal:AbortSignal.timeout(60000)});
   let responseSize=0;const responseChunks=[];
   for await(const chunk of response.body){responseSize+=chunk.length;if(responseSize>2000000)throw new Error('upstream_output_limit');responseChunks.push(Buffer.from(chunk));}
   const data=JSON.parse(Buffer.concat(responseChunks).toString());send(response.status,data);
  }catch(error){console.error('[ops]',error.name);if(!res.headersSent)send(502,{error:'upstream_unavailable'});}
  finally{active--;}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const token=fs.readFileSync('/run/secrets/ops_token','utf8').trim();
 if(token.length<32)throw new Error('Invalid worker token');
 createWorker(token).listen(8080,'0.0.0.0');
 // Recover our own orphaned jobs after a worker restart. Never inspect or stop other services.
 const sweep=()=>{
  const listing=spawn('docker',['ps','-aq','--filter','label=codecheck.isolated-job=true'],{env:dockerEnv,stdio:['ignore','pipe','ignore']});
  let ids='';listing.stdout.on('data',c=>{if(ids.length<10000)ids+=c.toString();});listing.on('error',()=>{});
  listing.on('close',()=>{for(const id of ids.trim().split(/\s+/).filter(id=>/^[a-f0-9]{12,64}$/.test(id)).slice(0,100)){
    const inspect=spawn('docker',['inspect','--format','{{.Created}}',id],{env:dockerEnv,stdio:['ignore','pipe','ignore']});let created='';
    inspect.stdout.on('data',c=>{if(created.length<200)created+=c.toString();});inspect.on('error',()=>{});
    inspect.on('close',()=>{if(Date.now()-Date.parse(created.trim())>120000){const remove=spawn('docker',['rm','-f',id],{env:dockerEnv,stdio:'ignore'});remove.on('error',()=>{});}});
  }});
 };
 sweep();setInterval(sweep,60000).unref();
}

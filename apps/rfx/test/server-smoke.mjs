// Production-build HTTP checks. No credentials, writes, provider calls, or live Firebase data.
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {setTimeout as sleep} from 'node:timers/promises';
import assert from 'node:assert/strict';
const origin='http://localhost:3003';
const child=spawn(process.execPath,[createRequire(import.meta.url).resolve('next/dist/bin/next'),'start','--port','3003'],{cwd:new URL('../',import.meta.url),stdio:'pipe',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
let output='';child.stdout.on('data',s=>output+=s);child.stderr.on('data',s=>output+=s);
try{
 let response;
 for(let attempt=0;attempt<60;attempt++){try{response=await fetch(origin);if(response.ok)break;}catch{}await sleep(500);}
 assert.ok(response?.ok,'Production shell did not start: '+output);
 assert.match(await response.text(),/data-app="rfxchange-rfx"/);
 assert.match(response.headers.get('content-security-policy')||'',/frame-ancestors 'none'/);
 for(const path of ['/api/exchange?lens=rfx','/api/exchange?lens=intelligence','/api/exchange/media?organization=test-org']){
  const denied=await fetch(origin+path);assert.equal(denied.status,401,path);assert.match(denied.headers.get('cache-control')||'',/no-store/);
 }
 const watch=await fetch(origin+'/api/opportunities',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'set-watch',reference:'test',watching:true,commandId:'unauthorized-test'})});assert.equal(watch.status,401);
 const csrf=await fetch(origin+'/api/auth/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:'invalid'})});assert.equal(csrf.status,403);
 console.log('Production HTTP smoke: shell and anonymous protected-read/command/session rejection passed.');
}finally{child.kill('SIGTERM');}

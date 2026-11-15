import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalAgent} from '../local-agent/server.mjs';
import {createSetupCmd,SETUP_FILENAME} from '../src/powershell-manager/cmd-setup.js';
const origin='https://xcxc84584-prog.github.io';
async function withAgent(run){
 const agent=createLocalAgent({token:'a'.repeat(64)});
 await new Promise(resolve=>agent.server.listen(0,'127.0.0.1',resolve));
 const port=agent.server.address().port;
 const post=async(path,body,token='a'.repeat(64),source=origin)=>{
  const response=await fetch('http://127.0.0.1:'+port+path,{method:'POST',headers:{Origin:source,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:response.status,data:await response.json()};
 };
 try{await run(post);}finally{await new Promise(resolve=>agent.server.close(resolve));}
}
test('61: interactive mode retains pairing and origin authorization',async()=>{
 await withAgent(async post=>{
  assert.equal((await post('/status',{})).data.permission,'FULL');
  assert.equal((await post('/session/start',{},'b'.repeat(64))).status,401);
  const foreign=await post('/session/start',{},'a'.repeat(64),'https://untrusted.example');
  assert.notEqual(foreign.status,200);
  const invalid=await post('/session/run',{id:'unknown',command:'Get-Location'});
  assert.equal(invalid.status,404);
 });
});
test('61: CMD launches local agent without legacy permission prompt',()=>{
 const cmd=createSetupCmd();
 assert.equal(SETUP_FILENAME,'ClusterOpt-PLA-Setup-v0.0.62-r2.cmd');
 assert.ok(cmd.includes('node.exe "%AGENT_FILE%"'));
 assert.ok(!cmd.includes('Allow PowerShell commands? [Y/N]'));
 assert.ok(!cmd.includes('CLUSTEROPT_PS_PERMISSION=READ_ONLY'));
 assert.ok(!cmd.includes('CLUSTEROPT_PS_PERMISSION=FULL'));
});

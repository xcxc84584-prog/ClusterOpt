import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalAgent} from '../local-agent/server.mjs';
import {createSetupCmd,SETUP_FILENAME} from '../src/powershell-manager/cmd-setup.js';
const origin='https://xcxc84584-prog.github.io';
async function withAgent(permission,run){
 const agent=createLocalAgent({permission,token:'a'.repeat(64)});
 await new Promise(resolve=>agent.server.listen(0,'127.0.0.1',resolve));
 const address=agent.server.address();
 const post=async(path,body,token='a'.repeat(64))=>{
  const response=await fetch('http://127.0.0.1:'+address.port+path,{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:response.status,data:await response.json()};
 };
 try{await run(post);}finally{await new Promise(resolve=>agent.server.close(resolve));}
}
test('60.r10 default permission blocks interactive execution',async()=>{
 await withAgent('READ_ONLY',async post=>{
  const status=await post('/status',{});assert.equal(status.data.permission,'READ_ONLY');
  const result=await post('/execute',{action:'interactive',command:'Write-Output test'});
  assert.equal(result.status,403);assert.equal(result.data.code,'PERMISSION_DENIED');
 });
});
test('60.r10 full permission is locally assigned and still requires valid token',async()=>{
 await withAgent('FULL',async post=>{
  assert.equal((await post('/status',{})).data.permission,'FULL');
  assert.equal((await post('/execute',{action:'interactive',command:'Write-Output test'},'b'.repeat(64))).status,401);
  assert.equal((await post('/execute',{action:'interactive',command:''})).status,403);
 });
});
test('60.r10 CMD asks for local permission and downloads fresh agent',()=>{
 const cmd=createSetupCmd();assert.equal(SETUP_FILENAME,'ClusterOpt-PLA-Setup-v0.0.60-r10.cmd');
 assert.ok(cmd.includes('Allow PowerShell commands? [Y/N]'));
 assert.ok(cmd.includes('CLUSTEROPT_PS_PERMISSION=READ_ONLY'));
 assert.ok(cmd.includes('CLUSTEROPT_PS_PERMISSION=FULL'));
});

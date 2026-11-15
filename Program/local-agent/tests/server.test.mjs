import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalAgent,READ_ONLY_COMMANDS} from '../server.mjs';
const origin='https://xcxc84584-prog.github.io';
const setup=async()=>{const a=createLocalAgent({token:'test-secret',runner:async action=>({output:action})});await new Promise(resolve=>a.server.listen(0,'127.0.0.1',resolve));return {a,url:'http://127.0.0.1:'+a.server.address().port};};
const post=(url,path,headers={},body={})=>fetch(url+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
test('PLA rejects untrusted origins and missing tokens',async t=>{const {a,url}=await setup();t.after(()=>a.server.close());assert.equal((await post(url,'/status')).status,401);assert.equal((await post(url,'/status',{Origin:'https://evil.example',Authorization:'Bearer test-secret'})).status,403);});
test('PLA allows only fixed read-only actions and revokes token',async t=>{const {a,url}=await setup();t.after(()=>a.server.close());const h={Authorization:'Bearer test-secret'};assert.equal((await post(url,'/execute',h,{action:'Remove-Item'})).status,403);const r=await post(url,'/execute',h,{action:'version'});assert.equal((await r.json()).output,'version');assert.equal((await post(url,'/revoke',h)).status,200);assert.equal((await post(url,'/status',h)).status,401);});
test('PLA exposes no generic command execution',()=>{assert.deepEqual(Object.keys(READ_ONLY_COMMANDS).sort(),['location','version']);});

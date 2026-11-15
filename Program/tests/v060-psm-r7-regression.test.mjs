import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.31 all PSM action controls receive visible translated text',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js');
 assert.ok(ui.includes("for(const key of ['check','permissions','revoke'])"));
 assert.ok(ui.includes('control.textContent=msg[key]'));
 assert.ok(ui.includes("textContent=language.value==='en'?'Tools':'工具'"));
});
test('60.32 r7 responsive setup has auto-height rows and scroll containment',()=>{
 const css=read('../src/style.css');
 assert.ok(css.includes('grid-auto-rows:max-content!important'));
 assert.ok(css.includes('height:auto!important;overflow:visible!important'));
 assert.ok(css.includes('overflow-y:auto!important;overflow-x:hidden!important'));
});
test('60.33 token verification errors remain observable and only authenticated state enters terminal',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js');
 const manager=read('../src/powershell-manager/powershell-manager.js');
 assert.ok(ui.includes('if(state.configured){setConnected(true)'));
 assert.ok(ui.includes('state.error'));
 assert.ok(manager.includes('#lastError'));
});

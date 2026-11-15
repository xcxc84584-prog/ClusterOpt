import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const main=read('../src/main.js'),explorer=read('../src/explorer.js');
test('54.3 Explorer actions are one symbol with accessible labels',()=>{
 assert.match(explorer,/button\.append\(symbol\)/);
 assert.doesNotMatch(explorer,/caption\.textContent=label/);
 assert.match(explorer,/button\.setAttribute\('aria-label',label\)/);
});
test('54.3 document switch and virtual load never invoke full Shiki for huge text',()=>{
 assert.match(main,/function scheduleHighlight\(\{documentTransition=false\}=\{\}\)/);
 assert.match(main,/if\(documentTransition&&editor\.value\.length>256\*1024\)/);
 assert.match(main,/scheduleHighlight\(\{documentTransition:true\}\)/);
 assert.match(main,/if\(changedDocument\)scheduleHighlight\(\{documentTransition:true\}\)/);
});

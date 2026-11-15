import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createVTE} from '../src/vte/vte.js';
test('51.5: highlight overlay retains root and uses in-place node reconciliation',()=>{
 const s=readFileSync(new URL('../src/text-highlighter/highlight-renderer.js',import.meta.url),'utf8');
 assert.match(s,/if\(!this\.contentNode\)/);
 assert.match(s,/this\.contentNode\.insertBefore\(node,next\)/);
 assert.match(s,/if\(i>=first\)this\.#paint\(node,i\)/);
 assert.match(s,/this\.lineNodes=nodes/);
 const vte=createVTE();assert.equal(vte.Status().data.files.length,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createVTE} from '../src/vte/vte.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('52 undo highlight: OLR Ctrl+Z/Y retokenizes resident document without full refresh',()=>{
 const undo=main.slice(main.indexOf("editor.addEventListener('keydown',e=>{"),
   main.indexOf('async function doSave('));
 assert.match(undo,/olr\.redo\(active, editor\.value\)/);
 assert.match(undo,/olr\.undo\(active, editor\.value\)/);
 assert.match(undo,/highlightRenderer\.retainDuringEdit\(\)/);
 assert.match(undo,/scheduleHighlight\(\)/);
 assert.doesNotMatch(undo,/\brefresh\(\)/);
});
test('52 undo highlight: native historyUndo/historyRedo triggers full resident token recovery',()=>{
 const start=main.indexOf("editor.addEventListener('input',event=>{");
 const end=main.indexOf('// Visual-only scroll updates',start);
 const input=main.slice(start,end);
 assert.match(input,/historyUndo/);
 assert.match(input,/historyRedo/);
 assert.match(input,/if\(historyEdit\|\|\(pasted&&editor\.value\.length<=256\*1024\)\)scheduleHighlight\(\)/);
 assert.match(input,/reconcileResidentEdit\(id,index,content,inputIntent\)/);
});
test('52 undo highlight: VTE non-interference',()=>{
 const vte=createVTE();
 assert.equal(vte.Status().data.files.length,0);
});

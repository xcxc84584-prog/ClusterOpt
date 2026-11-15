import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveEditIntent} from '../src/fmc/newline-edit-intent.js';
import {patchLineStarts} from '../src/text-highlighter/incremental-line-index.js';
import {lineStarts} from '../src/text-highlighter/matching-window.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('53.2 paste: clipboard fallback and full resident recolor for bounded files',()=>{
 const main=read('../src/main.js');
 assert.match(main,/pendingPasteText=event\.clipboardData/);
 assert.match(main,/event\.inputType==='insertFromPaste'/);
 assert.match(main,/pasted&&editor\.value\.length<=256\*1024/);
 assert.match(main,/if\(historyEdit\|\|\(pasted&&editor\.value\.length<=256\*1024\)\)scheduleHighlight\(\)/);
});
test('53.2 paste: multiline micro-edit preserves LF offsets',()=>{
 const before='a\nb\nc\n',paste='x\ny\nz';
 const edit=deriveEditIntent({inputType:'insertFromPaste',data:paste,start:2,end:3,value:before});
 const after=before.slice(0,edit.start)+edit.text+before.slice(edit.end);
 assert.deepEqual(patchLineStarts(lineStarts(before),edit),lineStarts(after));
});
test('53.2 tokens: sorted replacement interval avoids full filter and sort',()=>{
 const renderer=read('../src/text-highlighter/highlight-renderer.js');
 assert.match(renderer,/#replaceTokenWindow\(begin,end,incoming\)/);
 assert.match(renderer,/previous\.slice\(0,first\)/);
 assert.doesNotMatch(renderer,/const old=this\.lastScheme\.ranges\.filter/);
 assert.doesNotMatch(renderer,/const existing=this\.lastScheme\.ranges\.filter/);
});

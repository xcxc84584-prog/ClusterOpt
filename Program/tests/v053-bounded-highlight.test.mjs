import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matchingWindow,lineStarts} from '../src/text-highlighter/matching-window.js';
import {findLexicalRestart} from '../src/text-highlighter/lexical-checkpoints.js';
import {patchLineStarts} from '../src/text-highlighter/incremental-line-index.js';
import {createVTE} from '../src/vte/vte.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('53: reused incremental LF index produces the same bounded matching window',()=>{
 let text='';for(let i=0;i<12000;i++)text+='const a'+i+' = '+i+';\n';
 let starts=lineStarts(text);
 for(const [start,end,insert] of [[50,50,'\nhello'],[1000,1002,'xx'],[text.length-1,text.length-1,'\n']]){
   const before=text;
   text=before.slice(0,start)+insert+before.slice(end);
   starts=patchLineStarts(starts,{start,end,text:insert,previousLength:before.length});
   assert.deepEqual(starts,lineStarts(text));
   for(const caret of [0,Math.floor(text.length/2),text.length]){
     const expected=matchingWindow(text,caret,100);
     const actual=matchingWindow(text,caret,100,starts);
     assert.deepEqual(actual,expected);
     assert.ok(actual.endLine-actual.startLine<100);
   }
 }
});
test('53: lexical checkpoint accepts shared index without rebuilding',()=>{
 const source='int x = 1;\nint y = 2;\n';
 assert.deepEqual(findLexicalRestart(source,8,'cpp',{knownStarts:lineStarts(source)}),
   findLexicalRestart(source,8,'cpp'));
});
test('53: editor input patches line index before highlight task; VTE unchanged',()=>{
 assert.match(main,/highlightRenderer\.retainDuringEdit\(inputIntent\)/);
 assert.match(main,/highlightRenderer\.lineIndexFor\(value\)/);
 assert.match(main,/matchingWindow\(value,caret,100,indexedStarts\)/);
 assert.match(main,/findLexicalRestart\(value,caret,detectLanguage\(item\.name\),\{knownStarts:indexedStarts\}\)/);
 const vte=createVTE();assert.equal(vte.Status().data.files.length,0);
});

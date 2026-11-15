import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateGutterWindow} from '../src/editor-render/gutter-window.js';
import {createVTE} from '../src/vte/vte.js';
import {readFileSync} from 'node:fs';
test('50.4: gutter renders bounded viewport even for millions of lines',()=>{
 const vte=createVTE();
 for(const top of [0,22,22000,2_000_000,22_000_000]){
  const range=calculateGutterWindow({lineCount:2_000_000,firstLine:400,
   scrollTop:top,viewportHeight:880,lineHeight:22,paddingTop:16,overscan:5});
  assert.ok(range.end-range.start<=52);
  assert.equal(range.firstNumber,400+range.start);
  assert.equal(range.lastNumber,400+range.end-1);
  assert.equal(range.offsetTop,16+range.start*22);
 }
 assert.equal(vte.Status().data.files.length,0);
});
test('50.4: gutter near EOF and invalid input',()=>{
 const range=calculateGutterWindow({lineCount:7,scrollTop:10000,
  viewportHeight:300,lineHeight:22});
 assert.deepEqual([range.start,range.end],[6,7]);
 assert.throws(()=>calculateGutterWindow({lineCount:0}),RangeError);
});
test('50.4: main.js uses virtual labels and CSS positioning',()=>{
 const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
 assert.match(read('../src/main.js'),/calculateGutterWindow\(/);
 assert.match(read('../src/main.js'),/gutter-labels/);
 assert.doesNotMatch(read('../src/main.js'),/Array\.from\(\{length:count\}/);
 assert.match(read('../src/style.css'),/\.gutter-labels/);
 assert.match(read('../index.html'),/main\.js\?v=opt062-psm-r2/);
});

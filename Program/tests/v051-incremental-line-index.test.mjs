import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLineStarts,remapRanges} from '../src/text-highlighter/highlight-renderer.js';
import {patchLineStarts,patchTokenRanges,validateKnownEdit}
  from '../src/text-highlighter/incremental-line-index.js';
import {createVTE} from '../src/vte/vte.js';

test('51.2: randomized known edits preserve LF starts and token offsets',()=>{
  const vte=createVTE();let text='alpha\nbeta\ngamma',seed=99;
  const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
  let starts=buildLineStarts(text);
  for(let i=0;i<600;i++){
    const from=rand(text.length+1);
    const to=from+rand(Math.min(5,text.length-from)+1);
    const inserted=['','x','\n','a\nb','xyz'][rand(5)];
    const patch={start:from,end:to,text:inserted,previousLength:text.length};
    const after=text.slice(0,from)+inserted+text.slice(to);
    assert.ok(validateKnownEdit(text,after,patch));
    starts=patchLineStarts(starts,patch);
    assert.deepEqual(starts,buildLineStarts(after));
    text=after;
  }
  assert.equal(vte.Status().data.files.length,0);
});
test('51.2: token remap matches legacy full-diff for exact known edits',()=>{
  const before='abc def ghi',after='abc XXdef ghi';
  const ranges=[{start:0,end:3},{start:4,end:7},{start:8,end:11}];
  const patch={start:4,end:4,text:'XX',previousLength:before.length};
  assert.deepEqual(patchTokenRanges(ranges,patch),remapRanges(ranges,before,after));
});
test('51.2: invalid or stale input must fall back',()=>{
  assert.equal(validateKnownEdit('abcd','abXd',{start:2,end:3,text:'Y',previousLength:4}),false);
  assert.equal(validateKnownEdit('abc','abcd',{start:1,end:1,text:'d',previousLength:2}),false);
  assert.throws(()=>patchLineStarts([0],{start:2,end:1,text:'',previousLength:4}),RangeError);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {matchingWindow} from '../src/text-highlighter/matching-window.js';
test('parentheses bound a multiline edit',()=>{
 const value='head\nfunction f(\n  one,\n  two\n)\ntail';
 const w=matchingWindow(value,value.indexOf('two'));
 assert.deepEqual([w.startLine,w.endLine],[1,4]);
});
test('braces bound an inner edit',()=>{
 const value='a\n{\n  [\n    x\n  ]\n}\nz';
 const w=matchingWindow(value,value.indexOf('x'));
 assert.deepEqual([w.startLine,w.endLine],[2,4]);
});
test('block comment matches both boundaries',()=>{
 const value='before\n/* start\n middle\n end */\nafter';
 const w=matchingWindow(value,value.indexOf('middle'));
 assert.deepEqual([w.startLine,w.endLine],[1,3]);
});
test('never exceeds 100 lines',()=>{
 const value=['{',...Array(180).fill('x'),'}'].join('\n');
 const w=matchingWindow(value,value.indexOf('x',value.length/2));
 assert.ok(w.endLine-w.startLine+1<=100);
});
test('unmatched text falls back to edited line',()=>{
 const value='first\nsecond\nthird';
 const w=matchingWindow(value,value.indexOf('second'));
 assert.deepEqual([w.startLine,w.endLine],[1,1]);
});

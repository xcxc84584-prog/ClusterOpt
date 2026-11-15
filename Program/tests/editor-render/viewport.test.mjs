import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateViewport} from '../../src/editor-render/viewport-calculator.js';

const calc = overrides => calculateViewport({
  scrollTop:0, viewportHeight:100, lineHeight:20, lineCount:100, overscan:2,
  ...overrides
});

test('viewport starts at first line and includes overscan',()=>{
  assert.deepEqual(calc().data,{start:0,end:7,visibleStart:0,visibleEnd:5});
});
test('viewport scrolls and clamps at document end',()=>{
  assert.deepEqual(calc({scrollTop:1900}).data,
    {start:93,end:100,visibleStart:95,visibleEnd:100});
});
test('empty document yields empty range',()=>{
  assert.deepEqual(calc({lineCount:0}).data,
    {start:0,end:0,visibleStart:0,visibleEnd:0});
});
test('fractional line height and viewport remain bounded',()=>{
  const r=calc({scrollTop:11.2,viewportHeight:40,lineHeight:17.5});
  assert.equal(r.ok,true);
  assert.equal(r.data.visibleStart,0);
  assert.equal(r.data.visibleEnd,3);
});
test('rejects invalid inputs without mutating state',()=>{
  for(const value of [NaN,Infinity,-1,'1'])
    assert.equal(calc({scrollTop:value}).code,400);
  assert.equal(calc({lineHeight:0}).code,400);
  assert.equal(calc({overscan:-1}).code,400);
  assert.equal(calc({lineCount:1.5}).code,400);
});
test('viewport beyond end is safely empty',()=>{
  const r=calc({scrollTop:99999});
  assert.deepEqual(r.data,{start:98,end:100,visibleStart:100,visibleEnd:100});
});

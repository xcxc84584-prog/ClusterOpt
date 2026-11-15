import test from 'node:test';
import assert from 'node:assert/strict';
import {runLineBenchmark} from '../src/performance/line-benchmark.js';
import {createVTE} from '../src/vte/vte.js';

test('50.1: newline benchmark is deterministic in content and isolated from VTE',()=>{
  const vte=createVTE();
  const result=runLineBenchmark({lineCount:60,operations:12,lineWidth:16});
  assert.equal(result.finalLines,72);
  assert.equal(result.operations,12);
  for(const name of ['pieceTreeInsert','editPathReconcile','fullNewlineScan']){
    assert.ok(Number.isFinite(result[name].p95Ms));
    assert.ok(result[name].p95Ms>=0);
  }
  assert.equal(vte.Status().data.files.length,0);
});
test('50.1: reject unsafe benchmark sizes',()=>{
  assert.throws(()=>runLineBenchmark({lineCount:0}),RangeError);
  assert.throws(()=>runLineBenchmark({operations:-1}),RangeError);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {benchmarkHighlight} from '../src/performance/highlight-benchmark.js';
import {createVTE} from '../src/vte/vte.js';
test('51.1: reproducible isolated highlighter baseline',()=>{
  const vte=createVTE();
  const r=benchmarkHighlight({lines:200,iterations:5,width:32});
  assert.equal(r.configuration.lines,200);
  for(const metric of [r.lineIndex,r.rangeRemap]){
    assert.equal(metric.count,5);
    for(const key of ['p50','p95','p99','max'])
      assert.ok(Number.isFinite(metric[key])&&metric[key]>=0);
  }
  assert.equal(vte.Status().data.files.length,0);
});
test('51.1: invalid benchmark inputs fail closed',()=>{
  assert.throws(()=>benchmarkHighlight({lines:0}),RangeError);
  assert.throws(()=>benchmarkHighlight({iterations:0}),RangeError);
});

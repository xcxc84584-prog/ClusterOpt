import test from 'node:test';
import assert from 'node:assert/strict';
import {PerformanceMonitor} from '../../src/performance/performance-monitor.js';

test('PMU is opt-in and bounded',()=>{
  const pmu=new PerformanceMonitor();
  assert.equal(pmu.record('input',10),false);
  pmu.start();
  for(let i=0;i<600;i++)pmu.record('input',i);
  const m=pmu.snapshot().metrics.input;
  assert.equal(m.count,512);
  assert.equal(m.max,599);
  pmu.stop();
  assert.equal(pmu.record('input',900),false);
});
test('PMU commands and exports',()=>{
  const pmu=new PerformanceMonitor();
  assert.equal(pmu.command('pmu start').ok,true);
  pmu.record('slice.load',12);
  assert.equal(pmu.command('pmu report').data.metrics['slice.load'].p95,12);
  assert.match(pmu.command('pmu export csv').data,/slice.load,1,12/);
  assert.equal(pmu.command('pmu benchmark').code,501);
  assert.equal(pmu.command('pmu nonsense').code,400);
  assert.equal(pmu.command('bad').code,404);
});
test('PMU measure records sync and async and preserves errors',async()=>{
  let now=0;
  const pmu=new PerformanceMonitor({now:()=>now});
  pmu.start();
  assert.equal(pmu.measure('sync',()=>{now+=4;return 5;}),5);
  assert.equal(await pmu.measure('async',async()=>{now+=7;return 9;}),9);
  assert.throws(()=>pmu.measure('failure',()=>{now+=2;throw Error('test');}),/test/);
  assert.equal(pmu.snapshot().metrics.failure.p95,2);
  pmu.stop();
});

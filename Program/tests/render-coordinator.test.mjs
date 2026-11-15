import test from 'node:test';
import assert from 'node:assert/strict';
import {RenderCoordinator} from '../src/editor-render/render-coordinator.js';
function harness(){
  const frames=new Map();let next=0;const errors=[];
  const coordinator=new RenderCoordinator({
    scheduleFrame:cb=>{frames.set(++next,cb);return next;},
    cancelFrame:id=>frames.delete(id),
    onError:error=>errors.push(error)
  });
  return {coordinator,frames,errors,flush:()=>{const tasks=[...frames.values()];frames.clear();tasks.forEach(fn=>fn());}};
}
test('coalesces multiple schedules into one frame and newest request',()=>{
  const h=harness(),calls=[];
  h.coordinator.schedule({source:'scroll',revision:1,render:()=>calls.push(1)});
  h.coordinator.schedule({source:'edit',revision:2,render:s=>calls.push(s.revision)});
  assert.equal(h.frames.size,1);
  h.flush();
  assert.deepEqual(calls,[2]);
});
test('generation invalidates stale async work',()=>{
  const h=harness();let snapshot;
  h.coordinator.schedule({source:'edit',revision:1,render:s=>{snapshot=s;}});
  h.flush();assert.equal(snapshot.isCurrent(),true);
  h.coordinator.schedule({source:'edit',revision:2,render:()=>{}});
  assert.equal(snapshot.isCurrent(),false);
});
test('cancel prevents pending work; dispose rejects scheduling',()=>{
  const h=harness();let calls=0;
  h.coordinator.schedule({source:'scroll',revision:0,render:()=>calls++});
  h.coordinator.cancel();h.flush();assert.equal(calls,0);
  h.coordinator.dispose();
  assert.equal(h.coordinator.schedule({source:'scroll',revision:0,render:()=>{}}).code,410);
});
test('invalid requests and render failures do not escape',()=>{
  const h=harness();
  assert.equal(h.coordinator.schedule({source:'x',revision:-1,render:()=>{}}).code,400);
  h.coordinator.schedule({source:'x',revision:0,render:()=>{throw Error('render');}});
  h.flush();assert.equal(h.errors.length,1);
});

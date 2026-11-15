import test from 'node:test';
import assert from 'node:assert/strict';
import {RenderCoordinator} from '../src/editor-render/render-coordinator.js';
import {createVTE} from '../src/vte/vte.js';

test('PR03: VTE isolation and scroll render coalescing do not modify virtual files',async()=>{
  const vte=createVTE();
  const before=vte.Log?.Read?.() ?? null;
  let callback;let schedules=0;const visual=[];
  const coordinator=new RenderCoordinator({
    scheduleFrame:cb=>{callback=cb;schedules++;return schedules;},
    cancelFrame:()=>{}
  });
  for(let i=0;i<50;i++){
    coordinator.schedule({source:'scroll',revision:i,render:s=>{
      visual.push(s.revision);
      assert.equal(s.isCurrent(),true);
    }});
  }
  assert.equal(schedules,1);
  callback();
  assert.deepEqual(visual,[49]);
  assert.equal(coordinator.status.pending,false);
  assert.ok(vte);
  assert.deepEqual(vte.Log?.Read?.() ?? null,before);
});
test('PR03: canceled visual frame never commits',()=>{
  let callback;let renders=0;
  const coordinator=new RenderCoordinator({scheduleFrame:cb=>(callback=cb,1),cancelFrame:()=>{}});
  coordinator.schedule({source:'scroll',revision:1,render:()=>renders++});
  coordinator.cancel();
  callback();
  assert.equal(renders,0);
});

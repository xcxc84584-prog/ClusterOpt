import test from 'node:test';
import assert from 'node:assert/strict';
import {HighlightTaskScheduler} from '../src/text-highlighter/highlight-task-scheduler.js';
import {createVTE} from '../src/vte/vte.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('51.6: latest revision commits only once',async()=>{
 const queue=[],out=[],scheduler=new HighlightTaskScheduler({schedule:fn=>queue.push(fn)});
 scheduler.run({revision:1,execute:async()=>1,commit:v=>out.push(v)});
 scheduler.run({revision:2,execute:async()=>2,commit:v=>out.push(v)});
 await Promise.all(queue.map(fn=>fn()));assert.deepEqual(out,[2]);
});
test('51.6: abort in-flight and dispose prevents stale commits',async()=>{
 const queue=[],out=[],scheduler=new HighlightTaskScheduler({schedule:fn=>queue.push(fn)});
 let release;
 scheduler.run({revision:1,execute:()=>new Promise(r=>release=r),commit:v=>out.push(v)});
 const running=queue.shift()();scheduler.cancel();release(1);await running;
 assert.deepEqual(out,[]);
 scheduler.dispose();
 assert.equal(scheduler.run({revision:2,execute:()=>2,commit:()=>{}}).code,410);
});
test('51.6: invalid tasks and VTE remain isolated',()=>{
 const vte=createVTE(),scheduler=new HighlightTaskScheduler();
 assert.equal(scheduler.run({revision:-1,execute:()=>{},commit:()=>{}}).code,400);
 assert.equal(vte.Status().data.files.length,0);
});

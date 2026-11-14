import test from 'node:test';
import assert from 'node:assert/strict';
import {DirtyLineTracker,countNewlines} from '../src/text-highlighter/dirty-line-tracker.js';
test('consecutive edits coalesce into 205-208',()=>{
 const tracker=new DirtyLineTracker();
 for(const line of [204,205,206,207])tracker.add(line,line);
 assert.deepEqual(tracker.take(),{start:204,end:207});
 assert.equal(tracker.pending,false);
});
test('a single reload never exceeds 100 lines',()=>{
 const tracker=new DirtyLineTracker();tracker.add(0,249);
 assert.deepEqual(tracker.take(),{start:0,end:99});
 assert.deepEqual(tracker.take(),{start:100,end:199});
 assert.deepEqual(tracker.take(),{start:200,end:249});
});
test('nonadjacent edits remain separate',()=>{
 const tracker=new DirtyLineTracker();tracker.add(10,10);tracker.add(30,30);
 assert.deepEqual(tracker.take(),{start:10,end:10});
 assert.deepEqual(tracker.take(),{start:30,end:30});
});
test('reset begins a new history epoch',()=>{
 const tracker=new DirtyLineTracker();tracker.add(204,207);tracker.reset();
 assert.equal(tracker.take(),null);tracker.add(6,6);
 assert.deepEqual(tracker.take(),{start:6,end:6});
});
test('newlines count for pasted text',()=>{
 assert.equal(countNewlines('中文\na\nb'),2);
});

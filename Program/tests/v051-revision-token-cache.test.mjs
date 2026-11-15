import test from 'node:test';
import assert from 'node:assert/strict';
import {RevisionTokenCache} from '../src/text-highlighter/revision-token-cache.js';
import {createVTE} from '../src/vte/vte.js';
const meta=(revision,source,documentId='doc')=>({documentId,sliceId:'0',
  language:'cpp',revision,source});
const ranges=[{start:0,end:2,token:'keyword'}];
test('51.4: exact source and revision isolate equal-length changes',()=>{
 const cache=new RevisionTokenCache();
 assert.equal(cache.put(meta(1,'abcd'),ranges),true);
 assert.deepEqual(cache.get(meta(1,'abcd')),ranges);
 assert.equal(cache.get(meta(1,'wxyz')),null);
 assert.equal(cache.get(meta(2,'abcd')),null);
 assert.equal(cache.put(meta(2,'wxyz'),ranges),true);
 assert.equal(cache.put(meta(1,'abcd'),ranges),false);
 assert.deepEqual(cache.get(meta(2,'wxyz')),ranges);
});
test('51.4: cache snapshots cannot be mutated; LRU and budget',()=>{
 const cache=new RevisionTokenCache({maxEntries:2,maxUnits:128});
 cache.put(meta(1,'a'),ranges);
 const copy=cache.get(meta(1,'a'));copy[0].token='corrupt';
 assert.equal(cache.get(meta(1,'a'))[0].token,'keyword');
 cache.put(meta(2,'b'),ranges);cache.get(meta(1,'a'));
 cache.put(meta(3,'c'),ranges);
 assert.equal(cache.get(meta(2,'b')),null);
 assert.equal(cache.size,2);
 assert.equal(cache.put(meta(4,'x'.repeat(129)),ranges),false);
 assert.ok(cache.usedUnits<=128);
});
test('51.4: invalidation and VTE noninterference',()=>{
 const vte=createVTE(),cache=new RevisionTokenCache();
 cache.put(meta(1,'aa'),ranges);cache.put(meta(1,'bb','other'),ranges);
 assert.equal(cache.invalidate('doc'),true);
 assert.equal(cache.get(meta(1,'aa')),null);
 assert.deepEqual(cache.get(meta(1,'bb','other')),ranges);
 assert.equal(vte.Status().data.files.length,0);
});

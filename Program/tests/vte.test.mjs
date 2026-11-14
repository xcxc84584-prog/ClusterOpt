import test from 'node:test';
import assert from 'node:assert/strict';
import {createVTE} from '../src/vte/vte.js';

test('VTE CRUD, isolated sessions and logs', async () => {
 const v=createVTE();
 assert.equal(v.Creat.Virtual_file('a',1024).code,201);
 assert.equal(v.Creat.Virtual_file('a',1).code,409);
 assert.equal(v.Creat.Virtual_AGENT('Agent_A').code,201);
 assert.equal(v.Creat.Virtual_AGENT('Agent_B').code,201);
 assert.equal(v.Creat.Virtual_fileSlice('b',{file:'a',index:0}).code,201);
 assert.equal((await v.Read.Virtual_file('a',{length:4})).data.content,'AAAA');
 assert.equal((await v.Updata.Virtual_fileSlice('b',{offset:0,deleteLength:1,insertText:'Z'})).ok,true);
 assert.equal((await v.Read.Virtual_file('a',{length:4})).data.content,'ZAAA');
 assert.equal(v.Status().data.files.length,1);
 assert.ok(v.Log().length>=6);
 assert.equal(v.Delete.Virtual_fileSlice('b').ok,true);
 assert.equal(v.Delete.Virtual_AGENT('Agent_A').ok,true);
 assert.equal(v.Delete.Virtual_file('a').ok,true);
 assert.equal(v.Reset().ok,true);
 assert.equal(v.Status().data.files.length,0);
});

test('VTE API runner tests exclusive writes, shared reads and USER preemption', async () => {
 const v=createVTE();
 v.Creat.Virtual_file('a',1);
 v.Creat.Virtual_fileSlice('b',{file:'a',index:0});
 v.Creat.Virtual_AGENT('A');
 v.Creat.Virtual_AGENT('B');
 const first=await v.FileSliceLoad('b',({fmc,slice})=>fmc.acquireWTF(slice.id,'A'));
 assert.equal(first.ok,true);
 const conflict=await v.FileSliceLoad('b',({fmc,slice})=>fmc.acquireWTF(slice.id,'B'));
 assert.equal(conflict.code,409);
 const takeover=await v.FileSliceLoad('b',({fmc,slice})=>fmc.userWrite(slice.id,'USER'));
 assert.equal(takeover.ok,true);
 const stale=await v.FileSliceLoad('b',({fmc,slice})=>
   fmc.agentCommit(slice.id,'A',first.data.leaseId,first.data.fencingToken,0,'bad'));
 assert.equal(stale.ok,false);
 await v.FileSliceLoad('b',({fmc,slice})=>fmc.releaseWTF(slice.id,takeover.data.leaseId,takeover.data.fencingToken,'USER'));
 const read=await v.FileSliceLoad('b',({fmc,slice})=>fmc.acquireORF(slice.id,'A'));
 assert.equal(read.ok,true);
 const write=await v.FileSliceLoad('b',({fmc,slice})=>fmc.acquireWTF(slice.id,'B'));
 assert.equal(write.code,409);
});

test('VTE environments never share virtual resources', () => {
 const a=createVTE(),b=createVTE();
 a.Creat.Virtual_file('private',1);
 assert.equal(b.Status().data.files.length,0);
 assert.equal(a.Creat.Virtual_file('oversized',102401).code,400);
});

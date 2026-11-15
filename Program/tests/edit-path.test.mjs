import test from 'node:test';
import assert from 'node:assert/strict';
import {EditPath} from '../src/fmc/edit-path.js';
import {createVTE} from '../src/vte/vte.js';
test('49.4: local input, deletion, IME and undo reconcile to exact textarea snapshot',()=>{
 const path=new EditPath('file:0','hello\nworld',{maxLength:4});
 for(const next of ['hello!\nworld','hello!\n世界','hello!\n世界🙂','hello!\nworld','hello\nworld','']){
  const result=path.reconcile(next);
  assert.equal(result.changed,true);
  assert.equal(path.text,next);
  assert.equal(path.slice(0,path.length),next);
  assert.equal(path.lineCount,next.split('\n').length);
  assert.ok(path.microSliceCount>=1);
 }
 assert.equal(path.reconcile('').changed,false);
});
test('49.4: deterministic arbitrary edits and VTE isolation',()=>{
 const vte=createVTE(),path=new EditPath('file:0','a\nb',{maxLength:8});
 let seed=8912,expected='a\nb';
 const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let i=0;i<500;i++){
  const start=rand(expected.length+1),end=start+rand(expected.length-start+1);
  const insert=['a','中','🙂','\n',''][rand(5)];
  expected=expected.slice(0,start)+insert+expected.slice(end);
  path.reconcile(expected);
  assert.equal(path.text,expected);
  assert.equal(path.slice(0,path.length),expected);
 }
 assert.equal(vte.Status().data.files.length,0);
});
test('49.4: reset and invalid inputs are non-mutating',()=>{
 const path=new EditPath('file:0','abc');
 assert.throws(()=>path.reconcile(null),TypeError);
 assert.equal(path.text,'abc');
 path.reset('new\nvalue');
 assert.equal(path.text,'new\nvalue');
 assert.equal(path.lineStart(1),4);
});

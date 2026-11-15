import test from 'node:test';
import assert from 'node:assert/strict';
import {MicroSliceDocument} from '../src/fmc/micro-slice-document.js';
import {createVTE} from '../src/vte/vte.js';
const verify=(doc,expected,max)=>{
 assert.equal(doc.toString(),expected);
 assert.equal(doc.length,expected.length);
 const parts=doc.list();
 assert.equal(parts[0].start,0);
 assert.equal(parts.at(-1).end,expected.length);
 assert.ok(parts.every(p=>p.length<=max&&p.parentSliceId==='parent:0'));
 for(let i=1;i<parts.length;i++)assert.equal(parts[i].start,parts[i-1].end);
 for(let i=0;i<=expected.length;i++){
  const loc=doc.locate(i);
  assert.ok(loc);
  assert.ok(loc.start<=i&&i<=loc.end);
 }
};
test('49.2: partition and boundary edits preserve unrelated IDs',()=>{
 const doc=new MicroSliceDocument('parent:0','abcdefghijkl',{maxLength:4});
 verify(doc,'abcdefghijkl',4);
 const initial=doc.list();
 doc.replace(5,7,'XYZ');
 verify(doc,'abcdeXYZhijkl',4);
 assert.equal(doc.list()[0].id,initial[0].id);
 assert.equal(doc.list().at(-1).id,initial.at(-1).id);
 doc.insert(doc.length,'!');
 verify(doc,'abcdeXYZhijkl!',4);
 doc.delete(0,doc.length);
 verify(doc,'',4);
 assert.equal(doc.microSliceCount,1);
});
test('49.2: randomized edits match string reference and remain bounded',()=>{
 let seed=7919;
 const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const doc=new MicroSliceDocument('parent:0','one\ntwo\nthree',{maxLength:7});
 let expected='one\ntwo\nthree';
 for(let i=0;i<400;i++){
  const start=rand(expected.length+1),end=start+rand(expected.length-start+1);
  const text=['','a','中','\n','🙂','abcdefghi'][rand(6)];
  doc.replace(start,end,text);
  expected=expected.slice(0,start)+text+expected.slice(end);
  verify(doc,expected,7);
 }
});
test('49.2: invalid edits and VTE isolation',()=>{
 const vte=createVTE(),doc=new MicroSliceDocument('parent:0','abc',{maxLength:2});
 assert.throws(()=>doc.replace(0,4,'x'),RangeError);
 assert.throws(()=>doc.replace(0,1,null),TypeError);
 verify(doc,'abc',2);
 assert.equal(vte.Status().data.files.length,0);
});

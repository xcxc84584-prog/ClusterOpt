import test from 'node:test';
import assert from 'node:assert/strict';
import {MicroSliceIndex} from '../src/fmc/micro-slice-index.js';
import {MicroSliceDocument} from '../src/fmc/micro-slice-document.js';
import {createVTE} from '../src/vte/vte.js';
test('49.3: indexed prefix and right-biased boundaries',()=>{
 const index=new MicroSliceIndex([3,0,4,2]);
 assert.equal(index.total,9);
 assert.deepEqual([0,1,2,3,4].map(i=>index.prefix(i)),[0,3,3,7,9]);
 assert.equal(index.locate(0),0);
 assert.equal(index.locate(3),2);
 assert.equal(index.locate(7),3);
 assert.equal(index.locate(9),3);
 assert.deepEqual(index.intersect(1,7),{first:0,last:2});
 assert.deepEqual(index.intersect(3,3),{first:2,last:2});
 assert.equal(index.locate(-1),null);
 assert.throws(()=>index.prefix(5),RangeError);
});
test('49.3: micro-slice index remains correct after structural edits',()=>{
 const doc=new MicroSliceDocument('parent:0','abcdefghijklmnop',{maxLength:4});
 const original=doc.list();
 doc.replace(5,7,'XYZ');
 assert.equal(doc.toString(),'abcdeXYZhijklmnop');
 assert.equal(doc.locate(4).start,4);
 assert.equal(doc.locate(doc.length).end,doc.length);
 assert.equal(doc.list()[0].id,original[0].id);
 assert.equal(doc.list().at(-1).id,original.at(-1).id);
 doc.delete(0,doc.length);
 assert.equal(doc.toString(),'');
 assert.equal(doc.locate(0).start,0);
});
test('49.3: randomized prefix lookup matches linear reference; VTE isolated',()=>{
 const vte=createVTE();
 let seed=43;
 const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let run=0;run<100;run++){
  const lengths=Array.from({length:1+rand(100)},()=>1+rand(20));
  const index=new MicroSliceIndex(lengths),total=lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++)
   assert.equal(index.prefix(i),lengths.slice(0,i).reduce((a,b)=>a+b,0));
  for(let offset=0;offset<=total;offset++){
   let sum=0,expected=lengths.length-1;
   for(let i=0;i<lengths.length;i++){sum+=lengths[i];if(offset<sum){expected=i;break;}}
   assert.equal(index.locate(offset),expected);
  }
 }
 assert.equal(vte.Status().data.files.length,0);
});

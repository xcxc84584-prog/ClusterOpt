import test from 'node:test';
import assert from 'node:assert/strict';
import {MicroSliceIndex} from '../src/fmc/micro-slice-index.js';
import {MicroSliceDocument} from '../src/fmc/micro-slice-document.js';
import {createVTE} from '../src/vte/vte.js';
test('50.3: randomized structural splice matches linear reference and VTE',()=>{
 const vte=createVTE();let lengths=[3,0,5,2],seed=17;
 const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const index=new MicroSliceIndex(lengths);
 for(let step=0;step<1500;step++){
  const at=rand(lengths.length+1),removed=rand(Math.min(4,lengths.length-at)+1);
  const added=Array.from({length:rand(5)},()=>rand(8));
  lengths.splice(at,removed,...added);
  index.splice(at,removed,added);
  assert.equal(index.count,lengths.length);
  const total=lengths.reduce((a,b)=>a+b,0);
  assert.equal(index.total,total);
  let sum=0;
  for(let i=0;i<lengths.length;i++){
   assert.equal(index.prefix(i),sum);
   sum+=lengths[i];
  }
  for(let i=0;i<=total;i++){
   let pos=0,expected=lengths.length-1;
   for(let j=0;j<lengths.length;j++){pos+=lengths[j];if(i<pos){expected=j;break;}}
   assert.equal(index.locate(i),lengths.length?expected:null);
  }
 }
 assert.equal(vte.Status().data.files.length,0);
});
test('50.3: document maintains IDs and offsets across repeated splices',()=>{
 const doc=new MicroSliceDocument('slice:0','a'.repeat(600),{maxLength:8});
 for(let i=0;i<250;i++){
  const offset=Math.floor(doc.length/2);
  doc.replace(offset,offset+1,i%2?'\n':'xyz');
  const list=doc.list();
  assert.equal(list.reduce((sum,x)=>sum+x.length,0),doc.length);
  assert.equal(list.at(-1).end,doc.length);
  assert.equal(doc.locate(offset).start<=offset,true);
 }
});

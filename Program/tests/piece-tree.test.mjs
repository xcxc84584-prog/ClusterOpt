import test from 'node:test';
import assert from 'node:assert/strict';
import {PieceTree} from '../src/fmc/piece-tree.js';
import {createVTE} from '../src/vte/vte.js';
const lineOffsets=text=>{const result=[0];for(let i=0;i<text.length;i++)if(text[i]==='\n')result.push(i+1);return result;};
const check=(tree,expected)=>{
 assert.equal(tree.toString(),expected);
 assert.equal(tree.length,expected.length);
 assert.equal(tree.lineCount,lineOffsets(expected).length);
 lineOffsets(expected).forEach((offset,line)=>assert.equal(tree.lineStart(line),offset,'line '+line));
 assert.equal(tree.lineStart(lineOffsets(expected).length),null);
};
test('49.1: insert, delete and replace at boundaries',()=>{
 const tree=new PieceTree('alpha\nbeta\n');
 check(tree,'alpha\nbeta\n');
 tree.insert(0,'START\n');check(tree,'START\nalpha\nbeta\n');
 tree.insert(tree.length,'END');check(tree,'START\nalpha\nbeta\nEND');
 tree.delete(0,6);check(tree,'alpha\nbeta\nEND');
 tree.replace(6,10,'B\nC');check(tree,'alpha\nB\nC\nEND');
});
test('49.1: deterministic random edit sequence matches plain strings',()=>{
 let seed=9127;
 const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const tree=new PieceTree('one\ntwo\nthree'),chars=['a','b','\n','中','🙂','\t'];
 let expected='one\ntwo\nthree';
 for(let i=0;i<600;i++){
  const start=rand(expected.length+1),end=start+rand(expected.length-start+1);
  const replacement=Array.from({length:rand(6)},()=>chars[rand(chars.length)]).join('');
  tree.replace(start,end,replacement);
  expected=expected.slice(0,start)+replacement+expected.slice(end);
  check(tree,expected);
 }
 assert.equal(tree.revision,600);
});
test('49.1: invalid offsets do not change content or revision',()=>{
 const tree=new PieceTree('abc');
 assert.throws(()=>tree.replace(-1,2,'x'),RangeError);
 assert.throws(()=>tree.replace(1,4,'x'),RangeError);
 assert.throws(()=>tree.insert(1,null),TypeError);
 check(tree,'abc');assert.equal(tree.revision,0);
});
test('49.1: independent trees and VTE do not share state',()=>{
 const vte=createVTE(),first=new PieceTree('a'),second=new PieceTree('a');
 first.insert(1,'\nnew');
 check(first,'a\nnew');check(second,'a');
 assert.equal(vte.Status().data.files.length,0);
});

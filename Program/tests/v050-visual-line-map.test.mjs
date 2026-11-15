import test from 'node:test';
import assert from 'node:assert/strict';
import {VisualLineMap,wrapSegments} from '../src/editor-render/visual-line-map.js';
import {createVTE} from '../src/vte/vte.js';
test('50.5: empty lines, exact boundary and tabs',()=>{
 assert.deepEqual(wrapSegments('',4),[{start:0,end:0,columns:0}]);
 assert.deepEqual(wrapSegments('abcdefgh',4),[
  {start:0,end:4,columns:4},{start:4,end:8,columns:4}]);
 assert.deepEqual(wrapSegments('ab\tc',4),[
  {start:0,end:3,columns:4},{start:3,end:4,columns:1}]);
 assert.throws(()=>wrapSegments('a\nb',4),RangeError);
});
test('50.5: logical/visual mapping and viewport',()=>{
 const map=new VisualLineMap({maxColumns:4});
 map.spliceLines(0,0,['abcdef','', 'xy','123456789']);
 assert.equal(map.logicalLineCount,4);
 assert.equal(map.visualLineCount,7);
 assert.deepEqual(map.logicalToVisual(0,4),{visualLine:1,visualColumn:0});
 assert.deepEqual(map.visualToLogical(2),{logicalLine:1,segment:0,start:0,end:0});
 assert.deepEqual(map.visualToLogical(6),{logicalLine:3,segment:2,start:8,end:9});
 assert.equal(map.visualWindow(1,4).length,3);
 assert.throws(()=>map.visualToLogical(7),RangeError);
});
test('50.5: randomized line splice agrees with reference; VTE isolated',()=>{
 const vte=createVTE();
 const map=new VisualLineMap({maxColumns:7});
 let lines=[],seed=77;
 const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let i=0;i<500;i++){
  const start=rand(lines.length+1),remove=rand(Math.min(3,lines.length-start)+1);
  const added=Array.from({length:rand(4)},()=>('abc\txyz').repeat(rand(4)));
  lines.splice(start,remove,...added);
  map.spliceLines(start,remove,added);
  const expected=lines.reduce((n,line)=>n+wrapSegments(line,7).length,0);
  assert.equal(map.visualLineCount,expected);
  assert.equal(map.logicalLineCount,lines.length);
  for(let v=0;v<expected;v++){
   const point=map.visualToLogical(v);
   assert.equal(map.logicalToVisual(point.logicalLine,point.start).visualLine,v);
  }
 }
 assert.equal(vte.Status().data.files.length,0);
});

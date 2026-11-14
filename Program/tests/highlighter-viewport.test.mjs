import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLineStarts,lineAt,remapRanges} from '../src/text-highlighter/highlight-renderer.js';
test('line index includes inserted and trailing blank lines',()=>{
 const starts=buildLineStarts('a\nb\n\nc\n');
 assert.deepEqual(starts,[0,2,4,5,7]);
 assert.equal(lineAt(starts,4),2);
 assert.equal(lineAt(starts,7),4);
});
test('incremental range remapping preserves unaffected suffix',()=>{
 const ranges=[{start:0,end:2,color:'#abc'},{start:6,end:9,color:'#def'}];
 const mapped=remapRanges(ranges,'ab\nxyz123','ab\nxyz\n123');
 assert.deepEqual(mapped,[ranges[0],{...ranges[1],start:7,end:10}]);
});
test('line index handles empty file and Chinese characters',()=>{
 assert.deepEqual(buildLineStarts(''),[0]);
 assert.deepEqual(buildLineStarts('中文\n你好'),[0,3]);
});

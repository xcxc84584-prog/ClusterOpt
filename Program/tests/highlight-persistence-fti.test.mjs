import test from 'node:test';
import assert from 'node:assert/strict';
import {FileTypeIdentifier} from '../src/fmc/file-type-identifier.js';
import {HighlightRenderer} from '../src/text-highlighter/highlight-renderer.js';
test('FTI recognizes Chinese UTF-8 without changing decoding policy',async()=>{
 const result=await new FileTypeIdentifier().identify(new Blob(['中文測試，繁體字。']),'中文.txt');
 assert.equal(result.kind,'TEXT');assert.equal(result.format,'UTF-8');
 assert.equal(result.script,'CJK');
});
test('FTI recognizes ordinary UTF-8 text',async()=>{
 const result=await new FileTypeIdentifier().identify(new Blob(['hello world']),'a.txt');
 assert.equal(result.script,'GENERAL');
});
test('renderer provides a provisional recolor method',()=>{
 assert.equal(typeof HighlightRenderer.prototype.retainDuringEdit,'function');
});

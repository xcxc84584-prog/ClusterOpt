import {transcodeToUtf8} from '../src/fmc/chinese-transcoder.js';
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

test('Big5 file is decoded and transcoded without replacement characters',async()=>{
 const bytes=new Uint8Array([0xa4,0xa4,0xa4,0xe5]);
 const source=new Blob([bytes]);
 const type=await new FileTypeIdentifier().identify(source,'sample.txt');
 assert.ok(type.format==='Big5'||type.candidates?.includes('Big5'));
 const utf8=await transcodeToUtf8(source,'Big5');
 assert.equal(await utf8.text(),'中文');
 assert.deepEqual(new Uint8Array(await source.arrayBuffer()),bytes);
});
test('GBK file is decoded as Chinese',async()=>{
 const source=new Blob([new Uint8Array([0xd6,0xd0,0xce,0xc4])]);
 const type=await new FileTypeIdentifier().identify(source,'sample.txt');
 assert.ok(type.format==='GBK'||type.candidates?.includes('GBK'));
 assert.equal(await (await transcodeToUtf8(source,'GBK')).text(),'中文');
});
test('GB18030 four-byte sequence survives a streaming boundary',async()=>{
 const prefix=new Uint8Array(256*1024-1).fill(0x41);
 const source=new Blob([prefix,new Uint8Array([0x94,0x39,0xfc,0x36])]);
 const result=await transcodeToUtf8(source,'GB18030');
 assert.equal((await result.text()).length,prefix.length+2);
});

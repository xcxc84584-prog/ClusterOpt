import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('media opens without reading or decoding 256 KiB binary preview',()=>{
 const media=main.slice(main.indexOf("if(type.kind==='MEDIA'){"),main.indexOf('// Byte-to-codepoint mapping'));
 assert.match(media,/previewBytes:0/);
 assert.doesNotMatch(media,/arrayBuffer\(/);
 assert.match(media,/refresh\(\)/);
});
test('media bypasses syntax highlighting and remains read-only',()=>{
 assert.match(main,/binaryDocuments\.get\(active\)\?\.type\?\.kind==='MEDIA'/);
 assert.match(main,/editor\.readOnly = unavailable \|\| media/);
 assert.match(main,/Media is read-only; original bytes preserved/);
});

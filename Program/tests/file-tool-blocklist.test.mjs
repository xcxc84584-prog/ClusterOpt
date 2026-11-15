import test from 'node:test';
import assert from 'node:assert/strict';
import {BlockedFileTypes,normalizeExtension} from '../src/file-type-blocklist.js';

function storage(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
test('File Tool excludes non-code file extensions by default',()=>{
 const policy=new BlockedFileTypes(storage());
 for(const name of ['video.mp4','photo.JPG','document.pdf','archive.zip'])assert.equal(policy.has(name),true,name);
 assert.equal(policy.has('main.cpp'),false);
});
test('File Tool can add, rename, delete and persist exclusions',()=>{
 const store=storage();const policy=new BlockedFileTypes(store);
 policy.add('abc');assert.equal(policy.has('test.abc'),true);
 policy.replace('.abc','.xyz');assert.equal(policy.has('test.xyz'),true);
 policy.remove('xyz');assert.equal(policy.has('test.xyz'),false);
 policy.add('.foo');assert.equal(new BlockedFileTypes(store).has('a.foo'),true);
 assert.throws(()=>normalizeExtension('../x'));
});
test('File Tool UI uses palette tokens and Explorer filters excluded entries',async()=>{
 const fs=await import('node:fs');
 const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const explorer=fs.readFileSync(new URL('../src/explorer.js',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(main,/GLOBALS\.register\('FILE_TOOL_BLOCKED_TYPES'/);
 assert.match(main,/GLOBALS\.register\('FILE_TOOL_THEME',UI_PALETTE\)/);
 assert.match(explorer,/this\.#blockedTypes\?\.has\(node\.name\)/);
 assert.match(css,/\.file-tool-dialog/);
 assert.match(css,/var\(--ui-surface\)/);
});

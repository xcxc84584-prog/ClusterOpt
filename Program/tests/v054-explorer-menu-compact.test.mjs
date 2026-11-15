import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('54.2 compact action row fits four buttons without horizontal scrolling',()=>{
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/#explorerTree \.explorer-inline-action \{/);
 assert.match(css,/width:100%; min-width:0; height:29px/);
 assert.match(css,/padding-inline-start:4px !important/);
 assert.match(css,/overflow:visible/);
});
test('54.2 Explorer style cache invalidated',()=>{
 assert.match(html,/style\.css\?v=opt054-explorer-icons/);
});

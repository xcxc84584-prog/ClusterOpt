import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('56: Explorer actions are embedded in the file row, not detached',()=>{
 const js=read('../src/explorer.js'),css=read('../src/style.css');
 assert.match(js,/row\.append\(this\.#inlineActions\(node\)\)/);
 assert.doesNotMatch(js,/document\.body\.append\(popup\)/);
 assert.match(css,/#explorerTree \.explorer-entry\.has-inline-actions/);
 assert.match(css,/flex-direction:row/);
 assert.match(css,/text-overflow:ellipsis/);
 assert.match(js,/\['more','⋯'/);
});
test('56: Explorer asset cache is invalidated',()=>{
 const html=read('../index.html');
 assert.match(html,/style\.css\?v=opt060-psm-r5/);
 assert.match(html,/main\.js\?v=opt060-psm-r5/);
});

test('56: entry module imports the same Explorer build as the page',()=>{
 const main=read('../src/main.js');
 const root=read('../../index.html');
 assert.match(main,/explorer\.js\?v=opt059-shortcut-i18n/);
 assert.match(root,/searchParams\.set\("v", "0\.0\.60"\)/);
 assert.match(root,/searchParams\.set\("build", "opt060-psm-r5"\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {filterExplorerEntries} from '../src/explorer.js';

test('Explorer search retains order and is case-insensitive',()=>{
 const entries=[{name:'B.cpp'},{name:'a.md'},{name:'b.py'}];
 assert.deepEqual(filterExplorerEntries(entries,'B').map(e=>e.name),['B.cpp','b.py']);
 assert.deepEqual(filterExplorerEntries(entries,'').map(e=>e.name),['B.cpp','a.md','b.py']);
});
test('Explorer search is safe for empty queries',()=>{
 assert.deepEqual(filterExplorerEntries([],'foo'),[]);
 assert.deepEqual(filterExplorerEntries([{name:'foo'}],null),[{name:'foo'}]);
});

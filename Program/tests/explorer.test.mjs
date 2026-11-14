import test from 'node:test';
import assert from 'node:assert/strict';
import {filterExplorerEntries} from '../src/explorer.js';
test('Explorer search is case-insensitive and preserves original order', () => {
  const entries=[{name:'Main.cpp'},{name:'notes.md'},{name:'main.py'}];
  assert.deepEqual(filterExplorerEntries(entries,'MAIN').map(x=>x.name),
    ['Main.cpp','main.py']);
  assert.equal(filterExplorerEntries(entries,'').length,3);
  assert.equal(filterExplorerEntries(entries,'missing').length,0);
});

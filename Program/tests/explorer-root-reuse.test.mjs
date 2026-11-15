import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/explorer.js',import.meta.url),'utf8');
test('Explorer reuses existing root for same or descendant directory',()=>{
 assert.match(source,/async #workspaceDirectory\(handle\)/);
 assert.match(source,/root\.handle\.isSameEntry\(handle\)/);
 assert.match(source,/root\.handle\.resolve\(handle\)/);
 assert.match(source,/if\(existing\)return existing/);
 assert.match(source,/const node=await this\.#remember\(handle\)/);
});
test('Explorer does not merge unrelated same-name directories',()=>{
 assert.match(source,/while\(this\.#roots\.some\(node=>node\.key===key\)\)/);
 assert.doesNotMatch(source,/if\(existing\)\{existing\.handle=handle;return existing;\}/);
});

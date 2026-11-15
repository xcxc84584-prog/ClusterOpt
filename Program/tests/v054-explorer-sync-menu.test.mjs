import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const explorer=readFileSync(new URL('../src/explorer.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
test('54 Explorer external sync polls only visible expanded directories',()=>{
 assert.match(explorer,/setInterval\(\(\)=>\{void this\.syncExternal\(\);\},2500\)/);
 assert.match(explorer,/this\.#panel\.hidden\|\|document\.hidden/);
 assert.match(explorer,/if\(node\.kind!=='directory'\|\|!node\.expanded\)return/);
 assert.match(explorer,/await this\.#loadChildren\(node,true\)/);
 assert.match(explorer,/if\(changed\)/);
});
test('54 Explorer refresh preserves selected and expanded entries when external file appears',()=>{
 assert.match(explorer,/const previous=new Map/);
 assert.match(explorer,/prior\.handle=handle;prior\.parent=node/);
 assert.match(explorer,/if\(this\.#selected&&!keys\.has\(this\.#selected\)\)this\.#selected=null/);
 assert.match(explorer,/if\(!this\.#rename&&!this\.#draft&&!this\.#hold\)this\.render\(\)/);
 assert.doesNotMatch(explorer,/Explorer directory read: '\+error\);node\.children=\[\]/);
});
test('54 Explorer menu shows labeled actions and back navigation',()=>{
 assert.match(explorer,/button\.append\(symbol\)/);
 assert.match(explorer,/explorer-action-symbol/);
 assert.match(explorer,/key==='more'\|\|key==='back'/);
 assert.match(css,/\.explorer-action-label/);
 assert.match(css,/\.explorer-inline-action\.is-danger/);
});

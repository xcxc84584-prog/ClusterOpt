import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createClusterDependencies} from '../src/dependency-registry.js';
import {createVTE} from '../src/vte/vte.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('49.4: registry and published object/property lists include EditPath',()=>{
 const registry=createClusterDependencies(),objects=registry.list(),edges=registry.edges();
 assert.ok(objects.length>=38);
 const edit=objects.find(x=>x.name==='EditPath');
 assert.ok(edit);
 for(const p of ['PARENT_SLICE_ID','EDIT_REVISION','TEXT_LENGTH','LINE_COUNT'])
  assert.ok(edit.properties.includes(p),p);
 assert.ok(edges.some(e=>e.from==='UI'&&e.to==='EditPath'));
 assert.ok(edges.some(e=>e.from==='EditPath'&&e.to==='MicroSliceDocument'));
 assert.match(read('../../OBJECT_LIST.md'),/\| EditPath \|/);
 assert.match(read('../../PROPERTY_LIST.md'),/\| `EDIT_REVISION` \|/);
});
test('49.4: version, redirect and refreshed module are aligned',()=>{
 const root=read('../../index.html'),page=read('../index.html'),main=read('../src/main.js');
 assert.match(root,/Program\/\?v=0\.0\.57/);
 assert.match(root,/searchParams\.set\("v", "0\.0\.57"\)/);
 assert.match(page,/Cluster Opt 0\.0\.57/);
 assert.match(page,/main\.js\?v=opt057-file-tool/);
 assert.match(main,/document\.title='Cluster Opt v0\.0\.57'/);
});
test('49.4: editor cache integration does not mutate VTE',()=>{
 const vte=createVTE();
 const main=read('../src/main.js');
 assert.match(main,/reconcileResidentEdit\(id,index,content,inputIntent\)/);
 assert.match(main,/session\.edit\(index, content\)/);
 assert.equal(vte.Status().data.files.length,0);
});

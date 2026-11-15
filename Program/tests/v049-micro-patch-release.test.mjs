import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createClusterDependencies} from '../src/dependency-registry.js';
import {createVTE} from '../src/vte/vte.js';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('49.5: OCDA patch contract, GitHub inventories and release are aligned', () => {
  const registry = createClusterDependencies();
  assert.ok(registry.list().length >= 38);
  const session = registry.list().find(x => x.name === 'VirtualFileSession');
  for (const name of ['MICRO_PATCH_BASE_VERSION','MICRO_PATCH_RANGE','PARENT_SLICE_ID'])
    assert.ok(session.properties.includes(name), name);
  assert.ok(registry.edges().some(e =>
    e.from === 'VirtualFileSession' && e.to === 'MicroSliceDocument'));
  for (const name of ['MICRO_PATCH_BASE_VERSION','MICRO_PATCH_RANGE'])
    assert.ok(read('../../PROPERTY_LIST.md').includes(name));
  assert.match(read('../../物件清單.md'), /49\.5/);
  assert.match(read('../../屬性清單.md'), /49\.5/);
  assert.match(read('../../index.html'), /Program\/\?v=0\.0\.58/);
  assert.match(read('../index.html'), /Cluster Opt 0\.0\.58/);
  const vte = createVTE();
  registry.list();
  assert.equal(vte.Status().data.files.length, 0);
});

test('49.5: four mandatory PR documents and six QuestionList audits exist', () => {
  const base = '../../PR/PR(+v 0.0.49)/PR-06/';
  for (const name of ['PRDrequest.md','ArcD.md','Plan.md','Relation Test.md'])
    assert.ok(read(base + name).length > 100, name);
  for (const group of ['QuestionList1','QuestionList2'])
    for (const name of ['未處理潛在問題清單.md','待測試清單.md','已修復紀錄.md'])
      assert.match(read('../../'+group+'/'+name), /PR-06 \/ 49\.5/);
});

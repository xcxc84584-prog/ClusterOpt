import test from 'node:test';
import assert from 'node:assert/strict';
import {createClusterDependencies} from '../src/dependency-registry.js';
import {createVTE} from '../src/vte/vte.js';

test('CAT-01/02: catalog distinguishes registered objects and implementation-only modules', () => {
  const registry = createClusterDependencies();
  const names = registry.list().map(object => object.name);
  assert.equal(names.length, 38); // v0.0.49.3 registers PieceTree, MicroSliceDocument and MicroSliceIndex
  for (const name of ['UI', 'Documents', 'OMU', 'VirtualFileSession', 'FILE_MENU']) {
    assert.ok(names.includes(name), name);
  }
  assert.equal(names.includes('Explorer'), true);
  assert.equal(names.includes('VTE'), true);
  const relation = registry.dep('FlagUnit');
  assert.equal(relation.ok, true);
  assert.ok(relation.data.relations.length > 0);
});

test('CAT-03: catalog VTE event chain does not share virtual file state', async () => {
  const first = createVTE();
  const second = createVTE();
  assert.equal(first.Creat.Virtual_file('catalog', 1).code, 201);
  assert.equal(second.Status().data.files.length, 0);
  assert.equal((await first.Read.Virtual_file('catalog', {length: 2})).data.content, 'AA');
  assert.equal(first.Reset().ok, true);
  assert.equal(first.Status().data.files.length, 0);
  assert.equal(second.Status().data.files.length, 0);
});

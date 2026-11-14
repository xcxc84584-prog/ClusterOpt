import test from 'node:test';
import assert from 'node:assert/strict';
import {DependencyRegistry, createClusterDependencies} from '../src/dependency-registry.js';
import {OMU} from '../src/omu.js';

test('all declared objects and dependencies resolve', () => {
  const registry = createClusterDependencies();
  const result = registry.dep();
  assert.equal(result.ok, true);
  assert.ok(result.data.totalObjects >= 20);
  assert.ok(result.data.totalRelations >= 20);
  for (const edge of result.data.relations) {
    assert.ok(result.data.objects.some(o => o.name === edge.from));
    assert.ok(result.data.objects.some(o => o.name === edge.to));
    assert.ok(['01', '10', '11'].includes(edge.dyda));
  }
  assert.equal(registry.dep('Missing').code, 404);
});

test('DYDA is direction-sensitive and bidirectional where appropriate', () => {
  const registry = new DependencyRegistry();
  registry.register('A');
  registry.register('B');
  assert.equal(registry.relate('A', 'B', 'REQUEST').ok, true);
  assert.equal(registry.dep('A').data.relations[0].dyda, '01');
  assert.equal(registry.relate('B', 'A', 'RESPONSE').ok, true);
  assert.ok(registry.dep('A').data.relations.every(e => e.dyda === '11'));
});

test('invalid, duplicate and missing dependency records are rejected', () => {
  const registry = new DependencyRegistry();
  assert.equal(registry.register('A').ok, true);
  assert.equal(registry.register('A').code, 409);
  assert.equal(registry.relate('A', 'B', 'REQUEST').code, 404);
  assert.equal(registry.relate('A', 'A', 'REQUEST').code, 400);
  registry.register('B');
  assert.equal(registry.relate('A', 'B', 'REQUEST').ok, true);
  assert.equal(registry.relate('A', 'B', 'REQUEST').code, 409);
});

test('returned dependency snapshots cannot mutate registry', () => {
  const registry = createClusterDependencies();
  const before = registry.dep('FlagUnit');
  before.data.objects[0].name = 'CORRUPT';
  before.data.objects[0].properties.push('CORRUPT');
  assert.equal(registry.dep('FlagUnit').data.objects[0].name, 'FlagUnit');
});

test('OMU loop stores START, ERROR, EHU and END, suppressing normal repetitions', () => {
  const omu = new OMU();
  const loop = omu.startLoop('SliceLoader', 'LOAD');
  for (let i = 0; i < 100; i++) omu.emit('SliceLoader', 'LOAD', 200, '', false, loop);
  omu.emit('SliceLoader', 'LOAD', 500, 'read failed', false, loop);
  omu.emit('SliceLoader', 'LOAD', 403, 'revoked', true, loop);
  assert.equal(omu.endLoop(loop), true);
  const logs = omu.logs();
  assert.deepEqual(logs.map(e => e.type), ['START', 'ERROR', 'EHU', 'END']);
  assert.equal(logs[3].suppressed, 100);
});

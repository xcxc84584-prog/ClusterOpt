import test from 'node:test';
import assert from 'node:assert/strict';
import {OMU} from '../src/omu.js';
import {createVTE} from '../src/vte/vte.js';

test('GOV-02: bounded OMU event chain retains START, ERROR, EHU and END', () => {
  const omu = new OMU();
  const loopId = omu.startLoop('GOV', 'BulkRead');
  omu.emit('GOV', 'Read', 200, 'normal-1', false, loopId);
  omu.emit('GOV', 'Read', 200, 'normal-2', false, loopId);
  omu.emit('GOV', 'Read', 409, 'conflict', false, loopId);
  omu.emit('GOV', 'Read', 500, 'handler', true, loopId);
  assert.equal(omu.endLoop(loopId), true);
  const logs = omu.logs();
  assert.deepEqual(logs.map(log => log.type), ['START', 'ERROR', 'EHU', 'END']);
  assert.ok(logs.every(log => log.loopId === loopId));
  assert.equal(logs[3].processed, 4);
  assert.equal(logs[3].suppressed, 2);
  assert.equal(logs[3].errors, 2);
});

test('GOV-03: VTE create/read/delete event chain is isolated', async () => {
  const primary = createVTE();
  const secondary = createVTE();
  assert.equal(primary.Creat.Virtual_file('governance', 1).code, 201);
  assert.equal(secondary.Status().data.files.length, 0);
  const read = await primary.Read.Virtual_file('governance', {length: 4});
  assert.equal(read.ok, true);
  assert.equal(read.data.content, 'AAAA');
  assert.equal(primary.Delete.Virtual_file('governance').ok, true);
  const actions = primary.Log().map(event => event.action);
  assert.ok(actions.some(action => action.includes('Virtual_file')));
  assert.equal(primary.Status().data.files.length, 0);
  assert.equal(secondary.Status().data.files.length, 0);
});

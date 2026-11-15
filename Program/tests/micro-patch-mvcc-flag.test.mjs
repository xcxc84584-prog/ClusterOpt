import test from 'node:test';
import assert from 'node:assert/strict';
import {VirtualFileSession} from '../src/fmc/virtual-file-session.js';
import {createVTE} from '../src/vte/vte.js';

test('49.5: parent FLAG/MVCC commits micro-patches and rejects stale versions', async () => {
  const vte = createVTE();
  const session = new VirtualFileSession('micro-doc', new Blob(['abcd\nefgh']));
  const user = session.getUserGateway();
  const before = await session.read(0);
  assert.equal(before.data.versionId, 0);
  const first = await user.patch(0, {
    start: 2, end: 4, text: 'XY', expectedVersionId: 0
  });
  assert.equal(first.ok, true);
  assert.equal(first.data.versionId, 1);
  assert.equal(first.data.parentSliceId, 'micro-doc:0');
  assert.equal((await session.read(0)).data.content, 'abXY\nefgh');
  const stale = await user.patch(0, {
    start: 0, end: 1, text: '!', expectedVersionId: 0
  });
  assert.equal(stale.ok, false);
  assert.equal(stale.code, 409);
  assert.equal(stale.ehu, 'MICRO_PATCH_VERSION_CONFLICT');
  assert.equal((await session.read(0)).data.content, 'abXY\nefgh');
  assert.equal(session.getFlagStatus(0).data.mode, 'FREE');
  assert.equal(session.recoveryEdits[0].content, 'abXY\nefgh');
  assert.equal(vte.Status().data.files.length, 0);
});

test('49.5: AGENT gateway patch validates base version and range', async () => {
  const session = new VirtualFileSession('agent-doc', new Blob(['hello']));
  const agent = session.getAgentGateway('AGENT-A');
  const invalid = await agent.patch(0, {
    start: -1, end: 0, text: 'x', expectedVersionId: 0
  });
  assert.equal(invalid.code, 416);
  assert.equal(session.getFlagStatus(0).data.mode, 'FREE');
  const bad = await agent.patch(0, {
    start: 0, end: 1, text: 'x'
  });
  assert.equal(bad.code, 400);
  const valid = await agent.patch(0, {
    start: 0, end: 5, text: '世界🙂', expectedVersionId: 0
  });
  assert.equal(valid.ok, true);
  assert.equal((await session.read(0)).data.content, '世界🙂');
  assert.equal((await session.getUserGateway().patch(0, {
    start: 0, end: 2, text: '中', expectedVersionId: 1
  })).ok, true);
  assert.equal((await agent.patch(0, {
    start: 0, end: 1, text: '!', expectedVersionId: 1
  })).code, 409);
  assert.equal(session.getFlagStatus(0).data.mode, 'FREE');
});

test('49.5: line offsets and recovery remain consistent after patch', async () => {
  const session = new VirtualFileSession('lines-doc', new Blob(['one\ntwo\nthree']));
  await session.indexLines();
  assert.equal(session.totalLines, 3);
  const result = await session.editPatch(0, {
    start: 3, end: 4, text: '\n\n', expectedVersionId: 0
  });
  assert.equal(result.ok, true);
  assert.equal(session.totalLines, 4);
  assert.equal(session.recoveryEdits[0].content, 'one\n\ntwo\nthree');
  const invalid = await session.editPatch(0, {
    start: 0, end: 100, text: '', expectedVersionId: 1
  });
  assert.equal(invalid.code, 416);
  assert.equal(session.totalLines, 4);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {FlagUnit} from '../src/fmc/flag-unit.js';
import {FileManagementCore} from '../src/fmc/file-management-core.js';
import {VirtualFileSession} from '../src/fmc/virtual-file-session.js';

test('multiple ORFs coexist, AGENT WTF is deferred', () => {
  let now = 1000;
  const flags = new FlagUnit({clock: () => now});
  const a = flags.acquireRead('s', 'agent-a');
  const b = flags.acquireRead('s', 'agent-b');
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(flags.status('s').data.readCount, 2);
  assert.equal(flags.acquire('s', 'agent-c').code, 409);
  assert.equal(flags.releaseRead('s', a.data.leaseId, a.data.fencingToken, 'agent-b').code, 403);
  assert.equal(flags.releaseRead('s', a.data.leaseId, a.data.fencingToken, 'agent-a').ok, true);
  assert.equal(flags.releaseRead('s', b.data.leaseId, b.data.fencingToken, 'agent-b').ok, true);
  assert.equal(flags.acquire('s', 'agent-c').ok, true);
});

test('USER preempts WTF and ORFs; stale tokens fail and EHU events emitted', () => {
  const events = [];
  const flags = new FlagUnit({onEvent: e => events.push(e)});
  const old = flags.acquire('s', 'agent-a').data;
  const takeover = flags.userTakeover('s');
  assert.equal(takeover.ok, true);
  assert.equal(flags.validate('s', old.leaseId, old.fencingToken), false);
  assert.equal(flags.release('s', old.leaseId, old.fencingToken).code, 403);
  assert.equal(flags.acquireRead('s', 'agent-b').code, 409);
  assert.ok(events.some(e => e.type === 'FLAG_REVOKED_BY_USER' && e.ownerId === 'agent-a'));
  flags.release('s', takeover.data.leaseId, takeover.data.fencingToken, 'USER');
  const read1 = flags.acquireRead('s', 'agent-a').data;
  const read2 = flags.acquireRead('s', 'agent-b').data;
  flags.userTakeover('s');
  assert.equal(flags.validateRead('s', read1.leaseId, read1.fencingToken, 'agent-a'), false);
  assert.equal(flags.validateRead('s', read2.leaseId, read2.fencingToken, 'agent-b'), false);
  assert.equal(events.filter(e => e.type === 'ORF_REVOKED').length, 2);
});

test('lease expiry, renewal limit and ownership', () => {
  let now = 0;
  const flags = new FlagUnit({clock: () => now});
  const lease = flags.acquire('s', 'agent', now).data;
  assert.equal(flags.renew('s', lease.leaseId, lease.fencingToken, now, 'agent').code, 425);
  now = 50000;
  assert.equal(flags.renew('s', lease.leaseId, lease.fencingToken, now, 'agent').ok, true);
  assert.equal(flags.renew('s', lease.leaseId, lease.fencingToken, now, 'agent').code, 409);
  assert.equal(flags.release('s', lease.leaseId, lease.fencingToken, 'other').code, 403);
  now = 170001;
  assert.equal(flags.active('s'), false);
  assert.equal(flags.validate('s', lease.leaseId, lease.fencingToken, now), false);
  assert.equal(flags.acquire('s', 'new-agent', now).ok, true);
});

test('FMC requires ORF for agent reads and denies stale agent commits', () => {
  const core = new FileManagementCore();
  const sliceId = 'doc:0';
  assert.equal(core.loaderAccess.register({sliceId, documentId: 'doc', content: 'before',
    startOffset: 0, endOffset: 6}).ok, true);
  const readLease = core.acquireORF(sliceId, 'agent-a').data;
  assert.equal(core.readWithORF(sliceId, readLease.leaseId, readLease.fencingToken, 'agent-a').data.content, 'before');
  assert.equal(core.acquireWTF(sliceId, 'agent-b').code, 409);
  const user = core.userWrite(sliceId);
  assert.equal(user.ok, true);
  assert.equal(core.readWithORF(sliceId, readLease.leaseId, readLease.fencingToken, 'agent-a').code, 403);
  assert.equal(core.commit(sliceId, user.data.leaseId, user.data.fencingToken, 0, 'user').ok, true);
  core.releaseWTF(sliceId, user.data.leaseId, user.data.fencingToken, 'USER');
  const agent = core.acquireWTF(sliceId, 'agent-b').data;
  core.userWrite(sliceId);
  assert.equal(core.agentCommit(sliceId, 'agent-b', agent.leaseId, agent.fencingToken, 1, 'stale').code, 403);
  assert.equal(core.loaderAccess.unregister(sliceId).code, 409);
});

test('VirtualFileSession USER edit preempts agent and protects recovery content', async () => {
  const session = new VirtualFileSession('doc', new Blob(['hello']));
  const agent = session.getAgentGateway('agent-1');
  assert.equal((await agent.read(0)).data.content, 'hello');
  const result = await session.getUserGateway().edit(0, 'world');
  assert.equal(result.ok, true);
  assert.equal(session.recoveryEdits[0].content, 'world');
  assert.equal(session.getFlagStatus(0).data.mode, 'FREE');
});

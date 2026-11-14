import {FlagUnit} from './flag-unit.js';
import {MVCCUnit} from './mvcc-unit.js';

/** FMC stores loaded slices only. Slice Loader owns registration decisions. */
export class FileManagementCore {
  #slices = new Map();
  #flags = new FlagUnit();
  #mvcc = new MVCCUnit();
  #loaderKey = Symbol('SliceLoader');
  #recoveryProtected = new Set();
  #flagEvents = new Set();
  constructor() {
    this.#flags.subscribe(event => {
      for (const callback of this.#flagEvents) {
        try { callback(event); } catch { /* observer isolation */ }
      }
    });
  }

  onFlagEvent(callback) {
    if (typeof callback !== 'function') throw new TypeError('callback');
    this.#flagEvents.add(callback);
    return () => this.#flagEvents.delete(callback);
  }

  get loaderAccess() {
    return Object.freeze({
      register: (descriptor) => this.#register(descriptor, this.#loaderKey),
      unregister: (sliceId) => this.#unregister(sliceId, this.#loaderKey)
    });
  }

  #register(descriptor, key) {
    if (key !== this.#loaderKey) return {ok: false, code: 403};
    const {sliceId, documentId, content, startOffset, endOffset} = descriptor;
    if (!sliceId || !documentId || typeof content !== 'string') {
      return {ok: false, code: 400};
    }
    if (this.#slices.has(sliceId)) return {ok: false, code: 409};
    const result = this.#mvcc.register(sliceId, content);
    if (!result.ok) return result;
    this.#slices.set(sliceId, {documentId, startOffset, endOffset, dirty: false});
    return {ok: true, code: 201, data: {sliceId}};
  }

  #unregister(sliceId, key) {
    if (key !== this.#loaderKey) return {ok: false, code: 403};
    const slice = this.#slices.get(sliceId);
    if (!slice) return {ok: false, code: 404};
    if (slice.dirty || this.#flags.active(sliceId) ||
        this.#recoveryProtected.has(sliceId) ||
        this.#mvcc.hasUnpersistedVersion(sliceId)) {
      return {ok: false, code: 409, message: 'Slice is protected from retirement'};
    }
    this.#mvcc.unregister(sliceId);
    this.#slices.delete(sliceId);
    this.#recoveryProtected.delete(sliceId);
    return {ok: true, code: 200};
  }

  read(sliceId, versionId = null) {
    if (!this.#slices.has(sliceId)) return {ok: false, code: 404};
    return this.#mvcc.read(sliceId, versionId);
  }

  /** USER editing preempts all AGENT leases on this slice. */
  userWrite(sliceId, userId = 'USER') {
    if (!this.#slices.has(sliceId)) return {ok: false, code: 404};
    return this.#flags.userTakeover(sliceId, userId);
  }

  /** AGENT write does not preempt readers or another writer. */
  acquireWTF(sliceId, ownerId) {
    if (!this.#slices.has(sliceId)) return {ok: false, code: 404};
    return this.#flags.acquire(sliceId, ownerId);
  }

  renewWTF(sliceId, leaseId, token, ownerId) {
    return this.#flags.renew(sliceId, leaseId, token, Date.now(), ownerId);
  }

  releaseWTF(sliceId, leaseId, token, ownerId) {
    return this.#flags.release(sliceId, leaseId, token, ownerId);
  }

  acquireORF(sliceId, agentId) {
    if (!this.#slices.has(sliceId)) return {ok: false, code: 404};
    return this.#flags.acquireRead(sliceId, agentId);
  }
  releaseORF(sliceId, leaseId, token, agentId) {
    return this.#flags.releaseRead(sliceId, leaseId, token, agentId);
  }
  renewORF(sliceId, leaseId, token, agentId) {
    return this.#flags.renewRead(sliceId, leaseId, token, agentId);
  }
  getFlagStatus(sliceId) {
    if (!this.#slices.has(sliceId)) return {ok: false, code: 404};
    return this.#flags.status(sliceId);
  }
  listOwnedFlags(ownerId) { return this.#flags.owned(ownerId); }

  /** A read is accepted only if the ORF remains valid and MVCC is unchanged. */
  readWithORF(sliceId, leaseId, token, agentId, versionId = null) {
    if (!this.#flags.validateRead(sliceId, leaseId, token, agentId))
      return {ok: false, code: 403, ehu: 'ORF_REVOKED'};
    const before = this.#mvcc.read(sliceId);
    if (!before.ok) return before;
    if (versionId !== null && before.data.versionId !== versionId)
      return {ok: false, code: 409, ehu: 'FLAG_VERSION_CONFLICT'};
    const result = this.#mvcc.read(sliceId, before.data.versionId);
    if (!this.#flags.validateRead(sliceId, leaseId, token, agentId))
      return {ok: false, code: 403, ehu: 'ORF_REVOKED'};
    const after = this.#mvcc.read(sliceId);
    if (!after.ok || after.data.versionId !== before.data.versionId)
      return {ok: false, code: 409, ehu: 'FLAG_VERSION_CONFLICT'};
    return result;
  }

  /** Only the authenticated owner may commit using an AGENT lease. */
  agentCommit(sliceId, agentId, leaseId, token, baseVersionId, content) {
    if (!this.#flags.validate(sliceId, leaseId, token, Date.now(), agentId))
      return {ok: false, code: 403, ehu: 'FLAG_PERMISSION_DENIED'};
    return this.commit(sliceId, leaseId, token, baseVersionId, content);
  }

  /** Caller must enforce administrator authorization before using this method. */
  administrativeRevoke(sliceId, authorized) {
    if (authorized !== true) return {ok: false, code: 403};
    return this.#flags.revoke(sliceId);
  }

  commit(sliceId, leaseId, token, baseVersionId, content) {
    if (!this.#flags.validate(sliceId, leaseId, token)) {
      return {ok: false, code: 403, message: 'Invalid or expired WTF'};
    }
    if (typeof content !== 'string') return {ok: false, code: 400};
    const result = this.#mvcc.commit(sliceId, baseVersionId, content);
    if (result.ok) this.#slices.get(sliceId).dirty = true;
    return result;
  }

  commitBatch(changes) {
    if (!Array.isArray(changes) || !changes.length) {
      return {ok: false, code: 400};
    }
    for (const change of changes) {
      if (!this.#slices.has(change.sliceId)) {
        return {ok: false, code: 404};
      }
      if (!this.#flags.validate(
        change.sliceId, change.leaseId, change.fencingToken
      )) {
        return {ok: false, code: 403, message: 'Invalid WTF'};
      }
    }
    const result = this.#mvcc.commitBatch(changes);
    if (result.ok) {
      for (const change of changes) this.#slices.get(change.sliceId).dirty = true;
    }
    return result;
  }

  markPersisted(sliceId, versionId) {
    const current = this.#mvcc.read(sliceId);
    if (!current.ok || current.data.versionId !== versionId) {
      return {ok: false, code: 409};
    }
    if (!this.#mvcc.markPersisted(sliceId, versionId)) return {ok: false, code: 409};
    this.#slices.get(sliceId).dirty = false;
    return {ok: true, code: 200};
  }

  setRecoveryProtection(sliceId, protectedState) {
    if (protectedState) this.#recoveryProtected.add(sliceId);
    else this.#recoveryProtected.delete(sliceId);
  }

  get loadedSliceCount() {
    return this.#slices.size;
  }
}

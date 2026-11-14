import {FlagUnit} from './flag-unit.js';
import {MVCCUnit} from './mvcc-unit.js';

/** FMC stores loaded slices only. Slice Loader owns registration decisions. */
export class FileManagementCore {
  #slices = new Map();
  #flags = new FlagUnit();
  #mvcc = new MVCCUnit();
  #loaderKey = Symbol('SliceLoader');
  #recoveryProtected = new Set();

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

  acquireWTF(sliceId, ownerId) {
    if (!this.#slices.has(sliceId)) return {ok: false, code: 404};
    return this.#flags.acquire(sliceId, ownerId);
  }

  renewWTF(sliceId, leaseId, token) {
    return this.#flags.renew(sliceId, leaseId, token);
  }

  releaseWTF(sliceId, leaseId, token) {
    return this.#flags.release(sliceId, leaseId, token);
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

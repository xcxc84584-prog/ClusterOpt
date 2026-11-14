/** Immutable committed slice revisions; optimistic base-version validation. */
export class MVCCUnit {
  #versions = new Map();

  register(sliceId, content) {
    if (this.#versions.has(sliceId)) return {ok: false, code: 409};
    this.#versions.set(sliceId, {current: 0, history: new Map([[0, content]])});
    return {ok: true, code: 201, data: {versionId: 0}};
  }

  read(sliceId, versionId = null) {
    const record = this.#versions.get(sliceId);
    if (!record) return {ok: false, code: 404};
    const version = versionId === null ? record.current : versionId;
    if (!record.history.has(version)) return {ok: false, code: 404};
    return {ok: true, code: 200, data: {
      versionId: version, content: record.history.get(version)
    }};
  }

  commit(sliceId, baseVersionId, content) {
    const record = this.#versions.get(sliceId);
    if (!record) return {ok: false, code: 404};
    if (record.current !== baseVersionId) return {ok: false, code: 409};
    const versionId = ++record.current;
    record.history.set(versionId, content);
    return {ok: true, code: 200, data: {versionId}};
  }

  /**
   * Validate all base versions before mutating any slice. This is an atomic
   * in-memory commit, not an atomic disk flush or crash-safe transaction.
   */
  commitBatch(changes) {
    if (!Array.isArray(changes) || changes.length === 0) {
      return {ok: false, code: 400};
    }
    const ids = new Set();
    for (const change of changes) {
      if (ids.has(change.sliceId) || typeof change.content !== 'string') {
        return {ok: false, code: 400};
      }
      ids.add(change.sliceId);
      const record = this.#versions.get(change.sliceId);
      if (!record) return {ok: false, code: 404};
      if (record.current !== change.baseVersionId) {
        return {ok: false, code: 409};
      }
    }
    const versions = [];
    for (const change of changes) {
      const record = this.#versions.get(change.sliceId);
      const versionId = ++record.current;
      record.history.set(versionId, change.content);
      versions.push({sliceId: change.sliceId, versionId});
    }
    return {ok: true, code: 200, data: {versions}};
  }

  unregister(sliceId) {
    return this.#versions.delete(sliceId);
  }
}

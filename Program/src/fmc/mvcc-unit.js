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

  unregister(sliceId) {
    return this.#versions.delete(sliceId);
  }
}

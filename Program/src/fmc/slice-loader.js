/** Byte-range loading without reading the complete Blob into memory. */
export class SliceLoader {
  #core;
  #access;
  #sources = new Map();
  #loaded = new Map();
  #size;

  constructor(core, sliceSize = 256 * 1024) {
    this.#core = core;
    this.#access = core.loaderAccess;
    this.#size = sliceSize;
  }

  attach(documentId, blob) {
    if (!documentId || !blob || typeof blob.slice !== 'function') {
      return {ok: false, code: 400};
    }
    this.#sources.set(documentId, blob);
    return {ok: true, code: 200, data: {
      byteLength: blob.size, sliceCount: Math.max(1, Math.ceil(blob.size / this.#size))
    }};
  }

  async load(documentId, index) {
    const source = this.#sources.get(documentId);
    if (!source || !Number.isInteger(index) || index < 0) {
      return {ok: false, code: 400};
    }
    const startOffset = index * this.#size;
    if (startOffset >= source.size && !(source.size === 0 && index === 0)) {
      return {ok: false, code: 416};
    }
    const sliceId = documentId + ':' + index;
    if (this.#loaded.has(sliceId)) return this.#core.read(sliceId);
    const endOffset = Math.min(startOffset + this.#size, source.size);
    const bytes = await source.slice(startOffset, endOffset).arrayBuffer();
    // Decode a complete byte slice; callers must handle UTF-8 boundaries
    // when stitching adjacent slices into a text view.
    const content = new TextDecoder().decode(bytes);
    const registered = this.#access.register({
      documentId, sliceId, startOffset, endOffset, content
    });
    if (!registered.ok) return registered;
    this.#loaded.set(sliceId, true);
    return this.#core.read(sliceId);
  }

  unload(documentId, index) {
    const sliceId = documentId + ':' + index;
    const result = this.#access.unregister(sliceId);
    if (result.ok) this.#loaded.delete(sliceId);
    return result;
  }

  detach(documentId) {
    for (const sliceId of [...this.#loaded.keys()]) {
      if (sliceId.startsWith(documentId + ':')) {
        const result = this.#access.unregister(sliceId);
        if (!result.ok) return result;
        this.#loaded.delete(sliceId);
      }
    }
    this.#sources.delete(documentId);
    return {ok: true, code: 200};
  }
}

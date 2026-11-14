/**
 * SliceLoader owns byte-range metadata and registers only resident slices.
 * UTF-8 boundaries are aligned so no code point is split across slices.
 */
export class SliceLoader {
  #core;
  #access;
  #sources = new Map();
  #loaded = new Map();
  #size;

  constructor(core, sliceSize = 256 * 1024) {
    if (!Number.isSafeInteger(sliceSize) || sliceSize < 4) {
      throw new RangeError('sliceSize must be >= 4 bytes');
    }
    this.#core = core;
    this.#access = core.loaderAccess;
    this.#size = sliceSize;
  }

  attach(documentId, blob) {
    if (!documentId || !blob || typeof blob.slice !== 'function') {
      return {ok: false, code: 400};
    }
    if (this.#sources.has(documentId)) {
      return {ok: false, code: 409, message: 'Document already attached'};
    }
    this.#sources.set(documentId, blob);
    return {
      ok: true, code: 200,
      data: {
        byteLength: blob.size,
        sliceCount: Math.max(1, Math.ceil(blob.size / this.#size))
      }
    };
  }

  async #boundary(source, offset) {
    if (offset === 0 || offset >= source.size) {
      return Math.min(offset, source.size);
    }
    const lookahead = new Uint8Array(
      await source.slice(offset, Math.min(offset + 4, source.size)).arrayBuffer()
    );
    let skip = 0;
    while (skip < lookahead.length && (lookahead[skip] & 0xc0) === 0x80) {
      skip++;
    }
    if (skip === lookahead.length) {
      throw new Error('Invalid UTF-8 boundary');
    }
    return offset + skip;
  }

  async load(documentId, index) {
    const source = this.#sources.get(documentId);
    if (!source || !Number.isInteger(index) || index < 0) {
      return {ok: false, code: 400};
    }
    const rawStart = index * this.#size;
    if (rawStart >= source.size && !(source.size === 0 && index === 0)) {
      return {ok: false, code: 416};
    }
    const sliceId = documentId + ':' + index;
    if (this.#loaded.has(sliceId)) {
      return this.#core.read(sliceId);
    }

    try {
      const startOffset = await this.#boundary(source, rawStart);
      const endOffset = await this.#boundary(
        source, Math.min(rawStart + this.#size, source.size)
      );
      const bytes = await source.slice(startOffset, endOffset).arrayBuffer();
      const content = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
      const registered = this.#access.register({
        documentId, sliceId, startOffset, endOffset, content
      });
      if (!registered.ok) return registered;
      this.#loaded.set(sliceId, true);
      return this.#core.read(sliceId);
    } catch (error) {
      return {ok: false, code: 422, message: String(error)};
    }
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

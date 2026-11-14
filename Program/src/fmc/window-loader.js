/**
 * WindowLoader requests the current slice and its immediate neighbors only.
 * It does not pretend to know the global line index before scanning.
 */
export class WindowLoader {
  #loader;
  #core;
  #active = new Map();
  #generation = new Map();

  constructor(loader, core) {
    this.#loader = loader;
    this.#core = core;
  }

  async loadWindow(documentId, center, sliceCount, radius = 1) {
    const generation = (this.#generation.get(documentId) || 0) + 1;
    this.#generation.set(documentId, generation);
    const start = Math.max(0, center - radius);
    const end = Math.min(sliceCount - 1, center + radius);
    const slices = [];

    for (let index = start; index <= end; index++) {
      const result = await this.#loader.load(documentId, index);
      if (!result.ok) return result;
      slices.push({index, ...result.data});
    }
    if (generation !== this.#generation.get(documentId)) {
      return {ok: false, code: 409, message: 'Superseded viewport'};
    }

    const previous = this.#active.get(documentId) || new Set();
    const next = new Set(slices.map(slice => slice.index));
    for (const index of previous) {
      if (!next.has(index)) this.#loader.unload(documentId, index);
    }
    this.#active.set(documentId, next);
    return {ok: true, code: 200, data: {start, end, slices}};
  }

  getActive(documentId) {
    return [...(this.#active.get(documentId) || [])];
  }
}

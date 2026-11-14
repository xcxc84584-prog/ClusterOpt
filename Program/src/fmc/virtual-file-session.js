import {FileManagementCore} from './file-management-core.js';
import {SliceLoader} from './slice-loader.js';

/**
 * File-backed editor session. Only the current byte slice and neighbors
 * are materialized. Edits are MVCC commits guarded by per-slice WTF leases.
 * Each session owns its own FMC and loader to avoid document ID collisions.
 */
export class VirtualFileSession {
  #core = new FileManagementCore();
  #loader = new SliceLoader(this.#core);
  #blob;
  #documentId;
  #count;
  #dirty = new Map();
  #resident = new Set();
  #positions = new Map();
  #center = 0;
  #generation = 0;

  constructor(documentId, blob) {
    this.#documentId = documentId;
    this.#blob = blob;
    const attached = this.#loader.attach(documentId, blob);
    if (!attached.ok) throw new Error('Could not attach file');
    this.#count = attached.data.sliceCount;
  }

  get sliceCount() {
    return this.#count;
  }

  get center() {
    return this.#center;
  }

  get dirty() {
    return this.#dirty.size > 0;
  }

  get residentCount() {
    return this.#core.loadedSliceCount;
  }

  getPosition(index) {
    return this.#positions.get(index) || null;
  }

  setPosition(index, position) {
    this.#positions.set(index, {...position});
  }

  async window(center) {
    if (!Number.isInteger(center) || center < 0 || center >= this.#count) {
      return {ok: false, code: 416};
    }
    const generation = ++this.#generation;
    const start = Math.max(0, center - 1);
    const end = Math.min(this.#count - 1, center + 1);
    const slices = [];
    for (let index = start; index <= end; index++) {
      const sliceId = this.#documentId + ':' + index;
      const result = this.#dirty.has(index)
        ? {ok: true, data: this.#dirty.get(index)}
        : await this.#loader.load(this.#documentId, index);
      if (!result.ok) return result;
      slices.push({index, sliceId, ...result.data});
    }
    if (generation !== this.#generation) {
      return {ok: false, code: 409, message: 'Stale viewport'};
    }
    const next = new Set(slices.map(item => item.index));
    for (const index of this.#resident) {
      if (!next.has(index) && !this.#dirty.has(index)) {
        this.#loader.unload(this.#documentId, index);
      }
    }
    this.#resident = next;
    this.#center = center;
    return {ok: true, code: 200, data: {slices, center}};
  }

  async read(index) {
    if (this.#dirty.has(index)) {
      return {ok: true, code: 200, data: {...this.#dirty.get(index)}};
    }
    return this.#loader.load(this.#documentId, index);
  }

  async edit(index, content, ownerId = 'USER') {
    const sliceId = this.#documentId + ':' + index;
    const read = await this.read(index);
    if (!read.ok) return read;
    const lease = this.#core.acquireWTF(sliceId, ownerId);
    if (!lease.ok) return lease;
    const {leaseId, fencingToken} = lease.data;
    try {
      const result = this.#core.commit(
        sliceId, leaseId, fencingToken, read.data.versionId, content
      );
      if (result.ok) {
        this.#dirty.set(index, {
          content, versionId: result.data.versionId
        });
      }
      return result;
    } finally {
      this.#core.releaseWTF(sliceId, leaseId, fencingToken);
    }
  }

  /**
   * Stream ordered slices into a writable file. Never concatenate the file.
   * The caller must not mark saved if the writer fails or is canceled.
   */
  async save(handle) {
    const writer = await handle.createWritable();
    try {
      for (let index = 0; index < this.#count; index++) {
        const result = await this.read(index);
        if (!result.ok) throw new Error('Slice read failed: ' + index);
        await writer.write(result.data.content);
        if (!this.#dirty.has(index) && !this.#resident.has(index)) {
          this.#loader.unload(this.#documentId, index);
        }
      }
      await writer.close();
    } catch (error) {
      await writer.abort().catch(() => {});
      throw error;
    }
    for (const [index, record] of this.#dirty) {
      this.#core.markPersisted(this.#documentId + ':' + index, record.versionId);
    }
    this.#dirty.clear();
    return {ok: true, code: 200};
  }
}

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
  #pending = new Map();
  #recoveryProtected = new Set();
  #forceText = false;

  constructor(documentId, blob, options = {}) {
    this.#forceText = options.forceText === true;
    this.#loader = new SliceLoader(this.#core, 256 * 1024, options);
    this.#documentId = documentId;
    this.#blob = blob;
    const attached = this.#loader.attach(documentId, blob);
    if (!attached.ok) throw new Error('Could not attach file');
    this.#count = attached.data.sliceCount;
  }

  get forceText() { return this.#forceText; }

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

  get sourceBlob() { return this.#blob; }

  get recoveryEdits() {
    return [...this.#dirty].map(([index, data]) => ({
      index, content: data.content
    }));
  }

  /** OLR recovery references must remain resident until resolved. */
  protectRecovery(index, enabled = true) {
    const sliceId = this.#documentId + ':' + index;
    if (enabled) this.#recoveryProtected.add(index);
    else this.#recoveryProtected.delete(index);
    this.#core.setRecoveryProtection(sliceId, enabled);
  }

  async restoreEdits(edits) {
    for (const item of edits || []) {
      const result = await this.edit(item.index, item.content);
      if (!result.ok) throw new Error('Recovery commit failed: ' + result.code);
    }
  }

  // Build a line-number index without decoding or registering all slices.
  // Each chunk is released after counting LF bytes; only integer offsets remain.
  async indexLines(onProgress = () => {}) {
    const counts = new Array(this.#count).fill(0);
    const step = 4 * 1024 * 1024;
    let scanned = 0;
    for (let offset = 0; offset < this.#blob.size; offset += step) {
      const end = Math.min(offset + step, this.#blob.size);
      const bytes = new Uint8Array(await this.#blob.slice(offset, end).arrayBuffer());
      for (let j = 0; j < bytes.length; j++) {
        if (bytes[j] === 10) counts[Math.floor((offset + j) / (256 * 1024))]++;
      }
      scanned = end;
      onProgress({completed: Math.min(this.#count,
        Math.ceil(scanned / (256 * 1024))), total: this.#count});
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (this.#blob.size === 0) onProgress({completed: 1, total: 1});
    this.lineStarts = new Array(this.#count);
    let line = 1;
    for (let i = 0; i < this.#count; i++) {
      this.lineStarts[i] = line;
      line += counts[i];
    }
    this.totalLines = line;
    return {ok: true, code: 200, data: {sliceCount: this.#count, totalLines: line}};
  }

  getPosition(index) {
    return this.#positions.get(index) || null;
  }

  setPosition(index, position) {
    this.#positions.set(index, {...position});
  }

  /** A demand-driven slice request; concurrent callers share one read. */
  async requestSlice(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.#count) {
      return {ok: false, code: 416};
    }
    if (this.#dirty.has(index)) {
      return {ok: true, code: 200, data: {...this.#dirty.get(index)}};
    }
    if (this.#pending.has(index)) return this.#pending.get(index);
    const request = this.#loader.load(this.#documentId, index);
    this.#pending.set(index, request);
    try {
      return await request;
    } finally {
      if (this.#pending.get(index) === request) this.#pending.delete(index);
    }
  }

  async window(center, onProgress = () => {}) {
    if (!Number.isInteger(center) || center < 0 || center >= this.#count) {
      return {ok: false, code: 416};
    }
    const generation = ++this.#generation;
    // Retain the viewport triplet: previous, current and next.
    // Only the center is displayed; neighbors are loaded as resident slices.
    const slices = [];
    const requested = [center];
    const protectedWindow = new Set([center - 1, center, center + 1]
      .filter(index => index >= 0 && index < this.#count));
    onProgress({completed: 0, total: requested.length, center});
    for (const index of requested) {
      const sliceId = this.#documentId + ':' + index;
      const result = await this.requestSlice(index);
      if (!result.ok) return result;
      slices.push({index, sliceId, ...result.data});
      if (generation === this.#generation) {
        onProgress({completed: slices.length, total: requested.length, center});
      }
    }
    if (generation !== this.#generation) {
      return {ok: false, code: 409, message: 'Stale viewport'};
    }
    // Load neighbor slices without blocking the center render.
    // Older requests are not evicted while still pending.
    for (const index of protectedWindow) {
      if (index !== center && !this.#dirty.has(index)) {
        this.requestSlice(index).then(() => {
          // A stale prefetch must not remain resident after viewport changes.
          if (!this.#resident.has(index) && !this.#dirty.has(index) &&
              !this.#recoveryProtected.has(index)) {
            this.#loader.unload(this.#documentId, index);
          }
        }).catch(() => {});
      }
    }
    for (const index of this.#loader.loadedIndices(this.#documentId)) {
      if (protectedWindow.has(index) || this.#dirty.has(index) ||
          this.#recoveryProtected.has(index) || this.#pending.has(index)) continue;
      this.#loader.unload(this.#documentId, index);
    }
    this.#resident = protectedWindow;
    this.#center = center;
    return {ok: true, code: 200, data: {slices, center}};
  }

  async read(index) {
    return this.requestSlice(index);
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
        if (this.lineStarts) {
          const lineCount = text => (text.match(/\n/g) || []).length;
          const delta = lineCount(content) - lineCount(read.data.content);
          if (delta !== 0) {
            for (let i = index + 1; i < this.lineStarts.length; i++) {
              this.lineStarts[i] += delta;
            }
            this.totalLines += delta;
          }
        }
        this.#dirty.set(index, {
          content, versionId: result.data.versionId
        });
        this.protectRecovery(index, true);
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
  async #alignedOffset(offset) {
    if (offset <= 0 || offset >= this.#blob.size) {
      return Math.min(Math.max(offset, 0), this.#blob.size);
    }
    const bytes = new Uint8Array(await this.#blob.slice(offset, offset + 4).arrayBuffer());
    let skip = 0;
    while (skip < bytes.length && (bytes[skip] & 0xc0) === 0x80) skip++;
    if (skip === bytes.length) throw new Error('Invalid UTF-8 boundary');
    return offset + skip;
  }

  async save(handle, onProgress = () => {}, signal = null) {
    if (signal?.aborted) throw new DOMException('Save interrupted by editing', 'AbortError');
    const writer = await handle.createWritable();
    try {
      for (let index = 0; index < this.#count; index++) {
        if (signal?.aborted) throw new DOMException('Save interrupted by editing', 'AbortError');
        if (this.#dirty.has(index)) {
          await writer.write(this.#dirty.get(index).content);
        } else {
          // Copy unchanged source bytes without decoding or allocating a JS string.
          const start = await this.#alignedOffset(index * 256 * 1024);
          const end = await this.#alignedOffset(
            Math.min(this.#blob.size, (index + 1) * 256 * 1024)
          );
          await writer.write(this.#blob.slice(start, end));
        }
        onProgress({completed: index + 1, total: this.#count});
      }
      if (signal?.aborted) throw new DOMException('Save interrupted by editing', 'AbortError');
      await writer.close();
    } catch (error) {
      await writer.abort().catch(() => {});
      throw error;
    }
    for (const [index, record] of this.#dirty) {
      this.#core.markPersisted(this.#documentId + ':' + index, record.versionId);
    }
    this.#dirty.clear();
    for (const index of this.#recoveryProtected) this.protectRecovery(index, false);
    // Rebind to the saved file: the original Blob is immutable and may now
    // differ in size and slice boundaries after editing.
    const savedBlob = await handle.getFile();
    for (const index of this.#resident) {
      this.#loader.unload(this.#documentId, index);
    }
    const detached = this.#loader.detach(this.#documentId);
    if (!detached.ok) throw new Error('Cannot release old slice registry');
    this.#blob = savedBlob;
    const attached = this.#loader.attach(this.#documentId, savedBlob);
    if (!attached.ok) throw new Error('Cannot attach saved file');
    this.#count = attached.data.sliceCount;
    this.#resident.clear();
    this.#center = Math.min(this.#center, this.#count - 1);
    return {ok: true, code: 200};
  }
}

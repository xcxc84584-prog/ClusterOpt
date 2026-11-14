/**
 * OLR: bounded undo/redo and reload recovery of editor state.
 * IndexedDB persists document snapshots; browser file handles are not assumed
 * to survive permission changes.
 */
export class OverloadRestorer {
  #dbPromise;
  #history = new Map();
  #limit;

  constructor(limit = 100) {
    this.#limit = limit;
    this.#dbPromise = this.#open();
  }

  #open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('cluster-opt-olr', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', {keyPath: 'documentId'});
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async #transaction(mode, callback) {
    const db = await this.#dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('documents', mode);
      const store = transaction.objectStore('documents');
      const request = callback(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async save(documentId, state) {
    const record = {
      documentId, ...state, updatedAt: Date.now()
    };
    await this.#transaction('readwrite', store => store.put(record));
    return {ok: true, code: 200};
  }

  async restoreAll() {
    return await this.#transaction('readonly', store => store.getAll());
  }

  async remove(documentId) {
    await this.#transaction('readwrite', store => store.delete(documentId));
  }

  /** Keep changed ranges rather than full copies of each document. */
  record(documentId, before, after) {
    if (before === after) return;
    const history = this.#history.get(documentId) || {undo: [], redo: []};
    history.undo.push(this.#patch(after, before));
    if (history.undo.length > this.#limit) history.undo.shift();
    history.redo = [];
    this.#history.set(documentId, history);
  }

  #patch(before, after) {
    let start = 0;
    while (start < before.length && start < after.length &&
        before[start] === after[start]) {
      start++;
    }
    let beforeEnd = before.length;
    let afterEnd = after.length;
    while (beforeEnd > start && afterEnd > start &&
        before[beforeEnd - 1] === after[afterEnd - 1]) {
      beforeEnd--;
      afterEnd--;
    }
    return {
      start,
      removed: before.slice(start, beforeEnd),
      inserted: after.slice(start, afterEnd)
    };
  }

  #apply(current, patch) {
    if (current.slice(patch.start, patch.start + patch.removed.length) !==
        patch.removed) {
      return null;
    }
    return current.slice(0, patch.start) + patch.inserted +
      current.slice(patch.start + patch.removed.length);
  }

  async clearAll() {
    const db = await this.#dbPromise;
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('documents', 'readwrite');
      transaction.objectStore('documents').clear();
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    this.#history.clear();
    return {ok: true, code: 200};
  }

  undo(documentId, current) {
    const history = this.#history.get(documentId);
    if (!history?.undo.length) return null;
    const patch = history.undo.pop();
    const previous = this.#apply(current, patch);
    if (previous === null) return null;
    history.redo.push(this.#patch(previous, current));
    return previous;
  }

  redo(documentId, current) {
    const history = this.#history.get(documentId);
    if (!history?.redo.length) return null;
    const patch = history.redo.pop();
    const next = this.#apply(current, patch);
    if (next === null) return null;
    history.undo.push(this.#patch(next, current));
    return next;
  }
}

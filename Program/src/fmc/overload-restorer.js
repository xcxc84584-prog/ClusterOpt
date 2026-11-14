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

  record(documentId, before, after) {
    if (before === after) return;
    const history = this.#history.get(documentId) || {undo: [], redo: []};
    history.undo.push(before);
    if (history.undo.length > this.#limit) history.undo.shift();
    history.redo = [];
    this.#history.set(documentId, history);
  }

  undo(documentId, current) {
    const history = this.#history.get(documentId);
    if (!history?.undo.length) return null;
    history.redo.push(current);
    return history.undo.pop();
  }

  redo(documentId, current) {
    const history = this.#history.get(documentId);
    if (!history?.redo.length) return null;
    history.undo.push(current);
    return history.redo.pop();
  }
}

/** Operation-scoped progress; stale updates cannot overwrite newer work. */
export class StorageProgressTracker {
  #operations = new Map();
  #active = new Map();
  #listeners = new Set();
  #sequence = 0;

  start(documentId, operationType, totalUnits = null) {
    const operationId = 'OP-' + (++this.#sequence);
    const operation = {
      operationId, documentId, operationType, phase: 'START',
      state: 'RUNNING', completedUnits: 0, totalUnits, progressPercent: null
    };
    this.#operations.set(operationId, operation);
    this.#active.set(documentId, operationId);
    this.#notify(operation);
    return operationId;
  }

  update(operationId, completedUnits, phase = 'PROGRESS') {
    const operation = this.#operations.get(operationId);
    if (!operation || operation.state !== 'RUNNING') return false;
    operation.completedUnits = Math.max(0, completedUnits);
    operation.phase = phase;
    if (operation.totalUnits !== null && operation.totalUnits > 0) {
      operation.progressPercent = Math.min(100,
        Math.floor(operation.completedUnits / operation.totalUnits * 100));
    }
    this.#notify(operation);
    return true;
  }

  finish(operationId, state = 'SUCCESS') {
    const operation = this.#operations.get(operationId);
    if (!operation || operation.state !== 'RUNNING') return false;
    operation.state = state;
    operation.phase = state === 'SUCCESS' ? 'END' : 'EHU';
    if (state === 'SUCCESS') operation.progressPercent = 100;
    this.#notify(operation);
    return true;
  }

  get(documentId) {
    const operation = this.#operations.get(this.#active.get(documentId));
    return operation ? {...operation} : null;
  }

  subscribe(callback) {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  #notify(operation) {
    if (this.#active.get(operation.documentId) !== operation.operationId) return;
    for (const callback of this.#listeners) callback({...operation});
  }
}

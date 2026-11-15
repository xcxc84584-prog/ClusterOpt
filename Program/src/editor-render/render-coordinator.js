// v0.0.47 PR-02: frame-coalesced, generation-checked rendering.
// Scheduling is isolated from editor state and does not own document content.
export class RenderCoordinator {
  #scheduleFrame;
  #cancelFrame;
  #onError;
  #pending = null;
  #frame = null;
  #generation = 0;
  #disposed = false;
  constructor({scheduleFrame, cancelFrame, onError = () => {}} = {}) {
    this.#scheduleFrame = scheduleFrame ?? (cb => requestAnimationFrame(cb));
    this.#cancelFrame = cancelFrame ?? (id => cancelAnimationFrame(id));
    this.#onError = onError;
  }
  get status() {
    return Object.freeze({
      pending: this.#frame !== null,
      generation: this.#generation,
      disposed: this.#disposed
    });
  }
  schedule({source, revision, render}) {
    if (this.#disposed) return {ok:false,code:410,message:'Coordinator disposed'};
    if (typeof source !== 'string' || !Number.isSafeInteger(revision) ||
        revision < 0 || typeof render !== 'function') {
      return {ok:false,code:400,message:'Invalid render request'};
    }
    const generation = ++this.#generation;
    this.#pending = {source,revision,render,generation};
    if (this.#frame === null) {
      try {
        this.#frame = this.#scheduleFrame(() => this.#flush());
      } catch (error) {
        this.#pending = null;
        this.#onError(error);
        return {ok:false,code:500,message:'Frame scheduling failed'};
      }
    }
    return {ok:true,code:202,data:{generation,scheduled:true}};
  }
  #flush() {
    this.#frame = null;
    if (this.#disposed || !this.#pending) return;
    const task = this.#pending;
    this.#pending = null;
    const snapshot = Object.freeze({
      source:task.source, revision:task.revision, generation:task.generation,
      isCurrent:() => !this.#disposed && task.generation === this.#generation
    });
    try {
      const result = task.render(snapshot);
      if (result && typeof result.then === 'function')
        result.catch(error => this.#onError(error));
    } catch (error) {
      this.#onError(error);
    }
  }
  cancel() {
    ++this.#generation;
    this.#pending = null;
    if (this.#frame !== null) {
      this.#cancelFrame(this.#frame);
      this.#frame = null;
    }
    return {ok:true,code:200};
  }
  dispose() {
    this.cancel();
    this.#disposed = true;
    return {ok:true,code:200};
  }
}

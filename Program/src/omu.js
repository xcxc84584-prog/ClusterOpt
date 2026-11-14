/**
 * OMU event collector. Only START, ERROR, EHU and END survive a loop.
 * Normal events outside a loop remain unchanged.
 */
export class OMU {
  #events = [];
  #sequence = 0;
  #loopSequence = 0;
  #loops = new Map();
  #maxEvents;

  constructor(maxEvents = 500) {
    this.#maxEvents = maxEvents;
  }

  #append(event) {
    const record = Object.freeze({
      id: ++this.#sequence,
      time: new Date().toISOString(),
      ...event
    });
    this.#events.push(record);
    if (this.#events.length > this.#maxEvents) this.#events.shift();
    return record;
  }

  startLoop(source, action, parentLoopId = null) {
    const loopId = 'LOOP-' + (++this.#loopSequence);
    const startedAt = Date.now();
    this.#loops.set(loopId, {
      source,
      action,
      parentLoopId,
      startedAt,
      processed: 0,
      suppressed: 0,
      errors: 0
    });
    this.#append({
      source, action, code: 200, message: 'START',
      ehu: false, type: 'START', loopId, parentLoopId
    });
    return loopId;
  }

  emit(source, action, code, message = '', ehu = false, loopId = null) {
    const loop = loopId ? this.#loops.get(loopId) : null;
    const isError = ehu || code >= 400;
    if (loop) {
      loop.processed++;
      if (isError) loop.errors++;
      if (!isError) {
        loop.suppressed++;
        return null;
      }
    }

    return this.#append({
      source, action, code, message, ehu,
      type: ehu ? 'EHU' : isError ? 'ERROR' : 'LOG',
      loopId: loop ? loopId : null
    });
  }

  endLoop(loopId, result = 'END') {
    const loop = this.#loops.get(loopId);
    if (!loop) return false;
    this.#loops.delete(loopId);
    this.#append({
      source: loop.source,
      action: loop.action,
      code: result === 'END' ? 200 : 500,
      message: result,
      ehu: false,
      type: result,
      loopId,
      parentLoopId: loop.parentLoopId,
      processed: loop.processed,
      suppressed: loop.suppressed,
      errors: loop.errors,
      durationMs: Date.now() - loop.startedAt
    });
    return true;
  }

  logs() {
    return this.#events.map(event => ({...event}));
  }
}

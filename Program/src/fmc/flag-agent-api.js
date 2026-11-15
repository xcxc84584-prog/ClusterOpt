/**
 * AGENT API: bind agentId at the trusted integration boundary.
 * Do not expose an arbitrary agentId argument to untrusted remote callers.
 */
export class AgentFlagGateway {
  #session;
  #agentId;
  constructor(session, agentId) {
    if (!agentId || agentId === 'USER') throw new Error('Invalid AGENT');
    this.#session = session;
    this.#agentId = agentId;
  }
  get ownerId() { return this.#agentId; }
  read(index) { return this.#session.agentRead(index, this.#agentId); }
  write(index, content) { return this.#session.edit(index, content, this.#agentId); }
  patch(index, change) { return this.#session.editPatch(index, change, this.#agentId); }
  status(index) { return this.#session.getFlagStatus(index); }
  owned() { return this.#session.listOwnedFlags(this.#agentId); }
  /**
   * A bounded deferred read. Revocation/409 are retryable; aborts stop work.
   * Retries reacquire an ORF and revalidate the MVCC snapshot each time.
   */
  async readDeferred(index, {maxAttempts = 5, initialDelayMs = 100, signal} = {}) {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100)
      return {ok: false, code: 400};
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted)
        return {ok: false, code: 499, ehu: 'AGENT_TASK_CANCELLED'};
      const result = await this.read(index);
      if (result.ok || ![403, 409].includes(result.code)) return result;
      if (attempt === maxAttempts)
        return {ok: false, code: 409, deferred: true,
          ehu: 'FLAG_READ_DEFERRED', attempts: attempt};
      const delay = Math.min(2000, Math.max(0, initialDelayMs) * (2 ** (attempt - 1)));
      await new Promise(resolve => {
        const timer = setTimeout(resolve, delay);
        if (signal) signal.addEventListener('abort', () => {
          clearTimeout(timer); resolve();
        }, {once: true});
      });
    }
  }
}

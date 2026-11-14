/** Exclusive slice write leases with monotonically increasing fencing tokens. */
export class FlagUnit {
  #leases = new Map();
  #tokens = new Map();
  #sequence = 0;

  acquire(sliceId, ownerId, now = Date.now()) {
    if (!sliceId || !ownerId) return {ok: false, code: 400};
    const current = this.#leases.get(sliceId);
    if (current && current.expiresAt > now) return {ok: false, code: 409};
    const fencingToken = (this.#tokens.get(sliceId) || 0) + 1;
    this.#tokens.set(sliceId, fencingToken);
    const lease = {
      leaseId: 'WTF-' + (++this.#sequence),
      sliceId, ownerId, fencingToken, acquiredAt: now, expiresAt: now + 60000
    };
    this.#leases.set(sliceId, lease);
    return {ok: true, code: 200, data: {...lease}};
  }

  validate(sliceId, leaseId, token, now = Date.now()) {
    const lease = this.#leases.get(sliceId);
    return Boolean(lease && lease.leaseId === leaseId &&
      lease.fencingToken === token && lease.expiresAt > now);
  }

  renew(sliceId, leaseId, token, now = Date.now()) {
    if (!this.validate(sliceId, leaseId, token, now)) return {ok: false, code: 409};
    const lease = this.#leases.get(sliceId);
    if (now < lease.acquiredAt + 50000) return {ok: false, code: 425};
    lease.expiresAt = now + 120000;
    return {ok: true, code: 200, data: {...lease}};
  }

  release(sliceId, leaseId, token) {
    if (!this.validate(sliceId, leaseId, token)) return {ok: false, code: 409};
    this.#leases.delete(sliceId);
    return {ok: true, code: 200};
  }

  active(sliceId) {
    const lease = this.#leases.get(sliceId);
    return Boolean(lease && lease.expiresAt > Date.now());
  }
}

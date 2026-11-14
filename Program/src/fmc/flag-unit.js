/**
 * FlagUnit v0.0.11 — per-slice, synchronous lease arbiter.
 * Invariants: one WTF OR arbitrarily many ORFs; USER edits preempt AGENT.
 * This is an in-process arbiter, not a distributed lock.
 */
export class FlagUnit {
  #write = new Map();
  #reads = new Map();
  #epochs = new Map();
  #sequence = 0;
  #events = new Set();
  #clock;
  constructor({clock = () => Date.now(), onEvent = null} = {}) {
    this.#clock = clock;
    if (onEvent) this.#events.add(onEvent);
  }
  reportEHU(sliceId, ownerId, reason, code = 403) {
    this.#emit('EHU', sliceId, {ownerId, ownerType: 'AGENT', flagType: null}, code, reason);
  }
  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    this.#events.add(listener);
    return () => this.#events.delete(listener);
  }
  #emit(type, sliceId, lease, code = 200, reason = '') {
    const event = Object.freeze({
      type, sliceId, leaseId: lease?.leaseId ?? null,
      ownerId: lease?.ownerId ?? null, ownerType: lease?.ownerType ?? null,
      flagType: lease?.flagType ?? null, code, reason, time: this.#clock()
    });
    for (const listener of this.#events) {
      try { listener(event); } catch { /* logging cannot break authorization */ }
    }
  }
  #epoch(sliceId) { return this.#epochs.get(sliceId) || 0; }
  #bump(sliceId) {
    const next = this.#epoch(sliceId) + 1;
    this.#epochs.set(sliceId, next);
    return next;
  }
  #validInput(sliceId, ownerId) {
    return typeof sliceId === 'string' && sliceId.length > 0 &&
      typeof ownerId === 'string' && ownerId.length > 0;
  }
  #newLease(sliceId, ownerId, ownerType, flagType, now, token) {
    return {
      leaseId: (flagType === 'ORF' ? 'ORF-' : 'WTF-') + (++this.#sequence),
      sliceId, ownerId, ownerType, flagType, fencingToken: token,
      acquiredAt: now, expiresAt: now + 60000, renewals: 0
    };
  }
  #prune(sliceId, now = this.#clock()) {
    const write = this.#write.get(sliceId);
    if (write && write.expiresAt <= now) {
      this.#write.delete(sliceId);
      this.#bump(sliceId);
      this.#emit('FLAG_EXPIRED', sliceId, write, 410);
    }
    const reads = this.#reads.get(sliceId);
    if (reads) {
      for (const [id, lease] of reads) {
        if (lease.expiresAt <= now) {
          reads.delete(id);
          this.#emit('FLAG_EXPIRED', sliceId, lease, 410);
        }
      }
      if (!reads.size) this.#reads.delete(sliceId);
    }
  }
  #revokeAll(sliceId, reason) {
    const write = this.#write.get(sliceId);
    if (write) {
      this.#write.delete(sliceId);
      this.#emit('FLAG_REVOKED_BY_USER', sliceId, write, 403, reason);
    }
    const reads = this.#reads.get(sliceId);
    if (reads) {
      for (const lease of reads.values())
        this.#emit('ORF_REVOKED', sliceId, lease, 403, reason);
      this.#reads.delete(sliceId);
    }
    this.#bump(sliceId);
  }
  /** USER write takeover is unconditional for a valid slice; never awaits AGENT. */
  userTakeover(sliceId, ownerId = 'USER', now = this.#clock()) {
    if (!this.#validInput(sliceId, ownerId)) return {ok: false, code: 400};
    this.#prune(sliceId, now);
    this.#revokeAll(sliceId, 'USER_EDIT');
    const lease = this.#newLease(sliceId, ownerId, 'USER', 'WTF', now, this.#epoch(sliceId));
    this.#write.set(sliceId, lease);
    this.#emit('FLAG_ACQUIRED', sliceId, lease);
    return {ok: true, code: 200, data: {...lease}};
  }
  /** AGENT write is exclusive; ORFs are not forcibly revoked for AGENT. */
  acquire(sliceId, ownerId, now = this.#clock(), ownerType = 'AGENT') {
    if (!this.#validInput(sliceId, ownerId) || ownerType !== 'AGENT')
      return {ok: false, code: 400};
    this.#prune(sliceId, now);
    if (this.#write.has(sliceId) || this.#reads.has(sliceId))
      return {ok: false, code: 409, ehu: 'FLAG_CONCURRENT_CONFLICT', deferred: true};
    const lease = this.#newLease(sliceId, ownerId, 'AGENT', 'WTF', now, this.#bump(sliceId));
    this.#write.set(sliceId, lease);
    this.#emit('FLAG_ACQUIRED', sliceId, lease);
    return {ok: true, code: 200, data: {...lease}};
  }
  acquireRead(sliceId, ownerId, now = this.#clock()) {
    if (!this.#validInput(sliceId, ownerId)) return {ok: false, code: 400};
    this.#prune(sliceId, now);
    if (this.#write.has(sliceId))
      return {ok: false, code: 409, ehu: 'FLAG_READ_DEFERRED', deferred: true};
    const lease = this.#newLease(sliceId, ownerId, 'AGENT', 'ORF', now, this.#epoch(sliceId));
    if (!this.#reads.has(sliceId)) this.#reads.set(sliceId, new Map());
    this.#reads.get(sliceId).set(lease.leaseId, lease);
    this.#emit('FLAG_ACQUIRED', sliceId, lease);
    return {ok: true, code: 200, data: {...lease}};
  }
  #find(sliceId, leaseId, flagType) {
    return flagType === 'ORF' ? this.#reads.get(sliceId)?.get(leaseId) :
      this.#write.get(sliceId)?.leaseId === leaseId ? this.#write.get(sliceId) : null;
  }
  #check(sliceId, leaseId, token, ownerId, flagType, now = this.#clock()) {
    this.#prune(sliceId, now);
    const lease = this.#find(sliceId, leaseId, flagType);
    return Boolean(lease && lease.fencingToken === token &&
      lease.expiresAt > now && lease.fencingToken === this.#epoch(sliceId) &&
      (ownerId === undefined || lease.ownerId === ownerId));
  }
  validate(sliceId, leaseId, token, now = this.#clock(), ownerId = undefined) {
    return this.#check(sliceId, leaseId, token, ownerId, 'WTF', now);
  }
  validateRead(sliceId, leaseId, token, ownerId, now = this.#clock()) {
    return this.#check(sliceId, leaseId, token, ownerId, 'ORF', now);
  }
  #renew(sliceId, leaseId, token, ownerId, flagType, now) {
    if (!this.#check(sliceId, leaseId, token, ownerId, flagType, now))
      return {ok: false, code: 403, ehu: 'FLAG_PERMISSION_DENIED'};
    const lease = this.#find(sliceId, leaseId, flagType);
    if (lease.renewals >= 1) return {ok: false, code: 409, ehu: 'FLAG_RENEW_LIMIT'};
    if (now < lease.acquiredAt + 50000)
      return {ok: false, code: 425, ehu: 'FLAG_RENEW_TOO_EARLY'};
    lease.renewals++;
    lease.expiresAt = now + 120000;
    this.#emit('FLAG_RENEWED', sliceId, lease);
    return {ok: true, code: 200, data: {...lease}};
  }
  renew(sliceId, leaseId, token, now = this.#clock(), ownerId = undefined) {
    return this.#renew(sliceId, leaseId, token, ownerId, 'WTF', now);
  }
  renewRead(sliceId, leaseId, token, ownerId, now = this.#clock()) {
    return this.#renew(sliceId, leaseId, token, ownerId, 'ORF', now);
  }
  #release(sliceId, leaseId, token, ownerId, flagType) {
    if (!this.#check(sliceId, leaseId, token, ownerId, flagType))
      return {ok: false, code: 403, ehu: 'FLAG_PERMISSION_DENIED'};
    const lease = this.#find(sliceId, leaseId, flagType);
    if (flagType === 'WTF') {
      this.#write.delete(sliceId);
      this.#bump(sliceId);
    } else {
      const reads = this.#reads.get(sliceId);
      reads.delete(leaseId);
      if (!reads.size) this.#reads.delete(sliceId);
    }
    this.#emit('FLAG_RELEASED', sliceId, lease);
    return {ok: true, code: 200};
  }
  release(sliceId, leaseId, token, ownerId = undefined) {
    return this.#release(sliceId, leaseId, token, ownerId, 'WTF');
  }
  releaseRead(sliceId, leaseId, token, ownerId) {
    return this.#release(sliceId, leaseId, token, ownerId, 'ORF');
  }
  /** Administrative revoke requires a trusted authorization decision from FMC. */
  revoke(sliceId, reason = 'ADMIN') {
    this.#prune(sliceId);
    const had = this.#write.has(sliceId) || this.#reads.has(sliceId);
    if (!had) return {ok: false, code: 404};
    this.#revokeAll(sliceId, reason);
    return {ok: true, code: 200};
  }
  active(sliceId) {
    this.#prune(sliceId);
    return this.#write.has(sliceId) || this.#reads.has(sliceId);
  }
  status(sliceId) {
    this.#prune(sliceId);
    const write = this.#write.get(sliceId);
    const reads = this.#reads.get(sliceId);
    return {ok: true, code: 200, data: {
      sliceId, mode: write ? 'WRITE' : reads?.size ? 'READ_SHARED' : 'FREE',
      writeOwner: write?.ownerId ?? null, readCount: reads?.size ?? 0,
      epoch: this.#epoch(sliceId)
    }};
  }
  owned(ownerId) {
    const leases = [];
    for (const sliceId of new Set([...this.#write.keys(), ...this.#reads.keys()])) {
      this.#prune(sliceId);
      const write = this.#write.get(sliceId);
      if (write?.ownerId === ownerId) leases.push({...write});
      for (const lease of this.#reads.get(sliceId)?.values() || [])
        if (lease.ownerId === ownerId) leases.push({...lease});
    }
    return leases;
  }
}

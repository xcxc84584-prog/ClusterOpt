# ArcD — FlagUnit v0.0.11

```text
UI USER edit → VirtualFileSession → FMC.userWrite
                                  └→ FlagUnit.userTakeover
                                       ├→ revoke AGENT WTF
                                       ├→ revoke all ORFs
                                       ├→ bump fencing epoch
                                       └→ grant USER WTF
                           → MVCC.commit → release WTF → OLR dirty protection

AGENT read → AgentFlagGateway → FMC.acquireORF → MVCC read
                         → validate ORF & version again → release ORF

AGENT write → AgentFlagGateway → FMC.acquireWTF → MVCC.commit
                         → validate owner/token/version → release WTF
```

Invariants: `WTF_count <= 1`; `WTF_count > 0 => ORF_count === 0`; USER takeover does not erase dirty content; stale lease IDs/fencing tokens fail. All per-slice state transitions are synchronous, without `await`.

## Trust boundary
The gateway constructor binds `agentId` supplied by the host. **This is not remote authentication.** An MCP/HTTP bridge must authenticate the remote principal and must not expose raw FMC methods or arbitrary gateway construction. `administrativeRevoke` accepts a trusted boolean from the host and must never be exposed directly to remote clients.

## Limitations
In-memory locks do not coordinate multiple browser tabs, workers or devices. No distributed consensus, durable task queue, or remote authenticated AGENT transport is implemented. Deferred reads are bounded and operate only while the tab is alive. USER preemption does not undo already-committed MVCC revisions; a caller must resolve any subsequent base-version conflict.

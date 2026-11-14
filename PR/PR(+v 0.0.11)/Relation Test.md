# Relation Tests — v0.0.11
| Case | Expected | Automation |
|---|---|---|
| Multiple AGENT ORFs | Shared, no WTF | Node test |
| AGENT WTF while ORF active | 409 deferred | Node test |
| USER edit during AGENT WTF | Revoke, fresh token, old commit 403 EHU | Node test |
| USER edit during N ORFs | All revoked, no valid stale read | Node test |
| Wrong owner release | 403 | Node test |
| 50s renew / one renewal / expiry | Correct deadlines | Node test |
| FMC stale AGENT commit | 403 | Node test |
| Dirty USER edit and recovery | Retained | Node test |
| AGENT deferred backoff | Finite retries; cancellable | Manual integration pending |
| Multiple browser tabs / remote MCP | Not covered by in-memory locks | Out of scope |
| 250 MiB browser performance | No UI regression | Manual pending |

# PRDrequest — v0.0.49 PR-06 / 49.5

Goal: provide a version-checked micro-range patch API under existing physical-slice FLAG/MVCC authority. USER and AGENT must use trusted bound gateways. Preserve existing full-slice edit, save, recovery and browser redirect. Update OCDA object/property lists and VTE tests.

Acceptance: successful patch, stale version 409, invalid range 416, missing version 400, owner-gateway identity, release of leases, dirty/recovery/line-count integrity, CI PASS. No independent micro-slice lease claim.

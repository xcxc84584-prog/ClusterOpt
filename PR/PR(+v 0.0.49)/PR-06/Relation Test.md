# Relation Test — 49.5

Command: `npm test` (GitHub Actions). Planned checks: USER successful patch; AGENT successful patch; stale 409; invalid 400/416; leases FREE after commit/error; dirty/recovery and line offsets; isolated VTE unchanged; OCDA and version redirect tests.

GitHub Actions Run #171 initially **FAIL** (test incorrectly expected private recovery version metadata in public recoveryEdits); corrected the assertion. Run #173 **PASS** on commit 9e793ec5a6536ae36dc96aa2f8b4525b97c5e13e (Node unit, VTE isolation, OCDA/redirect regression). This documentation update requires a new head CI run before merge. Browser manual input, independent micro-slice leases, cross-slice atomic commits and multi-GB benchmarks: **NOT RUN**.

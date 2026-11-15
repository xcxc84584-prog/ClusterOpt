# PR-13 — R7 PowerShell layout and pairing diagnostics

- Root cause of blank buttons: translation targeted `[data-psm]` while action controls use `[data-psm-action]`. Explicitly fill check, permissions, revoke, tool and close controls.
- Replace r6 fixed grid areas with flex page layout and intrinsic-height responsive grid. Preserve scroll at reduced browser zoom and window size; no overlapping steps.
- Preserve Token on failed connection for correction/retry; only enter terminal after authenticated `/status` succeeds.
- Surface agent errors rather than collapsing all failures into a generic unavailable message.
- Advance cache-busted nested imports and CMD download to r7, keep v0.0.60 release and root redirect aligned.
- CI and browser/Windows runtime checks remain pending.

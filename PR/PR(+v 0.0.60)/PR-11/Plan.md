# PR-11 — Verified PowerShell pairing and readable UI (r5)

- Pairing now checks token syntax and then authenticates `/status` against the local agent before entering console mode. A syntactically valid but incorrect token never unlocks the console.
- Console mode shows only the agent-supported allowlisted read-only commands `version` and `location`, with their output and a clear button. No arbitrary PowerShell execution is claimed or enabled.
- Connection settings return to setup mode. Failed connection leaves setup visible. Revoke clears connection mode.
- Setup and console buttons receive explicit localized text, readable palette foreground and minimum dimensions. Hidden panels use `[hidden]` CSS rules.
- Release stays v0.0.60, cache tag and CMD filename advance to r5; root redirect and nested module imports updated.
- Tests added for authenticated transition, allowlisted commands and button visibility. CI and browser verification pending.

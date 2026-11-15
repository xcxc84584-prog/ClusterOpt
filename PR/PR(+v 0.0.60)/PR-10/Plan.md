# PR-10 — r4 cache and PowerShell setup visibility

## Root causes
1. `Program/index.html` cache-busted only `main.js`, while its static import `powershell-ui.js` and the nested `cmd-setup.js` import had no cache version. A cached older module could continue generating an r2 CMD.
2. `.psm-body` used `margin:auto` in a scrollable flex column; large content became vertically centered and top steps clipped, leaving a blank-looking bottom.
3. Tool/menu buttons inherited theme-dependent control foreground colors that could match their backgrounds.

## Fixes
- Version the static PowerShell UI import and nested setup/client imports with `opt060-psm-r4`.
- Change generated filename to `ClusterOpt-PLA-Setup-v0.0.60-r4.cmd`.
- Force wizard to start at the top, preserve full step cards and vertical scrolling; restore button labels using surface text colors.
- Update root redirect, Program asset query, historical release assertions and add targeted regression tests.
- Normalize stale `v` and `build` query parameters while preserving other query parameters.

CI and browser runtime verification pending.

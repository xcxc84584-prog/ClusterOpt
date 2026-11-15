# PR-08 — CMD cache, palette text and tool-menu lifecycle

- Regenerated setup script filename uses `-r2` to distinguish stale downloads. Agent and product remain v0.0.60.
- Root redirect and Program asset URLs use `opt060-psm-r2` to bust browser caches.
- PowerShell controls use fallback text and background tokens to prevent invisible labels when palette variables are absent.
- Tool menu is fixed to the viewport and clamped within visible bounds. Close on outside pointer, Escape, any scroll, resize, session switch and pane hide. Event listeners are removed on disposal.
- Historical release tests and new regression tests updated.
- CI and browser runtime confirmation still required.

# v0.0.47 PR-03 — Scroll Render Scheduling

## PRDrequest
Coalesce scroll-triggered visual synchronization (highlight overlay, gutter, tab guides) through RenderCoordinator. Preserve synchronous viewport position persistence, recovery scheduling and virtual slice navigation. Version remains v0.0.47 and root redirect remains ?v=0.0.47.

## ArcD
Editor.scroll -> RenderCoordinator.Request.Schedule('scroll', revision) -> rAF -> snapshot.isCurrent() -> HighlightRenderer.sync() -> syncGutterScroll() -> syncTabGuides(). No editor text writes. EHU failure via OMU emit RenderCoordinator/ScrollRender/500. All other scroll event actions remain outside scheduler and retain existing timing.

## Plan
Small integration, no syntax parser change. References: MDN requestAnimationFrame and HTML scroll event; no performance claims before real-browser benchmarks. Future PR will integrate viewport-only syntax processing and font metrics.

## Relation Test
CI: npm test, node --check main.js; status pending at submission.
VTE: Program/tests/scroll-render-vte.test.mjs; isolated createVTE instance, 50 scroll requests -> one callback; cancellation noninterference.
Browser: scroll/gutter/tab alignment, document recovery and virtual slice transitions NOT RUN.
Risk: scheduling visual synchronization on next animation frame may expose a transient frame of mismatch on slow devices. Rollback by reverting main.js integration commit.

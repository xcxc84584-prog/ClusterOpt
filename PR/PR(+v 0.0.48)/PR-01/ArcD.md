# ClusterOpt v0.0.48 — Consolidated Render Optimization

## PRDrequest
Deliver v0.0.48 with minimal PR cycles. Unify highlight overlay, async viewport syntax and text metrics around the existing pure ViewportCalculator and TextMetrics. Keep textarea as sole edit authority. Maintain recovery, MVCC, FlagUnit and virtual slice logic.

## ArcD
- HighlightRenderer -> TextMetrics.Measure() -> ViewportCalculator.Calculate() -> bounded visible DOM, overscan 2/12.
- UI.ScheduleHighlight -> TextMetrics.Measure() -> ViewportCalculator.Calculate() -> capped 100-line async region; stale generation/AbortController guards remain.
- RenderCoordinator retains rAF coalescing of overlay, gutter and tab guides from v0.0.47.
- OCDA dependency registry adds HighlightRenderer -> ViewportCalculator, HighlightRenderer -> TextMetrics, UI -> ViewportCalculator.
- No changes to editor text, storage, lock or version history.

## Release and redirect
Program title, visible badge, JS document.title, root meta refresh, JS redirect and main.js cache key: v0.0.48. CSS and highlight renderer cache keys also refreshed.

## VTE/Relation Test
CI-discovered Program/tests/v048-release.test.mjs verifies version and redirect, viewport geometry, declared object edges, and VTE isolation. Additional existing tests cover render coordinator and recovery. Browser pixel-alignment, actual 1 GiB+ editing latency and memory-pressure benchmarks remain NOT RUN; do not claim those as optimized.

## Limits / follow-up before v0.0.50
- This release does NOT introduce Piece Tree or micro-slice MVCC/FLAG UNIT.
- v0.0.49: bounded edit path, line indexing and micro-slice integration design/implementation.
- v0.0.50: performance benchmarks, persistence and concurrency regression gate, if remaining scope warrants.
- Do not enable viewport-only syntax mode globally without multiline lexical checkpoint correctness.

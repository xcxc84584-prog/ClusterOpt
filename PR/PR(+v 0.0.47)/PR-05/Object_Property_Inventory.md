# ClusterOpt v0.0.47 — Object & Property Inventory

Status: PR-05 proposal. Runtime registry updated only for already merged PR-01 through PR-03. PR-04 TextMetrics is **pending** and intentionally not yet registered here.

| Object | Module | Declared properties | Request / purpose |
| --- | --- | --- | --- |
| ViewportCalculator | editor-render/viewport-calculator.js | VIEWPORT_RANGE, OVERSCAN | Calculate() pure fixed-height range |
| RenderCoordinator | editor-render/render-coordinator.js | RENDER_GENERATION, RENDER_REVISION, RENDER_PENDING | Schedule(), Cancel(), Dispose(), Get_Status() |
| HighlightRenderer | text-highlighter/highlight-renderer.js | TEXT_HIGHLIGHTER | render(), sync(), clear() |
| DFOM | dfom.js | — | tab guide rendering |
| VTE | vte/vte.js | — | isolated virtual tests |
| TextMetrics (planned PR-04) | editor-render/text-metrics.js | FONT_METRICS, TEXT_PADDING, TAB_SIZE | Measure() read-only |

## Dependency changes
UI -> RenderCoordinator (REQUEST); RenderCoordinator -> HighlightRenderer (REQUEST); RenderCoordinator -> DFOM (REQUEST). Existing edges remain unchanged.

## Non-interference
RenderCoordinator has no persistence, FlagUnit or MVCC write edge. It schedules visual updates only. ViewportCalculator is pure and does not own DOM.

## DYDA
Edges are directional from caller to provider: 01 outgoing, 10 incoming, 11 bidirectional, 00 unrelated.

## Verification
CI npm test pending. Browser visual alignment not tested by registry change. PR-04 pending merge before TextMetrics registration.

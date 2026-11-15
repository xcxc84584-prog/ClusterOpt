# ClusterOpt v0.0.47 — Final Release Gate

## PRDrequest
Complete v0.0.47 object/property inventory, add VTE render pipeline non-interference tests, and verify version and root redirect before the next v0.0.48 development cycle.

## ArcD — final objects
| Object | Properties | Role |
| --- | --- | --- |
| ViewportCalculator | VIEWPORT_RANGE, OVERSCAN | Pure fixed-height viewport calculation |
| RenderCoordinator | RENDER_GENERATION, RENDER_REVISION, RENDER_PENDING | Coalesced rAF visual scheduling |
| TextMetrics | FONT_METRICS, TEXT_PADDING, TAB_SIZE | Read-only editor geometry |
| HighlightRenderer | TEXT_HIGHLIGHTER | Overlay rendering |
| DFOM | — | Tab guides |
| VTE | — | Isolated virtual testing |

Declared dependency UI -> TextMetrics (REQUEST). TextMetrics has no write edge to MVCC, FlagUnit or recovery. Other v0.0.47 edges retained.

## Plan
- Register TextMetrics in OCDA dependency registry.
- Update legacy catalog count to 34.
- Add CI-discovered VTE regression tests for geometry, viewport and stale frame cancellation.
- Preserve Program/index.html v0.0.47, main.js document title v0.0.47 and root redirect ?v=0.0.47.
- Next version v0.0.48 only after this release gate.

## Relation Test
Node tests and VTE regression: pending CI at PR creation. Browser visual pixel alignment: NOT RUN. No direct live editor rewrite in this PR. 

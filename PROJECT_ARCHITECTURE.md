# ClusterOpt — Repository Architecture (v0.0.50.2)

The repository root is the project root; no extra `Project/` directory is required.

```text
ClusterOpt/
├── .github/workflows/           # CI
├── Program/
│   ├── index.html               # Application entry
│   ├── src/
│   │   ├── main.js              # UI / editor coordinator
│   │   ├── fmc/                 # Physical slices, MVCC, FLAG, Piece Tree, micro-slices
│   │   ├── editor-render/       # Viewport, render scheduling, metrics
│   │   ├── text-highlighter/    # Syntax coloring and matching
│   │   ├── vte/                 # Isolated virtual test environment
│   │   ├── performance/         # Performance monitor
│   │   └── *.js                 # Documents, Explorer, OCDA, OMU, global properties
│   └── tests/                   # Node test runner + VTE/OCDA regressions
├── PR/                          # Versioned PR evidence, historical paths preserved
├── QuestionList1/               # Issues 1–100, three-state records
├── QuestionList2/               # Issues 101–200, three-state records
├── 物件清單.md                   # Canonical object inventory
├── 屬性清單.md                   # Canonical object property inventory
├── 全域屬性清單.md               # Shared global property inventory
├── OBJECT_LIST.md               # OCDA machine-readable-style Markdown object index
├── PROPERTY_LIST.md             # OCDA declared-property index
├── 程式編寫守則.md               # Mandatory PR and verification policy
├── package.json                 # CI test commands
└── index.html                   # GitHub Pages redirect to Program/?v=0.0.49
```

50.1 adds isolated Node newline benchmarks. 50.2 adds known beforeinput range and LF delta reconciliation with fallback; no browser latency claims.\n\n## Runtime ownership and edit pipeline

```text
UI (main.js)
  -> Documents / Explorer
  -> VirtualFileSession -> FileManagementCore -> FlagUnit / MVCCUnit
  -> EditPath (resident derived buffer)
       -> MicroSliceDocument -> PieceTree
                             -> MicroSliceIndex
  -> RenderCoordinator / ViewportCalculator / TextMetrics
  -> TextHighlighter / HighlightRenderer / DFOM
  -> OMU (events, EHU)
```

**Boundary:** `EditPath` is a derived cache for resident virtual slices. `VirtualFileSession.edit()` still owns actual full-slice commits. 49.5 adds an opt-in micro-range patch API guarded by the physical parent slice WTF and MVCC base version. Micro-slices still do not own independent leases or versions. The legacy full-slice edit API remains in place. Do not claim multi-GB editor latency is verified.

## Source-of-truth policy

- OCDA registry declarations: `Program/src/dependency-registry.js` (40 registered objects).
- Canonical human-readable inventory: `物件清單.md`, `屬性清單.md`, `全域屬性清單.md`.
- English index: `OBJECT_LIST.md`, `PROPERTY_LIST.md`; keep aligned with registry.
- New PRs require `PRDrequest.md`, `ArcD.md`, `Plan.md`, `Relation Test.md`, VTE event chain and explicit CI evidence.
- Do not rename historical PR paths: external links and QuestionList references may depend on them.
- Preserve OCDA Public/Protected/Private and Properties/Request/Response contracts; no `SendTo()` routing.

## Historical documentation audit

`PR/PR(+v 0.0.49)/PR-01` through `PR-04` each currently contain `ArcD.md` only. They predate this cleanup and are **not** retrospectively marked as compliant with the four-file requirement. Future work should backfill missing original evidence from CI and code history; do not fabricate research dates, VTE Event Chains, or results.

## Verification

GitHub Actions Node tests verify static contracts and isolated VTE tests; actual browser behavior, multi-GiB benchmarks, and full end-to-end MVCC/FLAG security acceptance require separate evidence.

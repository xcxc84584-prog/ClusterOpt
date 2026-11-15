# ClusterOpt — Repository Architecture (v0.0.51.4)

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

- OCDA registry declarations: `Program/src/dependency-registry.js` (48 registered objects).
- Canonical human-readable inventory: `物件清單.md`, `屬性清單.md`, `全域屬性清單.md`.
- English index: `OBJECT_LIST.md`, `PROPERTY_LIST.md`; keep aligned with registry.
- New PRs require `PRDrequest.md`, `ArcD.md`, `Plan.md`, `Relation Test.md`, VTE event chain and explicit CI evidence.
- Do not rename historical PR paths: external links and QuestionList references may depend on them.
- Preserve OCDA Public/Protected/Private and Properties/Request/Response contracts; no `SendTo()` routing.

## Historical documentation audit

`PR/PR(+v 0.0.49)/PR-01` through `PR-04` each currently contain `ArcD.md` only. They predate this cleanup and are **not** retrospectively marked as compliant with the four-file requirement. Future work should backfill missing original evidence from CI and code history; do not fabricate research dates, VTE Event Chains, or results.

## Verification

GitHub Actions Node tests verify static contracts and isolated VTE tests; actual browser behavior, multi-GiB benchmarks, and full end-to-end MVCC/FLAG security acceptance require separate evidence.

50.3: micro-slice index structural splice uses implicit treap; document boundary array still linear on edits.

50.4: gutter now renders visible line numbers only with spacer and scroll sync; DOM browser validation pending.

50.5: pure resident-slice visual-line map and wrapped viewport mapping. Browser textarea wrap remains OFF pending exact glyph measurement and highlight/gutter/DFOM alignment; no UI toggle.

51.1: isolated Node benchmark for line-index and token-range remap; excludes Shiki, DOM, browser latency.

51.2: known beforeinput patch updates highlight line starts and token ranges; unknown edits fall back. Current array tail-shift and DOM repaint remain linear.

51.3: bounded conservative lexical restart (C-family); NOT Shiki grammar-stack persistence. Unknown context uses existing matching-window fallback.

51.4: bounded revision-aware exact-source LRU for uncolored tokens; theme changes recolor without retokenizing cached entries. Grammar checkpoint remains conservative.

51.5: HighlightRenderer reuses its overlay root and existing visible line nodes; dirty lines repaint on known edit. Full slice render still rebuilds tokens; browser DOM timing pending.

51.6: latest-wins syntax task scheduler with AbortSignal, revision-checked commit and cancellation; does NOT move Shiki to a Web Worker, so tokenization may still block UI.

v0.0.52: File → Tool → 文本著色器可設定 Ctrl+(Shift)+A–Z/0–9；Ctrl+C/V/X/Z/Y 不觸發物理 Block 重載，普通文件 Ctrl+Z/Y 避免全量 refresh；未知編輯仍保留安全回退。

## v0.0.52 PR-02 — Shortcut input UI

- File → Tool → 文本著色器：快捷鍵改用 readonly 輸入框錄製，不再使用 select；Esc 取消、Tab 導覽、衝突提示與儲存／重設。僅 UI，原有 OCDA 48 物件、FLAG/MVCC/VTE 不變。真實瀏覽器／IME 待測。

## v0.0.52 PR-03 — Ctrl+Z/Y 著色恢復

- OLR Ctrl+Z/Y 與原生 historyUndo/historyRedo 在修改 resident text 後重建語法著色，不重新載入實體 Block。一般輸入保留 100 行局部著色。已加入 Node 回歸測試；大檔、IME、實機瀏覽器待驗收。

## v0.0.53 PR-01 — Incremental Highlight LF Index

- Reuse HighlightRenderer line index patched by known micro-edits for matchingWindow and lexical checkpoint; bound comment scan. Unknown edits still full-index fallback. Shiki remains main-thread; Worker and persistent grammar state deferred. No FLAG/MVCC change. Browser typing/IME/Undo/large-file performance requires user acceptance.

## v0.0.53 PR-02 — Paste Syntax Recovery & Token Splice

- Ctrl+V clipboard fallback restores EditIntent where beforeinput.data is null; ≤256KiB resident paste triggers full syntax refresh, larger uses bounded local region. Token updates use binary search splice instead of whole-array filter+sort. Remaining: >100-line large paste incomplete recolor, Shiki main-thread latency, browser/IME tests pending. MVCC/FLAG/VTE unaffected.

## v0.0.53 PR-03 — Large Highlight Freeze Guard

- Large resident text >64KiB routes to viewport-only Shiki (≤100 lines, ≤12KiB source); over-budget viewport plain fallback. Scroll re-tokenizes visible window with debounce and retains previous token overlay. Addresses reported >10s freezes without touching FLAG/MVCC/VTE. Still requires browser verification; synchronous grammar on bounded source may remain slow.

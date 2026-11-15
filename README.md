# ClusterOpt

Local-first browser IDE (GitHub Pages). Current release: **v0.0.50** (through stage 49.5).

- [Open application](https://xcxc84584-prog.github.io/ClusterOpt/)
- [Project architecture and repository tree](PROJECT_ARCHITECTURE.md)
- [Programming rules](程式編寫守則.md)
- [Object inventory](物件清單.md) · [Property inventory](屬性清單.md) · [Global properties](全域屬性清單.md)
- [OCDA object index](OBJECT_LIST.md) · [OCDA property index](PROPERTY_LIST.md)
- [QuestionList1](QuestionList1/) · [QuestionList2](QuestionList2/) · [PR history](PR/)

**Implementation status:** 49.1 Piece Tree, 49.2 micro-slices, 49.3 micro-slice index and 49.4 resident edit reconciliation are merged. 50.1 benchmarks and 50.2 incremental newline intent path; 49.5 parent-slice FLAG/MVCC-guarded micro-patch API is implemented; independent micro-slice leases are not. CI PASS does not imply browser or GB-file benchmarks.

50.3: micro-slice index structural splice uses implicit treap; document boundary array still linear on edits.

50.4: viewport-only gutter labels; keeps textarea authoritative and native scroll geometry.

50.5: soft-wrap visual-line map model and tests only. Browser wrap stays OFF to preserve highlighting, line numbers and caret geometry.

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

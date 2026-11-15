# ClusterOpt Object List — v0.0.51.4

Source of truth: `Program/src/dependency-registry.js` (createClusterDependencies). Registry entries: **42**. Runtime UI objects and implementation modules are not automatically additional OCDA registry objects.

| Object | Source module | Role |
|---|---|---|
| UI | `main.js` | Browser interaction and coordination |
| Documents | `documents.js` | Document metadata and tabs |
| FileManager | `file-manager.js` | File operations |
| GlobalPropertyRegistry | `global-properties.js` | Global property values |
| InterfacePalette | `interface-palette.js` | Theme color calculation |
| LanguageProperty | `language.js` | Localized strings |
| OMU | `omu.js` | Event and EHU log collector |
| SyncStatus | `sync-status.js` | Per-document synchronization state |
| FileManagementCore | `fmc/file-management-core.js` | Slice permissions and MVCC |
| FileTypeIdentifier | `fmc/file-type-identifier.js` | Text and binary detection |
| FlagUnit | `fmc/flag-unit.js` | Write and read leases |
| AgentFlagGateway | `fmc/flag-agent-api.js` | Agent-scoped read/write API |
| UserFlagGateway | `fmc/flag-user-api.js` | User-priority edit API |
| MVCCUnit | `fmc/mvcc-unit.js` | Slice version history |
| SliceLoader | `fmc/slice-loader.js` | On-demand slice loading |
| VirtualFileSession | `fmc/virtual-file-session.js` | Virtual document session |
| WindowLoader | `fmc/window-loader.js` | Viewport slice window |
| OverloadRestorer | `fmc/overload-restorer.js` | Local recovery persistence |
| StorageProgressTracker | `fmc/storage-progress-tracker.js` | Progress tracking |
| LineTree | `fmc/line-tree.js` | Line offset indexing |
| PieceTree | `fmc/piece-tree.js` | Balanced editable text buffer |
| MicroSliceDocument | `fmc/micro-slice-document.js` | Bounded logical child slices of a physical slice |
| MicroSliceIndex | `fmc/micro-slice-index.js` | implicit treap prefix offsets for micro-slices |
| VisualLineMap | `editor-render/visual-line-map.js` | Soft-wrap logical/visual model (not browser-active) |
| GutterWindow | `editor-render/gutter-window.js` | Bounded line number viewport |
| NewlineEditIntent | `fmc/newline-edit-intent.js` | Pure beforeinput range and LF delta |
| HighlightTaskScheduler | `text-highlighter/highlight-task-scheduler.js` | Abortable syntax task coordinator |
| RevisionTokenCache | `text-highlighter/revision-token-cache.js` | Exact-source revision LRU |
| LexicalCheckpoints | `text-highlighter/lexical-checkpoints.js` | Conservative lexical restart |
| HighlightLineIndex | `text-highlighter/incremental-line-index.js` | Known-range LF/token patch |
| HighlightBenchmark | `performance/highlight-benchmark.js` | Isolated line-index and token remap benchmark |
| LineBenchmark | `performance/line-benchmark.js` | Isolated newline latency baseline |
| EditPath | `fmc/edit-path.js` | Resident-slice incremental textarea reconciliation |
| ExternalChangeMonitor | `main.js` | External file change observation |
| FILE_MENU | `main.js` | File menu UI |
| Explorer | `explorer.js` | Workspace tree, context menu and file actions |
| VTE | `vte/vte.js` | Isolated virtual test environment |
| ViewportCalculator | `editor-render/viewport-calculator.js` | Fixed-height visible line range |
| RenderCoordinator | `editor-render/render-coordinator.js` | Coalesced visual frame scheduler |
| TextMetrics | `editor-render/text-metrics.js` | Read-only editor geometry snapshot |
| DFOM | `dfom.js` | Editor indentation and tab guide rendering |
| TextHighlighter | `text-highlighter/text-highlighter.js` | Syntax tokenization |
| HighlightRenderer | `text-highlighter/highlight-renderer.js` | Editor highlight overlay |
| MatchingWindow | `text-highlighter/matching-window.js` | Incremental highlight matching |
| TextContrast | `text-highlighter/text-contrast.js` | Syntax color contrast |
| StoragePriority | `storage-priority.js` | Storage priority configuration |
| ChineseTranscoder | `fmc/chinese-transcoder.js` | Text encoding conversion |

Updated for 50.1: isolated LineBenchmark added (P50/P95/P99); 49.5: 47 objects retained. VirtualFileSession now exposes version-checked micro-range patches under parent WTF/MVCC; bound AgentFlagGateway and UserFlagGateway expose patch(). No independent micro-slice leases. For directional relations, inspect `createClusterDependencies().edges()`.

> 50.3：MicroSliceIndex 改用 implicit treap；MicroSliceDocument 仍使用陣列管理邊界 ID，完整 list 與陣列 splice 仍可能 O(N)。

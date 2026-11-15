# ClusterOpt Property List — v0.0.57

Source of truth: `Program/src/dependency-registry.js`. Properties are shared names; the table lists objects declaring each property, not a persisted value store.

| Property | Declaring objects |
|---|---|
| `EXPLORER_ACTIVE_COLOR` | UI, GlobalPropertyRegistry, InterfacePalette, Explorer |
| `DOCUMENT_STATUS` | UI, Documents, GlobalPropertyRegistry, SyncStatus, ExternalChangeMonitor |
| `EDIT_REVISION` | PieceTree, MicroSliceDocument, EditPath |
| `FILE_TOOL_BLOCKED_TYPES` | UI, GlobalPropertyRegistry, Explorer, FileTool |
| `FILE_TOOL_THEME` | UI, GlobalPropertyRegistry, InterfacePalette, FileTool |
| `FILE_TYPE_IDENTIFIER` | UI, GlobalPropertyRegistry |
| `FONT_METRICS` | TextMetrics |
| `LANGUAGE` | UI, GlobalPropertyRegistry, LanguageProperty, FILE_MENU, Explorer |
| `EDIT_RANGE` | NewlineEditIntent |
| `LINE_EDIT_DELTA` | NewlineEditIntent |
| `LINE_BENCHMARK_P50` | LineBenchmark |
| `LINE_BENCHMARK_P95` | LineBenchmark |
| `LINE_BENCHMARK_P99` | LineBenchmark |
| `LINE_COUNT` | PieceTree, EditPath |
| `MICRO_PATCH_BASE_VERSION` | VirtualFileSession, AgentFlagGateway, UserFlagGateway |
| `MICRO_PATCH_RANGE` | VirtualFileSession, AgentFlagGateway, UserFlagGateway |
| `MICRO_SLICE_ID` | MicroSliceDocument |
| `MICRO_SLICE_LENGTHS` | MicroSliceIndex |
| `MICRO_SLICE_MAX_LENGTH` | MicroSliceDocument |
| `MICRO_SLICE_PREFIX` | MicroSliceIndex |
| `MICRO_SLICE_RANGE` | MicroSliceDocument, MicroSliceIndex |
| `OVERSCAN` | ViewportCalculator |
| `PARENT_SLICE_ID` | MicroSliceDocument, EditPath, VirtualFileSession |
| `RENDER_GENERATION` | RenderCoordinator |
| `RENDER_PENDING` | RenderCoordinator |
| `RENDER_REVISION` | RenderCoordinator |
| `STORAGE_PRIORITY` | UI, GlobalPropertyRegistry, StoragePriority |
| `STORAGE_PROGRESS` | GlobalPropertyRegistry, StorageProgressTracker |
| `TAB_SIZE` | TextMetrics |
| `TEXT_HIGHLIGHTER` | UI, GlobalPropertyRegistry, TextHighlighter, HighlightRenderer |
| `TEXT_LENGTH` | PieceTree, EditPath |
| `TEXT_PADDING` | TextMetrics |
| `UI_PALETTE` | UI, GlobalPropertyRegistry, InterfacePalette, TextContrast |
| `VIEWPORT_RANGE` | ViewportCalculator |

49.4 EditPath declares PARENT_SLICE_ID, EDIT_REVISION, TEXT_LENGTH and LINE_COUNT. MicroSliceDocument remains under physical-slice MVCC/FLAG authority.

| `MICRO_SLICE_SPLICE` | MicroSliceIndex — structural O(log N + inserted pieces) index splice |

| `GUTTER_VIEWPORT_RANGE` | GutterWindow |
| `GUTTER_OVERSCAN` | GutterWindow |

| `VISUAL_LINE_RANGE` | VisualLineMap |
| `WRAP_COLUMNS` | VisualLineMap |
| `WRAP_TAB_SIZE` | VisualLineMap |

| `HIGHLIGHT_INDEX_P95` | HighlightBenchmark |
| `HIGHLIGHT_REMAP_P95` | HighlightBenchmark |

| `HIGHLIGHT_EDIT_RANGE` | HighlightLineIndex |
| `HIGHLIGHT_LINE_DELTA` | HighlightLineIndex |

| `LEXICAL_RESTART_LINE` | LexicalCheckpoints |
| `LEXICAL_CONTEXT_LIMIT` | LexicalCheckpoints |

| `TOKEN_CACHE_REVISION` | RevisionTokenCache |
| `TOKEN_CACHE_BUDGET` | RevisionTokenCache |

| `HIGHLIGHT_DIRTY_RANGE` | HighlightRenderer |
| `HIGHLIGHT_DOM_REUSE` | HighlightRenderer |

| `HIGHLIGHT_TASK_GENERATION` | HighlightTaskScheduler |
| `HIGHLIGHT_TASK_ABORT` | HighlightTaskScheduler |

| `HIGHLIGHT_SHORTCUT_KEY` | TextHighlighterShortcut |
| `HIGHLIGHT_SHORTCUT_SHIFT` | TextHighlighterShortcut |

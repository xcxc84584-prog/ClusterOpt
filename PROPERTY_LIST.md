# ClusterOpt Property List — v0.0.49.5

Source of truth: `Program/src/dependency-registry.js`. Properties are shared names; the table lists objects declaring each property, not a persisted value store.

| Property | Declaring objects |
|---|---|
| `DOCUMENT_STATUS` | UI, Documents, GlobalPropertyRegistry, SyncStatus, ExternalChangeMonitor |
| `EDIT_REVISION` | PieceTree, MicroSliceDocument, EditPath |
| `FILE_TYPE_IDENTIFIER` | UI, GlobalPropertyRegistry |
| `FONT_METRICS` | TextMetrics |
| `LANGUAGE` | UI, GlobalPropertyRegistry, LanguageProperty, FILE_MENU, Explorer |
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

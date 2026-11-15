/**
 * OCDA dependency registry.
 *
 * Direction is from the caller/dependent object to the provider/dependency.
 * DYDA 01 = outgoing only, 10 = incoming only, 11 = both, 00 = unrelated.
 * Edges describe declared contracts, not a runtime call trace.
 */
export class DependencyRegistry {
  #objects = new Map();
  #edges = new Map();

  register(name, {module = '', role = '', properties = []} = {}) {
    if (typeof name !== 'string' || !name.trim() || this.#objects.has(name)) {
      return {ok: false, code: 409, message: 'Invalid or duplicate object'};
    }
    if (!Array.isArray(properties) || properties.some(p => typeof p !== 'string')) {
      return {ok: false, code: 400};
    }
    this.#objects.set(name, Object.freeze({
      name, module, role, properties: Object.freeze([...properties])
    }));
    return {ok: true, code: 201};
  }

  relate(from, to, type, description = '') {
    if (!this.#objects.has(from) || !this.#objects.has(to)) {
      return {ok: false, code: 404, message: 'Unknown object'};
    }
    if (from === to || !['IMPORT', 'REQUEST', 'RESPONSE', 'PROPERTY',
      'SUBSCRIBE', 'LOG', 'CONTAINS'].includes(type)) {
      return {ok: false, code: 400};
    }
    const key = JSON.stringify([from, to, type]);
    if (this.#edges.has(key)) return {ok: false, code: 409};
    this.#edges.set(key, Object.freeze({from, to, type, description}));
    return {ok: true, code: 201};
  }

  #direction(from, to) {
    const forward = [...this.#edges.values()].some(e => e.from === from && e.to === to);
    const reverse = [...this.#edges.values()].some(e => e.from === to && e.to === from);
    return forward ? (reverse ? '11' : '01') : (reverse ? '10' : '00');
  }

  dep(name = null) {
    if (name !== null && !this.#objects.has(name)) {
      return {ok: false, code: 404, message: 'Unknown object: ' + name};
    }
    const objects = name ? [this.#objects.get(name)] : [...this.#objects.values()];
    const edges = [...this.#edges.values()].filter(e =>
      name === null || e.from === name || e.to === name);
    return {
      ok: true,
      code: 200,
      data: {
        objects: objects.map(o => ({
          ...o, properties: [...o.properties]
        })),
        relations: edges.map(e => ({
          ...e, dyda: name === null
            ? this.#direction(e.from, e.to)
            : this.#direction(name, e.from === name ? e.to : e.from)
        })),
        totalObjects: this.#objects.size,
        totalRelations: this.#edges.size
      }
    };
  }

  list() { return this.dep().data.objects; }
  edges() { return this.dep().data.relations; }
}

/** Single source of truth for the current v0.0.50 static OCDA declarations. */
export function createClusterDependencies() {
  const registry = new DependencyRegistry();
  const objects = [
    ['UI', 'main.js', 'Browser interaction and coordination', ['LANGUAGE', 'UI_PALETTE', 'TEXT_HIGHLIGHTER', 'STORAGE_PRIORITY', 'DOCUMENT_STATUS', 'FILE_TYPE_IDENTIFIER']],
    ['Documents', 'documents.js', 'Document metadata and tabs', ['DOCUMENT_STATUS']],
    ['FileManager', 'file-manager.js', 'File operations', []],
    ['GlobalPropertyRegistry', 'global-properties.js', 'Global property values', ['LANGUAGE', 'UI_PALETTE', 'TEXT_HIGHLIGHTER', 'STORAGE_PRIORITY', 'DOCUMENT_STATUS', 'STORAGE_PROGRESS', 'FILE_TYPE_IDENTIFIER']],
    ['InterfacePalette', 'interface-palette.js', 'Theme color calculation', ['UI_PALETTE']],
    ['LanguageProperty', 'language.js', 'Localized strings', ['LANGUAGE']],
    ['OMU', 'omu.js', 'Event and EHU log collector', []],
    ['SyncStatus', 'sync-status.js', 'Per-document synchronization state', ['DOCUMENT_STATUS']],
    ['FileManagementCore', 'fmc/file-management-core.js', 'Slice permissions and MVCC', []],
    ['FileTypeIdentifier', 'fmc/file-type-identifier.js', 'Text and binary detection', []],
    ['FlagUnit', 'fmc/flag-unit.js', 'Write and read leases', []],
    ['AgentFlagGateway', 'fmc/flag-agent-api.js', 'Agent-scoped read/write API', ['MICRO_PATCH_BASE_VERSION','MICRO_PATCH_RANGE']],
    ['UserFlagGateway', 'fmc/flag-user-api.js', 'User-priority edit API', ['MICRO_PATCH_BASE_VERSION','MICRO_PATCH_RANGE']],
    ['MVCCUnit', 'fmc/mvcc-unit.js', 'Slice version history', []],
    ['SliceLoader', 'fmc/slice-loader.js', 'On-demand slice loading', []],
    ['VirtualFileSession', 'fmc/virtual-file-session.js', 'Virtual document session', ['MICRO_PATCH_BASE_VERSION','MICRO_PATCH_RANGE','PARENT_SLICE_ID']],
    ['WindowLoader', 'fmc/window-loader.js', 'Viewport slice window', []],
    ['OverloadRestorer', 'fmc/overload-restorer.js', 'Local recovery persistence', []],
    ['StorageProgressTracker', 'fmc/storage-progress-tracker.js', 'Progress tracking', ['STORAGE_PROGRESS']],
    ['LineTree', 'fmc/line-tree.js', 'Line offset indexing', []],
    ['PieceTree', 'fmc/piece-tree.js', 'Balanced editable text buffer', ['TEXT_LENGTH','LINE_COUNT','EDIT_REVISION']],
    ['MicroSliceDocument', 'fmc/micro-slice-document.js', 'Bounded logical child slices of a physical slice', ['PARENT_SLICE_ID','MICRO_SLICE_ID','MICRO_SLICE_RANGE','MICRO_SLICE_MAX_LENGTH','EDIT_REVISION']],
    ['MicroSliceIndex', 'fmc/micro-slice-index.js', 'Implicit treap prefix offsets and structural splice for micro-slices', ['MICRO_SLICE_LENGTHS','MICRO_SLICE_PREFIX','MICRO_SLICE_RANGE','MICRO_SLICE_SPLICE']],
    ['EditPath', 'fmc/edit-path.js', 'Resident-slice incremental textarea reconciliation', ['PARENT_SLICE_ID','EDIT_REVISION','TEXT_LENGTH','LINE_COUNT']],
    ['HighlightBenchmark', 'performance/highlight-benchmark.js', 'Isolated line-index and token-remap baseline', ['HIGHLIGHT_INDEX_P95','HIGHLIGHT_REMAP_P95']],
    ['LineBenchmark', 'performance/line-benchmark.js', 'Isolated newline latency baseline', ['LINE_BENCHMARK_P50','LINE_BENCHMARK_P95','LINE_BENCHMARK_P99']],
    ['NewlineEditIntent', 'fmc/newline-edit-intent.js', 'Pure UTF-16 beforeinput range and line delta', ['LINE_EDIT_DELTA','EDIT_RANGE']],
    ['ExternalChangeMonitor', 'main.js', 'External file change observation', ['DOCUMENT_STATUS']],
    ['FILE_MENU', 'main.js', 'File menu UI', ['LANGUAGE']],
    ['Explorer', 'explorer.js', 'Workspace tree, context menu and file actions', ['LANGUAGE']],
    ['VTE', 'vte/vte.js', 'Isolated virtual test environment', []],
    ['VisualLineMap', 'editor-render/visual-line-map.js', 'Resident-slice logical-to-visual soft-wrap model (not yet browser authoritative)', ['VISUAL_LINE_RANGE','WRAP_COLUMNS','WRAP_TAB_SIZE']],
    ['GutterWindow', 'editor-render/gutter-window.js', 'Bounded visible line-number window', ['GUTTER_VIEWPORT_RANGE','GUTTER_OVERSCAN']],
    ['ViewportCalculator', 'editor-render/viewport-calculator.js', 'Fixed-height visible line range', ['VIEWPORT_RANGE','OVERSCAN']],
    ['RenderCoordinator', 'editor-render/render-coordinator.js', 'Coalesced visual frame scheduler', ['RENDER_GENERATION','RENDER_REVISION','RENDER_PENDING']],
    ['TextMetrics', 'editor-render/text-metrics.js', 'Read-only editor geometry snapshot', ['FONT_METRICS','TEXT_PADDING','TAB_SIZE']],
    ['DFOM', 'dfom.js', 'Editor indentation and tab guide rendering', []],
    ['TextHighlighter', 'text-highlighter/text-highlighter.js', 'Syntax tokenization', ['TEXT_HIGHLIGHTER']],
    ['HighlightRenderer', 'text-highlighter/highlight-renderer.js', 'Editor highlight overlay', ['TEXT_HIGHLIGHTER']],
    ['MatchingWindow', 'text-highlighter/matching-window.js', 'Incremental highlight matching', []],
    ['TextContrast', 'text-highlighter/text-contrast.js', 'Syntax color contrast', ['UI_PALETTE']],
    ['StoragePriority', 'storage-priority.js', 'Storage priority configuration', ['STORAGE_PRIORITY']],
    ['ChineseTranscoder', 'fmc/chinese-transcoder.js', 'Text encoding conversion', []],
  ];
  for (const [name, module, role, properties] of objects) {
    registry.register(name, {module, role, properties});
  }

  const edges = [
    ['UI', 'Documents', 'REQUEST'], ['UI', 'FileManager', 'REQUEST'],
    ['UI', 'GlobalPropertyRegistry', 'REQUEST'],
    ['UI', 'VirtualFileSession', 'REQUEST'],
    ['UI', 'FileTypeIdentifier', 'REQUEST'],
    ['UI', 'OverloadRestorer', 'REQUEST'],
    ['UI', 'StorageProgressTracker', 'REQUEST'],
    ['UI', 'OMU', 'LOG'], ['Documents', 'OMU', 'LOG'],
    ['UI', 'Explorer', 'REQUEST'], ['UI', 'VTE', 'REQUEST'],
    ['UI', 'DFOM', 'REQUEST'],
    ['UI', 'RenderCoordinator', 'REQUEST'],
    ['UI', 'TextMetrics', 'REQUEST'],
    ['RenderCoordinator', 'HighlightRenderer', 'REQUEST'],
    ['RenderCoordinator', 'DFOM', 'REQUEST'], ['UI', 'TextHighlighter', 'REQUEST'],
    ['UI', 'HighlightRenderer', 'REQUEST'], ['UI', 'MatchingWindow', 'REQUEST'],
    ['UI', 'StoragePriority', 'REQUEST'], ['UI', 'ChineseTranscoder', 'REQUEST'],
    ['Explorer', 'OMU', 'LOG'], ['Explorer', 'LanguageProperty', 'REQUEST'],
    ['HighlightRenderer', 'TextHighlighter', 'REQUEST'],
    ['HighlightRenderer', 'ViewportCalculator', 'REQUEST'],
    ['HighlightRenderer', 'TextMetrics', 'REQUEST'],
    ['UI', 'ViewportCalculator', 'REQUEST'],
    ['UI', 'GutterWindow', 'REQUEST'],
    ['VisualLineMap', 'ViewportCalculator', 'REQUEST'],
    ['TextHighlighter', 'TextContrast', 'REQUEST'],
    ['FileManager', 'OMU', 'LOG'], ['FILE_MENU', 'LanguageProperty', 'REQUEST'],
    ['LanguageProperty', 'UI', 'SUBSCRIBE'],
    ['InterfacePalette', 'UI', 'SUBSCRIBE'],
    ['GlobalPropertyRegistry', 'LanguageProperty', 'PROPERTY'],
    ['GlobalPropertyRegistry', 'InterfacePalette', 'PROPERTY'],
    ['GlobalPropertyRegistry', 'SyncStatus', 'PROPERTY'],
    ['GlobalPropertyRegistry', 'StorageProgressTracker', 'PROPERTY'],
    ['GlobalPropertyRegistry', 'TextHighlighter', 'PROPERTY'],
    ['GlobalPropertyRegistry', 'StoragePriority', 'PROPERTY'],
    ['GlobalPropertyRegistry', 'FileTypeIdentifier', 'PROPERTY'],
    ['ExternalChangeMonitor', 'Documents', 'REQUEST'],
    ['ExternalChangeMonitor', 'SyncStatus', 'REQUEST'],
    ['MicroSliceDocument', 'PieceTree', 'IMPORT'],
    ['MicroSliceDocument', 'MicroSliceIndex', 'IMPORT'],
    ['EditPath', 'MicroSliceDocument', 'IMPORT'],
    ['UI', 'EditPath', 'REQUEST'],
    ['UI', 'NewlineEditIntent', 'REQUEST'],
    ['HighlightBenchmark', 'HighlightRenderer', 'REQUEST'],
    ['LineBenchmark', 'EditPath', 'REQUEST'],
    ['LineBenchmark', 'PieceTree', 'REQUEST'],
    ['FileManagementCore', 'FlagUnit', 'IMPORT'],
    ['FileManagementCore', 'MVCCUnit', 'IMPORT'],
    ['SliceLoader', 'FileManagementCore', 'REQUEST'],
    ['WindowLoader', 'SliceLoader', 'REQUEST'],
    ['WindowLoader', 'FileManagementCore', 'REQUEST'],
    ['VirtualFileSession', 'FileManagementCore', 'REQUEST'],
    ['VirtualFileSession', 'SliceLoader', 'REQUEST'],
    ['VirtualFileSession', 'LineTree', 'REQUEST'],
    ['VirtualFileSession', 'MicroSliceDocument', 'REQUEST'],
    ['VirtualFileSession', 'AgentFlagGateway', 'REQUEST'],
    ['VirtualFileSession', 'UserFlagGateway', 'REQUEST'],
    ['AgentFlagGateway', 'VirtualFileSession', 'REQUEST'],
    ['UserFlagGateway', 'VirtualFileSession', 'REQUEST'],
  ];
  for (const [from, to, type] of edges) {
    const result = registry.relate(from, to, type);
    if (!result.ok) throw new Error('Invalid dependency: ' + from + ' → ' + to);
  }
  return registry;
}

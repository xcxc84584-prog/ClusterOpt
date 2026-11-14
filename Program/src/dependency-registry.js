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
          ...e, dyda: this.#direction(e.from, e.to)
        })),
        totalObjects: this.#objects.size,
        totalRelations: this.#edges.size
      }
    };
  }

  list() { return this.dep().data.objects; }
  edges() { return this.dep().data.relations; }
}

/** Single source of truth for the current v0.0.12 static OCDA declarations. */
export function createClusterDependencies() {
  const registry = new DependencyRegistry();
  const objects = [
    ['UI', 'main.js', 'Browser interaction and coordination', ['LANGUAGE', 'UI_PALETTE']],
    ['Documents', 'documents.js', 'Document metadata and tabs', ['DOCUMENT_STATUS']],
    ['FileManager', 'file-manager.js', 'File operations', []],
    ['GlobalPropertyRegistry', 'global-properties.js', 'Global property values', []],
    ['InterfacePalette', 'interface-palette.js', 'Theme color calculation', ['UI_PALETTE']],
    ['LanguageProperty', 'language.js', 'Localized strings', ['LANGUAGE']],
    ['OMU', 'omu.js', 'Event and EHU log collector', []],
    ['SyncStatus', 'sync-status.js', 'Per-document synchronization state', ['DOCUMENT_STATUS']],
    ['FileManagementCore', 'fmc/file-management-core.js', 'Slice permissions and MVCC', []],
    ['FileTypeIdentifier', 'fmc/file-type-identifier.js', 'Text and binary detection', []],
    ['FlagUnit', 'fmc/flag-unit.js', 'Write and read leases', []],
    ['AgentFlagGateway', 'fmc/flag-agent-api.js', 'Agent-scoped read/write API', []],
    ['UserFlagGateway', 'fmc/flag-user-api.js', 'User-priority edit API', []],
    ['MVCCUnit', 'fmc/mvcc-unit.js', 'Slice version history', []],
    ['SliceLoader', 'fmc/slice-loader.js', 'On-demand slice loading', []],
    ['VirtualFileSession', 'fmc/virtual-file-session.js', 'Virtual document session', []],
    ['WindowLoader', 'fmc/window-loader.js', 'Viewport slice window', []],
    ['OverloadRestorer', 'fmc/overload-restorer.js', 'Local recovery persistence', []],
    ['StorageProgressTracker', 'fmc/storage-progress-tracker.js', 'Progress tracking', ['STORAGE_PROGRESS']],
    ['LineTree', 'fmc/line-tree.js', 'Line offset indexing', []],
    ['ExternalChangeMonitor', 'main.js', 'External file change observation', ['DOCUMENT_STATUS']],
    ['FILE_MENU', 'main.js', 'File menu UI', ['LANGUAGE']],
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
    ['FileManager', 'OMU', 'LOG'], ['FILE_MENU', 'LanguageProperty', 'REQUEST'],
    ['LanguageProperty', 'UI', 'SUBSCRIBE'],
    ['InterfacePalette', 'UI', 'SUBSCRIBE'],
    ['GlobalPropertyRegistry', 'LanguageProperty', 'PROPERTY'],
    ['GlobalPropertyRegistry', 'InterfacePalette', 'PROPERTY'],
    ['GlobalPropertyRegistry', 'SyncStatus', 'PROPERTY'],
    ['GlobalPropertyRegistry', 'StorageProgressTracker', 'PROPERTY'],
    ['ExternalChangeMonitor', 'Documents', 'REQUEST'],
    ['ExternalChangeMonitor', 'SyncStatus', 'REQUEST'],
    ['FileManagementCore', 'FlagUnit', 'IMPORT'],
    ['FileManagementCore', 'MVCCUnit', 'IMPORT'],
    ['SliceLoader', 'FileManagementCore', 'REQUEST'],
    ['WindowLoader', 'SliceLoader', 'REQUEST'],
    ['WindowLoader', 'FileManagementCore', 'REQUEST'],
    ['VirtualFileSession', 'FileManagementCore', 'REQUEST'],
    ['VirtualFileSession', 'SliceLoader', 'REQUEST'],
    ['VirtualFileSession', 'LineTree', 'REQUEST'],
    ['VirtualFileSession', 'AgentFlagGateway', 'REQUEST'],
    ['VirtualFileSession', 'UserFlagGateway', 'REQUEST'],
    ['AgentFlagGateway', 'VirtualFileSession', 'REQUEST'],
    ['UserFlagGateway', 'VirtualFileSession', 'REQUEST'],
    ['VirtualFileSession', 'OverloadRestorer', 'REQUEST'],
  ];
  for (const [from, to, type] of edges) {
    const result = registry.relate(from, to, type);
    if (!result.ok) throw new Error('Invalid dependency: ' + from + ' → ' + to);
  }
  return registry;
}

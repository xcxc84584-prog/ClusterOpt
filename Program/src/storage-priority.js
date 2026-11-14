/**
 * Persist the storage precedence policy independently of document snapshots.
 * A blocked/private browser falls back to the in-memory default.
 */
export const STORAGE_PRIORITY_KEY = 'clusteropt.storage-priority.v1';
export const DEFAULT_STORAGE_PRIORITY = 'internal';

export function normalizeStoragePriority(value) {
  return value === 'external' || value === 'internal'
    ? value : DEFAULT_STORAGE_PRIORITY;
}

export function readStoragePriority(storage = null) {
  try {
    const target = storage || globalThis.localStorage;
    return normalizeStoragePriority(target.getItem(STORAGE_PRIORITY_KEY));
  } catch {
    return DEFAULT_STORAGE_PRIORITY;
  }
}

export function writeStoragePriority(value, storage = null) {
  if (value !== 'internal' && value !== 'external') {
    return {ok: false, code: 400};
  }
  try {
    const target = storage || globalThis.localStorage;
    target.setItem(STORAGE_PRIORITY_KEY, value);
    return {ok: true, code: 200};
  } catch {
    return {ok: false, code: 503, message: 'Storage is unavailable'};
  }
}

export function fileSignature(file) {
  return [file.size, file.lastModified].join(':');
}

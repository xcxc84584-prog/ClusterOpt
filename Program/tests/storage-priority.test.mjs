import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_PRIORITY_KEY,
  readStoragePriority,
  writeStoragePriority,
  fileSignature
} from '../src/storage-priority.js';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value)
  };
}

test('storage priority survives a simulated page reload', () => {
  const storage = fakeStorage();
  assert.equal(readStoragePriority(storage), 'internal');
  assert.equal(writeStoragePriority('external', storage).ok, true);
  assert.equal(storage.getItem(STORAGE_PRIORITY_KEY), 'external');
  assert.equal(readStoragePriority(storage), 'external');
  assert.equal(writeStoragePriority('internal', storage).ok, true);
  assert.equal(readStoragePriority(storage), 'internal');
});

test('invalid priority cannot overwrite the saved policy', () => {
  const storage = fakeStorage();
  writeStoragePriority('external', storage);
  assert.equal(writeStoragePriority('unsafe', storage).code, 400);
  assert.equal(readStoragePriority(storage), 'external');
  storage.setItem(STORAGE_PRIORITY_KEY, 'invalid');
  assert.equal(readStoragePriority(storage), 'internal');
});

test('blocked storage degrades safely', () => {
  const blocked = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); }
  };
  assert.equal(readStoragePriority(blocked), 'internal');
  assert.equal(writeStoragePriority('external', blocked).code, 503);
});

test('file metadata signature detects external size or mtime changes', () => {
  assert.equal(fileSignature({size: 12, lastModified: 1}), '12:1');
  assert.notEqual(
    fileSignature({size: 12, lastModified: 1}),
    fileSignature({size: 13, lastModified: 1})
  );
  assert.notEqual(
    fileSignature({size: 12, lastModified: 1}),
    fileSignature({size: 12, lastModified: 2})
  );
});

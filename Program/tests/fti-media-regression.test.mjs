import test from 'node:test';
import assert from 'node:assert/strict';
import {FileTypeIdentifier} from '../src/fmc/file-type-identifier.js';

const fti = new FileTypeIdentifier();
test('MP4 ftyp signature is binary media, not text', async () => {
  const header = new Uint8Array([0,0,0,24,0x66,0x74,0x79,0x70,0x69,0x73,0x6f,0x6d,0,0,0,0]);
  const result = await fti.identify(new Blob([header]), 'sample.mp4');
  assert.equal(result.kind, 'MEDIA');
  assert.equal(result.mode, 'BINARY');
});
test('MP4 extension prevents malformed media entering text decoder', async () => {
  const result = await fti.identify(new Blob(['plain looking header']), 'movie.mp4');
  assert.equal(result.mode, 'BINARY');
});
test('ordinary UTF-8 remains text', async () => {
  const result = await fti.identify(new Blob(['hello world']), 'readme.txt');
  assert.equal(result.mode, 'TEXT');
});

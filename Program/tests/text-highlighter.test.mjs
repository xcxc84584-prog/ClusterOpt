import test from 'node:test';
import assert from 'node:assert/strict';
import {detectLanguage,categoryFor,TextPalette,TextHighlighter}
  from '../src/text-highlighter/text-highlighter.js';
test('language registry supports multiple families',()=>{
  assert.equal(detectLanguage('x.cpp'),'cpp');
  assert.equal(detectLanguage('x.tsx'),'tsx');
  assert.equal(detectLanguage('Dockerfile'),'dockerfile');
  assert.equal(detectLanguage('x.unknown'),'text');
});
test('token scopes map to semantic categories',()=>{
  assert.equal(categoryFor(['source.cpp','comment.block.cpp']),'comment');
  assert.equal(categoryFor(['keyword.control.js']),'keyword');
});
test('private palette does not mutate source background',()=>{
  const p=new TextPalette(),background=[0,0,0];
  assert.equal(p.setColor('keyword','#abcdef'),true);
  assert.equal(p.setColor('keyword','javascript:evil'),false);
  assert.match(p.resolve(background).keyword,/^#[a-f0-9]{6}$/);
  assert.deepEqual(background,[0,0,0]);
});
test('plaintext returns a scheme without network access',async()=>{
  const h=new TextHighlighter();
  const result=await h.highlightSlice({documentId:'d',targetSliceId:'20',
    targetSlice:'text',language:'text'});
  assert.equal(result.status,'FALLBACK');
  assert.equal(result.targetSliceId,'20');
});

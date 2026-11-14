import test from 'node:test';
import assert from 'node:assert/strict';
import {TextHighlighter} from '../src/text-highlighter/text-highlighter.js';
import {HighlightRenderer} from '../src/text-highlighter/highlight-renderer.js';
test('local line API is independent of whole slice',()=>{
 assert.equal(typeof TextHighlighter.prototype.highlightLine,'function');
 assert.equal(typeof HighlightRenderer.prototype.renderLine,'function');
});
test('plaintext line bypass requires no Shiki or network',async()=>{
 const h=new TextHighlighter();
 const result=await h.highlightLine({documentId:'d',targetSliceId:'0',line:'中文 abc',language:'text'});
 assert.equal(result.status,'FALLBACK');
 assert.deepEqual(result.ranges,[]);
});

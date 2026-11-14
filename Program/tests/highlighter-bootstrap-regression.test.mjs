import test from 'node:test';
import assert from 'node:assert/strict';
import {HighlightRenderer} from '../src/text-highlighter/highlight-renderer.js';
import {matchingWindow} from '../src/text-highlighter/matching-window.js';
test('renderer exposes bootstrap for editing before first full highlight',()=>{
 assert.equal(typeof HighlightRenderer.prototype.bootstrap,'function');
 assert.equal(typeof HighlightRenderer.prototype.renderRegion,'function');
});
test('single line and matching region can both be selected',()=>{
 const text='void f() {\n  foo(\n    x\n  );\n}';
 const matched=matchingWindow(text,text.indexOf('x'));
 assert.deepEqual([matched.startLine,matched.endLine],[1,3]);
 const single=matchingWindow('a\nb\nc',2);
 assert.deepEqual([single.startLine,single.endLine],[1,1]);
});

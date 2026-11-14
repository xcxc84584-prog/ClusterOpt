import test from 'node:test';
import assert from 'node:assert/strict';
import {dfomEdit, DFOM_PAIRS} from '../src/dfom.js';

test('Tab inserts one literal tab and Backspace deletes it atomically', () => {
  assert.deepEqual(dfomEdit('ab', 1, 1, 'Tab'),
    {start:1,end:1,text:'\t',caret:2});
  assert.deepEqual(dfomEdit('a\tb', 2, 2, 'Backspace'),
    {start:1,end:2,text:'',caret:1});
});
test('brackets and quotes are paired', () => {
  for (const [open, close] of Object.entries(DFOM_PAIRS)) {
    const edit=dfomEdit('',0,0,open);
    assert.equal(edit.text,open+close);
    assert.equal(edit.caret,1);
  }
});
test('selected text is surrounded, and closing character is overtyped', () => {
  assert.deepEqual(dfomEdit('word',0,4,'('),
    {start:0,end:4,text:'(word)',selectStart:1,selectEnd:5});
  assert.deepEqual(dfomEdit('()',1,1,')'),
    {start:1,end:2,text:')',caret:2});
});
test('existing code is not paired inside identifiers', () => {
  assert.equal(dfomEdit('word',0,0,'('),null);
  assert.equal(dfomEdit('x',0,0,'(',{composing:true}),null);
});

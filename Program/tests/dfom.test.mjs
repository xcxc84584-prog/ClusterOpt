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

test('angle brackets, Chinese typography and skip closing', () => {
  for (const [open, close] of [['<','>'],['《','》'],['〈','〉'],['【','】'],['＜','＞']]) {
    assert.equal(dfomEdit('',0,0,open).text,open+close);
    assert.equal(dfomEdit('word',0,4,open).text,open+'word'+close);
    assert.equal(dfomEdit(open+close,1,1,close).caret,2);
  }
});

test('angle bracket pairs before identifier and whitespace', () => {
  assert.deepEqual(dfomEdit('vector',0,0,'<'),
    {start:0,end:0,text:'<>',caret:1});
  assert.equal(dfomEdit('vector<>',7,7,'>').caret,8);
});
test('space and Enter expand an empty brace pair into indented block', () => {
  for (const key of [' ', 'Enter']) {
    const edit=dfomEdit('if (x) {}',8,8,key);
    assert.equal(edit.text,'\n\t\n');
    assert.equal(edit.caret,10);
    const nested=dfomEdit('\t{}',2,2,key);
    assert.equal(nested.text,'\n\t\t\n\t');
    assert.equal(nested.caret,5);
  }
});
test('Enter keeps indentation and indents after opening brackets', () => {
  assert.equal(dfomEdit('\tcall(',6,6,'Enter').text,'\n\t\t');
  assert.equal(dfomEdit('\tfoo',4,4,'Enter').text,'\n\t');
});
test('Shift Tab unindents a line and Backspace removes indentation stop', () => {
  assert.deepEqual(dfomEdit('\tfoo',1,1,'Tab',{shift:true}),
    {start:0,end:1,text:'',caret:0});
  assert.deepEqual(dfomEdit('    foo',4,4,'Backspace'),
    {start:0,end:4,text:'',caret:0});
});

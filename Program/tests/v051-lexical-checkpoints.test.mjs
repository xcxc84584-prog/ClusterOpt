import test from 'node:test';
import assert from 'node:assert/strict';
import {findLexicalRestart} from '../src/text-highlighter/lexical-checkpoints.js';
import {createVTE} from '../src/vte/vte.js';
test('51.3: restart before block comment and after neutral line',()=>{
 const text='let x=1;\n/* comment\n still comment */\nlet y=2;\n';
 const p=findLexicalRestart(text,text.indexOf('still'),'javascript');
 assert.equal(p.restartLine,1);
 const q=findLexicalRestart(text,text.indexOf('let y'),'javascript');
 assert.equal(q.restartLine,3);
});
test('51.3: unknown language, template, long prefix fail closed',()=>{
 assert.equal(findLexicalRestart('abc',1,'python'),null);
 assert.equal(findLexicalRestart('const a=\x60hi\x60;\nnext',17,'javascript'),null);
 assert.equal(findLexicalRestart('a\n'.repeat(105),210,'javascript'),null);
 assert.throws(()=>findLexicalRestart('abc',-1,'cpp'),RangeError);
});
test('51.3: read-only checkpoints do not affect VTE files',()=>{
 const vte=createVTE();
 findLexicalRestart('/* x */\nint main() {}',12,'cpp');
 assert.equal(vte.Status().data.files.length,0);
});

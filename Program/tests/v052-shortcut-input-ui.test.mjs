import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeHighlightShortcut,DEFAULT_HIGHLIGHT_SHORTCUT} from '../src/text-highlighter/highlight-shortcut.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('52 UI: keyboard recorder input replaces dropdown',()=>{
 const page=read('../index.html'),main=read('../src/main.js');
 assert.match(page,/<input id="highlighterShortcutInput"/);
 assert.doesNotMatch(page,/<select id="highlighterShortcutKey"/);
 assert.match(main,/shortcutInput\.addEventListener\('keydown'/);
 assert.match(main,/event\.key==='Escape'/);
 assert.match(main,/if\(event\.key==='Tab'\)return/);
 assert.match(main,/event\.isComposing/);
 assert.match(main,/persistHighlightShortcut\(localStorage,shortcutDraft\)/);
 assert.match(page,/main\.js\?v=opt052-pr03/);
});
test('52 UI: Ctrl required, Shift optional, reserved combinations rejected',()=>{
 assert.deepEqual(DEFAULT_HIGHLIGHT_SHORTCUT,{shift:true,key:'H'});
 assert.deepEqual(normalizeHighlightShortcut({shift:false,key:'8'}),{shift:false,key:'8'});
 assert.equal(normalizeHighlightShortcut({shift:false,key:'V'}),null);
 assert.equal(normalizeHighlightShortcut({shift:true,key:'V'}),null);
});

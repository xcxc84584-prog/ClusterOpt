import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_HIGHLIGHT_SHORTCUT,normalizeHighlightShortcut,matchesHighlightShortcut,
 shouldHandleEditorShortcut,restoreHighlightShortcut,persistHighlightShortcut}
 from '../src/text-highlighter/highlight-shortcut.js';
import {createVTE} from '../src/vte/vte.js';
test('52: default shortcut and allowed Ctrl+optional Shift+alphanumeric',()=>{
 assert.deepEqual(DEFAULT_HIGHLIGHT_SHORTCUT,{shift:true,key:'H'});
 assert.deepEqual(normalizeHighlightShortcut({shift:false,key:'8'}),{shift:false,key:'8'});
 assert.deepEqual(normalizeHighlightShortcut({shift:true,key:'b'}),{shift:true,key:'B'});
 assert.equal(normalizeHighlightShortcut({shift:false,key:'C'}),null);
 assert.equal(normalizeHighlightShortcut({shift:false,key:'Z'}),null);
 assert.equal(normalizeHighlightShortcut({shift:true,key:'F1'}),null);
});
test('52: editor focus and modifiers guard copy/paste/undo',()=>{
 const editor={},other={},dialog={open:false};
 assert.equal(shouldHandleEditorShortcut({target:editor},editor,dialog),true);
 assert.equal(shouldHandleEditorShortcut({target:other},editor,dialog),false);
 assert.equal(shouldHandleEditorShortcut({target:editor},editor,{open:true}),false);
 const event=(key,shiftKey=false)=>({key,ctrlKey:true,shiftKey,altKey:false});
 assert.equal(matchesHighlightShortcut(event('h',true),DEFAULT_HIGHLIGHT_SHORTCUT),true);
 for(const key of ['c','v','z','x','y'])assert.equal(
   matchesHighlightShortcut(event(key),DEFAULT_HIGHLIGHT_SHORTCUT),false);
 assert.equal(matchesHighlightShortcut({...event('h',true),isComposing:true},DEFAULT_HIGHLIGHT_SHORTCUT),false);
});
test('52: persistence and invalid settings fallback',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 assert.equal(persistHighlightShortcut(storage,{shift:false,key:'9'}),true);
 assert.deepEqual(restoreHighlightShortcut(storage),{shift:false,key:'9'});
 map.set('cluster.textHighlighter.shortcut','{invalid');
 assert.deepEqual(restoreHighlightShortcut(storage),DEFAULT_HIGHLIGHT_SHORTCUT);
 assert.equal(persistHighlightShortcut(storage,{shift:false,key:'V'}),false);
});
test('52: Ctrl undo no longer forces full refresh and VTE stays isolated',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const undo=main.slice(main.indexOf("editor.addEventListener('keydown',e=>{"),
   main.indexOf('async function doSave('));
 assert.doesNotMatch(undo,/\brefresh\(\)/);
 assert.match(undo,/scheduleHighlight\(\)/);
 const vte=createVTE();assert.equal(vte.Status().data.files.length,0);
});

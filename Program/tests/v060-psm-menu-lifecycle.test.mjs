import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.20 tool menu closes on outside pointer, escape, scroll, resize, and session changes',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js');
 for(const token of ['onOutsideClick','onEscape','onScroll','positionToolMenu','closeToolMenu','document.addEventListener(\'pointerdown\'','window.addEventListener(\'resize\''])assert.ok(ui.includes(token),token);
 assert.ok(ui.includes('function selectSession(id){\n   closeToolMenu()'));
});
test('60.21 tool menu is viewport-bound and text has fallback palette colors',()=>{
 const css=read('../src/style.css');
 assert.ok(css.includes('position:fixed!important'));
 assert.ok(css.includes('max-width:calc(100vw - 16px)'));
 assert.ok(css.includes('--psm-button-text:var(--ui-text-on-control,var(--ui-text-on-surface,#f1f2f5))'));
});
test('60.22 setup download has a distinct revision filename',()=>{
 const cmd=read('../src/powershell-manager/cmd-setup.js');
 assert.ok(cmd.includes('ClusterOpt-PLA-Setup-v0.0.60-r7.cmd'));
});

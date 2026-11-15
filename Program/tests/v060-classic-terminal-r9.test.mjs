import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.37 connected terminal uses inline PS prompt and compact toolbar',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js');
 assert.ok(ui.includes('psm-terminal-classic'));
 assert.ok(ui.includes('data-psm-terminal="prompt"'));
 assert.ok(ui.includes('data-psm-action="new-session"'));
 assert.ok(ui.includes('data-psm-action="close-session"'));
 assert.ok(ui.includes("if(action==='new-session'){createSession();return;}"));
});
test('60.38 terminal uses black full workspace and input has no visible button',()=>{
 const css=read('../src/style.css');
 assert.ok(css.includes('.psm-pane.psm-connected .psm-terminal-classic:not([hidden])'));
 assert.ok(css.includes('background:#000!important'));
 assert.ok(css.includes('.psm-pane.psm-connected .psm-terminal-input button,.psm-pane.psm-connected .psm-terminal-actions{display:none!important}'));
});
test('60.39 r9 release cache and redirect remain consistent',()=>{
 const root=read('../../index.html');const main=read('../src/main.js');const ui=read('../src/powershell-manager/powershell-ui.js');
 assert.ok(root.includes('opt066-conpty-r1'));
 assert.ok(main.includes('powershell-ui.js?v=opt066-conpty-r1'));
 assert.ok(ui.includes('cmd-setup.js?v=opt066-conpty-r1'));
});

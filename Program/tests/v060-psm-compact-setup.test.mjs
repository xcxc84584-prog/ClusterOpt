import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.29 compact setup shows steps in a single view and reserves scroll for small screens',()=>{const css=read('../src/style.css');const ui=read('../src/powershell-manager/powershell-ui.js');assert.ok(ui.includes("pane.classList.add('psm-compact-setup')"));assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));assert.ok(css.includes('grid-area:feedback'));assert.ok(css.includes('@media(max-width:650px)'));});
test('60.30 release import chain and stale redirect assertions use r6',()=>{const main=read('../src/main.js');const ui=read('../src/powershell-manager/powershell-ui.js');assert.ok(main.includes('powershell-ui.js?v=opt060-psm-r7'));assert.ok(ui.includes('cmd-setup.js?v=opt060-psm-r7'));assert.ok(main.includes("params.set('build','opt060-psm-r7')"));});

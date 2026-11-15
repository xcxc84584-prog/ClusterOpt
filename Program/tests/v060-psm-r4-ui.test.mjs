import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.23 nested PowerShell ES modules are versioned to invalidate stale r2/r3',()=>{
 assert.ok(read('../src/main.js').includes("powershell-ui.js?v=opt062-psm-r2"));
 assert.ok(read('../src/powershell-manager/powershell-ui.js').includes("cmd-setup.js?v=opt062-psm-r2"));
});
test('60.24 setup pane does not center oversized content vertically',()=>{
 const css=read('../src/style.css');
 assert.ok(css.includes('margin:0 auto!important'));
 assert.ok(css.includes('.psm-pane .psm-quick-setup{display:grid!important'));
});
test('60.25 stale bookmarked build query is normalized',()=>{
 const main=read('../src/main.js');
 assert.ok(main.includes("params.set('build','opt062-psm-r2')"));
});

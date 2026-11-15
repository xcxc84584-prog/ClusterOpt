import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.11 PowerShell creates multiple sessions and owns tab cards',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js');
 for(const text of ['createSession','selectSession','closeSession','syncTabs','psm-tab','button.addEventListener(\'click\',createSession)'])assert.ok(ui.includes(text),text);
});
test('60.12 document tabs and PowerShell tabs share the same tab bar',()=>{
 const main=read('../src/main.js');
 assert.match(main,/psmUI\.syncTabs\(\)/);
 assert.match(main,/function switchDoc\(id\)\{\s*psmUI\.hide\(\)/);
 assert.match(main,/document\.title='Cluster Opt v0\.0\.67'/);
});
test('60.13 terminal tab bar remains visible in PowerShell mode',()=>{
 const css=read('../src/style.css');
 assert.match(css,/#clusterEditorColumn\.psm-mode #tabs\{position:relative;z-index:9;visibility:visible/);
 assert.doesNotMatch(css,/#clusterEditorColumn\.psm-mode #tabs\{visibility:hidden/);
});

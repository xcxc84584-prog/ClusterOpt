import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSetupCmd} from '../src/powershell-manager/cmd-setup.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.18 port takeover is delegated to explicit user-confirmed installer',()=>{
 const cmd=createSetupCmd();
 assert.ok(cmd.includes('install-v064.ps1'));
 const installer=read('../local-agent/install-v064.ps1');
 for(const part of ['Get-NetTCPConnection','Get-Process','Stop-Process','Read-Host','Enter TCP port','Type YES'])assert.ok(installer.includes(part),part);
 assert.ok(installer.indexOf('Type YES')<installer.indexOf('Stop-Process'));
});
test('60.19 menu labels and setup actions are accessible',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js');
 assert.ok(ui.includes("setAttribute('aria-label',msg.tool)"));
 assert.ok(ui.includes("setAttribute('aria-label',msg.close)"));
 const css=read('../src/style.css');
 assert.match(css,/\.psm-pane \.psm-menu:not\(\[hidden\]\)/);
 assert.match(css,/\.psm-pane \.psm-body \.psm-primary/);
});

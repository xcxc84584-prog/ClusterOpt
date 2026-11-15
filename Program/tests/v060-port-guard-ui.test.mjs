import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSetupCmd} from '../src/powershell-manager/cmd-setup.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.18 port takeover requires Y but does not verify process identity',()=>{
 const cmd=createSetupCmd();
 for(const part of ['Get-NetTCPConnection','Force use port 43881? [Y/N]','if /I not "%CONFIRM%"=="Y" goto cancel_replace','Stop-Process','goto unsafe_replace'])assert.ok(cmd.includes(part),part);
 assert.ok(!cmd.includes('Get-CimInstance Win32_Process'));
 assert.ok(cmd.indexOf('Stop-Process')<cmd.indexOf('Start-Process'));
});
test('60.19 menu labels and setup actions are accessible',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js');
 assert.ok(ui.includes("setAttribute('aria-label',msg.tool)"));
 assert.ok(ui.includes("setAttribute('aria-label',msg.close)"));
 const css=read('../src/style.css');
 assert.match(css,/\.psm-pane \.psm-menu:not\(\[hidden\]\)/);
 assert.match(css,/\.psm-pane \.psm-body \.psm-primary/);
});

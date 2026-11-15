import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSetupCmd} from '../src/powershell-manager/cmd-setup.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.18 port guard requires typed confirmation and verifies process identity',()=>{
 const cmd=createSetupCmd();
 for(const part of ['Get-NetTCPConnection','Get-CimInstance Win32_Process','REPLACE 43881','node.exe','ClusterOpt-Agent*server.mjs','Stop-Process','goto cancel_replace','goto unsafe_replace'])assert.ok(cmd.includes(part),part);
 assert.ok(cmd.indexOf('REPLACE 43881')<cmd.indexOf('Stop-Process'));
 assert.ok(cmd.indexOf('Stop-Process')<cmd.indexOf('node.exe "%AGENT_FILE%"'));
});
test('60.19 menu labels and setup actions are accessible',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js');
 assert.match(ui,/setAttribute\('aria-label',msg.tool\)/);
 assert.match(ui,/setAttribute\('aria-label',msg.close\)/);
 const css=read('../src/style.css');
 assert.match(css,/\.psm-pane \.psm-menu:not\(\[hidden\]\)/);
 assert.match(css,/\.psm-pane \.psm-body \.psm-primary/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.34 interactive terminal input supports submit and command history',()=>{const ui=read('../src/powershell-manager/powershell-ui.js');for(const token of ['psm-terminal-input','commandForm.addEventListener(\'submit\'','ArrowUp','ArrowDown','session.history.push(command)','remote.runSession('])assert.ok(ui.includes(token),token);});
test('60.35 local agent requires paired auth and explicit interactive confirmation',()=>{const server=read('../local-agent/server.mjs');const client=read('../src/powershell-manager/powershell-client.js');assert.ok(server.includes("body.action==='interactive'"));assert.ok(server.includes("'/session/run'"));assert.ok(server.includes('equalSecret('));assert.ok(server.includes('command.length>16384'));assert.ok(client.includes('runSession('));});
test('60.36 r8 cache chain and CMD filename are synchronized',()=>{const main=read('../src/main.js');const ui=read('../src/powershell-manager/powershell-ui.js');const cmd=read('../src/powershell-manager/cmd-setup.js');assert.ok(main.includes('powershell-ui.js?v=opt061-psm-r1'));assert.ok(ui.includes('cmd-setup.js?v=opt061-psm-r1'));assert.ok(cmd.includes('v0.0.61-r1.cmd'));});

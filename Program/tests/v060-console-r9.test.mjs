import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.r9 connected console is output plus multiline input, no command approval UI',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js');
 assert.ok(ui.includes('<textarea id="psmCommandInput"'));
 assert.ok(ui.includes('commandForm.requestSubmit()'));
 assert.ok(!ui.includes('window.confirm('));
 assert.ok(!ui.includes('data-psm-action="settings"'));
 assert.ok(!ui.includes('data-psm-action="version"'));
 assert.ok(!ui.includes('data-psm-action="location"'));
 assert.ok(!ui.includes('data-psm-action="clear"'));
});
test('60.r9 agent accepts authenticated interactive script without extra confirmation',()=>{
 const server=read('../local-agent/server.mjs');
 assert.ok(!server.includes('body.confirm!==true'));
 assert.ok(server.includes('equalSecret('));
 assert.ok(server.includes('ALLOWED_ORIGINS'));
});

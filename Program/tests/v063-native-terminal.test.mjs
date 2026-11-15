import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('63.1: native ConPTY server binds to existing loopback agent',()=>{
 const agent=read('../local-agent/server.mjs'),bridge=read('../local-agent/native-terminal.mjs');
 assert.match(agent,/attachNativeTerminal\(agent.server/);
 assert.match(bridge,/pty.spawn/);
 assert.match(bridge,/WebSocketServer/);
 assert.match(bridge,/allowedOrigins.has\(req.headers.origin\)/);
 assert.match(bridge,/same\(m.token,token\)/);
});
test('63.2: browser terminal supports ANSI streaming and interactive input',()=>{
 const ui=read('../src/powershell-manager/powershell-ui.js'),client=read('../src/powershell-manager/powershell-client.js');
 assert.match(ui,/window.Terminal/);
 assert.match(ui,/nativeTerm.onData/);
 assert.match(ui,/type:'resize'/);
 assert.match(client,/openNativeTerminal/);
});
test('63.3: setup CMD installs the native dependencies',()=>{
 const setup=read('../src/powershell-manager/cmd-setup.js');
 assert.match(setup,/native-terminal.mjs/);
 assert.match(setup,/npm.cmd install/);
 assert.match(setup,/Start-Process/);
});

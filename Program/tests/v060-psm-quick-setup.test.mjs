import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSetupCmd,SETUP_FILENAME,PLA_SOURCE} from '../src/powershell-manager/cmd-setup.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.14 quick setup exposes downloadable CMD and pairing UI',()=>{const src=read('../src/powershell-manager/powershell-ui.js');for(const item of ['data-psm-action="download"','data-psm-action="pair"','psm-quick-setup','createSetupCmd()'])assert.ok(src.includes(item),item);});
test('60.15 token is memory-only and agent endpoint is loopback',()=>{const src=read('../src/powershell-manager/powershell-client.js');assert.match(src,/127\.0\.0\.1:43881/);assert.match(src,/#token/);assert.doesNotMatch(src,/localStorage|sessionStorage/);});
test('60.16 CMD downloads pinned PLA and launches it to show token',()=>{const cmd=createSetupCmd();assert.equal(SETUP_FILENAME,'ClusterOpt-PLA-Setup-v0.0.60-r8.cmd');assert.match(PLA_SOURCE,/2aa46615c72bfc789b50a131260d3ab7203060db/);assert.ok(cmd.includes('Invoke-WebRequest'));assert.ok(cmd.includes('node.exe "%AGENT_FILE%"'));assert.ok(cmd.includes('PAIRING TOKEN APPEARS BELOW'));assert.ok(cmd.includes('pause >nul'));assert.ok(cmd.includes('\r\n'));assert.doesNotMatch(cmd,/https?:\/\/[^\s]+token=/i);});
test('60.17 setup theme uses semantic tokens and responsive layout',()=>{const css=read('../src/style.css');assert.match(css,/--psm-bg:var\(--ui-background\)/);assert.match(css,/--psm-ink:var\(--ui-text-on-surface/);assert.match(css,/@media\(max-width:600px\)/);});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSetupCmd,SETUP_FILENAME,PLA_SOURCE} from '../src/powershell-manager/cmd-setup.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.14 quick setup exposes downloadable CMD and pairing UI',()=>{const src=read('../src/powershell-manager/powershell-ui.js');for(const item of ['data-psm-action="download"','data-psm-action="pair"','psm-quick-setup','createSetupCmd()'])assert.ok(src.includes(item),item);});
test('60.15 token is tab-scoped and agent endpoint is loopback',()=>{const src=read('../src/powershell-manager/powershell-client.js');assert.match(src,/127\.0\.0\.1:43881/);assert.match(src,/#token/);assert.match(src,/sessionStorage\.setItem\(TOKEN_KEY/);assert.match(src,/sessionStorage\.removeItem\(TOKEN_KEY/);assert.doesNotMatch(src,/\blocalStorage\b/);});
test('60.16 CMD downloads pinned PLA and launches it to show token',()=>{const cmd=createSetupCmd();assert.equal(SETUP_FILENAME,'ClusterOpt-PLA-Setup-v0.0.62-r2.cmd');assert.match(PLA_SOURCE,/ClusterOpt\/main\/Program\/local-agent\/server\.mjs/);assert.ok(cmd.includes('Invoke-WebRequest'));assert.ok(cmd.includes('Start-Process'));assert.ok(cmd.includes('PAIRING TOKEN (keep private):'));assert.ok(cmd.includes('pause'));assert.ok(cmd.includes('\r\n'));assert.doesNotMatch(cmd,/https?:\/\/[^\s]+token=/i);});
test('60.17 setup theme uses semantic tokens and responsive layout',()=>{const css=read('../src/style.css');assert.match(css,/--psm-bg:var\(--ui-background\)/);assert.match(css,/--psm-ink:var\(--ui-text-on-surface/);assert.match(css,/@media\(max-width:600px\)/);});

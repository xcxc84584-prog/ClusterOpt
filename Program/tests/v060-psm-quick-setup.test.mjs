import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('60.14 quick setup exposes downloadable CMD and pairing UI',()=>{const src=read('../src/powershell-manager/powershell-ui.js');for(const item of ['data-psm-action="download"','data-psm-action="pair"','ClusterOpt-PLA-Setup-v0.0.60.cmd','psm-quick-setup'])assert.ok(src.includes(item),item);});
test('60.15 token is memory-only and agent endpoint is loopback',()=>{const src=read('../src/powershell-manager/powershell-client.js');assert.match(src,/127\.0\.0\.1:43881/);assert.match(src,/#token/);assert.doesNotMatch(src,/localStorage|sessionStorage/);});
test('60.16 CMD pins a reviewed agent revision',()=>{const src=read('../src/powershell-manager/powershell-ui.js');assert.match(src,/2aa46615c72bfc789b50a131260d3ab7203060db/);assert.match(src,/Review server\.mjs before running/);});

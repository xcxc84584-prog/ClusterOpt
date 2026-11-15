import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('60.6 Explorer terminal button exists',()=>assert.match(read('index.html'),/id="explorerPowerShell"/));
test('60.7 setup view never exposes an editable terminal input',()=>{const src=read('src/powershell-manager/powershell-ui.js');assert.match(src,/id="psmCheckCommand" readonly/);assert.doesNotMatch(src,/eval\(|new Function\(/);});
test('60.8 version route and assets match',()=>{assert.match(read('index.html'),/Cluster Opt 0\.0\.60/);assert.match(read('src/main.js'),/mountPowerShellUI/);});
test('60.9 localization uses global LANGUAGE subscription',()=>assert.match(read('src/powershell-manager/powershell-ui.js'),/language\.subscribe\(translate\)/));

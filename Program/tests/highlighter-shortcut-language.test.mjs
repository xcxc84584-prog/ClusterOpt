import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('shortcut editor uses global LANGUAGE for English and Chinese',()=>{
 const main=read('../src/main.js'),lang=read('../src/language.js'),html=read('../index.html');
 for(const key of ['shortcutTitle','shortcutDescription','shortcutCombination','shortcutReset','shortcutHelp','shortcutSave','shortcutRecording','shortcutInvalid']){
  assert.match(main,new RegExp("t\\('"+key+"'\\)"));
 }
 assert.match(lang,/shortcutTitle:'切換快捷鍵'/);
 assert.match(lang,/shortcutTitle:'Toggle shortcut'/);
 assert.match(main,/LANGUAGE\.subscribe\(\(\)=>\{renderLanguage\(\)/);
 assert.match(html,/id="highlighterShortcutDescription"/);
 assert.match(html,/id="highlighterShortcutScope"/);
});

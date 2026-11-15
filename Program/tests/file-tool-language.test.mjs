import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('File Tool dialog is translated through global LANGUAGE',()=>{
 const main=read('../src/main.js'),lang=read('../src/language.js'),html=read('../index.html');
 assert.match(main,/renderBlockedTypesLanguage\(\)/);
 assert.match(main,/LANGUAGE\.subscribe\(\(\)=>\{renderLanguage\(\)/);
 assert.match(main,/\$\('#blockedTypesTitle'\)\.textContent=t\('blockedTypes'\)/);
 assert.match(main,/\$\('#blockedTypesListLabel'\)\.textContent=t\('blockedTypesList'\)/);
 assert.match(main,/t\('blockedTypesEditPrompt'\)/);
 assert.match(html,/id="blockedTypesFooter"/);
 assert.match(lang,/blockedTypes:'屏蔽檔案類型'/);
 assert.match(lang,/blockedTypes:'Excluded File Types'/);
});

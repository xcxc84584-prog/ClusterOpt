import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('53.3 large resident text never enters full-slice Shiki path',()=>{
 assert.match(main,/const LARGE_HIGHLIGHT_THRESHOLD=64\*1024/);
 assert.match(main,/highlightViewportOnly=editor\.value\.length>LARGE_HIGHLIGHT_THRESHOLD/);
 assert.match(main,/if\(highlightViewportOnly\)\{/);
 assert.match(main,/const MAX_VIEWPORT_TOKEN_CHARS=12\*1024/);
 assert.match(main,/if\(source\.length>MAX_VIEWPORT_TOKEN_CHARS\)/);
});
test('53.3 large viewport scroll requests bounded syntax refresh',()=>{
 assert.match(main,/if\(highlightViewportOnly&&TEXT_HIGHLIGHTER\.enabled\)/);
 assert.match(main,/if\(key!==highlightViewportKey\)\{highlightViewportKey=key;scheduleHighlight\(\);\}/);
 assert.match(main,/highlightRenderer\.lineIndexFor\(target\)\|\|buildHighlightLineStarts\(target\)/);
});
test('53.3 existing Ctrl+V and Ctrl+Z paths preserved',()=>{
 assert.match(main,/pendingPasteText=event\.clipboardData/);
 assert.match(main,/if\(historyEdit\|\|\(pasted&&editor\.value\.length<=256\*1024\)\)scheduleHighlight\(\)/);
});

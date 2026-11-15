import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('49.1: v0.0.49 display and redirect are consistent',()=>{
 const program=read('../index.html'),root=read('../../index.html'),main=read('../src/main.js');
 assert.match(program,/Cluster Opt 0\.0\.64/);
 assert.match(program,/v0\.0\.64/);
 assert.match(program,/main\.js\?v=opt064-port-r2/);
 assert.match(root,/Program\/\?v=0\.0\.64/);
 assert.match(root,/searchParams\.set\("v", "0\.0\.64"\)/);
 assert.match(main,/document\.title='Cluster Opt v0\.0\.64'/);
});

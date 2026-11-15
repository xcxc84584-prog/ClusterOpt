import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createClusterDependencies} from '../src/dependency-registry.js';
import {calculateViewport} from '../src/editor-render/viewport-calculator.js';
import {measureTextMetrics} from '../src/editor-render/text-metrics.js';
import {createVTE} from '../src/vte/vte.js';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('v0.0.48 release: title, script cache key and root redirect agree',()=>{
 const page=read('../index.html'),root=read('../../index.html'),main=read('../src/main.js');
 assert.match(page,/Cluster Opt 0\.0\.48/);
 assert.match(page,/v0\.0\.48/);
 assert.match(page,/main\.js\?v=opt048-render/);
 assert.match(root,/Program\/\?v=0\.0\.48/);
 assert.match(root,/searchParams\.set\("v", "0\.0\.48"\)/);
 assert.match(main,/document\.title='Cluster Opt v0\.0\.48'/);
});
test('v0.0.48: visible range uses the same geometry as renderer and highlighter',()=>{
 const editor={scrollTop:275,scrollLeft:5,clientHeight:410,clientWidth:800};
 const geometry=measureTextMetrics(editor,()=>({fontSize:'16px',lineHeight:'22px',fontFamily:'monospace',fontWeight:'400',tabSize:'4',paddingTop:'0px'}));
 assert.equal(geometry.ok,true);
 const range=calculateViewport({scrollTop:geometry.data.scrollTop,viewportHeight:geometry.data.clientHeight,lineHeight:geometry.data.lineHeight,lineCount:10000,overscan:2});
 assert.equal(range.ok,true);
 assert.equal(range.data.start,10);
 assert.ok(range.data.end>range.data.start);
});
test('v0.0.48: OCDA dependencies are declared without persistence writes',()=>{
 const registry=createClusterDependencies(),edges=registry.edges();
 for(const to of ['ViewportCalculator','TextMetrics'])
  assert.ok(edges.some(e=>e.from==='HighlightRenderer'&&e.to===to),to);
 assert.equal(edges.some(e=>e.from==='HighlightRenderer'&&['FlagUnit','MVCCUnit','OverloadRestorer'].includes(e.to)),false);
});
test('v0.0.48: render geometry leaves VTE virtual resources untouched',()=>{
 const vte=createVTE();
 const initial=vte.Status().data.files.length;
 measureTextMetrics({scrollTop:0,clientHeight:200},()=>({fontSize:'12px',lineHeight:'18px'}));
 calculateViewport({scrollTop:0,viewportHeight:200,lineHeight:18,lineCount:100});
 assert.equal(vte.Status().data.files.length,initial);
});

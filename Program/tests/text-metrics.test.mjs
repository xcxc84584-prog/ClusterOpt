import test from 'node:test';
import assert from 'node:assert/strict';
import {measureTextMetrics} from '../src/editor-render/text-metrics.js';
const editor={scrollTop:42,scrollLeft:7,clientHeight:500,clientWidth:900};
const style={fontFamily:'monospace',fontSize:'16px',fontWeight:'400',lineHeight:'24px',tabSize:'4',
 paddingTop:'12px',paddingBottom:'12px',paddingLeft:'16px',paddingRight:'16px'};
test('PR04: immutable geometry snapshot without editor mutation',()=>{
  const before=structuredClone(editor);
  const result=measureTextMetrics(editor,()=>style);
  assert.equal(result.ok,true);
  assert.equal(result.data.lineHeight,24);
  assert.equal(result.data.paddingLeft,16);
  assert.equal(result.data.scrollTop,42);
  assert.equal(Object.isFrozen(result.data),true);
  assert.deepEqual(editor,before);
});
test('PR04: normal line height uses font-size fallback',()=>{
  const result=measureTextMetrics(editor,()=>({...style,lineHeight:'normal'}));
  assert.equal(result.data.lineHeight,19.2);
});
test('PR04: invalid editor and unresolved font metrics return errors',()=>{
  assert.equal(measureTextMetrics(null).code,400);
  assert.equal(measureTextMetrics(editor,()=>({...style,lineHeight:'normal',fontSize:'unknown'})).code,422);
});

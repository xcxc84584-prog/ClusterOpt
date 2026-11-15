import test from 'node:test';
import assert from 'node:assert/strict';
import {createClusterDependencies} from '../src/dependency-registry.js';
import {measureTextMetrics} from '../src/editor-render/text-metrics.js';
import {calculateViewport} from '../src/editor-render/viewport-calculator.js';
import {RenderCoordinator} from '../src/editor-render/render-coordinator.js';
import {createVTE} from '../src/vte/vte.js';

test('v0.0.47: object registry includes all render pipeline components',()=>{
 const registry=createClusterDependencies();
 for(const name of ['ViewportCalculator','RenderCoordinator','TextMetrics'])
   assert.equal(registry.list().some(o=>o.name===name),true,name);
 const properties=registry.dep('TextMetrics').data.objects[0].properties;
 assert.ok(properties.includes('FONT_METRICS'));
 assert.ok(properties.includes('TEXT_PADDING'));
 assert.ok(properties.includes('TAB_SIZE'));
});
test('v0.0.47: VTE isolation persists while geometry and viewport calculations execute',()=>{
 const vte=createVTE();
 const before=vte.Status().data.files.length;
 const editor={scrollTop:40,scrollLeft:0,clientHeight:100,clientWidth:500};
 const geometry=measureTextMetrics(editor,()=>({
  fontFamily:'monospace',fontSize:'16px',fontWeight:'400',lineHeight:'20px',
  tabSize:'4',paddingTop:'0px',paddingBottom:'0px',paddingLeft:'0px',paddingRight:'0px'
 }));
 assert.equal(geometry.ok,true);
 const range=calculateViewport({scrollTop:geometry.data.scrollTop,viewportHeight:geometry.data.clientHeight,lineHeight:geometry.data.lineHeight,lineCount:100});
 assert.equal(range.ok,true);
 assert.equal(vte.Status().data.files.length,before);
});
test('v0.0.47: coordinator cancels stale frames without mutating VTE',()=>{
 const vte=createVTE();
 let frame, rendered=0;
 const coordinator=new RenderCoordinator({scheduleFrame:cb=>(frame=cb,1),cancelFrame:()=>{}});
 coordinator.schedule({source:'scroll',revision:1,render:()=>rendered++});
 coordinator.cancel();
 frame();
 assert.equal(rendered,0);
 assert.equal(vte.Status().data.files.length,0);
});

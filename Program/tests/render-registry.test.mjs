import test from 'node:test';
import assert from 'node:assert/strict';
import {createClusterDependencies} from '../src/dependency-registry.js';
test('PR05: OCDA render objects and properties registered',()=>{
 const registry=createClusterDependencies();
 const names=new Map(registry.list().map(o=>[o.name,o]));
 assert.ok(names.has('ViewportCalculator'));
 assert.ok(names.has('RenderCoordinator'));
 assert.ok(names.get('RenderCoordinator').properties.includes('RENDER_GENERATION'));
 assert.ok(names.get('ViewportCalculator').properties.includes('VIEWPORT_RANGE'));
});
test('PR05: render graph is read-only relative to MVCC and FlagUnit',()=>{
 const registry=createClusterDependencies();
 const edges=registry.edges();
 const rendererEdges=edges.filter(e=>e.from==='RenderCoordinator');
 assert.ok(rendererEdges.some(e=>e.to==='HighlightRenderer'));
 assert.equal(rendererEdges.some(e=>['MVCCUnit','FlagUnit','OverloadRestorer'].includes(e.to)),false);
});

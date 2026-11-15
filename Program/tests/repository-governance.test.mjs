import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createClusterDependencies} from '../src/dependency-registry.js';
import {createVTE} from '../src/vte/vte.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('repository governance: canonical inventory and project navigation exist',()=>{
  for(const name of ['README.md','PROJECT_ARCHITECTURE.md',
    '物件清單.md','屬性清單.md','全域屬性清單.md',
    'OBJECT_LIST.md','PROPERTY_LIST.md','程式編寫守則.md']){
    assert.ok(read('../../'+name).length>100,name);
  }
  for(const group of ['QuestionList1','QuestionList2'])
    for(const file of ['未處理潛在問題清單.md','待測試清單.md','已修復紀錄.md'])
      assert.match(read('../../'+group+'/'+file),/PR-05 倉庫整理檢查/);
});

test('repository governance: OCDA and canonical inventory stay aligned',()=>{
  const registry=createClusterDependencies();
  const names=registry.list().map(x=>x.name);
  assert.ok(names.length>=38);
  const objects=read('../../OBJECT_LIST.md');
  for(const name of names)
    assert.ok(objects.includes('| '+name+' |'),'missing '+name);
  const properties=read('../../PROPERTY_LIST.md');
  for(const name of ['EDIT_REVISION','MICRO_SLICE_PREFIX','PARENT_SLICE_ID'])
    assert.ok(properties.includes(name),'missing '+name);
  assert.match(read('../../物件清單.md'),/48 個物件/);
});

test('repository governance: release redirect and VTE noninterference',()=>{
  const root=read('../../index.html'),program=read('../index.html');
  assert.match(root,/Program\/\?v=0\.0\.68/);
  assert.match(program,/Cluster Opt 0\.0\.68/);
  const vte=createVTE();
  createClusterDependencies().list();
  assert.equal(vte.Status().data.files.length,0);
});

test('repository governance: current PR contains four mandatory documents',()=>{
  const base='../../PR/PR(+v 0.0.49)/PR-05/';
  for(const name of ['PRDrequest.md','ArcD.md','Plan.md','Relation Test.md'])
    assert.ok(read(base+name).length>100,name);
});

import {VirtualFileSession} from './fmc/virtual-file-session.js';
import {OverloadRestorer} from './fmc/overload-restorer.js';
import {LineTree} from './fmc/line-tree.js';
import {WindowLoader} from './fmc/window-loader.js';
import {FileManagementCore} from './fmc/file-management-core.js';
import {SliceLoader} from './fmc/slice-loader.js';
import {StorageProgressTracker} from './fmc/storage-progress-tracker.js';
import {OMU} from './omu.js';
import {InterfacePalette} from './interface-palette.js';
import {createDocumentsClass} from './documents.js';
import {createFileManagerClass} from './file-manager.js';
import {createGlobalPropertyRegistryClass} from './global-properties.js';
import {createSyncStatusClass} from './sync-status.js';
import {LanguageProperty} from './language.js';
// Cluster Opt 1: object state is private; contracts are the only cross-object channel.
const contract=(ok,data=null,code=200,message='')=>Object.freeze({ok,code,data,message});
const omu=new OMU();
const fmc = new FileManagementCore();
const sliceLoader = new SliceLoader(fmc);
const storageProgress = new StorageProgressTracker();
const olr = new OverloadRestorer();
const windowLoader = new WindowLoader(sliceLoader, fmc);
const viewPositions = new Map();
const virtualSessions = new Map();
let virtualRenderGeneration = 0;
let virtualEditQueue = Promise.resolve();
let recoveryTimer = null;
let restoring = false;
let virtualScrollBusy = false;
const virtualScrollCooldown = new Map();
class ExternalChangeMonitor {
 #baseline=new Map();
#busy=new Set();
#generation=new Map();
 constructor(documents,states,registry){this.docs=documents;
this.states=states;
this.registry=registry;
}
 watch(id,content){this.#baseline.set(id,content);
this.#generation.set(id,(this.#generation.get(id)||0)+1);
this.states.set(id,'SYNCED');
}
 unwatch(id){this.#baseline.delete(id);
this.#generation.set(id,(this.#generation.get(id)||0)+1);
this.states.delete(id);
}
 onEdit(id){if(this.#baseline.has(id))this.states.set(id,'DIVERGED');
else this.states.set(id,'UNVERIFIED');
}
 async checkNow(id, loopId = null){
  if(this.#busy.has(id))return;
  const handle=this.docs.handle(id);
if(!handle || virtualSessions.has(id))return;
  const before=this.docs.get(id);
if(!before.ok)return;
  const generation=this.#generation.get(id),revision=before.data.revision,previous=this.#baseline.get(id);
  this.#busy.add(id);
this.states.set(id,'LOADING');
  try{
   const file=await handle.getFile(),external=await file.text();
   if(this.#generation.get(id)!==generation||!this.docs.get(id).ok)return;
   const current=this.docs.get(id).data;
   if(external!==previous){this.#baseline.set(id,external);
omu.emit('ExternalChangeMonitor','ExternalChange',200, '', false, loopId);
}
if(this.registry.get('STORAGE_PRIORITY')==='external' && current.content!==external){
     const replaced=this.docs.replaceFromExternal(id,external,current.revision);
     if(!replaced.ok)throw Error(replaced.message);
     if(active===id){editor.value=external;
editor.dataset.doc=id;
refresh();
}
    }
const latest=this.docs.get(id).data;
   this.states.set(id,latest.content===external?'SYNCED':'DIVERGED');
  }catch(e){
   if(this.#generation.get(id)===generation){this.states.set(id,'ERROR');
omu.emit('ExternalChangeMonitor','Read',e.name==='NotAllowedError'?403:500,String(e),true,loopId);
}
  }finally{this.#busy.delete(id);
}
 }
 async checkAll() {
    const ids = this.docs.ids().filter(id => this.docs.handle(id));
    if (ids.length === 0) return;
    const loopId = omu.startLoop('ExternalChangeMonitor', 'CheckAll');
    try {
      for (const id of ids) {
        await this.checkNow(id, loopId);
      }
      omu.endLoop(loopId);
    } catch (error) {
      omu.emit('ExternalChangeMonitor', 'CheckAll', 500, String(error), true, loopId);
      omu.endLoop(loopId, 'ABORTED');
    }
  }
}
const Documents = createDocumentsClass(omu, contract);
const FileManager = createFileManagerClass(omu, contract);
const GlobalPropertyRegistry = createGlobalPropertyRegistryClass();
const SyncStatus = createSyncStatusClass();
const LANGUAGE=new LanguageProperty();
const UI_PALETTE = new InterfacePalette();
const t=(key,...args)=>LANGUAGE.t(key,...args);
const docs=new Documents(),files=new FileManager(),GLOBALS=new GlobalPropertyRegistry(),syncStates=new SyncStatus();
GLOBALS.register('LANGUAGE',LANGUAGE);
GLOBALS.register('UI_PALETTE', UI_PALETTE);
GLOBALS.register('STORAGE_PRIORITY','internal');
GLOBALS.register('DOCUMENT_STATUS',syncStates);
GLOBALS.register('STORAGE_PROGRESS', storageProgress);
const monitor=new ExternalChangeMonitor(docs,syncStates,GLOBALS);
let active=null;
function capturePosition(id = active) {
  if (!id || editor.dataset.doc !== id) return;
  viewPositions.set(id, {
    scrollTop: editor.scrollTop,
    scrollLeft: editor.scrollLeft,
    selectionStart: editor.selectionStart,
    selectionEnd: editor.selectionEnd
  });
}
function restorePosition(id = active) {
  const position = viewPositions.get(id);
  if (!position || editor.dataset.doc !== id) return;
  editor.setSelectionRange(position.selectionStart, position.selectionEnd);
  editor.scrollTop = position.scrollTop;
  editor.scrollLeft = position.scrollLeft;
  $('#gutter').scrollTop = position.scrollTop;
}
function scheduleRecovery() {
  if (restoring) return;
  clearTimeout(recoveryTimer);
  recoveryTimer = setTimeout(async () => {
    try {
      await virtualEditQueue;
      const snapshots = docs.ids().map(id => {
        const data = docs.get(id).data;
        const session = virtualSessions.get(id);
        if (session) {
          return {
            id, name: data.name, virtual: true,
            // File handles can be structured-cloned into IndexedDB.
            handle: docs.handle(id) || null,
            // Keep source bytes for picker-only files without a handle.
            blob: docs.handle(id) ? null : session.sourceBlob,
            edits: session.recoveryEdits,
            center: session.center,
            position: session.getPosition(session.center) || null
          };
        }
        return {id, name: data.name, content: data.content,
          dirty: data.dirty, position: viewPositions.get(id) || null};
      }).filter(item => item.virtual ||
        (typeof item.content === 'string' && item.content.length <= 2 * 1024 * 1024));
      await olr.save('workspace', {active, documents: snapshots});
    } catch (error) {
      omu.emit('OLR', 'Persist', 500, String(error), true);
      status('Recovery persistence failed: ' + String(error));
    }
  }, 350);
}

const $=s=>document.querySelector(s),editor=$('#editor');
function status(msg){$('#status').textContent=msg;
}
function updateEditorLock() {
  const operation = active ? storageProgress.get(active) : null;
  const loading = !!active && (syncStates.get(active) === 'LOADING' ||
    (['LOAD', 'INDEX'].includes(operation?.operationType) && operation.state === 'RUNNING'));
  const unavailable = !!active && virtualSessions.has(active) &&
    editor.dataset.doc !== active;
  editor.readOnly = loading || unavailable;
  editor.setAttribute('aria-readonly', String(loading));
  editor.title = loading ? 'Loading slices — editing is disabled' :
    unavailable ? 'Slice not ready — editing is disabled' : '';
}
function refresh(){const d=active?docs.get(active).data:null;
$('#empty').hidden=!!d;
$('#editorPane').hidden=!d;
$('#tabs').replaceChildren();
for(const id of docs.ids()){const x=docs.get(id).data;
const tab=document.createElement('div');
tab.className='tab'+(id===active?' active':'');
const name=document.createElement('span');
name.className='name';
name.textContent=x.name+(x.dirty?' ●':'');
const close=document.createElement('span');
close.className='close';
close.textContent='×';
close.onclick=e=>{e.stopPropagation();
closeDoc(id);
};
tab.append(name,close);
tab.onclick=()=>switchDoc(id);
$('#tabs').append(tab);
}
if(d){if(editor.dataset.doc!==active){
  editor.value = virtualSessions.has(active) ? '' : d.content;
  editor.dataset.doc=active;
}
$('#filename').textContent=d.name+(d.dirty?' *':'');
if (virtualSessions.has(active)) {
  const session = virtualSessions.get(active);
  $('#sliceControls').hidden = true;
  $('#gutter').textContent = '…';
} else {
  $('#sliceControls').hidden = true;
  updateLines();
}
}
else{$('#sliceControls').hidden = true;$('#filename').textContent=t('unnamed');
editor.dataset.doc='';
}updatePos();
renderSyncStatus();
}
function switchDoc(id){
  if (active && virtualSessions.has(active)) {
    const session = virtualSessions.get(active);
    session.setPosition(session.center, {
      scrollTop: editor.scrollTop, scrollLeft: editor.scrollLeft,
      selectionStart: editor.selectionStart, selectionEnd: editor.selectionEnd
    });
  } else capturePosition();
  active=id;
  refresh();
  if (virtualSessions.has(id)) {
    renderVirtualSlice(id);
  } else {
    restorePosition(id);
  }
  editor.focus({preventScroll:true});
  scheduleRecovery();
}
function create(name=t('unnamed'),content='',handle=null){const res=docs.create(name,content,handle);
active=res.data.id;
if(handle)monitor.watch(active,content);
refresh();
editor.focus({preventScroll:true});
  scheduleRecovery();
}
function closeDoc(id){const d=docs.get(id).data;
if(!d)return;
if(d.dirty&&!confirm(t('confirmClose',d.name)))return;
monitor.unwatch(id);
virtualSessions.delete(id);
viewPositions.delete(id);
docs.close(id);
if(active===id)active=docs.ids().at(-1)||null;
refresh();
scheduleRecovery();
}
function updateLines(){
  const count = editor.value.split('\n').length;
  const tree = new LineTree([count]);
  $('#gutter').textContent = Array.from({length: tree.total}, (_, i) => i + 1).join('\n');
}
function updatePos(){const p=editor.selectionStart||0,txt=editor.value.slice(0,p),lines=txt.split('\n');
$('#position').textContent=`Ln ${lines.length}, Col ${lines.at(-1).length+1}`;
}
editor.addEventListener('input',()=>{if(!active || editor.readOnly)return;
if (virtualSessions.has(active)) {
  const id = active;
  const session = virtualSessions.get(id);
  const index = session.center;
  const content = editor.value;
  session.setPosition(index, {
    scrollTop: editor.scrollTop, scrollLeft: editor.scrollLeft,
    selectionStart: editor.selectionStart, selectionEnd: editor.selectionEnd
  });
  virtualEditQueue = virtualEditQueue.then(async () => {
    const result = await session.edit(index, content);
    if (!result.ok) throw new Error('WTF/MVCC commit failed: ' + result.code);
    docs.update(id, '');
    syncStates.set(id, 'DIVERGED');
    scheduleRecovery();
  }).catch(error => {
    status(String(error));
    omu.emit('VirtualEditor', 'Commit', 500, String(error), true);
  });
  $('#filename').textContent = docs.get(id).data.name + ' *';
  return;
}
const previous = docs.get(active).data.content;
if (previous.length < 2 * 1024 * 1024 && editor.value.length < 2 * 1024 * 1024) {
  olr.record(active, previous, editor.value);
}
docs.update(active,editor.value);
capturePosition();
scheduleRecovery();monitor.onEdit(active);updateLines();updatePos();$('#filename').textContent=docs.get(active).data.name+' *';
const activeTab=[...$('#tabs').children].find(tab=>tab.classList.contains('active'));
if(activeTab)activeTab.querySelector('.name').textContent=docs.get(active).data.name+' ●';status(t('unsaved'));});
editor.addEventListener('scroll',()=>{
  $('#gutter').scrollTop=editor.scrollTop;
  if (active && virtualSessions.has(active)) {
    virtualSessions.get(active).setPosition(
      virtualSessions.get(active).center,
      {scrollTop: editor.scrollTop, scrollLeft: editor.scrollLeft,
        selectionStart: editor.selectionStart, selectionEnd: editor.selectionEnd}
    );
  } else capturePosition();
  scheduleRecovery();
  if (active && virtualSessions.has(active) && !editor.readOnly && !virtualScrollBusy) {
    const session = virtualSessions.get(active);
    const max = editor.scrollHeight - editor.clientHeight;
    const now = Date.now();
    const last = virtualScrollCooldown.get(active) || 0;
    if (now - last > 400 && max > 0) {
      const next = editor.scrollTop >= max - 12 ? session.center + 1 :
        editor.scrollTop <= 12 ? session.center - 1 : session.center;
      if (next !== session.center && next >= 0 && next < session.sliceCount) {
        virtualScrollCooldown.set(active, now);
        virtualScrollBusy = true;
        renderVirtualSlice(active, next).finally(() => { virtualScrollBusy = false; });
      }
    }
  }
});
['click','keyup','select'].forEach(ev=>editor.addEventListener(ev,()=>{
  updatePos();
  capturePosition();
  scheduleRecovery();
}));
editor.addEventListener('keydown',e=>{
  if ((e.ctrlKey || e.metaKey) && ['z','y'].includes(e.key.toLowerCase())) {
    if (!active || virtualSessions.has(active) || editor.value.length >= 2 * 1024 * 1024) return;
    e.preventDefault();
    const content = e.key.toLowerCase() === 'y' || e.shiftKey
      ? olr.redo(active, editor.value) : olr.undo(active, editor.value);
    if (content === null) return;
    const position = {scrollTop: editor.scrollTop, scrollLeft: editor.scrollLeft,
      selectionStart: editor.selectionStart, selectionEnd: editor.selectionEnd};
    editor.value = content;
    docs.update(active, content);
    monitor.onEdit(active);
    viewPositions.set(active, position);
    restorePosition(active);
    updateLines();
    updatePos();
    refresh();
    scheduleRecovery();
    return;
  }
  if(e.key==='Tab'){e.preventDefault();
const s=editor.selectionStart;editor.setRangeText('    ',s,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));}});
async function doSave(as=false){if(!active)return;
const id=active;
capturePosition(id);
const operationId=storageProgress.start(
  id, 'SAVE', virtualSessions.has(id) ? virtualSessions.get(id).sliceCount : 1
);
syncStates.set(id,'SAVING');
const d=docs.get(id).data;
const revision=d.revision;
let res;
if (virtualSessions.has(id)) {
  try {
    await virtualEditQueue;
    let handle = as ? null : docs.handle(id);
    if (!handle && 'showSaveFilePicker' in window) {
      handle = await window.showSaveFilePicker({suggestedName: d.name});
    }
    if (!handle) throw new Error('Streaming save requires a file handle');
    await virtualSessions.get(id).save(handle, progress => {
      storageProgress.update(operationId, progress.completed, 'FLUSH');
    });
    res = contract(true, {handle, name: handle.name});
  } catch (error) {
    res = contract(false, null, 500, String(error));
  }
} else {
  res = await files.save(d, docs.handle(id), as);
}
if(res.ok){storageProgress.update(operationId,1,'FLUSH');
storageProgress.finish(operationId,'SUCCESS');
if(!docs.get(id).ok)return;
docs.setSaved(id,res.data.handle,res.data.name,revision);
if(res.data.handle && !virtualSessions.has(id)){monitor.watch(id,d.content);
if(docs.get(id).data.revision!==revision)monitor.onEdit(id);
}
else syncStates.set(id,'UNVERIFIED');
refresh();
restorePosition(id);
scheduleRecovery();
status(t(res.data.download?'downloaded':'saved'));
}
else {storageProgress.finish(operationId,'ERROR');
syncStates.set(id,'ERROR');
status(res.message||t('saveFailed'));}
}

async function createVirtual(item) {
  const result = docs.create(item.name, '', item.handle);
  const id = result.data.id;
  const session = new VirtualFileSession(id, item.blob);
  virtualSessions.set(id, session);
  active = id;
  refresh();
  const initId = storageProgress.start(id, 'INDEX', session.sliceCount);
  syncStates.set(id, 'LOADING');
  try {
    await session.indexLines(progress => storageProgress.update(initId, progress.completed, 'INDEX'));
    storageProgress.finish(initId, 'SUCCESS');
    await renderVirtualSlice(id);
  } catch (error) {
    storageProgress.finish(initId, 'ERROR');
    syncStates.set(id, 'ERROR');
    status('File indexing failed: ' + String(error));
  }
  editor.focus({preventScroll: true});
  scheduleRecovery();
}

async function renderVirtualSlice(id, center = null) {
  const session = virtualSessions.get(id);
  if (!session) return;
  const generation = ++virtualRenderGeneration;
  syncStates.set(id, 'LOADING');
  const index = center === null ? session.center : center;
  // Only the requested physical slice is materialized; no neighbor preloading.
  const total = 1;
  const operationId = storageProgress.start(id, 'LOAD', total);
  let succeeded = false;
  try {
    await virtualEditQueue;
    if (generation !== virtualRenderGeneration || active !== id) return;
    const result = await session.window(index, progress => {
      storageProgress.update(operationId, progress.completed, 'READ');
    });
    if (generation !== virtualRenderGeneration || active !== id) return;
    if (!result.ok) throw new Error(result.message || 'Slice load failed');
    const current = result.data.slices.find(item => item.index === index);
    if (!current || typeof current.content !== 'string') {
      throw new Error('Requested slice is unavailable');
    }
    editor.value = current.content;
    editor.dataset.doc = id;
    const position = session.getPosition(index);
    if (position) {
      editor.setSelectionRange(
        Math.min(position.selectionStart, editor.value.length),
        Math.min(position.selectionEnd, editor.value.length)
      );
      editor.scrollTop = position.scrollTop;
      editor.scrollLeft = position.scrollLeft;
    } else {
      editor.setSelectionRange(0, 0);
      editor.scrollTop = 0;
      editor.scrollLeft = 0;
    }
    const firstLine = current.content.split('\n').length;
    const lineStart = session.lineStarts?.[index] || 1;
    $('#gutter').textContent = Array.from(
      {length: firstLine}, (_, i) => String(lineStart + i)
    ).join('\n');
    $('#sliceControls').hidden = true;
    status('Loaded slice ' + (index + 1) + ' / ' + session.sliceCount);
    $('#gutter').scrollTop = editor.scrollTop;
    updatePos();
    scheduleRecovery();
    storageProgress.update(operationId, total, 'READ');
    succeeded = true;
    syncStates.set(id, session.dirty ? 'DIVERGED' : 'UNVERIFIED');
  } catch (error) {
    if (generation === virtualRenderGeneration && active === id) {
      syncStates.set(id, 'ERROR');
      status('Slice load failed: ' + String(error));
      omu.emit('VirtualEditor', 'Load', 500, String(error), true);
    }
  } finally {
    storageProgress.finish(operationId, succeeded ? 'SUCCESS' : 'ERROR');
    if (generation === virtualRenderGeneration && active === id &&
        syncStates.get(id) === 'LOADING') syncStates.set(id, 'ERROR');
    updateEditorLock();
  }
}

async function moveVirtual(delta) {
  if (!active || !virtualSessions.has(active)) return;
  const id = active;
  const session = virtualSessions.get(id);
  session.setPosition(session.center, {
    scrollTop: editor.scrollTop,
    scrollLeft: editor.scrollLeft,
    selectionStart: editor.selectionStart,
    selectionEnd: editor.selectionEnd
  });
  const next = Math.max(0, Math.min(
    session.sliceCount - 1, session.center + delta
  ));
  await renderVirtualSlice(id, next);
}

$('#slicePrevious').addEventListener('click', () => moveVirtual(-1));
$('#sliceNext').addEventListener('click', () => moveVirtual(1));

const actions={new:()=>create(),open:()=>openFiles(),save:()=>doSave(),saveas:()=>doSave(true),close:()=>active&&closeDoc(active),closeall:()=>{for(const id of docs.ids())closeDoc(id);
}};
$('#menuBtn').onclick=()=>{$('#menu').hidden=!$('#menu').hidden;
};
$('#menu').onclick=e=>{const key=e.target.dataset.action;
if(actions[key]){actions[key]();
$('#menu').hidden=true;
}};
document.addEventListener('click',e=>{if(!e.target.closest('.menu-wrap'))$('#menu').hidden=true;});
$('#fileInput').onchange=async e=>{const items=await files.open(e.target.files);
for (const item of items) await createVirtual(item);
e.target.value='';
};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();doSave(e.shiftKey);}
if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'){e.preventDefault();create();}
if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='o'){e.preventDefault();openFiles();}});
window.addEventListener('beforeunload',e=>{if(docs.ids().some(id=>docs.get(id).data.dirty)){e.preventDefault();e.returnValue='';}});
async function openFiles(){if('showOpenFilePicker' in window){try{const items=await files.openWithHandle();
for (const item of items) await createVirtual(item);
return;
}catch(e){if(e.name==='AbortError')return;
omu.emit('FileManager','Open',500,String(e),true);
status(String(e));
return;
}}$('#fileInput').click();
}
function renderSyncStatus() {
  const state = active ? syncStates.get(active) : 'UNVERIFIED';
  const progress = active ? storageProgress.get(active) : null;
  const colors = {
    SYNCED: '#22C55E', DIVERGED: '#EAB308', ERROR: '#EF4444',
    LOADING: '#3B82F6', SAVING: '#3B82F6',
    CONFLICT: '#F97316', ABORTED: '#EF4444', UNVERIFIED: '#64748B'
  };
  const bar = $('#meterFill');
  const percent = progress && progress.state === 'RUNNING'
    ? progress.progressPercent : null;
  const saving = state === 'SAVING' || state === 'LOADING';
  updateEditorLock();
  bar.style.width = saving && percent !== null ? percent + '%' : '100%';
  bar.style.background = colors[state] || colors.UNVERIFIED;
  bar.parentElement.classList.toggle('indeterminate', saving && percent === null);
  const label = state === 'LOADING' && progress?.state === 'RUNNING'
    ? (progress.operationType === 'INDEX' ? 'INDEXING' : 'LOADING') + ' (' + progress.completedUnits + '/' +
      (progress.totalUnits ?? '?') + ' slices)'
    : saving && percent !== null ? state + ' ' + percent + '%' : state;
  const percentage = $('#meterPercent');
  percentage.hidden = !saving;
  percentage.textContent = percent === null ? '…' : percent + '%';
  bar.parentElement.title = label;
  bar.parentElement.setAttribute('role', 'progressbar');
  bar.parentElement.setAttribute('aria-label', label);
  bar.parentElement.setAttribute('aria-valuemin', '0');
  bar.parentElement.setAttribute('aria-valuemax', '100');
  if (saving && percent === null) {
    bar.parentElement.removeAttribute('aria-valuenow');
  } else {
    bar.parentElement.setAttribute('aria-valuenow', String(percent ?? 100));
  }
  $('#syncLabel').textContent = label;
  updateEditorLock();
}
storageProgress.subscribe(operation => {
  if (operation.documentId === active) renderSyncStatus();
});
syncStates.subscribe((id)=>{if(id===active)renderSyncStatus();});
$('#priority').value=GLOBALS.get('STORAGE_PRIORITY');
$('#priority').addEventListener('change',()=>{GLOBALS.set('STORAGE_PRIORITY',$('#priority').value);omu.emit('STORAGE_PRIORITY','Set',200);monitor.checkAll();});
setInterval(()=>{if(!document.hidden)monitor.checkAll();},2500);
window.addEventListener('focus',()=>monitor.checkAll());
// Read-only diagnostics, not a remote HTTP endpoint.
const dependencies=Object.freeze([
  Object.freeze({from:'UI',to:'Documents',type:'Request/Response'}),
  Object.freeze({from:'UI',to:'FileManager',type:'Request/Response'}),
  Object.freeze({from:'Documents',to:'OMU',type:'LOG'}),
  Object.freeze({from:'FileManager',to:'OMU',type:'LOG'}),
  Object.freeze({from:'FileMenu',to:'LANGUAGE',type:'Request/Response'}),
  Object.freeze({from:'LANGUAGE',to:'UI',type:'Subscribe'})
]);
const copyDependencies=()=>dependencies.map(d=>({...d}));
const selectLogs=(options={},onlyEhu=false)=>{
  if(options===null||typeof options!=='object'||Array.isArray(options))return Object.freeze({ok:false,code:400,message:'Options must be an object'});
  const {limit,code,source}=options;
  if(limit!==undefined&&(!Number.isInteger(limit)||limit<0))return Object.freeze({ok:false,code:400,message:'limit must be a nonnegative integer'});
  if(code!==undefined&&(!Number.isInteger(code)||code<100||code>599))return Object.freeze({ok:false,code:400,message:'code must be an HTTP-like status number'});
  if(source!==undefined&&typeof source!=='string')return Object.freeze({ok:false,code:400,message:'source must be a string'});
  let entries=omu.logs().filter(e=>(!onlyEhu||e.ehu)&&(code===undefined||e.code===code)&&(source===undefined||e.source===source));
  if(limit!==undefined)entries=limit===0?[]:entries.slice(-limit);
  return entries;
};
const consoleApi=Object.freeze({
  log:(options={})=>selectLogs(options),
  ehu:(options={})=>selectLogs(options,true),
  dep:()=>copyDependencies(),
  help:()=>Object.freeze(['Cluster.log()','Cluster.log({limit:20})','Cluster.log({code:404})','Cluster.ehu()','Cluster.dep()'])
});
Object.defineProperty(window,'Cluster',{value:consoleApi,writable:false,configurable:false});
window.ClusterOpt=Object.freeze({clearRecovery:()=>olr.clearAll(),fmcStatus:()=>({loadedSlices:fmc.loadedSliceCount}),
  loadSliceWindow: async (documentId, blob, center = 0) => {
    const attached = sliceLoader.attach(documentId, blob);
    if (!attached.ok) return attached;
    return windowLoader.loadWindow(documentId, center, attached.data.sliceCount);
  },language:()=>LANGUAGE.value,setLanguage:value=>LANGUAGE.set(value),palette:()=>UI_PALETTE.value,setPalette:rgb=>UI_PALETTE.set(rgb),logs:()=>omu.logs(),dependencies:copyDependencies});
refresh();

function renderLanguage() {
  document.documentElement.lang=LANGUAGE.value;
  document.title='Cluster Opt 8';
  $('#menuBtn').textContent=t('file')+'⌄';
  for (const key of ['new','open','save','saveas','close','closeall']) {
    const button=$('#menu [data-action="'+key+'"]');
    if (button) button.textContent=t(key);
  }
  $('#languageBtn').textContent=t('language')+' ›';
  $('#toolBtn').textContent=t('tool')+' ›';
  $('#paletteBtn').textContent=t('palette')+' ›';
  $('#paletteLabel').textContent=t('paletteRGB');
  $('#paletteTitle').textContent=t('palette');
  $('#paletteDark').textContent=t('darkEndpoint');
  $('#paletteLight').textContent=t('lightEndpoint');
  $('#paletteHint').textContent=t('paletteHint');
  $('#palettePresetLabel').textContent=t('palettePresets');
  $('#paletteFooterHint').textContent=t('paletteAutosave');
  $('#paletteDone').textContent=t('done');
  $('#paletteClose').setAttribute('aria-label',t('closeDialog'));
  $('#empty p').textContent=t('empty');
  $('#editor').setAttribute('aria-label',t('editor'));
  $('#priority').title=t('priority');
  $('#priority option[value="internal"]').textContent=t('internal');
  $('#priority option[value="external"]').textContent=t('external');
  $('#fileType').textContent=t('plain');
  for (const button of document.querySelectorAll('[data-locale]')) {
    button.querySelector('.locale-check').textContent=
      button.dataset.locale===LANGUAGE.value?'✓':'';
    button.setAttribute('aria-pressed',String(button.dataset.locale===LANGUAGE.value));
  }
const statusText=$('#status').dataset.statusKey||'ready';
  status(t(statusText));
  refresh();
}
LANGUAGE.subscribe(()=>{renderLanguage();omu.emit('LANGUAGE','Set',200);});
$('#languageBtn').addEventListener('click',event=>{
  event.stopPropagation();
  const options=$('#languageOptions');
  options.hidden=!options.hidden;
  $('#languageBtn').setAttribute('aria-expanded',String(!options.hidden));
});
$('#languageOptions').addEventListener('click',event=>{
  const button=event.target.closest('[data-locale]');
  if (!button) return;
  const result=LANGUAGE.set(button.dataset.locale);
  if (!result.ok) omu.emit('LANGUAGE','Set',result.code,result.message,true);
  $('#languageOptions').hidden=true;
  $('#languageBtn').setAttribute('aria-expanded','false');
  $('#menu').hidden=true;
});
renderLanguage();

/* Opt 6: the UI reads and writes only the public UI_PALETTE contract. */
function updatePaletteControls() {
  const rgb = UI_PALETTE.value;
  const hex = rgb.map(value => value.toString(16).padStart(2, '0')).join('');
  $('#palettePicker').value = '#' + hex;
  $('#paletteHex').textContent = '#' + hex.toUpperCase();
  $('#paletteMode').textContent = UI_PALETTE.mode.toUpperCase();

  document.querySelectorAll('[data-rgb]').forEach(input => {
    input.value = rgb[Number(input.dataset.rgb)];
  });
}

function setPalette(rgb) {
  const result = UI_PALETTE.set(rgb);

  if (!result.ok) {
    omu.emit('UI_PALETTE', 'Set', result.code, result.message, true);
    return;
  }

  omu.emit('UI_PALETTE', 'Set', 200);
  updatePaletteControls();
}

$('#toolBtn').addEventListener('click', event => {
  event.stopPropagation();
  const options = $('#toolOptions');
  options.hidden = !options.hidden;
  $('#toolBtn').setAttribute('aria-expanded', String(!options.hidden));
});

const paletteDialog = $('#paletteDialog');

$('#paletteBtn').addEventListener('click', event => {
  event.stopPropagation();
  $('#menu').hidden = true;
  $('#toolOptions').hidden = true;
  $('#toolBtn').setAttribute('aria-expanded', 'false');
  updatePaletteControls();
  paletteDialog.showModal();
});

$('#paletteClose').addEventListener('click', () => paletteDialog.close());
$('#paletteDone').addEventListener('click', () => paletteDialog.close());

paletteDialog.addEventListener('click', event => {
  if (event.target === paletteDialog) paletteDialog.close();
});

$('#palettePicker').addEventListener('input', event => {
  const hex = event.target.value;
  const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
  setPalette(rgb);
});

document.querySelectorAll('[data-rgb]').forEach(input => {
  input.addEventListener('change', () => {
    const values = [...document.querySelectorAll('[data-rgb]')]
      .map(element => Number(element.value));
    setPalette(values);
  });
});

$('#paletteDark').addEventListener('click', () => setPalette([0, 0, 0]));
$('#paletteLight').addEventListener('click', () => setPalette([255, 255, 255]));
UI_PALETTE.subscribe(updatePaletteControls);
updatePaletteControls();

// Restore virtual drafts and small documents after reload.
(async () => {
  try {
    const records = await olr.restoreAll();
    const workspace = records.find(record => record.documentId === 'workspace');
    if (!workspace?.documents?.length || docs.ids().length) return;
    restoring = true;
    const mapping = new Map();
    for (const item of workspace.documents) {
      try {
        if (item.virtual) {
          let blob = item.blob;
          if (!blob && item.handle) {
            const permission = await item.handle.queryPermission({mode: 'read'});
            if (permission !== 'granted') {
              status('File access needs permission: ' + item.name);
              continue;
            }
            blob = await item.handle.getFile();
          }
          if (!blob) continue;
          const created = docs.create(item.name, '', item.handle || null);
          const id = created.data.id;
          const session = new VirtualFileSession(id, blob);
          virtualSessions.set(id, session);
          mapping.set(item.id, id);
          await session.indexLines();
          await session.restoreEdits(item.edits);
          const center = Math.min(Math.max(0, item.center || 0), session.sliceCount - 1);
          session.setPosition(center, item.position || {
            scrollTop: 0, scrollLeft: 0, selectionStart: 0, selectionEnd: 0
          });
          await session.window(center);
          continue;
        }
        if (typeof item.content !== 'string') continue;
        const created = docs.create(item.name, item.content);
        const id = created.data.id;
        mapping.set(item.id, id);
        if (item.dirty) docs.update(id, item.content);
        if (item.position) viewPositions.set(id, item.position);
      } catch (error) {
        omu.emit('OLR', 'RestoreDocument', 500, item.name + ': ' + String(error), true);
      }
    }
    active = mapping.get(workspace.active) || docs.ids()[0] || null;
    refresh();
    if (active && virtualSessions.has(active)) {
      await renderVirtualSlice(active, virtualSessions.get(active).center);
    } else restorePosition(active);
    status('Recovered editor session');
  } catch (error) {
    omu.emit('OLR', 'Restore', 500, String(error), true);
  } finally {
    restoring = false;
  }
})();

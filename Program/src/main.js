import {createClusterDependencies} from './dependency-registry.js';
import {VirtualFileSession} from './fmc/virtual-file-session.js';
import {FileTypeIdentifier} from './fmc/file-type-identifier.js';
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
import {LanguageProperty} from './language.js?v=20261114-i18n-v2';
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
const binaryDocuments = new Map();
const FTI = new FileTypeIdentifier();
const virtualRenderGenerations = new Map();
const savingDocuments = new Set();
const saveAbortControllers = new Map();
const backgroundIndexing = new Set();
const rebuildingDocuments = new Set();
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
GLOBALS.register('FILE_TYPE_IDENTIFIER', FTI);
const monitor=new ExternalChangeMonitor(docs,syncStates,GLOBALS);
let active=null;
function capturePosition(id = active) {
  if (!id || editor.dataset.doc !== id) return;
  viewPositions.set(id, {
    // OLR viewport coordinate: scroll offset, not caret line.
    scrollTop: editor.scrollTop,
    scrollLeft: editor.scrollLeft,
    selectionStart: editor.selectionStart,
    selectionEnd: editor.selectionEnd
  });
}
function restorePosition(id = active) {
  const position = viewPositions.get(id);
  if (!position || editor.dataset.doc !== id) return;
  editor.setSelectionRange(position.selectionStart ?? 0, position.selectionEnd ?? 0);
  editor.scrollTop = position.scrollTop ?? 0;
  editor.scrollLeft = position.scrollLeft ?? 0;
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
            // Never assume a session exposes a Blob (older cached modules may
            // lack the sourceBlob accessor). Persist edits independently.
            blob: session.sourceBlob instanceof Blob &&
              (!docs.handle(id) || session.sourceBlob.size <= 16 * 1024 * 1024)
              ? session.sourceBlob : null,
            edits: session.recoveryEdits,
            forceText: session.forceText,
            center: session.center,
            position: session.getPosition(session.center) || null
          };
        }
        if (binaryDocuments.has(id)) {
          const binary = binaryDocuments.get(id);
          return {id, name: data.name, binary: true, handle: docs.handle(id) || null,
            blob: !docs.handle(id) && binary.blob.size <= 16 * 1024 * 1024 ? binary.blob : null,
            content: binary.content, previewBytes: binary.previewBytes, dirty: binary.dirty};
        }
        return {id, name: data.name, content: data.content,
          dirty: data.dirty, position: viewPositions.get(id) || null};
      }).filter(item => item.virtual || item.binary ||
        (typeof item.content === 'string' && item.content.length <= 2 * 1024 * 1024));
      await olr.save('workspace', {active, documents: snapshots});
    } catch (error) {
      omu.emit('OLR', 'Persist', 500, String(error), true);
      status('Recovery persistence failed: ' + String(error));
    }
  }, 350);
}

const $=s=>document.querySelector(s),editor=$('#editor');
function localizeStatusMessage(raw) {
  if (raw === '就緒' || raw === 'Ready') return t('ready');
  if (raw === '未儲存' || raw === 'Unsaved') return t('unsaved');
  if (raw === '已儲存' || raw === 'Saved') return t('saved');
  const slice = /^(?:Loaded slice|已載入切片) ([0-9]+) \/ ([0-9]+)$/.exec(raw);
  if (slice) return t('statusLoadedSlice', slice[1], slice[2]);
  return raw;
}
function status(msg){
  const el = $('#status');
  el.dataset.rawMessage = String(msg);
  el.textContent = localizeStatusMessage(String(msg));
  el.title = el.textContent;
}
function updateEditorLock() {
  // A blue operation is advisory, not a blanket editing lock. Editing an
  // already materialized slice interrupts its active save safely.
  const unavailable = !!active && virtualSessions.has(active) &&
    (editor.dataset.doc !== active || !editor.dataset.sliceReady);
  editor.readOnly = unavailable;
  editor.setAttribute('aria-readonly', String(unavailable));
  editor.title = unavailable ? 'Waiting for the first editable slice' : '';
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
if(d){const changedDocument = editor.dataset.doc !== active;
if(changedDocument){
  editor.value = binaryDocuments.has(active) ? binaryDocuments.get(active).content : virtualSessions.has(active) ? '' : d.content;
  editor.dataset.doc=active;
  editor.dataset.sliceReady = virtualSessions.has(active) ? '' : 'true';
}
$('#filename').textContent=d.name+(d.dirty?' *':'');
if (virtualSessions.has(active)) {
  const session = virtualSessions.get(active);
  if (changedDocument || rebuildingDocuments.has(active)) $('#gutter').textContent = '…';
} else {
  updateLines();
}
}
else{$('#filename').textContent=t('unnamed');
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
  if (savingDocuments.has(id) || backgroundIndexing.has(id) || rebuildingDocuments.has(id)) {
    // Preserve operation progress. A slice will be displayed after the operation.
    renderSyncStatus();
  } else if (virtualSessions.has(id)) {
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
binaryDocuments.delete(id);
rebuildingDocuments.delete(id);
virtualRenderGenerations.delete(id);
viewPositions.delete(id);
docs.close(id);
if(active===id){
  active=docs.ids().at(-1)||null;
  if(active) switchDoc(active);
  else refresh();
} else refresh();
scheduleRecovery();
}
function updateLines(){
  const count = editor.value.split('\n').length;
  const tree = new LineTree([count]);
  $('#gutter').textContent = Array.from({length: tree.total}, (_, i) => i + 1).join('\n');
}
/**
 * Navigate only after the target physical slice has finished loading.
 * Binary search uses the indexed first line of each slice.
 */
async function goToLine(lineNumber) {
  const id = active;
  if (!id || !Number.isSafeInteger(lineNumber) || lineNumber < 1) {
    status(t('goLineInvalid'));
    return;
  }
  const session = virtualSessions.get(id);
  const totalLines = session ? session.totalLines : editor.value.split('\n').length;
  if (lineNumber > totalLines) {
    status(t('goLineOutOfRange',totalLines));
    return;
  }
  const input = $('#goLineInput');
  const button = $('#goLineButton');
  input.disabled = true;
  button.disabled = true;
  try {
    if (session) {
      if (!session.lineStarts?.length) throw new Error(t('goLineIndexMissing'));
      let low = 0;
      let high = session.lineStarts.length - 1;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (session.lineStarts[middle] <= lineNumber) low = middle;
        else high = middle - 1;
      }
      const targetSlice = low;
      syncStates.set(id, 'LOADING');
      status(t('goLineLoading'));
      await renderVirtualSlice(id, targetSlice);
      if (active !== id || session.center !== targetSlice) return;
      if (syncStates.get(id) === 'ERROR') throw new Error(t('goLineLoadFailed'));
      const relativeLine = lineNumber - session.lineStarts[targetSlice];
      const lines = editor.value.split('\n');
      const offset = lines.slice(0, relativeLine).reduce(
        (sum, text) => sum + text.length + 1, 0
      );
      editor.setSelectionRange(offset, offset);
      const lineHeight = Number.parseFloat(getComputedStyle(editor).lineHeight) || 22;
      editor.scrollTop = Math.max(0, relativeLine * lineHeight - editor.clientHeight / 3);
      $('#gutter').scrollTop = editor.scrollTop;
      session.setPosition(targetSlice, {
        scrollTop: editor.scrollTop, scrollLeft: editor.scrollLeft,
        selectionStart: offset, selectionEnd: offset
      });
    } else {
      const lines = editor.value.split('\n');
      const offset = lines.slice(0, lineNumber - 1).reduce(
        (sum, text) => sum + text.length + 1, 0
      );
      editor.setSelectionRange(offset, offset);
      const lineHeight = Number.parseFloat(getComputedStyle(editor).lineHeight) || 22;
      editor.scrollTop = Math.max(0, (lineNumber - 1) * lineHeight - editor.clientHeight / 3);
      $('#gutter').scrollTop = editor.scrollTop;
    }
    updatePos();
    editor.focus({preventScroll: true});
    status('已跳轉至第 ' + lineNumber + ' 行');
    scheduleRecovery();
  } catch (error) {
    syncStates.set(id, 'ERROR');
    omu.emit('EditorWindow', 'GoToLine', 500, String(error), true);
    status('跳轉失敗：' + String(error));
  } finally {
    input.disabled = false;
    button.disabled = false;
  }
}
$('#goLineButton').addEventListener('click', () =>
  goToLine(Number($('#goLineInput').value)));
$('#goLineInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') goToLine(Number(event.currentTarget.value));
});
function updatePos(){const p=editor.selectionStart||0,txt=editor.value.slice(0,p),lines=txt.split('\n');
$('#position').textContent=t('position',lines.length,lines.at(-1).length+1);
}
editor.addEventListener('input',()=>{if(!active || editor.readOnly)return;
const abortSave = saveAbortControllers.get(active);
if (abortSave && !abortSave.signal.aborted) {
  abortSave.abort();
  omu.emit('Storage', 'SaveInterruptedByEdit', 409, 'User edited during save');
}
if (binaryDocuments.has(active)) {
  const record = binaryDocuments.get(active);
  record.content = editor.value;
  record.dirty = true;
  docs.update(active, '');
  syncStates.set(active, 'DIVERGED');
  updateLines(); updatePos();
  $('#filename').textContent = docs.get(active).data.name + ' *';
  scheduleRecovery();
  return;
}
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
// Native wheel input continues into adjacent slices without a footer control.
editor.addEventListener('wheel', event => {
  if (!active || !virtualSessions.has(active) || editor.readOnly ||
      virtualScrollBusy || event.deltaY === 0) return;
  const session = virtualSessions.get(active);
  const max = Math.max(0, editor.scrollHeight - editor.clientHeight);
  const next = event.deltaY > 0 && editor.scrollTop >= max - 2
    ? session.center + 1
    : event.deltaY < 0 && editor.scrollTop <= 2
      ? session.center - 1 : session.center;
  if (next === session.center || next < 0 || next >= session.sliceCount) return;
  const now = Date.now();
  if (now - (virtualScrollCooldown.get(active) || 0) < 300) return;
  event.preventDefault();
  virtualScrollCooldown.set(active, now);
  const id = active;
  virtualScrollBusy = true;
  renderVirtualSlice(id, next).then(() => {
    if (active === id && event.deltaY < 0) {
      editor.scrollTop = Math.max(0, editor.scrollHeight - editor.clientHeight);
    }
  }).finally(() => { virtualScrollBusy = false; });
}, {passive: false});
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
if (savingDocuments.has(id) || backgroundIndexing.has(id) || rebuildingDocuments.has(id)) return;
capturePosition(id);
if (binaryDocuments.has(id)) {
  const data = binaryDocuments.get(id);
  try {
    const bytes = new Uint8Array(data.content.length);
    for (let i = 0; i < bytes.length; i++) {
      const value = data.content.charCodeAt(i);
      if (value > 255) throw new Error('Byte view requires U+0000–U+00FF at offset ' + i);
      bytes[i] = value;
    }
    let handle = as ? null : docs.handle(id);
    if (!handle && 'showSaveFilePicker' in window)
      handle = await window.showSaveFilePicker({suggestedName: docs.get(id).data.name});
    if (!handle) throw new Error('Binary save requires a writable file handle');
    const writable = await handle.createWritable();
    try {
      await writable.write(bytes);
      if (data.blob.size > data.previewBytes) await writable.write(data.blob.slice(data.previewBytes));
      await writable.close();
    } catch (error) {
      await writable.abort().catch(() => {});
      throw error;
    }
    data.blob = await handle.getFile();
    data.previewBytes = bytes.length;
    data.dirty = false;
    docs.setSaved(id, handle, handle.name, docs.get(id).data.revision);
    syncStates.set(id, 'SYNCED');
    if (active === id) status('Binary bytes saved without lossy encoding');
    scheduleRecovery();
  } catch (error) {
    syncStates.set(id, 'ERROR');
    omu.emit('FTI', 'BinarySave', 500, String(error), true);
    if (active === id) status('Binary save failed: ' + String(error));
  }
  return;
}
const operationId=storageProgress.start(
  id, 'SAVE', virtualSessions.has(id) ? virtualSessions.get(id).sliceCount : 1
);
const saveController = new AbortController();
saveAbortControllers.set(id, saveController);
savingDocuments.add(id);
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
    const session = virtualSessions.get(id);
    const savedCenter = session.center;
    const savedPosition = session.getPosition(savedCenter);
    await session.save(handle, progress => {
      storageProgress.update(operationId, progress.completed, 'FLUSH');
    }, saveController.signal);
    storageProgress.finish(operationId, 'SUCCESS');
    savingDocuments.delete(id);
    saveAbortControllers.delete(id);
    const reindexId = storageProgress.start(id, 'INDEX', session.sliceCount);
    rebuildingDocuments.add(id);
    backgroundIndexing.add(id);
    syncStates.set(id, 'LOADING');
    try {
      await session.indexLines(progress =>
        storageProgress.update(reindexId, progress.completed, 'INDEX'));
      storageProgress.finish(reindexId, 'SUCCESS');
      const center = Math.min(savedCenter, session.sliceCount - 1);
      if (savedPosition) session.setPosition(center, savedPosition);
      // Finish the background INDEX before rendering; avoid replacing its progress.
      // The saved viewport is loaded after the lock is released.
    } catch (error) {
      storageProgress.finish(reindexId, 'ERROR');
      throw error;
    } finally {
      rebuildingDocuments.delete(id);
      backgroundIndexing.delete(id);
      if (active === id) renderSyncStatus();
    }
    if (active === id) await renderVirtualSlice(id, Math.min(savedCenter, session.sliceCount - 1));
    res = contract(true, {handle, name: handle.name});
  } catch (error) {
    res = contract(false, null, 500, String(error));
  }
} else {
  res = await files.save(d, docs.handle(id), as);
}
savingDocuments.delete(id);
if (saveAbortControllers.get(id) === saveController) saveAbortControllers.delete(id);
if(res.ok){storageProgress.update(operationId,1,'FLUSH');
storageProgress.finish(operationId,'SUCCESS');
if(!docs.get(id).ok)return;
docs.setSaved(id,res.data.handle,res.data.name,revision);
if(res.data.handle && !virtualSessions.has(id)){monitor.watch(id,d.content);
if(docs.get(id).data.revision!==revision)monitor.onEdit(id);
}
syncStates.set(id, docs.get(id).data.revision === revision && res.data.handle ? 'SYNCED' : 'DIVERGED');
if (active === id) {
  refresh();
  if (!virtualSessions.has(id)) restorePosition(id);
}
scheduleRecovery();
if (active === id) status(t(res.data.download?'downloaded':'saved'));
}
else {storageProgress.finish(operationId, saveController.signal.aborted ? 'ABORTED' : 'ERROR');
syncStates.set(id, saveController.signal.aborted ? 'DIVERGED' : 'ERROR');
if (active === id) status(saveController.signal.aborted ? 'Save interrupted by editing; unsaved edits retained' : (res.message||t('saveFailed')));}
}

async function findOpenDocument(item) {
  for (const id of docs.ids()) {
    const current = docs.get(id).data;
    const handle = docs.handle(id);
    if (handle && item.handle && typeof handle.isSameEntry === 'function') {
      try { if (await handle.isSameEntry(item.handle)) return id; }
      catch (error) { omu.emit('Documents', 'CompareHandle', 409, String(error)); }
    }
    // Fallback only for unhandled file inputs; avoid merging distinct files
    // with identical names when both have stable filesystem handles.
    if (!handle && !item.handle && current.name === item.name &&
        virtualSessions.has(id)) return id;
  }
  return null;
}
async function askForceBinary(name, reason) {
  const dialog = $('#ftiDialog');
  $('#ftiFileName').textContent = name;
  $('#ftiReason').textContent = reason;
  return new Promise(resolve => {
    const cancel = $('#ftiCancel');
    const force = $('#ftiForce');
    let finished = false;
    const settle = value => {
      if (finished) return;
      finished = true;
      cancel.removeEventListener('click', onCancel);
      force.removeEventListener('click', onForce);
      dialog.removeEventListener('close', onClose);
      if (dialog.open) dialog.close();
      resolve(value);
    };
    const onCancel = () => settle(false);
    const onForce = () => settle(true);
    const onClose = () => settle(false);
    cancel.addEventListener('click', onCancel);
    force.addEventListener('click', onForce);
    dialog.addEventListener('close', onClose);
    dialog.showModal();
    cancel.focus();
  });
}
async function createBinary(item, type) {
  const existing = await findOpenDocument(item);
  if (existing) { switchDoc(existing); return; }
  const created = docs.create(item.name, '', item.handle);
  const id = created.data.id;
  // Byte-to-codepoint mapping is reversible (0x00–0xFF), unlike UTF-8 replacement.
  // Only materialize the first 256 KiB; preserve the untouched tail as raw Blob.
  const previewBytes = Math.min(item.blob.size, 256 * 1024);
  const bytes = new Uint8Array(await item.blob.slice(0, previewBytes).arrayBuffer());
  let content = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    content += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  binaryDocuments.set(id, {blob: item.blob, type, content, previewBytes, dirty: false});
  active = id;
  syncStates.set(id, item.handle ? 'SYNCED' : 'UNVERIFIED');
  refresh();
  status(type.kind + ' · byte view (first ' + previewBytes +
    ' bytes editable; remaining bytes preserved)');
  scheduleRecovery();
}
function attachFlagEvents(session) {
  session.onFlagEvent(event => {
    // OMU owns the event stream; never log lease tokens or raw slice content.
    if (event.code >= 400 || event.type === 'FLAG_REVOKED_BY_USER' ||
        event.type === 'ORF_REVOKED') {
      omu.emit('FlagUnit', event.type, event.code,
        [event.sliceId, event.ownerType, event.ownerId, event.reason].filter(Boolean).join(' | '),
        true);
    }
  });
}
async function createVirtual(item) {
  let type;
  try {
    type = await FTI.identify(item.blob, item.name);
  } catch (error) {
    omu.emit('FTI', 'Identify', 500, String(error), true);
    if (!await askForceBinary(item.name, String(error))) return;
    type = FTI.forceText();
  }
  if (type.mode === 'PROMPT') {
    omu.emit('FTI', 'Parse', 422, type.ehu, true);
    if (!await askForceBinary(item.name, '無法確認 UTF-8 編碼，是否以文字模式強制載入？無法解碼的字元會顯示為替代符號。')) return;
    type = FTI.forceText();
  }
  if (type.mode === 'BINARY') {
    await createBinary(item, type);
    return;
  }
  const existing = await findOpenDocument(item);
  if (existing) {
    switchDoc(existing);
    return;
  }
  const result = docs.create(item.name, '', item.handle);
  const id = result.data.id;
  const session = new VirtualFileSession(id, item.blob, {forceText: type.mode === 'FORCE_TEXT'});
  attachFlagEvents(session);
  virtualSessions.set(id, session);
  active = id;
  refresh();
  backgroundIndexing.add(id);
  const initId = storageProgress.start(id, 'INDEX', session.sliceCount);
  syncStates.set(id, 'LOADING');
  let indexed = false;
  try {
    await session.indexLines(progress => storageProgress.update(initId, progress.completed, 'INDEX'));
    storageProgress.finish(initId, 'SUCCESS');
    indexed = true;
  } catch (error) {
    storageProgress.finish(initId, 'ERROR');
    syncStates.set(id, 'ERROR');
    if (active === id) status('File indexing failed: ' + String(error));
  } finally {
    backgroundIndexing.delete(id);
    if (active === id) renderSyncStatus();
  }
  if (indexed) {
    if (active === id) await renderVirtualSlice(id);
    else await reconcileLoadedDocument(id);
  }
  editor.focus({preventScroll: true});
  scheduleRecovery();
}

/**
 * Reconcile persisted recovery records with FMC/MVCC state after loading.
 * A missing handle or a failed recovery query is not proof of synchronization.
 */
async function reconcileLoadedDocument(id) {
  const document = docs.get(id);
  if (!document.ok) return;
  const session = virtualSessions.get(id);
  const handle = docs.handle(id);
  if (document.data.dirty || session?.dirty) {
    syncStates.set(id, 'DIVERGED');
    return;
  }
  if (!handle) {
    syncStates.set(id, 'UNVERIFIED');
    return;
  }

  try {
    const records = await olr.restoreAll();
    const workspace = records.find(record => record.documentId === 'workspace');
    let recoverable = false;
    for (const saved of workspace?.documents || []) {
      const pending = saved.virtual
        ? Array.isArray(saved.edits) && saved.edits.length > 0
        : saved.dirty === true;
      if (!pending) continue;
      if (saved.handle && typeof handle.isSameEntry === 'function') {
        if (await handle.isSameEntry(saved.handle)) {
          recoverable = true;
          break;
        }
      } else if (!saved.handle && saved.id === id) {
        recoverable = true;
        break;
      }
    }
    // An edit or a new operation may have started during the IndexedDB read.
    if (!docs.get(id).ok || docs.get(id).data.dirty || session?.dirty) {
      syncStates.set(id, 'DIVERGED');
      return;
    }
    const running = storageProgress.get(id);
    if (running?.state === 'RUNNING') return;
    syncStates.set(id, recoverable ? 'DIVERGED' : 'SYNCED');
  } catch (error) {
    syncStates.set(id, 'UNVERIFIED');
    omu.emit('FMC', 'ReconcileRecovery', 500, String(error), true);
  }
}

async function renderVirtualSlice(id, center = null) {
  const session = virtualSessions.get(id);
  if (!session) return;
  if (savingDocuments.has(id) || backgroundIndexing.has(id)) return;
  const generation = (virtualRenderGenerations.get(id) || 0) + 1;
  virtualRenderGenerations.set(id, generation);
  syncStates.set(id, 'LOADING');
  const index = center === null ? session.center : center;
  // Only the requested physical slice is materialized; no neighbor preloading.
  const total = 1;
  const operationId = storageProgress.start(id, 'LOAD', total);
  let succeeded = false;
  try {
    await virtualEditQueue;
    if (generation !== virtualRenderGenerations.get(id) || active !== id) return;
    const result = await session.window(index, progress => {
      storageProgress.update(operationId, progress.completed, 'READ');
    });
    if (generation !== virtualRenderGenerations.get(id) || active !== id) return;
    if (!result.ok) throw new Error(result.message || 'Slice load failed');
    const current = result.data.slices.find(item => item.index === index);
    if (!current || typeof current.content !== 'string') {
      throw new Error('Requested slice is unavailable');
    }
    editor.value = current.content;
    editor.dataset.doc = id;
    editor.dataset.sliceReady = 'true';
    const position = session.getPosition(index);
    if (position) {
      // Restore the viewport first. Caret position must never dictate the view.
      editor.setSelectionRange(
        Math.min(position.selectionStart ?? 0, editor.value.length),
        Math.min(position.selectionEnd ?? 0, editor.value.length)
      );
      editor.scrollTop = position.scrollTop ?? 0;
      editor.scrollLeft = position.scrollLeft ?? 0;
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
    status('Loaded slice ' + (index + 1) + ' / ' + session.sliceCount);
    $('#gutter').scrollTop = editor.scrollTop;
    updatePos();
    scheduleRecovery();
    storageProgress.update(operationId, total, 'READ');
    succeeded = true;
    syncStates.set(id, session.dirty ? 'DIVERGED' : 'UNVERIFIED');
  } catch (error) {
    if (generation === virtualRenderGenerations.get(id) && active === id) {
      syncStates.set(id, 'ERROR');
      status('Slice load failed: ' + String(error));
      omu.emit('VirtualEditor', 'Load', 500, String(error), true);
    }
  } finally {
    storageProgress.finish(operationId, succeeded ? 'SUCCESS' : 'ERROR');
    if (succeeded) await reconcileLoadedDocument(id);
    if (generation === virtualRenderGenerations.get(id) && active === id &&
        syncStates.get(id) === 'LOADING') syncStates.set(id, 'ERROR');
    updateEditorLock();
  }
}


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
  const saving = state === 'SAVING' || state === 'LOADING' || progress?.state === 'RUNNING';
  updateEditorLock();
  bar.style.width = saving && percent !== null ? percent + '%' : '100%';
  const operationColor = progress?.state === 'RUNNING' &&
    ['SAVE', 'INDEX', 'LOAD'].includes(progress.operationType) ? '#3B82F6' : null;
  bar.style.background = operationColor || (state === 'SYNCED' ? '#22C55E' : colors[state] || colors.UNVERIFIED);
  bar.parentElement.classList.toggle('indeterminate', saving && percent === null);
  const stateLabel = t('state' + (state || 'UNVERIFIED'));
  const label = state === 'LOADING' && progress?.state === 'RUNNING'
    ? t('state' + (progress.operationType === 'INDEX' ? 'INDEXING' : 'LOADING')) +
      ' (' + progress.completedUnits + '/' + (progress.totalUnits ?? '?') + ' ' + t('slices') + ')'
    : saving && percent !== null ? stateLabel + ' ' + percent + '%' : stateLabel;
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
  $('#syncLabel').title = label;
  updateEditorLock();
}
storageProgress.subscribe(operation => {
  if (operation.documentId === active) {
    renderSyncStatus();
  }
});
syncStates.subscribe((id)=>{if(id===active)renderSyncStatus();});
$('#priority').value=GLOBALS.get('STORAGE_PRIORITY');
$('#priority').addEventListener('change',()=>{GLOBALS.set('STORAGE_PRIORITY',$('#priority').value);omu.emit('STORAGE_PRIORITY','Set',200);monitor.checkAll();});
setInterval(()=>{if(!document.hidden)monitor.checkAll();},2500);
window.addEventListener('focus',()=>monitor.checkAll());
// Read-only diagnostics, not a remote HTTP endpoint.
const dependencyRegistry = createClusterDependencies();
const copyDependencies = () => dependencyRegistry.edges();
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
  dep:(objectName=null)=>dependencyRegistry.dep(objectName),
  objects:()=>dependencyRegistry.list(),
  help:()=>Object.freeze(['Cluster.log()','Cluster.log({limit:20})','Cluster.log({code:404})','Cluster.ehu()','Cluster.dep()','Cluster.dep("FlagUnit")','Cluster.objects()'])
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
  document.title='Cluster Opt v0.0.12';
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
  $('#goLineBar').setAttribute('aria-label',t('goLineGroup'));
  $('#goLineBar label[for="goLineInput"]').textContent=t('goLineLabel');
  $('#goLineButton').textContent=t('goLineButton');
  $('#goLineBar .goLineHint').textContent=t('goLineHint');
  for (const button of document.querySelectorAll('[data-locale]')) {
    button.querySelector('.locale-check').textContent=
      button.dataset.locale===LANGUAGE.value?'✓':'';
    button.setAttribute('aria-pressed',String(button.dataset.locale===LANGUAGE.value));
  }
const currentStatus=$('#status').dataset.rawMessage;
  status(currentStatus || t('ready'));
  refresh();
  renderSyncStatus();
  updatePos();
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

// Prebuilt recovery window: metadata is visible before large-file indexing finishes.
// Recovery and indexing now report through the document-scoped footer tracker.
// Restore virtual drafts and small documents after reload.
(async () => {
  try {
    const records = await olr.restoreAll();
    const workspace = records.find(record => record.documentId === 'workspace');
    if (!workspace?.documents?.length || docs.ids().length) return;
    restoring = true;
    const firstVirtual = workspace.documents.find(item => item.virtual);
    // No blocking recovery overlay: progress is shown in the footer.
    const mapping = new Map();
    for (const item of workspace.documents) {
      try {
        if (item.binary) {
          let blob = item.blob;
          if (!blob && item.handle) {
            const permission = await item.handle.queryPermission({mode: 'read'});
            if (permission !== 'granted') continue;
            blob = await item.handle.getFile();
          }
          if (!blob) continue;
          const created = docs.create(item.name, '', item.handle || null);
          const id = created.data.id;
          binaryDocuments.set(id, {blob, type: {kind: 'BINARY', mode: 'BINARY'},
            content: item.content || '', previewBytes: item.previewBytes ?? Math.min(blob.size, 256 * 1024),
            dirty: !!item.dirty});
          if (item.dirty) docs.update(id, '');
          mapping.set(item.id, id);
          continue;
        }
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
          const session = new VirtualFileSession(id, blob, {forceText: item.forceText === true});
          attachFlagEvents(session);
          virtualSessions.set(id, session);
          mapping.set(item.id, id);
          if (!active) { active = id; refresh(); }
          rebuildingDocuments.add(id);
          backgroundIndexing.add(id);
          const indexing = storageProgress.start(id, 'INDEX', session.sliceCount);
          syncStates.set(id, 'LOADING');
          try {
            await session.indexLines(progress => {
              storageProgress.update(indexing, progress.completed, 'INDEX');
              // Footer subscribes to this document-scoped INDEX progress.
            });
            storageProgress.finish(indexing, 'SUCCESS');
          } catch (indexError) {
            storageProgress.finish(indexing, 'ERROR');
            throw indexError;
          }

          await session.restoreEdits(item.edits);
          if (item.edits?.length) docs.update(id, '');
          const center = Math.min(Math.max(0, item.center || 0), session.sliceCount - 1);
          session.setPosition(center, item.position || {
            scrollTop: 0, scrollLeft: 0, selectionStart: 0, selectionEnd: 0
          });
          await session.window(center);
          rebuildingDocuments.delete(id);
          backgroundIndexing.delete(id);
          if (active === id) renderSyncStatus();
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
    for (const id of docs.ids()) {
      if (virtualSessions.has(id) && id !== active) await reconcileLoadedDocument(id);
    }
    status('Recovered editor session');
  } catch (error) {
    omu.emit('OLR', 'Restore', 500, String(error), true);
  } finally {
    restoring = false;
    rebuildingDocuments.clear();
    backgroundIndexing.clear();
  }
})();

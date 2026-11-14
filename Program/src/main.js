import {LanguageProperty} from './language.js';
// Cluster Opt 1: object state is private; contracts are the only cross-object channel.
const contract=(ok,data=null,code=200,message='')=>Object.freeze({ok,code,data,message});
class OMU {#events=[];emit(source,action,code,message='',ehu=false){this.#events.push(Object.freeze({id:this.#events.length+1,time:new Date().toISOString(),source,action,code,message,ehu}));if(this.#events.length>500)this.#events.shift();}logs(){return this.#events.map(e=>({...e}));}}
const omu=new OMU();
class Documents {
 #docs=new Map();#seq=0;
 create(name='未命名.txt',content='',handle=null){const id='DOC-'+(++this.#seq);this.#docs.set(id,{id,name,content,handle,dirty:false,revision:0});omu.emit('Documents','Create',201);return contract(true,{id});}
 get(id){const d=this.#docs.get(id);return d?contract(true,{id:d.id,name:d.name,content:d.content,dirty:d.dirty,revision:d.revision,hasHandle:!!d.handle}):contract(false,null,404,'Document not found');}
 update(id,content){const d=this.#docs.get(id);if(!d)return contract(false,null,404);d.content=content;d.revision++;d.dirty=true;omu.emit('Documents','Update',200);return contract(true);}
 replaceFromExternal(id,content,expectedRevision){const d=this.#docs.get(id);if(!d)return contract(false,null,404);if(d.revision!==expectedRevision)return contract(false,null,409,'Document changed during read');d.content=content;d.revision++;d.dirty=false;omu.emit('Documents','ExternalReplace',200);return contract(true);}
 setSaved(id,handle=null,name=null,expectedRevision=null){const d=this.#docs.get(id);if(!d)return contract(false,null,404);if(handle)d.handle=handle;if(name)d.name=name;if(expectedRevision===null||d.revision===expectedRevision)d.dirty=false;omu.emit('Documents','Saved',200);return contract(true);}
 handle(id){return this.#docs.get(id)?.handle||null;}
 close(id){if(!this.#docs.has(id))return contract(false,null,404);this.#docs.delete(id);omu.emit('Documents','Close',204);return contract(true);}
 ids(){return [...this.#docs.keys()];}
}
class FileManager {
 async open(files){const out=[];for(const f of files){try{out.push({name:f.name,content:await f.text(),handle:null});omu.emit('FileManager','Read',200);}catch(e){omu.emit('FileManager','Read',500,String(e),true);}}return out;}
 async openWithHandle(){const handles=await window.showOpenFilePicker({multiple:true});const out=[];for(const handle of handles){const file=await handle.getFile();out.push({name:file.name,content:await file.text(),handle});}return out;}
 async save(doc,handle,forceAs=false){try{let h=forceAs?null:handle;if(!h&&'showSaveFilePicker'in window)h=await window.showSaveFilePicker({suggestedName:doc.name});if(h){const w=await h.createWritable();await w.write(doc.content);await w.close();omu.emit('FileManager','Write',200);return contract(true,{handle:h,name:h.name});}const blob=new Blob([doc.content],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=doc.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);omu.emit('FileManager','Download',200);return contract(true,{handle:null,name:doc.name,download:true});}catch(e){const cancel=e.name==='AbortError';omu.emit('FileManager','Write',cancel?400:500,String(e),!cancel);return contract(false,null,cancel?400:500,e.message);}}
}
class GlobalPropertyRegistry {
 #values=new Map();#listeners=new Map();
 register(name,value){if(this.#values.has(name))throw Error('Duplicate global property: '+name);this.#values.set(name,value);}
 get(name){return this.#values.get(name);}
 set(name,value){if(!this.#values.has(name))return contract(false,null,404);this.#values.set(name,value);for(const cb of this.#listeners.get(name)||[])cb(value);return contract(true);}
 subscribe(name,cb){if(!this.#listeners.has(name))this.#listeners.set(name,new Set());this.#listeners.get(name).add(cb);return()=>this.#listeners.get(name).delete(cb);}
}
class SyncStatus {
 #states=new Map();#listeners=new Set();
 get(id){return this.#states.get(id)||'UNVERIFIED';}
 set(id,state){this.#states.set(id,state);for(const cb of this.#listeners)cb(id,state);}
 delete(id){this.#states.delete(id);}
 subscribe(cb){this.#listeners.add(cb);return()=>this.#listeners.delete(cb);}
}
class ExternalChangeMonitor {
 #baseline=new Map();#busy=new Set();#generation=new Map();
 constructor(documents,states,registry){this.docs=documents;this.states=states;this.registry=registry;}
 watch(id,content){this.#baseline.set(id,content);this.#generation.set(id,(this.#generation.get(id)||0)+1);this.states.set(id,'SYNCED');}
 unwatch(id){this.#baseline.delete(id);this.#generation.set(id,(this.#generation.get(id)||0)+1);this.states.delete(id);}
 onEdit(id){if(this.#baseline.has(id))this.states.set(id,'DIVERGED');else this.states.set(id,'UNVERIFIED');}
 async checkNow(id){
  if(this.#busy.has(id))return;
  const handle=this.docs.handle(id);if(!handle)return;
  const before=this.docs.get(id);if(!before.ok)return;
  const generation=this.#generation.get(id),revision=before.data.revision,previous=this.#baseline.get(id);
  this.#busy.add(id);this.states.set(id,'LOADING');
  try{
   const file=await handle.getFile(),external=await file.text();
   if(this.#generation.get(id)!==generation||!this.docs.get(id).ok)return;
   const current=this.docs.get(id).data;
   if(external!==previous){this.#baseline.set(id,external);omu.emit('ExternalChangeMonitor','ExternalChange',200);}
    if(this.registry.get('STORAGE_PRIORITY')==='external' && current.content!==external){
     const replaced=this.docs.replaceFromExternal(id,external,current.revision);
     if(!replaced.ok)throw Error(replaced.message);
     if(active===id){editor.value=external;editor.dataset.doc=id;refresh();}
    }
   
   const latest=this.docs.get(id).data;
   this.states.set(id,latest.content===external?'SYNCED':'DIVERGED');
  }catch(e){
   if(this.#generation.get(id)===generation){this.states.set(id,'ERROR');omu.emit('ExternalChangeMonitor','Read',e.name==='NotAllowedError'?403:500,String(e),true);}
  }finally{this.#busy.delete(id);}
 }
 async checkAll(){for(const id of this.docs.ids())if(this.docs.handle(id))await this.checkNow(id);}
}
const LANGUAGE=new LanguageProperty();
const t=(key,...args)=>LANGUAGE.t(key,...args);
const docs=new Documents(),files=new FileManager(),GLOBALS=new GlobalPropertyRegistry(),syncStates=new SyncStatus();GLOBALS.register('LANGUAGE',LANGUAGE);GLOBALS.register('UI_PALETTE','dark');GLOBALS.register('STORAGE_PRIORITY','internal');GLOBALS.register('DOCUMENT_STATUS',syncStates);const monitor=new ExternalChangeMonitor(docs,syncStates,GLOBALS);let active=null;const $=s=>document.querySelector(s),editor=$('#editor');
function status(msg){$('#status').textContent=msg;}function refresh(){const d=active?docs.get(active).data:null;$('#empty').hidden=!!d;$('#editorPane').hidden=!d;$('#tabs').replaceChildren();for(const id of docs.ids()){const x=docs.get(id).data;const tab=document.createElement('div');tab.className='tab'+(id===active?' active':'');const name=document.createElement('span');name.className='name';name.textContent=x.name+(x.dirty?' ●':'');const close=document.createElement('span');close.className='close';close.textContent='×';close.onclick=e=>{e.stopPropagation();closeDoc(id);};tab.append(name,close);tab.onclick=()=>switchDoc(id);$('#tabs').append(tab);}if(d){if(editor.dataset.doc!==active){editor.value=d.content;editor.dataset.doc=active;}$('#filename').textContent=d.name+(d.dirty?' *':'');updateLines();}else{$('#filename').textContent=t('unnamed');editor.dataset.doc='';}updatePos();renderSyncStatus();}
function switchDoc(id){active=id;refresh();editor.focus();}function create(name=t('unnamed'),content='',handle=null){const res=docs.create(name,content,handle);active=res.data.id;if(handle)monitor.watch(active,content);refresh();editor.focus();}
function closeDoc(id){const d=docs.get(id).data;if(!d)return;if(d.dirty&&!confirm(t('confirmClose',d.name)))return;monitor.unwatch(id);docs.close(id);if(active===id)active=docs.ids().at(-1)||null;refresh();}
function updateLines(){const count=editor.value.split('\n').length;$('#gutter').textContent=Array.from({length:count},(_,i)=>i+1).join('\n');}function updatePos(){const p=editor.selectionStart||0,txt=editor.value.slice(0,p),lines=txt.split('\n');$('#position').textContent=`Ln ${lines.length}, Col ${lines.at(-1).length+1}`;}
editor.addEventListener('input',()=>{if(!active)return;docs.update(active,editor.value);monitor.onEdit(active);updateLines();updatePos();$('#filename').textContent=docs.get(active).data.name+' *';const activeTab=[...$('#tabs').children].find(tab=>tab.classList.contains('active'));if(activeTab)activeTab.querySelector('.name').textContent=docs.get(active).data.name+' ●';status(t('unsaved'));});editor.addEventListener('scroll',()=>{$('#gutter').scrollTop=editor.scrollTop;});['click','keyup','select'].forEach(ev=>editor.addEventListener(ev,updatePos));editor.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const s=editor.selectionStart;editor.setRangeText('    ',s,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));}});
async function doSave(as=false){if(!active)return;const id=active;const d=docs.get(id).data;const revision=d.revision;const res=await files.save(d,docs.handle(id),as);if(res.ok){if(!docs.get(id).ok)return;docs.setSaved(id,res.data.handle,res.data.name,revision);if(res.data.handle){monitor.watch(id,d.content);if(docs.get(id).data.revision!==revision)monitor.onEdit(id);}else syncStates.set(id,'UNVERIFIED');refresh();status(t(res.data.download?'downloaded':'saved'));}else status(res.message||t('saveFailed'));}
const actions={new:()=>create(),open:()=>openFiles(),save:()=>doSave(),saveas:()=>doSave(true),close:()=>active&&closeDoc(active),closeall:()=>{for(const id of docs.ids())closeDoc(id);}};$('#menuBtn').onclick=()=>{$('#menu').hidden=!$('#menu').hidden;};$('#menu').onclick=e=>{const key=e.target.dataset.action;if(actions[key]){actions[key]();$('#menu').hidden=true;}};document.addEventListener('click',e=>{if(!e.target.closest('.menu-wrap'))$('#menu').hidden=true;});$('#fileInput').onchange=async e=>{const items=await files.open(e.target.files);items.forEach(x=>create(x.name,x.content,x.handle));e.target.value='';};document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();doSave(e.shiftKey);}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'){e.preventDefault();create();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='o'){e.preventDefault();openFiles();}});window.addEventListener('beforeunload',e=>{if(docs.ids().some(id=>docs.get(id).data.dirty)){e.preventDefault();e.returnValue='';}});
async function openFiles(){if('showOpenFilePicker' in window){try{const items=await files.openWithHandle();items.forEach(x=>create(x.name,x.content,x.handle));return;}catch(e){if(e.name==='AbortError')return;omu.emit('FileManager','Open',500,String(e),true);status(String(e));return;}}$('#fileInput').click();}
function renderSyncStatus(){const state=active?syncStates.get(active):'UNVERIFIED';const colors={SYNCED:'#22C55E',DIVERGED:'#EAB308',ERROR:'#EF4444',LOADING:'#3B82F6',UNVERIFIED:'#64748B'};const bar=$('#meterFill');bar.style.width='100%';bar.style.background=colors[state];bar.parentElement.title=state;}
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
window.ClusterOpt=Object.freeze({language:()=>LANGUAGE.value,setLanguage:value=>LANGUAGE.set(value),logs:()=>omu.logs(),dependencies:copyDependencies});refresh();

function renderLanguage() {
  document.documentElement.lang=LANGUAGE.value;
  document.title='Cluster Opt 5';
  $('#menuBtn').textContent=t('file')+'⌄';
  for (const key of ['new','open','save','saveas','close','closeall']) {
    const button=$('#menu [data-action="'+key+'"]');
    if (button) button.textContent=t(key);
  }
  $('#languageBtn').firstChild.textContent=t('language')+' ';
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

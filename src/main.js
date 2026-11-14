import {LanguageProperty} from '../Program/src/language.js';
// Cluster Opt 1: object state is private; contracts are the only cross-object channel.
const contract=(ok,data=null,code=200,message='')=>Object.freeze({ok,code,data,message});
class OMU {#events=[];emit(source,action,code,message='',ehu=false){this.#events.push(Object.freeze({id:this.#events.length+1,time:new Date().toISOString(),source,action,code,message,ehu}));if(this.#events.length>500)this.#events.shift();}logs(){return this.#events.map(e=>({...e}));}}
const omu=new OMU();
class Documents {#docs=new Map();#seq=0;create(name='未命名.txt',content='',handle=null){const id='DOC-'+(++this.#seq);this.#docs.set(id,{id,name,content,handle,dirty:false});omu.emit('Documents','Create',201);return contract(true,{id});}get(id){const d=this.#docs.get(id);return d?contract(true,{id:d.id,name:d.name,content:d.content,dirty:d.dirty,hasHandle:!!d.handle}):contract(false,null,404,'Document not found');}update(id,content){const d=this.#docs.get(id);if(!d)return contract(false,null,404,'Document not found');d.content=content;d.dirty=true;omu.emit('Documents','Update',200);return contract(true);}setSaved(id,handle=null,name=null){const d=this.#docs.get(id);if(!d)return contract(false,null,404);if(handle)d.handle=handle;if(name)d.name=name;d.dirty=false;omu.emit('Documents','Saved',200);return contract(true);}handle(id){return this.#docs.get(id)?.handle||null;}close(id){if(!this.#docs.has(id))return contract(false,null,404);this.#docs.delete(id);omu.emit('Documents','Close',204);return contract(true);}ids(){return [...this.#docs.keys()];}}
class FileManager {async open(files){const out=[];for(const f of files){try{out.push({name:f.name,content:await f.text()});omu.emit('FileManager','Read',200);}catch(e){omu.emit('FileManager','Read',500,String(e),true);}}return out;}async save(doc,handle,forceAs=false){try{let h=forceAs?null:handle;if(!h&&'showSaveFilePicker'in window){h=await window.showSaveFilePicker({suggestedName:doc.name});}if(h){const w=await h.createWritable();await w.write(doc.content);await w.close();omu.emit('FileManager','Write',200);return contract(true,{handle:h,name:h.name});}const blob=new Blob([doc.content],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=doc.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);omu.emit('FileManager','Download',200);return contract(true,{handle:null,name:doc.name,download:true});}catch(e){const cancel=e.name==='AbortError';omu.emit('FileManager','Write',cancel?400:500,String(e),!cancel);return contract(false,null,cancel?400:500,e.message);}}}
const LANGUAGE=new LanguageProperty();
const t=(key,...args)=>LANGUAGE.t(key,...args);
const docs=new Documents(),files=new FileManager();let active=null;const $=s=>document.querySelector(s),editor=$('#editor');
function status(msg){$('#status').textContent=msg;}function refresh(){const d=active?docs.get(active).data:null;$('#empty').hidden=!!d;$('#editorPane').hidden=!d;$('#tabs').replaceChildren();for(const id of docs.ids()){const x=docs.get(id).data;const tab=document.createElement('div');tab.className='tab'+(id===active?' active':'');const name=document.createElement('span');name.className='name';name.textContent=x.name+(x.dirty?' ●':'');const close=document.createElement('span');close.className='close';close.textContent='×';close.onclick=e=>{e.stopPropagation();closeDoc(id);};tab.append(name,close);tab.onclick=()=>switchDoc(id);$('#tabs').append(tab);}if(d){if(editor.dataset.doc!==active){editor.value=d.content;editor.dataset.doc=active;}$('#filename').textContent=d.name+(d.dirty?' *':'');updateLines();}else{$('#filename').textContent=t('unnamed');editor.dataset.doc='';}updatePos();}
function switchDoc(id){active=id;refresh();editor.focus();}function create(name=t('unnamed'),content='',handle=null){const res=docs.create(name,content,handle);active=res.data.id;refresh();editor.focus();}
function closeDoc(id){const d=docs.get(id).data;if(!d)return;if(d.dirty&&!confirm(t('confirmClose',d.name)))return;docs.close(id);if(active===id)active=docs.ids().at(-1)||null;refresh();}
function updateLines(){const count=editor.value.split('\n').length;$('#gutter').textContent=Array.from({length:count},(_,i)=>i+1).join('\n');}function updatePos(){const p=editor.selectionStart||0,txt=editor.value.slice(0,p),lines=txt.split('\n');$('#position').textContent=`Ln ${lines.length}, Col ${lines.at(-1).length+1}`;}
editor.addEventListener('input',()=>{if(!active)return;docs.update(active,editor.value);updateLines();updatePos();$('#filename').textContent=docs.get(active).data.name+' *';const t=[...$('#tabs').children].find(t=>t.classList.contains('active'));if(t)t.querySelector('.name').textContent=docs.get(active).data.name+' ●';status(t('unsaved'));});editor.addEventListener('scroll',()=>{$('#gutter').scrollTop=editor.scrollTop;});['click','keyup','select'].forEach(ev=>editor.addEventListener(ev,updatePos));editor.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const s=editor.selectionStart;editor.setRangeText('    ',s,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));}});
async function doSave(as=false){if(!active)return;const d=docs.get(active).data;const res=await files.save(d,docs.handle(active),as);if(res.ok){docs.setSaved(active,res.data.handle,res.data.name);refresh();status(t(res.data.download?'downloaded':'saved'));}else status(res.message||t('saveFailed'));}
const actions={new:()=>create(),open:()=>$('#fileInput').click(),save:()=>doSave(),saveas:()=>doSave(true),close:()=>active&&closeDoc(active),closeall:()=>{for(const id of docs.ids())closeDoc(id);}};$('#menuBtn').onclick=()=>{$('#menu').hidden=!$('#menu').hidden;};$('#menu').onclick=e=>{const key=e.target.dataset.action;if(actions[key]){actions[key]();$('#menu').hidden=true;}};document.addEventListener('click',e=>{if(!e.target.closest('.menu-wrap'))$('#menu').hidden=true;});$('#fileInput').onchange=async e=>{const items=await files.open(e.target.files);items.forEach(x=>create(x.name,x.content));e.target.value='';};document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();doSave(e.shiftKey);}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'){e.preventDefault();create();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='o'){e.preventDefault();$('#fileInput').click();}});window.addEventListener('beforeunload',e=>{if(docs.ids().some(id=>docs.get(id).data.dirty)){e.preventDefault();e.returnValue='';}});
// Read-only diagnostics, not a remote HTTP endpoint.
window.ClusterOpt=Object.freeze({language:()=>LANGUAGE.value,setLanguage:value=>LANGUAGE.set(value),logs:()=>omu.logs(),dependencies:()=>[{from:'UI',to:'Documents',type:'Request/Response'},{from:'UI',to:'FileManager',type:'Request/Response'},{from:'Documents',to:'OMU',type:'LOG'},{from:'FileManager',to:'OMU',type:'LOG'}]});refresh();

function renderLanguage() {
  document.documentElement.lang=LANGUAGE.value;
  document.title='Cluster Opt 3';
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

/**
 * Explorer workspace. Public contracts: addDirectory, addFile, syncDocuments,
 * setLocale, toggle, revealDocument, refresh. No global editor state is owned here.
 * File System Access handles persist in IndexedDB; ordering/expansion in JSON.
 */
export function filterExplorerEntries(entries, query) {
  const term=String(query||'').trim().toLocaleLowerCase();
  return term?entries.filter(entry=>entry.name.toLocaleLowerCase().includes(term)):entries;
}
const STATE_KEY='cluster.explorer.workspace.v2';
const DB_NAME='cluster-explorer-handles-v1';
function readState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}');}catch{return {};}}
function writeState(state){try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch{/* storage unavailable */}}
function openHandleDB(){return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(new Error('IndexedDB unavailable'));return;}
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>req.result.createObjectStore('roots',{keyPath:'key'});
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
});}
async function handleTransaction(mode,callback){
  const db=await openHandleDB();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction('roots',mode),store=tx.objectStore('roots');
    const req=callback(store);req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);tx.onerror=()=>reject(tx.error);
  });}finally{db.close();}
}
export class Explorer {
  #roots=[];#documents=[];#active=null;#locale='zh-Hant';
  #panel;#tree;#search;#openFile;#openDocument;#closeFile;#log;
  #state=readState();#clipboard=null;#menu=null;#rename=null;
  #hold=null;#drag=null;#selected=null;#revealGeneration=0;
  constructor({panel,openFile,openDocument,closeFile=async()=>false,log=()=>{}}){
    this.#panel=panel;this.#tree=panel.querySelector('#explorerTree');
    this.#search=panel.querySelector('#explorerSearch');
    this.#openFile=openFile;this.#openDocument=openDocument;this.#closeFile=closeFile;this.#log=log;
    this.#search.addEventListener('input',()=>this.render());
    panel.querySelector('#explorerAddFolder').addEventListener('click',()=>this.addDirectory());
    panel.querySelector('#explorerAddFile').addEventListener('click',()=>this.addFile());
    panel.querySelector('#explorerRefresh').addEventListener('click',()=>this.refresh());
    panel.querySelector('#explorerClose').addEventListener('click',()=>this.toggle(false));
    document.querySelector('#explorerToggle').addEventListener('click',()=>this.toggle());
    // Right mouse is reserved for sibling reordering, never the action menu.
    this.#tree.addEventListener('contextmenu',e=>{if(e.target.closest('.explorer-entry'))e.preventDefault();});
    this.#tree.addEventListener('pointerdown',e=>this.#pointerDown(e));
    document.addEventListener('pointermove',e=>this.#pointerMove(e));
    document.addEventListener('pointerup',e=>this.#pointerUp(e));
    document.addEventListener('pointercancel',()=>{this.#clearHold();this.#drag=null;this.#tree.querySelectorAll('.drag-ready,.drag-target').forEach(el=>el.classList.remove('drag-ready','drag-target'));});
    document.addEventListener('click',e=>{if(this.#menu&&!this.#menu.contains(e.target))this.#closeMenu();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){this.#closeMenu();this.#cancelRename();}});
    this.#restoreRoots();
  }
  get #en(){return this.#locale==='en';}
  #say(zh,en){return this.#en?en:zh;}
  #save(){writeState(this.#state);}
  #key(node){return node.parent?this.#key(node.parent)+'/'+encodeURIComponent(node.name):node.key;}
  #node(handle,parent=null,key=null){
    const node={handle,parent,key:key||null,name:handle.name,kind:handle.kind,children:null,expanded:false};
    node.expanded=!!this.#state.expanded?.[this.#key(node)];return node;
  }
  async #restoreRoots(){
    try{
      const records=await handleTransaction('readonly',store=>store.getAll());
      const saved=this.#state.rootOrder||[];
      records.sort((a,b)=>{const ai=saved.indexOf(a.key),bi=saved.indexOf(b.key);return (ai<0?Infinity:ai)-(bi<0?Infinity:bi);});
      for(const record of records)if(!this.#roots.some(n=>n.key===record.key))
        this.#roots.push(this.#node(record.handle,null,record.key));
      this.render();
      for(const root of this.#roots)if(root.expanded)await this.#loadChildren(root);
      this.render();
    }catch(error){this.#log('Explorer handle restore: '+error);}
  }
  async #remember(handle){
    const key=handle.kind+':'+handle.name;
    let existing=this.#roots.find(n=>n.key===key);
    if(existing){existing.handle=handle;return existing;}
    const node=this.#node(handle,null,key);this.#roots.push(node);
    this.#state.rootOrder=this.#roots.map(n=>n.key);this.#save();
    try{await handleTransaction('readwrite',store=>store.put({key,handle}));}
    catch(error){this.#log('Explorer handle persistence: '+error);}
    return node;
  }
  toggle(force){
    const open=force===undefined?this.#panel.hidden:!!force;
    this.#panel.hidden=!open;
    document.querySelector('#explorerToggle').setAttribute('aria-expanded',String(open));
    if(open&&this.#active)this.revealDocument(this.#active);
  }
  setLocale(locale,translate){
    this.#locale=locale;
    const labels={explorerTitle:'#explorerTitle',explorerSearch:'#explorerSearch',
      explorerAddFolder:'#explorerAddFolder',explorerAddFile:'#explorerAddFile',explorerClose:'#explorerClose'};
    for(const [key,selector] of Object.entries(labels)){
      const el=this.#panel.querySelector(selector);
      if(key==='explorerSearch'){el.placeholder=translate(key);el.setAttribute('aria-label',translate(key));}
      else if(key==='explorerTitle')el.textContent=translate(key);
      else{el.title=translate(key);el.setAttribute('aria-label',translate(key));}
    }
    const refresh=this.#panel.querySelector('#explorerRefresh');
    refresh.title=this.#say('重新整理','Refresh');refresh.setAttribute('aria-label',refresh.title);
    document.querySelector('#explorerToggle').title=translate('explorerTitle');
    this.render();
  }
  syncDocuments(documents,activeId){
    this.#documents=documents.map(item=>({...item}));
    const changed=this.#active!==activeId;this.#active=activeId;
    if(changed&&activeId&&!this.#panel.hidden)this.revealDocument(activeId);
    else {if(changed){this.#selected=null;this.#revealGeneration++;}this.render();}
  }
  async addDirectory(){
    if(!window.showDirectoryPicker){this.#log('Directory picker unavailable');return;}
    try{const handle=await window.showDirectoryPicker({mode:'readwrite'});
      await this.#remember(handle);this.render();}
    catch(error){if(error.name!=='AbortError')this.#log(String(error));}
  }
  async addFile(){
    if(!window.showOpenFilePicker){document.querySelector('#fileInput').click();return;}
    try{const handles=await window.showOpenFilePicker({multiple:true});
      for(const handle of handles){await this.#remember(handle);await this.#openFile(handle);}
      this.render();}
    catch(error){if(error.name!=='AbortError')this.#log(String(error));}
  }
  async #loadChildren(node,force=false){
    if(node.kind!=='directory'||(node.children&&!force))return;
    const previous=new Map((node.children||[]).map(n=>[n.name,n]));
    try{
      const children=[];
      for await(const handle of node.handle.values()){
        const prior=previous.get(handle.name);
        if(prior&&prior.kind===handle.kind){prior.handle=handle;prior.parent=node;children.push(prior);}
        else children.push(this.#node(handle,node));
      }
      node.children=this.#order(children,node);
    }catch(error){this.#log('Explorer directory read: '+error);node.children=[];}
  }
  #order(children,parent){
    const keys=this.#state.order?.[parent?this.#key(parent):'@roots']||[];
    return children.sort((a,b)=>{
      const ai=keys.indexOf(a.name),bi=keys.indexOf(b.name);
      if(ai!==-1||bi!==-1)return(ai===-1?Infinity:ai)-(bi===-1?Infinity:bi);
      return a.kind===b.kind?a.name.localeCompare(b.name):a.kind==='directory'?-1:1;
    });
  }
  async #expand(node){
    if(node.kind==='file'){this.#selected=this.#key(node);this.render();await this.#openFile(node.handle);return;}
    node.expanded=!node.expanded;
    this.#state.expanded??={};this.#state.expanded[this.#key(node)]=node.expanded;this.#save();
    if(node.expanded)await this.#loadChildren(node);
    this.render();
  }
  async refresh(){
    // Explorer refresh resets the visible tree to its collapsed state.
    // Preserve workspace roots, open editor tabs and on-disk files.
    ++this.#revealGeneration;
    this.#selected=null;
    this.#closeMenu();
    this.#clearHold();
    this.#drag=null;
    this.#state.expanded={};
    const collapse=nodes=>{
      for(const node of nodes){
        node.expanded=false;
        if(node.children)collapse(node.children);
      }
    };
    collapse(this.#roots);
    this.#save();
    this.render();
  }
  async revealDocument(id){
    const generation=++this.#revealGeneration;
    const doc=this.#documents.find(d=>d.id===id);
    if(!doc){this.#selected=null;this.render();return;}
    const find=async nodes=>{
      for(const node of nodes){
        if(node.kind==='file'&&node.name===doc.name)return node;
        if(node.kind==='directory'){
          await this.#loadChildren(node);
          const match=await find(node.children||[]);
          if(match){node.expanded=true;this.#state.expanded??={};
            this.#state.expanded[this.#key(node)]=true;return match;}
        }
      }return null;
    };
    // Name-only matching is ambiguous; prefer a matching FileSystemHandle when supplied.
    const match=await find(this.#roots);
    if(generation!==this.#revealGeneration||id!==this.#active)return;
    this.#selected=match?this.#key(match):null;
    this.#save();this.render();
    if(match&&!this.#panel.hidden){
      const row=[...this.#tree.querySelectorAll('.explorer-entry[data-path]')]
        .find(el=>el.dataset.path===this.#key(match));
      row?.scrollIntoView({block:'nearest'});
    }
  }
  #allNodes(){const out=[];const visit=nodes=>{for(const n of nodes){out.push(n);if(n.children)visit(n.children);}};visit(this.#roots);return out;}
  #nodeAt(row){return this.#allNodes().find(n=>this.#key(n)===row?.dataset.path);}
  #closeMenu(){this.#menu?.remove();this.#menu=null;}
  #context(event){
    const row=event.target.closest('.explorer-entry[data-path]');
    if(!row)return;event.preventDefault();
    const node=this.#nodeAt(row);if(!node)return;
    this.#selected=this.#key(node);this.render();
    this.#openMenu(node,event.clientX,event.clientY);
  }
  #openMenu(node,clientX,clientY){
    this.#closeMenu();
    const menu=document.createElement('div');menu.className='explorer-context';menu.setAttribute('role','menu');
    menu.addEventListener('click',event=>event.stopPropagation());
    const items=[
      [this.#say('重新命名','Rename'),()=>this.#startRename(node)],
      [this.#say('刪除','Delete'),()=>this.#delete(node)],
      [this.#say('剪下','Cut'),()=>this.#clipboard={node,cut:true}],
      [this.#say('複製','Copy'),()=>this.#clipboard={node,cut:false}],
      [this.#say('貼上','Paste'),()=>this.#paste(node)],
      [this.#say('關閉','Close'),()=>this.#closeEntry(node)]
    ];
    for(const [label,action] of items){
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.setAttribute('role','menuitem');
      button.onclick=()=>{this.#closeMenu();Promise.resolve(action()).catch(error=>this.#log(String(error)));};
      menu.append(button);
    }
    this.#panel.append(menu);this.#menu=menu;
    const rect=this.#panel.getBoundingClientRect();
    menu.style.left=Math.max(0,Math.min(clientX-rect.left,rect.width-160))+'px';
    menu.style.top=Math.max(0,Math.min(clientY-rect.top,rect.height-190))+'px';
  }
  async #closeEntry(node){
    if(!node.parent){
      // Closing a workspace root only detaches it from Explorer, never deletes disk data.
      this.#roots=this.#roots.filter(root=>root!==node);
      this.#state.rootOrder=this.#roots.map(root=>root.key);
      if(this.#selected===this.#key(node))this.#selected=null;
      this.#save();
      try{await handleTransaction('readwrite',store=>store.delete(node.key));}
      catch(error){this.#log('Explorer root detach: '+error);}
      this.render();
      return;
    }
    // Non-root Close affects the editor tab only; it must not delete the file.
    const closed=await this.#closeFile(node.handle,node.name);
    if(closed&&this.#selected===this.#key(node))this.#selected=null;
    this.render();
  }
  #cancelRename(){this.#rename=null;this.render();}
  #startRename(node){this.#rename=this.#key(node);this.render();
    this.#tree.querySelector('.explorer-rename')?.focus();}
  async #renameNode(node,newName){
    const name=newName.trim();if(!name||name===node.name){this.#cancelRename();return;}
    if(!node.parent){this.#log('Root name cannot be changed from Explorer');this.#cancelRename();return;}
    try{
      const parent=node.parent.handle;
      if(node.kind==='file'){
        const file=await node.handle.getFile();
        const target=await parent.getFileHandle(name,{create:true});
        const writer=await target.createWritable();await writer.write(file);await writer.close();
      }else{
        this.#log('Folder rename is not supported by File System Access API');this.#cancelRename();return;
      }
      await parent.removeEntry(node.name);
      node.name=name;node.handle=await parent.getFileHandle(name);
      this.#state.order??={};this.#state.order[this.#key(node.parent)]=(node.parent.children||[]).map(n=>n.name);
      this.#save();this.render();
    }catch(error){this.#log('Rename failed: '+error);this.#cancelRename();}
  }
  async #delete(node){
    if(!node.parent){this.#roots=this.#roots.filter(n=>n!==node);this.#state.rootOrder=this.#roots.map(n=>n.key);this.#save();try{await handleTransaction('readwrite',store=>store.delete(node.key));}catch(error){this.#log(String(error));}this.render();return;}
    try{
      await node.parent.handle.removeEntry(node.name,{recursive:node.kind==='directory'});
      node.parent.children=node.parent.children.filter(n=>n!==node);
      this.render();
    }catch(error){this.#log('Delete failed: '+error);}
  }
  async #paste(target){
    if(!this.#clipboard)return;
    const destination=target.kind==='directory'?target:target.parent;
    if(!destination){this.#log('Select a folder to paste');return;}
    const {node,cut}=this.#clipboard;
    if(node.kind!=='file'){this.#log('Folder copy/move is not yet supported');return;}
    if(node===target)return;
    try{
      const file=await node.handle.getFile();
      const newHandle=await destination.handle.getFileHandle(node.name,{create:true});
      const writer=await newHandle.createWritable();await writer.write(file);await writer.close();
      if(cut&&node.parent&&node.parent!==destination){
        await node.parent.handle.removeEntry(node.name);
        node.parent.children=node.parent.children.filter(n=>n!==node);
      }
      if(cut)this.#clipboard=null;
      await this.#loadChildren(destination,true);destination.expanded=true;this.render();
    }catch(error){this.#log('Paste failed: '+error);}
  }
  #clearHold(){if(this.#hold){clearTimeout(this.#hold.timer);this.#hold=null;}}
  #pointerDown(e){
    if(e.button!==2)return;
    const row=e.target.closest('.explorer-entry[data-path]');if(!row)return;
    e.preventDefault();this.#clearHold();this.#drag=null;
    const node=this.#nodeAt(row);if(!node)return;
    this.#hold={node,x:e.clientX,y:e.clientY,ready:true,timer:null};
    row.classList.add('drag-ready');
  }
  #pointerMove(e){
    if(!this.#hold)return;
    if(!this.#hold.ready){
      if(Math.hypot(e.clientX-this.#hold.x,e.clientY-this.#hold.y)>8)this.#clearHold();
      return;
    }
    const row=document.elementFromPoint(e.clientX,e.clientY)?.closest('.explorer-entry[data-path]');
    this.#tree.querySelectorAll('.drag-target').forEach(el=>el.classList.remove('drag-target'));
    if(row&&this.#nodeAt(row)?.parent===this.#hold.node.parent){
      row.classList.add('drag-target');this.#drag=row.dataset.path;
    }else this.#drag=null;
  }
  #pointerUp(e){
    if(!this.#hold)return;
    const {node,ready}=this.#hold;this.#clearHold();
    this.#tree.querySelectorAll('.drag-ready,.drag-target').forEach(el=>el.classList.remove('drag-ready','drag-target'));
    if(!ready||e.button!==2||!this.#drag){this.#drag=null;return;}
    const target=this.#allNodes().find(n=>this.#key(n)===this.#drag);this.#drag=null;
    if(!target||node===target||node.parent!==target.parent)return;
    const siblings=node.parent?node.parent.children:this.#roots;
    const from=siblings.indexOf(node),to=siblings.indexOf(target);
    if(from<0||to<0)return;
    siblings.splice(from,1);siblings.splice(to,0,node);
    this.#state.order??={};
    this.#state.order[node.parent?this.#key(node.parent):'@roots']=siblings.map(n=>n.name);
    this.#save();this.render();
  }
  render(){
    const query=this.#search.value.trim().toLocaleLowerCase();
    const fragment=document.createDocumentFragment();
    const section=(title,rows)=>{
      const heading=document.createElement('div');heading.className='explorer-section';heading.textContent=title;
      fragment.append(heading,...rows);
    };
    // Open editor tabs are managed by the editor, not duplicated in Explorer.
    const nodes=[];
    const walk=(node,depth)=>{
      const matches=!query||node.name.toLocaleLowerCase().includes(query);
      const descendants=[];
      if(node.children){for(const child of node.children){
        const before=nodes.length;walk(child,depth+1);descendants.push(...nodes.splice(before));
      }}
      if(!matches&&!descendants.length)return;
      const row=this.#button(node.name,node.kind,depth);
      row.dataset.path=this.#key(node);
      if(row.dataset.path===this.#selected)row.classList.add('active');
      row.querySelector('.explorer-arrow').textContent=node.kind==='directory'?(node.expanded?'⌄':'›'):'';
      // Left click opens the action menu only. The disclosure arrow controls
      // folder expansion, and double click opens a file in the editor.
      row.onclick=event=>{
        event.stopPropagation();
        if(this.#rename||event.button!==0)return;
        this.#selected=this.#key(node);
        this.render();
        this.#openMenu(node,event.clientX,event.clientY);
      };
      row.ondblclick=event=>{
        event.stopPropagation();
        if(this.#rename||event.button!==0)return;
        this.#closeMenu();
        if(node.kind==='file')void this.#expand(node);
      };
      if(node.kind==='directory'){
        const arrow=row.querySelector('.explorer-arrow');
        arrow.classList.add('explorer-disclosure');
        arrow.onclick=event=>{
          event.stopPropagation();
          this.#closeMenu();
          void this.#expand(node);
        };
      }
      if(this.#rename===this.#key(node)){
        const input=document.createElement('input');input.className='explorer-rename';
        input.value=node.name;row.querySelector('.explorer-name').replaceWith(input);
        input.onclick=e=>e.stopPropagation();
        input.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')this.#renameNode(node,input.value);
          if(e.key==='Escape')this.#cancelRename();};
        input.onblur=()=>{if(this.#rename===this.#key(node))this.#renameNode(node,input.value);};
      }
      nodes.push(row);
      if(node.expanded||query)nodes.push(...descendants);
    };
    for(const root of this.#roots)walk(root,0);
    section(this.#say('工作區','WORKSPACE'),nodes);
    this.#tree.replaceChildren(fragment);
  }
  #button(name,kind,depth){
    const button=document.createElement('button');button.type='button';
    button.className='explorer-entry';button.style.paddingInlineStart=(10+depth*15)+'px';
    button.title=name;
    const arrow=document.createElement('span');arrow.className='explorer-arrow';
    const icon=document.createElement('span');icon.className='explorer-file-icon';
    icon.textContent=kind==='directory'?'▣':'◇';
    const label=document.createElement('span');label.className='explorer-name';label.textContent=name;
    button.append(arrow,icon,label);return button;
  }
}

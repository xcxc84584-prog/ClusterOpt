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
  #panel;#tree;#search;#openFile;#openDocument;#closeFile;#closeRoot;#newFile;#log;
  #state=readState();#clipboard=null;#menu=null;#rename=null;
  #hold=null;#drag=null;#selected=null;#revealGeneration=0;#suppressClick=false;#draft=null;
  constructor({panel,openFile,openDocument,closeFile=async()=>false,closeRoot=async()=>true,newFile=()=>{},log=()=>{}}){
    this.#panel=panel;this.#tree=panel.querySelector('#explorerTree');
    this.#search=panel.querySelector('#explorerSearch');
    this.#openFile=openFile;this.#openDocument=openDocument;this.#closeFile=closeFile;this.#closeRoot=closeRoot;this.#newFile=newFile;this.#log=log;
    this.#search.addEventListener('input',()=>this.render());
    panel.querySelector('#explorerAddFolder').addEventListener('click',()=>this.addDirectory());
    panel.querySelector('#explorerAddFile').addEventListener('click',()=>this.addFile());
    panel.querySelector('#explorerRefresh').addEventListener('click',()=>this.refresh());
    panel.querySelector('#explorerClose').addEventListener('click',()=>this.toggle(false));
    document.querySelector('#explorerToggle').addEventListener('click',()=>this.toggle());
    // Right click opens the action menu; left-button hold and drag reorders siblings.
    this.#tree.addEventListener('contextmenu',e=>this.#context(e));
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
  newFile(){return this.#newFile();}
  async openHandles(handles){
    for(const handle of handles){
      // Resolve imports through the existing workspace handle where possible.
      const existing=await this.#findWorkspaceHandle(handle);
      if(existing)await this.#openFile(existing);
      else{await this.#remember(handle);await this.#openFile(handle);}
    }
    this.render();
  }
  async #findWorkspaceHandle(handle){
    const matches=async nodes=>{
      for(const node of nodes){
        if(node.kind==='file'){
          try{if(node.handle===handle||await node.handle.isSameEntry(handle))return node.handle;}catch{}
        }else if(node.kind==='directory'){
          try{
            const path=await node.handle.resolve(handle);
            if(path?.length){let current=node.handle;for(const part of path)current=await current.getDirectoryHandle(part).catch(()=>current.getFileHandle(part));return current;}
          }catch{}
          if(node.children){const found=await matches(node.children);if(found)return found;}
        }
      }
      return null;
    };
    return matches(this.#roots);
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
      await this.openHandles(handles);}
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
      [this.#say('建立新文件','New File'),()=>this.#createIn(node,'file')],
      [this.#say('建立新資料夾','New Folder'),()=>this.#createIn(node,'directory')],
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
  async #createIn(node,kind){
    const directory=node.kind==='directory'?node:node.parent;
    if(!directory){this.#log('Select a folder to create an entry');return;}
    // Show a draft entry inside the tree. Nothing is written until Enter/blur.
    directory.expanded=true;
    this.#state.expanded??={};
    this.#state.expanded[this.#key(directory)]=true;
    await this.#loadChildren(directory);
    this.#draft={directory,kind,busy:false};
    this.#save();
    this.render();
    const field=this.#tree.querySelector('.explorer-create-input');
    field?.focus();
  }
  async #commitDraft(draft,value){
    if(this.#draft!==draft||draft.busy)return;
    const name=value.trim();
    if(!name){this.#draft=null;this.render();return;}
    if(name==='.'||name==='..'||name.includes('/')||name.includes('\\')){
      this.#log('Invalid entry name: '+name);
      this.#tree.querySelector('.explorer-create-input')?.focus();
      return;
    }
    draft.busy=true;
    try{
      for await(const existing of draft.directory.handle.keys()){
        if(existing===name){
          this.#log('Entry already exists: '+name);
          draft.busy=false;
          this.#tree.querySelector('.explorer-create-input')?.focus();
          return;
        }
      }
      const handle=draft.kind==='file'
        ?await draft.directory.handle.getFileHandle(name,{create:true})
        :await draft.directory.handle.getDirectoryHandle(name,{create:true});
      this.#draft=null;
      await this.#loadChildren(draft.directory,true);
      this.render();
      if(draft.kind==='file')await this.#openFile(handle);
    }catch(error){
      draft.busy=false;
      this.#log('Create entry failed: '+error);
      this.#tree.querySelector('.explorer-create-input')?.focus();
    }
  }
  async #closeEntry(node){
    if(!node.parent){
      // Close all tabs belonging to this root before detaching the workspace handle.
      // If an unsaved editor refuses to close, retain the root.
      if(!await this.#closeRoot(node.handle))return;
      // Detach only; never delete disk files.
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
    if(e.button!==0||e.target.closest('.explorer-disclosure,.explorer-rename'))return;
    const row=e.target.closest('.explorer-entry[data-path]');if(!row)return;
    this.#clearHold();this.#drag=null;
    const node=this.#nodeAt(row);if(!node)return;
    const hold={node,x:e.clientX,y:e.clientY,ready:false,timer:null};
    hold.timer=setTimeout(()=>{
      if(this.#hold===hold){hold.ready=true;row.classList.add('drag-ready');}
    },200);
    this.#hold=hold;
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
    if(ready&&this.#drag)this.#suppressClick=true;
    if(!ready||e.button!==0||!this.#drag){this.#drag=null;return;}
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
      // Left click selects only; context actions belong exclusively to right click.
      row.onclick=event=>{
        event.stopPropagation();
        if(this.#suppressClick){this.#suppressClick=false;return;}
        if(this.#rename||event.button!==0)return;
        this.#selected=this.#key(node);
        this.render();
        // A single click opens files; folder expansion remains on the arrow.
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
    if(this.#draft){
      const draft=this.#draft, directory=draft.directory;
      const siblings=nodes;
      const parentIndex=siblings.findIndex(row=>row.dataset?.path===this.#key(directory));
      if(parentIndex>=0){
        const depth=Math.round((parseInt(siblings[parentIndex].style.paddingInlineStart,10)-10)/15)+1;
        const row=this.#button('',draft.kind,depth);
        row.classList.add('explorer-create-row');
        const input=document.createElement('input');
        input.className='explorer-create-input explorer-rename';
        input.placeholder=draft.kind==='file'?this.#say('新文件名稱','New file name'):this.#say('新資料夾名稱','New folder name');
        row.querySelector('.explorer-name').replaceWith(input);
        row.onclick=e=>e.stopPropagation();
        input.onclick=e=>e.stopPropagation();
        input.onkeydown=e=>{
          e.stopPropagation();
          if(e.key==='Enter'){e.preventDefault();void this.#commitDraft(draft,input.value);}
          if(e.key==='Escape'){e.preventDefault();this.#draft=null;this.render();}
        };
        input.onblur=()=>{if(this.#draft===draft&&!draft.busy)void this.#commitDraft(draft,input.value);};
        let insertAt=parentIndex+1;
        while(insertAt<siblings.length&&siblings[insertAt].style?.paddingInlineStart&&
          parseInt(siblings[insertAt].style.paddingInlineStart,10)>parseInt(siblings[parentIndex].style.paddingInlineStart,10))insertAt++;
        siblings.splice(insertAt,0,row);
        fragment.replaceChildren();
        const heading=document.createElement('div');heading.className='explorer-section';heading.textContent=this.#say('工作區','WORKSPACE');
        fragment.append(heading,...siblings);
      }
    }
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

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
  #translate=(key)=>key;
  #panel;#tree;#search;#openFile;#openDocument;#closeFile;#closeRoot;#newFile;#log;
  #state=readState();#clipboard=null;#actionBar=null;#hint=null;#rename=null;
  #hold=null;#drag=null;#selected=null;#revealGeneration=0;#suppressClick=false;#draft=null;
  #syncing=false;#syncTimer=null;#contextPopup=null;
  constructor({panel,openFile,openDocument,closeFile=async()=>false,closeRoot=async()=>true,newFile=()=>{},log=()=>{}}){
    this.#panel=panel;this.#tree=panel.querySelector('#explorerTree');
    this.#search=panel.querySelector('#explorerSearch');
    this.#openFile=openFile;this.#openDocument=openDocument;this.#closeFile=closeFile;this.#closeRoot=closeRoot;this.#newFile=newFile;this.#log=log;
    this.#search.addEventListener('input',()=>this.render());
    this.#hint=typeof document.createElement==='function'?
      document.createElement('div'):null;
    if(this.#hint){
    this.#hint.className='explorer-action-hint';
    this.#hint.setAttribute('role','status');
    this.#hint.setAttribute('aria-live','polite');
    this.#hint.hidden=true;
    this.#search.insertAdjacentElement?.('afterend',this.#hint);
    }
    panel.querySelector('#explorerAddFolder').addEventListener('click',()=>this.addDirectory());
    panel.querySelector('#explorerAddFile').addEventListener('click',()=>this.addFile());
    panel.querySelector('#explorerRefresh').addEventListener('click',()=>this.refresh());
    panel.querySelector('#explorerClose').addEventListener('click',()=>this.toggle(false));
    document.querySelector('#explorerToggle').addEventListener('click',()=>this.toggle());
    // Right click opens the action menu; left-button hold and drag reorders siblings.
    this.#tree.addEventListener('contextmenu',e=>this.#context(e));
    // Dismiss immediately on wheel/touch movement, and on any actual tree scroll.
    this.#tree.addEventListener('scroll',()=>this.#closeMenu(),{passive:true});
    this.#tree.addEventListener('wheel',()=>this.#closeMenu(),{passive:true});
    this.#tree.addEventListener('touchmove',()=>this.#closeMenu(),{passive:true});
    // The editor is a separate scroll container: dismiss the side menu there too.
    const editor=document.getElementById?.('editor');
    if(editor){
      editor.addEventListener('scroll',()=>this.#closeMenu(),{passive:true});
      editor.addEventListener('wheel',()=>this.#closeMenu(),{passive:true});
      editor.addEventListener('touchmove',()=>this.#closeMenu(),{passive:true});
    }
    if(typeof window!=='undefined')
      window.addEventListener('resize',()=>this.#closeMenu(),{passive:true});
    this.#tree.addEventListener('pointerdown',e=>this.#pointerDown(e));
    document.addEventListener('pointermove',e=>this.#pointerMove(e));
    document.addEventListener('pointerup',e=>this.#pointerUp(e));
    document.addEventListener('pointercancel',()=>{this.#clearHold();this.#drag=null;this.#tree.querySelectorAll('.drag-ready,.drag-target').forEach(el=>el.classList.remove('drag-ready','drag-target'));});
    document.addEventListener('click',e=>{
      if(this.#actionBar&&!e.target.closest('.explorer-inline-actions'))this.#closeMenu();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){this.#closeMenu();this.#cancelRename();}});
    this.#restoreRoots();
    // File System Access has no portable directory change event. Poll only
    // expanded folders while the Explorer is visible; preserve user state.
    if(typeof window!=='undefined'){
      this.#syncTimer=window.setInterval(()=>{void this.syncExternal();},2500);
      window.addEventListener('focus',()=>{void this.syncExternal();});
    }
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)void this.syncExternal();
    });
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
    if(!open)this.#closeMenu();
    this.#panel.hidden=!open;
    document.querySelector('#explorerToggle').setAttribute('aria-expanded',String(open));
    if(open){void this.syncExternal();if(this.#active)this.revealDocument(this.#active);}
  }
  setLocale(locale,translate){
    this.#closeMenu();
    this.#locale=locale;
    this.#translate=translate;
    const labels={explorerTitle:'#explorerTitle',explorerSearch:'#explorerSearch',
      explorerAddFolder:'#explorerAddFolder',explorerAddFile:'#explorerAddFile',explorerClose:'#explorerClose'};
    for(const [key,selector] of Object.entries(labels)){
      const el=this.#panel.querySelector(selector);
      if(key==='explorerSearch'){el.placeholder=translate(key);el.setAttribute('aria-label',translate(key));}
      else if(key==='explorerTitle')el.textContent=translate(key);
      else{el.title=translate(key);el.setAttribute('aria-label',translate(key));}
    }
    const importLabels={explorerAddFolder:['▣ ',translate('explorerImportFolder')],explorerAddFile:['◇ ',translate('explorerImportFile')]};
    for(const [id,[symbol,label]] of Object.entries(importLabels)){
      const button=this.#panel.querySelector('#'+id);
      button.textContent=symbol+label;
      button.title=label;
      button.setAttribute('aria-label',label);
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
    }catch(error){
      // Transient permission/read failures must not erase a cached tree.
      this.#log('Explorer directory read: '+error);
    }
  }
  async syncExternal(){
    if(this.#syncing||this.#panel.hidden||document.hidden)return false;
    this.#syncing=true;
    let changed=false;
    const visit=async node=>{
      if(node.kind!=='directory'||!node.expanded)return;
      const previous=node.children||[];
      const signature=previous.map(n=>n.name+'|'+n.kind).sort().join('\\n');
      try{
        await this.#loadChildren(node,true);
      }catch(error){this.#log('Explorer external sync: '+error);return;}
      const next=node.children||[];
      if(signature!==next.map(n=>n.name+'|'+n.kind).sort().join('\\n'))changed=true;
      for(const child of next)if(child.kind==='directory'&&child.expanded)await visit(child);
    };
    try{
      for(const root of this.#roots)await visit(root);
      if(changed){
        // Do not close a context menu or reset selection unless its entry vanished.
        const keys=new Set(this.#allNodes().map(n=>this.#key(n)));
        if(this.#selected&&!keys.has(this.#selected))this.#selected=null;
        if(this.#actionBar&&!keys.has(this.#actionBar.nodeKey))this.#actionBar=null;
        if(!this.#rename&&!this.#draft&&!this.#hold)this.render();
      }
      return changed;
    }finally{this.#syncing=false;}
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
  #closeMenu(){
    if(!this.#actionBar)return;
    this.#actionBar=null;
    this.#contextPopup?.remove();this.#contextPopup=null;
    this.#updateHint();
    this.render();
  }
  #updateHint(action=''){
    const state=this.#actionBar;
    this.#search.hidden=false;
    this.#search.disabled=false;
    if(this.#hint)this.#hint.hidden=true;
    if(!state)return;
    const node=this.#allNodes().find(item=>this.#key(item)===state.nodeKey);
    const target=node?.name||state.name;
    const fallback=this.#say('請選擇功能','Choose an action');
    if(!this.#hint)return;
    this.#hint.textContent=this.#say('操作 ','Actions for ')+target+
      '（'+(action||fallback)+'）';
    this.#hint.title=this.#hint.textContent;
  }
  #context(event){
    const row=event.target.closest('.explorer-entry[data-path]');
    if(!row)return;
    event.preventDefault();
    const node=this.#nodeAt(row);
    if(!node)return;
    this.#selected=this.#key(node);
    this.#actionBar={nodeKey:this.#key(node),name:node.name,level:'primary'};
    this.#updateHint();
    this.render();
    this.#showContextPopup();
  }
  #showContextPopup(){
    this.#contextPopup?.remove();this.#contextPopup=null;
    if(!this.#actionBar)return;
    const row=[...this.#tree.querySelectorAll('.explorer-entry[data-path]')]
      .find(item=>item.dataset.path===this.#actionBar.nodeKey);
    const node=this.#allNodes().find(item=>this.#key(item)===this.#actionBar.nodeKey);
    if(!row||!node)return;
    const popup=this.#inlineActions(node);
    popup.classList.add('explorer-vscode-popup');
    popup.setAttribute('role','menu');
    document.body.append(popup);this.#contextPopup=popup;
    const rect=row.getBoundingClientRect();
    const panel=this.#panel.getBoundingClientRect();
    const width=164;
    const rightSpace=window.innerWidth-panel.right;
    const left=rightSpace>=width+8?panel.right+4:Math.max(8,panel.left-width-4);
    popup.style.left=Math.max(8,left)+'px';
    popup.style.top=Math.max(8,Math.min(rect.top,window.innerHeight-popup.offsetHeight-8))+'px';
  }
  #inlineActions(node){
    const toolbar=document.createElement('span');
    toolbar.className='explorer-inline-actions';
    toolbar.setAttribute('role','toolbar');
    toolbar.setAttribute('aria-label',this.#say('檔案操作','File actions'));
    const primary=[
      ['folder','▣',this.#say('資料夾','Folder'),()=>this.#createIn(node,'directory')],
      ['file','◇',this.#say('新文件','New file'),()=>this.#createIn(node,'file')],
      ['close','×',this.#say('關閉','Close'),()=>this.#closeEntry(node)],
      ['more','⋯',this.#say('更多','More'),null]
    ];
    const secondary=[
      ['back','‹',this.#say('返回','Back'),null],
      ['rename','✎',this.#say('重新命名','Rename'),()=>this.#startRename(node)],
      ['cut','✂',this.#say('剪下','Cut'),()=>{this.#clipboard={node,cut:true};}],
      ['copy','▤',this.#say('複製','Copy'),()=>{this.#clipboard={node,cut:false};}],
      ['paste','▧',this.#say('貼上','Paste'),()=>this.#paste(node)],
      ['delete','⌫',this.#say('刪除','Delete'),()=>this.#delete(node)]
    ];
    const items=this.#actionBar.level==='primary'?primary:secondary;
    const buttons=[];
    for(const [key,glyph,label,action] of items){
      const button=document.createElement('button');
      button.type='button';
      button.className='explorer-inline-action'+(key==='delete'?' is-danger':'');
      const symbol=document.createElement('span');symbol.className='explorer-action-symbol';
      symbol.textContent=glyph;symbol.setAttribute('aria-hidden','true');
      // Keep the action surface a single symbol; full names remain accessible
      // via title, aria-label and the existing hover/focus hint.
      button.append(symbol);
      button.dataset.action=key;
      button.title=label;
      button.setAttribute('aria-label',label);
      button.disabled=(key==='rename'&&(!node.parent||node.kind==='directory'))||
        (key==='paste'&&!this.#clipboard)||
        (key==='folder'&&!node.parent&&node.kind!=='directory')||
        (key==='file'&&!node.parent&&node.kind!=='directory');
      button.addEventListener('pointerenter',()=>this.#updateHint(label));
      button.addEventListener('pointerleave',()=>this.#updateHint());
      button.addEventListener('focus',()=>this.#updateHint(label));
      button.addEventListener('blur',()=>this.#updateHint());
      button.addEventListener('click',event=>{
        event.stopPropagation();
        if(key==='more'||key==='back'){
          this.#actionBar.level=key==='more'?'secondary':'primary';
          this.#updateHint();
          this.render();
          this.#showContextPopup();
          this.#contextPopup?.querySelector('.explorer-inline-action')?.focus({preventScroll:true});
          return;
        }
        this.#closeMenu();
        Promise.resolve().then(action).catch(error=>this.#log(String(error)));
      });
      toolbar.append(button);
      buttons.push(button);
    }
    toolbar.addEventListener('click',event=>event.stopPropagation());
    toolbar.addEventListener('keydown',event=>{
      const current=buttons.indexOf(document.activeElement);
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();
        const step=event.key==='ArrowDown'?1:-1;
        buttons[(current+step+buttons.length)%buttons.length].focus();
      }
      if(event.key==='Home'){event.preventDefault();buttons[0].focus();}
      if(event.key==='End'){event.preventDefault();buttons.at(-1).focus();}
    });
    return toolbar;
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
  #cancelRename(){
    this.#rename=null;
    this.render();
  }
  #startRename(node){
    if(!node.parent||node.kind!=='file')return;
    this.#rename=this.#key(node);
    this.render();
    this.#tree.querySelector('.explorer-rename')?.focus();
  }
  async #renameNode(node,newName){
    const oldKey=this.#key(node);
    // Enter and blur can fire together. Consume the edit before awaiting I/O.
    if(this.#rename!==oldKey)return;
    this.#rename=null;
    const name=newName.trim();
    if(!name||name===node.name){this.render();return;}
    if(!node.parent||node.kind!=='file'){this.render();return;}
    if(name==='.'||name==='..'||name.includes('/')||name.includes('\\\\')){
      this.#log('Invalid rename target: '+name);
      this.render();return;
    }
    const parent=node.parent.handle;
    const oldName=node.name;
    try{
      for await(const existing of parent.keys()){
        if(existing===name)throw new Error('Entry already exists: '+name);
      }
      const file=await node.handle.getFile();
      const target=await parent.getFileHandle(name,{create:true});
      const writer=await target.createWritable();
      try{await writer.write(file);await writer.close();}
      catch(error){await writer.abort().catch(()=>{});throw error;}
      try{await parent.removeEntry(oldName);}
      catch(error){
        await parent.removeEntry(name).catch(()=>{});
        throw error;
      }
      node.name=name;
      node.handle=target;
      if(this.#selected===oldKey)this.#selected=this.#key(node);
      this.#state.order??={};
      this.#state.order[this.#key(node.parent)]=(node.parent.children||[]).map(n=>n.name);
      this.#save();
    }catch(error){this.#log('Rename failed: '+error);}
    finally{this.render();}
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
    if(e.button!==0||e.target.closest('.explorer-disclosure,.explorer-rename,.explorer-inline-actions'))return;
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
    if(this.#actionBar)this.#showContextPopup();
  }
  #button(name,kind,depth){
    const button=document.createElement('div');button.setAttribute('role','button');
    button.tabIndex=0;
    button.addEventListener('keydown',event=>{
      if(event.target!==button)return;
      if(event.key==='Enter'||event.key===' '){event.preventDefault();button.click();}
    });
    button.className='explorer-entry';button.style.paddingInlineStart=(10+depth*15)+'px';
    button.title=name;
    const arrow=document.createElement('span');arrow.className='explorer-arrow';
    const icon=document.createElement('span');icon.className='explorer-file-icon';
    icon.textContent=kind==='directory'?'▣':'◇';
    const label=document.createElement('span');label.className='explorer-name';label.textContent=name;
    button.append(arrow,icon,label);return button;
  }
}

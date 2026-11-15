// v0.0.65 PR-02 — Browser UI only. Never runs OS commands.
import {PowerShellManager} from './powershell-manager.js';
import {PowerShellClient} from './powershell-client.js?v=opt065-native-r1';
import {createSetupCmd,SETUP_FILENAME} from './cmd-setup.js?v=opt065-native-r1';
const COPY={
 'zh-Hant':{title:'PowerShell',setup:'配置本地代理',desc:'尚未連線至 PowerShell Local Agent。此介面不可執行命令。',check:'檢查連線',tool:'PowerShell 工具',permissions:'權限管理',revoke:'撤銷本地權限',unavailable:'本地代理尚未提供。無法執行命令。',command:'環境檢查指令（CMD）',hint:'這是選用的環境診斷指令；請在 Windows CMD 執行。Token 僅輸入於上方配對欄位。',close:'關閉',status:'未配置',rule:'預設權限：可申請',notice:'權限管理需先配置可信任的本地代理；目前僅提供規則說明。'},
 en:{title:'PowerShell',setup:'Set up Local Agent',desc:'PowerShell Local Agent is not connected. Commands cannot be executed here.',check:'Check connection',tool:'PowerShell tools',permissions:'Permission management',revoke:'Revoke local access',unavailable:'Local Agent is not available. Commands are disabled.',command:'Environment check (CMD)',hint:'Optional environment diagnostics for Windows CMD. Enter the token only in the pairing field.',close:'Close',status:'Not configured',rule:'Default permission: Requestable',notice:'Permission management requires a trusted Local Agent. This is an informational preview.'}
};
const CHECK='powershell.exe -NoProfile -Command "$PSVersionTable.PSVersion.ToString(); [Environment]::OSVersion.VersionString"';
export function mountPowerShellUI({host,button,language,manager=new PowerShellManager({agent:new PowerShellClient()})}){
 if(!host||!button||!language)throw new Error('PSM_UI_MISSING_DEPENDENCY');
 let open=false;
 const toolMenu=()=>pane.querySelector('.psm-menu');
 const toolButton=()=>pane.querySelector(connected?'[data-psm-action="settings"]':'[data-psm-action="tool"]');
 function closeToolMenu(){const menu=toolMenu();if(!menu)return;menu.hidden=true;toolButton()?.setAttribute('aria-expanded','false');}
 function positionToolMenu(){const menu=toolMenu(),trigger=toolButton();if(!menu||menu.hidden||!trigger)return;const a=trigger.getBoundingClientRect();const w=menu.offsetWidth||200,h=menu.offsetHeight||100;menu.style.left=Math.max(8,Math.min(a.right-w,window.innerWidth-w-8))+'px';menu.style.top=Math.max(8,Math.min(a.bottom+6,window.innerHeight-h-8))+'px';}
 function onOutsideClick(event){if(!toolMenu()?.hidden&&!toolMenu().contains(event.target)&&!toolButton().contains(event.target))closeToolMenu();}
 function onEscape(event){if(event.key==='Escape')closeToolMenu();}
 function onScroll(event){if(!toolMenu()?.hidden&&event.target!==toolMenu())closeToolMenu();}
 document.addEventListener('pointerdown',onOutsideClick,true);
 document.addEventListener('keydown',onEscape,true);
 document.addEventListener('scroll',onScroll,true);
 window.addEventListener('scroll',onScroll,true);
 window.addEventListener('resize',closeToolMenu);
 const sessions=[];
 const remote=manager.agent;
 let pollTimer=null;
 let connected=false;
 let terminalBusy=false;
 let selected=null;
 let sequence=0;
 const tabs=host.querySelector('#tabs');
 const pane=document.createElement('section');
 pane.id='powershellManagerPane';pane.className='psm-pane';pane.hidden=true;
 pane.setAttribute('aria-label','PowerShell');
 pane.innerHTML=`<div class="psm-top"><strong data-psm="title"></strong><div class="psm-actions"><span data-psm="status"></span><button type="button" data-psm-action="tool" aria-expanded="false" aria-label="PowerShell tools">⚙</button><button type="button" data-psm-action="close" aria-label="Close">×</button></div></div><div class="psm-menu" hidden><button type="button" data-psm-action="connection-settings"></button><button type="button" data-psm-action="clear"></button></div><div class="psm-body"><div class="psm-intro"><span class="psm-glyph" aria-hidden="true">⌁</span><div><span class="psm-eyebrow">LOCAL CONNECTION · v0.0.65</span><h2 data-psm="setup"></h2><p data-psm="desc"></p></div></div><details class="psm-advanced"><summary data-psm="command"></summary><label for="psmCheckCommand" data-psm="hint"></label><input id="psmCheckCommand" readonly></details><div class="psm-footer"><button type="button" data-psm-action="check" class="psm-primary"></button><p role="status" aria-live="polite" data-psm="feedback"></p></div></div>`;
 host.append(pane);
 const terminal=document.createElement('section');
 terminal.className='psm-terminal psm-terminal-classic';terminal.hidden=true;
 terminal.innerHTML='<div class="psm-terminal-head"><strong data-psm-terminal="heading"></strong><span class="psm-terminal-connection" data-psm-terminal="mode"></span><div class="psm-terminal-toolbar"><button type="button" data-psm-action="new-session"></button><button type="button" data-psm-action="close-session"></button><button type="button" data-psm-action="settings"></button></div></div>';
 pane.append(terminal);
 // Native ConPTY is the only terminal. No textarea or HTTP-command fallback.
 const nativeWrap=document.createElement('div');
 nativeWrap.className='psm-native-wrap';nativeWrap.hidden=true;
 nativeWrap.style.cssText='flex:1;min-height:220px;background:#0b1018;padding:8px;overflow:hidden';
 terminal.append(nativeWrap);
 let nativeSocket=null,nativeTerm=null,nativeFit=null,nativeLoading=null;
 async function loadNativeTerminal(){
   if(window.Terminal)return;
   if(nativeLoading)return nativeLoading;
   nativeLoading=(async()=>{
     const css=document.createElement('link');css.rel='stylesheet';css.href='https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css';document.head.append(css);
     await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js';script.onload=resolve;script.onerror=()=>reject(Error('XTERM_LOAD_FAILED'));document.head.append(script);});
   })();return nativeLoading;
 }
 async function startNativeTerminal(){
   try{
     await loadNativeTerminal();
     if(nativeSocket){nativeSocket.close();nativeSocket=null;}
     nativeTerm?.dispose();nativeWrap.replaceChildren();
     nativeTerm=new window.Terminal({cursorBlink:true,convertEol:false,fontFamily:'Consolas, monospace',fontSize:13,theme:{background:'#0b1018',foreground:'#e5eaf1'},scrollback:10000});
     nativeWrap.hidden=false;
               nativeTerm.open(nativeWrap);
     const ws=remote.openNativeTerminal();nativeSocket=ws;
     ws.addEventListener('message',event=>{
       let message;try{message=JSON.parse(event.data);}catch{return;}
       if(message.type==='data')nativeTerm?.write(message.data);
       if(message.type==='ready')nativeTerm?.write('\\r\\n[ConPTY connected]\\r\\n');
       if(message.type==='error')nativeTerm?.write('\\r\\n'+message.message+'\\r\\n');
       if(message.type==='exit')nativeTerm?.write('\\r\\n[Shell exited: '+message.exitCode+']\\r\\n');
     });
     ws.addEventListener('close',()=>nativeTerm?.write('\\r\\n[Native terminal disconnected]\\r\\n'));
     nativeTerm.onData(data=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'input',data}));});
     const resize=()=>{if(!nativeTerm||ws.readyState!==WebSocket.OPEN)return;const cols=Math.max(20,Math.floor(nativeWrap.clientWidth/8)),rows=Math.max(8,Math.floor(nativeWrap.clientHeight/17));nativeTerm.resize(cols,rows);ws.send(JSON.stringify({type:'resize',cols,rows}));};
     ws.addEventListener('open',resize);window.addEventListener('resize',resize);
               nativeTerm.focus();
   }catch(e){nativeWrap.hidden=false;nativeWrap.textContent='Native terminal unavailable: '+e.message+' — check Local Agent installation and reconnect.';}
 }

 function renderMode(){const setupView=pane.querySelector('.psm-body');setupView.hidden=connected;terminal.hidden=!connected;pane.classList.toggle('psm-connected',connected);}
 function appendOutput(message,id=selected){const session=sessions.find(x=>x.id===id);if(session)session.output.push(message);if(id===selected&&nativeTerm)nativeTerm.writeln(String(message));}
 function setConnected(value){connected=Boolean(value);renderMode();translate();if(!connected){nativeSocket?.close();nativeSocket=null;nativeTerm?.dispose();nativeTerm=null;nativeWrap.replaceChildren();}else if(open)requestAnimationFrame(()=>startNativeTerminal());}

 const setup=document.createElement('div');setup.className='psm-quick-setup';
 setup.innerHTML='<div class="psm-setup-step"><span class="psm-step-number">01</span><div><strong data-psm-extra="downloadTitle"></strong><p data-psm-extra="downloadHint"></p><button type="button" data-psm-action="download" class="psm-primary"></button></div></div><div class="psm-setup-step"><span class="psm-step-number">02</span><div><strong data-psm-extra="pairTitle"></strong><p data-psm-extra="pairHint"></p><div class="psm-pair-row"><input id="psmAgentPort" type="number" min="1024" max="65535" value="43881" aria-label="Local Agent port" title="Local Agent port" style="width:100px"><input id="psmPairToken" type="password" autocomplete="off" spellcheck="false" placeholder="64-character token"><button type="button" data-psm-action="pair"></button></div></div></div><div class="psm-setup-step"><span class="psm-step-number">03</span><div><strong data-psm-extra="verifyTitle"></strong><p data-psm-extra="verifyHint"></p></div></div>';
 pane.querySelector('.psm-body').prepend(setup);
 pane.classList.add('psm-compact-setup');
 const q=s=>pane.querySelector(s);
 q('#psmAgentPort').value=String(remote.port||43881);
 q('#psmCheckCommand').value=CHECK;
 function t(){return COPY[language.value]||COPY['zh-Hant'];}
 function translate(){
   const msg=t();
   for(const key of ['title','status','setup','desc','command','hint','check','permissions','revoke']){
     const node=q('[data-psm="'+key+'"]');if(node)node.textContent=msg[key];
   }
   for(const key of ['check']){
     const control=q('[data-psm-action="'+key+'"]');if(control){control.textContent=msg[key];control.setAttribute('aria-label',msg[key]);}
   }
   q('[data-psm-action="connection-settings"]').textContent=language.value==='en'?'Connection settings':'連線設定';
   q('.psm-menu [data-psm-action="clear"]').textContent=language.value==='en'?'Clear output':'清除輸出';
   q('[data-psm-action="tool"]').title=msg.tool;
   q('[data-psm-action="tool"]').setAttribute('aria-label',msg.tool);
   q('[data-psm-action="tool"]').textContent=language.value==='en'?'Tools':'工具';
   q('[data-psm-action="close"]').title=msg.close;
   q('[data-psm-action="close"]').setAttribute('aria-label',msg.close);
   q('[data-psm-action="close"]').textContent=msg.close;
   const extra=language.value==='en'?{downloadTitle:'Download setup CMD',downloadHint:'Run CMD to start the agent and see its token. If port 43881 is busy, press Y to force-release port 43881; this may stop an unrelated service.',download:'Download .cmd',pairTitle:'Pair local agent',pairHint:'Copy the 64-character token shown in CMD. It is kept only in browser memory.',pair:'Pair',verifyTitle:'Verify connection',verifyHint:'Click Check connection. Never expose the local port publicly.'}:{downloadTitle:'下載快速配置 CMD',downloadHint:'執行 CMD 後顯示 Token。若 43881 已占用，輸入 Y 即可強制釋放連接埠，可能中斷其他程式。',download:'下載 .cmd',pairTitle:'配對本地代理',pairHint:'複製 CMD 顯示的 64 字元 Token，僅存於瀏覽器記憶體。',pair:'配對',verifyTitle:'驗證連線',verifyHint:'點擊下方「檢查連線」，勿公開本地連接埠。'};
   for(const key of ['downloadTitle','downloadHint','pairTitle','pairHint','verifyTitle','verifyHint'])q('[data-psm-extra="'+key+'"]').textContent=extra[key];
   q('[data-psm-action="download"]').textContent=extra.download;
   q('[data-psm-action="pair"]').textContent=extra.pair;
   button.title=msg.title;button.setAttribute('aria-label',msg.title);
   const labels=language.value==='en'?{heading:'PowerShell',mode:'Connected',settings:'PowerShell tools',version:'PowerShell version',location:'Current directory',clear:'Clear output','new-session':'+ Session','close-session':'Close session'}:{heading:'PowerShell',mode:'已連線',settings:'PowerShell 工具',version:'PowerShell 版本',location:'目前目錄',clear:'清除輸出','new-session':'+工作階段','close-session':'關閉工作階段'};
   const runLabel=language.value==='en'?'Run':'執行';
   for(const [key,value] of Object.entries(labels)){const node=terminal.querySelector('[data-psm-terminal="'+key+'"]')||terminal.querySelector('[data-psm-action="'+key+'"]');if(node)node.textContent=value;}
   q('[data-psm="status"]').textContent=connected?(language.value==='en'?'Connected':'已連線'):msg.status;
 }
 function renderTabs(){
   // Document tabs are owned by main.js; only append our own session cards.
   for(const session of sessions){
     const tab=document.createElement('div');
     tab.className='tab psm-tab'+(open&&selected===session.id?' active':'');
     tab.dataset.psmTab=String(session.id);
     const name=document.createElement('span');name.className='name';name.textContent='⌁ '+t().title+' '+session.id;
     const close=document.createElement('span');close.className='close';close.textContent='×';
     close.setAttribute('role','button');close.setAttribute('aria-label',t().close);
     close.onclick=e=>{e.stopPropagation();closeSession(session.id);};
     tab.append(name,close);
     tab.onclick=()=>selectSession(session.id);
     tabs.append(tab);
   }
 }
 function selectSession(id){
   closeToolMenu();
   if(!sessions.some(x=>x.id===id))return;
   selected=id;open=true;pane.hidden=false;
   host.classList.add('psm-mode');button.setAttribute('aria-pressed','true');
   // A session has its own setup status/feedback, independent from other tabs.
   q('[data-psm="feedback"]').textContent=sessions.find(x=>x.id===id).feedback||'';
   renderMode();translate();syncTabs();if(connected)requestAnimationFrame(()=>{if(nativeSocket?.readyState===WebSocket.OPEN)nativeTerm?.focus();else startNativeTerminal();});
 }
 function createSession(){
   const session={id:++sequence,feedback:'',history:[],historyIndex:0,output:[],remoteId:null,starting:false,polling:false};sessions.push(session);
   selectSession(session.id);return session.id;
 }
 function hide(){closeToolMenu();open=false;pane.hidden=true;host.classList.remove('psm-mode');button.setAttribute('aria-pressed','false');closeToolMenu();syncTabs();}
 function closeSession(id){
   const i=sessions.findIndex(x=>x.id===id);if(i<0)return;
   const old=sessions[i];if(nativeSocket){nativeSocket.close();nativeSocket=null;}nativeTerm?.dispose();nativeTerm=null;if(old.remoteId)remote.closeSession(old.remoteId).catch(()=>{});
   sessions.splice(i,1);
   if(selected===id){
     selected=null;
     if(sessions.length)selectSession(sessions[Math.min(i,sessions.length-1)].id);
     else hide();
   }else syncTabs();
 }
 function syncTabs(){
   tabs.querySelectorAll('.psm-tab').forEach(tab=>tab.remove());
   renderTabs();
   tabs.querySelectorAll('.tab:not(.psm-tab)').forEach(tab=>tab.classList.toggle('active',!open&&tab.classList.contains('active')));
 }
 function show(){if(selected!==null)selectSession(selected);else createSession();}
 button.addEventListener('click',createSession);
 pane.addEventListener('click',async event=>{
   const action=event.target.closest('[data-psm-action]')?.dataset.psmAction;
   if(!action)return;
   if(action==='new-session'){if(nativeSocket){nativeSocket.close();nativeSocket=null;}nativeTerm?.dispose();nativeTerm=null;createSession();return;}
   if(action==='close-session'){closeSession(selected);return;}
   if(action==='download'){
     const cmd=createSetupCmd();
     const url=URL.createObjectURL(new Blob([cmd],{type:'application/octet-stream'}));
     const a=document.createElement('a');a.href=url;a.download=SETUP_FILENAME;
     document.body.append(a);a.click();a.remove();
     setTimeout(()=>URL.revokeObjectURL(url),1000);
   }
   if(action==='pair'){
     const pairButton=q('[data-psm-action="pair"]');pairButton.disabled=true;
     if(!manager.agent.setPort(q('#psmAgentPort').value)){setFeedback('Port must be between 1024 and 65535.');pairButton.disabled=false;return;}
     const ok=manager.agent.pair(q('#psmPairToken').value);
     if(ok)q('#psmPairToken').value='';
     if(!ok){pairButton.disabled=false;setFeedback(language.value==='en'?'Token must be exactly 64 hexadecimal characters.':'Token 必須是 64 個十六進位字元。');return;}
     try{
       const state=await manager.checkConnection();
       if(state.configured){setConnected(true);appendOutput(language.value==='en'?'Local Agent authenticated. Interactive PowerShell ready.':'本地代理驗證成功，可以直接輸入命令。');setFeedback('');}
       else setFeedback((language.value==='en'?'Pairing failed: ':'配對失敗：')+(state.error||'NETWORK_UNAVAILABLE')+(language.value==='en'?'. Check agent, token and browser local-network access.':'。請確認代理視窗、Token 與瀏覽器本地網路權限。'));
     }catch{setFeedback(language.value==='en'?'Cannot reach local agent on 127.0.0.1:43881.':'無法連線至 127.0.0.1:43881。');}
     finally{pairButton.disabled=false;}
   }
   if(action==='close')closeSession(selected);
   if(action==='settings'||action==='tool'){const menu=toolMenu();const shouldOpen=menu.hidden;closeToolMenu();if(shouldOpen){menu.hidden=false;toolButton().setAttribute('aria-expanded','true');positionToolMenu();}return;}
   if(action==='connection-settings'){setConnected(false);for(const session of sessions){if(session.remoteId)remote.closeSession(session.remoteId).catch(()=>{});session.remoteId=null;}closeToolMenu();return;}
   if(action==='clear'){nativeTerm?.clear();closeToolMenu();}
   if(action==='check'){const state=await manager.checkConnection();if(state.configured){setConnected(true);appendOutput(language.value==='en'?'Connected to local agent.':'已連線至本地代理。');}else setFeedback((language.value==='en'?'Connection failed: ':'連線失敗：')+(state.error||'NETWORK_UNAVAILABLE'));}
 });
 function setFeedback(value){q('[data-psm="feedback"]').textContent=value;const session=sessions.find(x=>x.id===selected);if(session)session.feedback=value;}
 const unsubscribe=language.subscribe(()=>{translate();syncTabs();});
 translate();
 if(remote.paired)manager.checkConnection().then(state=>{if(state.configured)setConnected(true);else remote.clear();}).catch(()=>{});
 return {show,hide,createSession,selectSession,closeSession,syncTabs,get isOpen(){return open;},get sessions(){return sessions.map(x=>({...x}));},dispose(){if(pollTimer)clearInterval(pollTimer);for(const session of sessions)if(session.remoteId)remote.closeSession(session.remoteId).catch(()=>{});unsubscribe();document.removeEventListener('pointerdown',onOutsideClick,true);document.removeEventListener('keydown',onEscape,true);document.removeEventListener('scroll',onScroll,true);window.removeEventListener('scroll',onScroll,true);window.removeEventListener('resize',closeToolMenu);hide();tabs.querySelectorAll('.psm-tab').forEach(x=>x.remove());pane.remove();}};
}

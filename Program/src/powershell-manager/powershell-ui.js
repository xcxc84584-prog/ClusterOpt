// v0.0.60 PR-02 — Browser UI only. Never runs OS commands.
import {PowerShellManager} from './powershell-manager.js';
import {PowerShellClient} from './powershell-client.js?v=opt060-psm-r5';
import {createSetupCmd,SETUP_FILENAME} from './cmd-setup.js?v=opt060-psm-r5';
const COPY={
 'zh-Hant':{title:'PowerShell',setup:'配置本地代理',desc:'尚未連線至 PowerShell Local Agent。此介面不可執行命令。',check:'檢查連線',tool:'PowerShell 工具',permissions:'權限管理',revoke:'撤銷本地權限',unavailable:'本地代理尚未提供。無法執行命令。',command:'環境檢查指令（CMD）',hint:'請在 Windows CMD 執行以下唯讀環境檢查。正式安裝器尚未發布，請勿輸入 Token。',close:'關閉',status:'未配置',rule:'預設權限：可申請',notice:'權限管理需先配置可信任的本地代理；目前僅提供規則說明。'},
 en:{title:'PowerShell',setup:'Set up Local Agent',desc:'PowerShell Local Agent is not connected. Commands cannot be executed here.',check:'Check connection',tool:'PowerShell tools',permissions:'Permission management',revoke:'Revoke local access',unavailable:'Local Agent is not available. Commands are disabled.',command:'Environment check (CMD)',hint:'Run this read-only check in Windows CMD. The verified installer is not yet published; do not enter a token.',close:'Close',status:'Not configured',rule:'Default permission: Requestable',notice:'Permission management requires a trusted Local Agent. This is an informational preview.'}
};
const CHECK='powershell.exe -NoProfile -Command "$PSVersionTable.PSVersion.ToString(); [Environment]::OSVersion.VersionString"';
export function mountPowerShellUI({host,button,language,manager=new PowerShellManager({agent:new PowerShellClient()})}){
 if(!host||!button||!language)throw new Error('PSM_UI_MISSING_DEPENDENCY');
 let open=false;
 const toolMenu=()=>pane.querySelector('.psm-menu');
 const toolButton=()=>pane.querySelector('[data-psm-action="tool"]');
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
 let connected=false;
 let terminalBusy=false;
 let selected=null;
 let sequence=0;
 const tabs=host.querySelector('#tabs');
 const pane=document.createElement('section');
 pane.id='powershellManagerPane';pane.className='psm-pane';pane.hidden=true;
 pane.setAttribute('aria-label','PowerShell');
 pane.innerHTML=`<div class="psm-top"><strong data-psm="title"></strong><div class="psm-actions"><span data-psm="status"></span><button type="button" data-psm-action="tool" aria-expanded="false" aria-label="PowerShell tools">⚙</button><button type="button" data-psm-action="close" aria-label="Close">×</button></div></div><div class="psm-menu" hidden><button type="button" data-psm-action="permissions"></button><button type="button" data-psm-action="revoke"></button></div><div class="psm-body"><div class="psm-intro"><span class="psm-glyph" aria-hidden="true">⌁</span><div><span class="psm-eyebrow">LOCAL CONNECTION · v0.0.60</span><h2 data-psm="setup"></h2><p data-psm="desc"></p></div></div><details class="psm-advanced"><summary data-psm="command"></summary><label for="psmCheckCommand" data-psm="hint"></label><input id="psmCheckCommand" readonly></details><div class="psm-footer"><button type="button" data-psm-action="check" class="psm-primary"></button><p role="status" aria-live="polite" data-psm="feedback"></p></div></div>`;
 host.append(pane);
 const terminal=document.createElement('section');
 terminal.className='psm-terminal';terminal.hidden=true;
 terminal.innerHTML='<div class="psm-terminal-head"><strong data-psm-terminal="heading"></strong><span data-psm-terminal="mode"></span><button type="button" data-psm-action="settings"></button></div><div class="psm-terminal-output" role="log" aria-live="polite" aria-label="PowerShell output"></div><div class="psm-terminal-actions"><button type="button" data-psm-action="version"></button><button type="button" data-psm-action="location"></button><button type="button" data-psm-action="clear"></button></div>';
 pane.append(terminal);
 function renderMode(){const setupView=pane.querySelector('.psm-body');setupView.hidden=connected;terminal.hidden=!connected;pane.classList.toggle('psm-connected',connected);}
 function appendOutput(message){const line=document.createElement('pre');line.textContent=message;terminal.querySelector('.psm-terminal-output').append(line);terminal.querySelector('.psm-terminal-output').scrollTop=terminal.querySelector('.psm-terminal-output').scrollHeight;}
 function setConnected(value){connected=Boolean(value);renderMode();translate();}

 const setup=document.createElement('div');setup.className='psm-quick-setup';
 setup.innerHTML='<div class="psm-setup-step"><span class="psm-step-number">01</span><div><strong data-psm-extra="downloadTitle"></strong><p data-psm-extra="downloadHint"></p><button type="button" data-psm-action="download" class="psm-primary"></button></div></div><div class="psm-setup-step"><span class="psm-step-number">02</span><div><strong data-psm-extra="pairTitle"></strong><p data-psm-extra="pairHint"></p><div class="psm-pair-row"><input id="psmPairToken" type="password" autocomplete="off" spellcheck="false" placeholder="64-character token"><button type="button" data-psm-action="pair"></button></div></div></div><div class="psm-setup-step"><span class="psm-step-number">03</span><div><strong data-psm-extra="verifyTitle"></strong><p data-psm-extra="verifyHint"></p></div></div>';
 pane.querySelector('.psm-body').prepend(setup);
 const q=s=>pane.querySelector(s);
 q('#psmCheckCommand').value=CHECK;
 function t(){return COPY[language.value]||COPY['zh-Hant'];}
 function translate(){
   const msg=t();
   for(const key of ['title','status','setup','desc','command','hint','check','permissions','revoke']){
     const node=q('[data-psm="'+key+'"]');if(node)node.textContent=msg[key];
   }
   q('[data-psm-action="tool"]').title=msg.tool;
   q('[data-psm-action="tool"]').setAttribute('aria-label',msg.tool);
   q('[data-psm-action="close"]').title=msg.close;
   q('[data-psm-action="close"]').setAttribute('aria-label',msg.close);
   const extra=language.value==='en'?{downloadTitle:'Download setup CMD',downloadHint:'Run CMD to start the agent and see its token. If port 43881 is busy, press Y to force-release port 43881; this may stop an unrelated service.',download:'Download .cmd',pairTitle:'Pair local agent',pairHint:'Copy the 64-character token shown in CMD. It is kept only in browser memory.',pair:'Pair',verifyTitle:'Verify connection',verifyHint:'Click Check connection. Never expose the local port publicly.'}:{downloadTitle:'下載快速配置 CMD',downloadHint:'執行 CMD 後顯示 Token。若 43881 已占用，輸入 Y 即可強制釋放連接埠，可能中斷其他程式。',download:'下載 .cmd',pairTitle:'配對本地代理',pairHint:'複製 CMD 顯示的 64 字元 Token，僅存於瀏覽器記憶體。',pair:'配對',verifyTitle:'驗證連線',verifyHint:'點擊下方「檢查連線」，勿公開本地連接埠。'};
   for(const key of ['downloadTitle','downloadHint','pairTitle','pairHint','verifyTitle','verifyHint'])q('[data-psm-extra="'+key+'"]').textContent=extra[key];
   q('[data-psm-action="download"]').textContent=extra.download;
   q('[data-psm-action="pair"]').textContent=extra.pair;
   button.title=msg.title;button.setAttribute('aria-label',msg.title);
   const labels=language.value==='en'?{heading:'PowerShell · Local Agent',mode:'Read-only / Allowlisted',settings:'Connection settings',version:'PowerShell version',location:'Current directory',clear:'Clear output'}:{heading:'PowerShell · 本地代理',mode:'唯讀 / 白名單',settings:'連線設定',version:'PowerShell 版本',location:'目前目錄',clear:'清除輸出'};
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
   renderMode();translate();syncTabs();
 }
 function createSession(){
   const session={id:++sequence,feedback:''};sessions.push(session);
   selectSession(session.id);return session.id;
 }
 function hide(){closeToolMenu();open=false;pane.hidden=true;host.classList.remove('psm-mode');button.setAttribute('aria-pressed','false');closeToolMenu();syncTabs();}
 function closeSession(id){
   const i=sessions.findIndex(x=>x.id===id);if(i<0)return;
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
   if(action==='download'){
     const cmd=createSetupCmd();
     const url=URL.createObjectURL(new Blob([cmd],{type:'application/octet-stream'}));
     const a=document.createElement('a');a.href=url;a.download=SETUP_FILENAME;
     document.body.append(a);a.click();a.remove();
     setTimeout(()=>URL.revokeObjectURL(url),1000);
   }
   if(action==='pair'){
     const ok=manager.agent.pair(q('#psmPairToken').value);
     q('#psmPairToken').value='';
     if(!ok){setFeedback(language.value==='en'?'Invalid token format.':'Token 格式錯誤。');return;}
     const state=await manager.checkConnection();
     if(state.configured){setConnected(true);appendOutput(language.value==='en'?'Connected to local agent. Only approved read-only actions are available.':'已連線至本地代理，目前僅提供核准的唯讀操作。');}
     else setFeedback(language.value==='en'?'Token could not be verified with local agent.':'Token 無法通過本地代理驗證，請確認 CMD 仍在執行。');
   }
   if(action==='close')closeSession(selected);
   if(action==='settings'){setConnected(false);closeToolMenu();}
   if(action==='clear')terminal.querySelector('.psm-terminal-output').replaceChildren();
   if((action==='version'||action==='location')&&!terminalBusy){
     terminalBusy=true;
     appendOutput('PS> '+(action==='version'?'$PSVersionTable.PSVersion.ToString()':'(Get-Location).Path'));
     try{const result=await manager.executeCommand({action});appendOutput(result.ok?String(result.output??''):(language.value==='en'?'Command denied or unavailable.':'命令遭拒或代理無法使用。'));}
     catch{appendOutput(language.value==='en'?'Connection lost. Return to settings and pair again.':'連線中斷，請返回設定重新配對。');setConnected(false);}
     finally{terminalBusy=false;}
   }
   if(action==='tool'){const menu=toolMenu();const shouldOpen=menu.hidden;closeToolMenu();if(shouldOpen){menu.hidden=false;toolButton().setAttribute('aria-expanded','true');positionToolMenu();}}
   if(action==='permissions'){setFeedback(t().rule+' — '+t().notice);closeToolMenu();}
   if(action==='revoke'){try{const result=await manager.revokeLocalAccess();setConnected(false);setFeedback(result.ok?'Revoked':t().unavailable);}catch{setFeedback(t().unavailable);}closeToolMenu();}
   if(action==='check'){try{const state=await manager.checkConnection();if(state.configured){setConnected(true);appendOutput(language.value==='en'?'Connected to local agent.':'已連線至本地代理。');}else setFeedback(t().unavailable);}catch{setFeedback(language.value==='en'?'Connection failed. Verify CMD is still running and token is paired.':'連線失敗，請確認 CMD 仍在執行且已完成 Token 配對。');}}
 });
 function setFeedback(value){q('[data-psm="feedback"]').textContent=value;const session=sessions.find(x=>x.id===selected);if(session)session.feedback=value;}
 const unsubscribe=language.subscribe(()=>{translate();syncTabs();});
 translate();
 return {show,hide,createSession,selectSession,closeSession,syncTabs,get isOpen(){return open;},get sessions(){return sessions.map(x=>({...x}));},dispose(){unsubscribe();document.removeEventListener('pointerdown',onOutsideClick,true);document.removeEventListener('keydown',onEscape,true);document.removeEventListener('scroll',onScroll,true);window.removeEventListener('scroll',onScroll,true);window.removeEventListener('resize',closeToolMenu);hide();tabs.querySelectorAll('.psm-tab').forEach(x=>x.remove());pane.remove();}};
}

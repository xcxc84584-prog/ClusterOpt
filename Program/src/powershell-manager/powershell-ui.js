// v0.0.60 PR-02 — Browser UI only. Never runs OS commands.
import {PowerShellManager} from './powershell-manager.js';
const COPY={
 'zh-Hant':{title:'PowerShell',setup:'配置本地代理',desc:'尚未連線至 PowerShell Local Agent。此介面不可執行命令。',check:'檢查連線',tool:'PowerShell 工具',permissions:'權限管理',revoke:'撤銷本地權限',unavailable:'本地代理尚未提供。無法執行命令。',command:'環境檢查指令（CMD）',hint:'請在 Windows CMD 執行以下唯讀環境檢查。正式安裝器尚未發布，請勿輸入 Token。',close:'關閉',status:'未配置',rule:'預設權限：可申請',notice:'權限管理需先配置可信任的本地代理；目前僅提供規則說明。'},
 en:{title:'PowerShell',setup:'Set up Local Agent',desc:'PowerShell Local Agent is not connected. Commands cannot be executed here.',check:'Check connection',tool:'PowerShell tools',permissions:'Permission management',revoke:'Revoke local access',unavailable:'Local Agent is not available. Commands are disabled.',command:'Environment check (CMD)',hint:'Run this read-only check in Windows CMD. The verified installer is not yet published; do not enter a token.',close:'Close',status:'Not configured',rule:'Default permission: Requestable',notice:'Permission management requires a trusted Local Agent. This is an informational preview.'}
};
const CHECK='powershell.exe -NoProfile -Command "$PSVersionTable.PSVersion.ToString(); [Environment]::OSVersion.VersionString"';
export function mountPowerShellUI({host,button,language,manager=new PowerShellManager()}){
 if(!host||!button||!language)throw new Error('PSM_UI_MISSING_DEPENDENCY');
 let open=false;
 const sessions=[];
 let selected=null;
 let sequence=0;
 const tabs=host.querySelector('#tabs');
 const pane=document.createElement('section');
 pane.id='powershellManagerPane';pane.className='psm-pane';pane.hidden=true;
 pane.setAttribute('aria-label','PowerShell');
 pane.innerHTML=`<div class="psm-top"><strong data-psm="title"></strong><div class="psm-actions"><span data-psm="status"></span><button type="button" data-psm-action="tool" aria-expanded="false">⚙</button><button type="button" data-psm-action="close" aria-label="Close">×</button></div></div><div class="psm-menu" hidden><button type="button" data-psm-action="permissions"></button><button type="button" data-psm-action="revoke"></button></div><div class="psm-body"><span class="psm-glyph">⌁</span><h2 data-psm="setup"></h2><p data-psm="desc"></p><label data-psm="command" for="psmCheckCommand"></label><input id="psmCheckCommand" readonly><p data-psm="hint"></p><button type="button" data-psm-action="check"></button><p role="status" data-psm="feedback"></p></div>`;
 host.append(pane);
 const q=s=>pane.querySelector(s);
 q('#psmCheckCommand').value=CHECK;
 function t(){return COPY[language.value]||COPY['zh-Hant'];}
 function translate(){
   const msg=t();
   for(const key of ['title','status','setup','desc','command','hint','check','permissions','revoke']){
     const node=q('[data-psm="'+key+'"]');if(node)node.textContent=msg[key];
   }
   q('[data-psm-action="tool"]').title=msg.tool;
   q('[data-psm-action="close"]').title=msg.close;
   button.title=msg.title;button.setAttribute('aria-label',msg.title);
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
   if(!sessions.some(x=>x.id===id))return;
   selected=id;open=true;pane.hidden=false;
   host.classList.add('psm-mode');button.setAttribute('aria-pressed','true');
   // A session has its own setup status/feedback, independent from other tabs.
   q('[data-psm="feedback"]').textContent=sessions.find(x=>x.id===id).feedback||'';
   translate();syncTabs();
 }
 function createSession(){
   const session={id:++sequence,feedback:''};sessions.push(session);
   selectSession(session.id);return session.id;
 }
 function hide(){open=false;pane.hidden=true;host.classList.remove('psm-mode');button.setAttribute('aria-pressed','false');q('.psm-menu').hidden=true;syncTabs();}
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
   if(action==='close')closeSession(selected);
   if(action==='tool'){q('.psm-menu').hidden=!q('.psm-menu').hidden;q('[data-psm-action="tool"]').setAttribute('aria-expanded',String(!q('.psm-menu').hidden));}
   if(action==='permissions'){setFeedback(t().rule+' — '+t().notice);q('.psm-menu').hidden=true;}
   if(action==='revoke'){const result=await manager.revokeLocalAccess();setFeedback(result.ok?'Revoked':t().unavailable);q('.psm-menu').hidden=true;}
   if(action==='check'){const state=await manager.checkConnection();setFeedback(state.configured?'Connected':t().unavailable);}
 });
 function setFeedback(value){q('[data-psm="feedback"]').textContent=value;const session=sessions.find(x=>x.id===selected);if(session)session.feedback=value;}
 const unsubscribe=language.subscribe(()=>{translate();syncTabs();});
 translate();
 return {show,hide,createSession,selectSession,closeSession,syncTabs,get isOpen(){return open;},get sessions(){return sessions.map(x=>({...x}));},dispose(){unsubscribe();hide();tabs.querySelectorAll('.psm-tab').forEach(x=>x.remove());pane.remove();}};
}

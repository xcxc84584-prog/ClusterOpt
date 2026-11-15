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
 function show(){open=true;pane.hidden=false;host.classList.add('psm-mode');button.setAttribute('aria-pressed','true');translate();}
 function hide(){open=false;pane.hidden=true;host.classList.remove('psm-mode');button.setAttribute('aria-pressed','false');q('.psm-menu').hidden=true;}
 button.addEventListener('click',()=>open?hide():show());
 pane.addEventListener('click',async event=>{
   const action=event.target.closest('[data-psm-action]')?.dataset.psmAction;
   if(!action)return;
   if(action==='close')hide();
   if(action==='tool'){q('.psm-menu').hidden=!q('.psm-menu').hidden;q('[data-psm-action="tool"]').setAttribute('aria-expanded',String(!q('.psm-menu').hidden));}
   if(action==='permissions'){q('[data-psm="feedback"]').textContent=t().rule+' — '+t().notice;q('.psm-menu').hidden=true;}
   if(action==='revoke'){const result=await manager.revokeLocalAccess();q('[data-psm="feedback"]').textContent=result.ok?'Revoked':t().unavailable;q('.psm-menu').hidden=true;}
   if(action==='check'){const state=await manager.checkConnection();q('[data-psm="feedback"]').textContent=state.configured?'Connected':t().unavailable;}
 });
 const unsubscribe=language.subscribe(translate);
 translate();
 return {show,hide,get isOpen(){return open;},dispose(){unsubscribe();hide();pane.remove();}};
}

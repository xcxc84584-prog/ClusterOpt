// ClusterOpt PLA v0.0.60 — local-only, read-only bootstrap. No arbitrary shell execution.
import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const DEFAULT_PORT=43881;
export const ALLOWED_ORIGINS=new Set(['https://xcxc84584-prog.github.io']);
export const READ_ONLY_COMMANDS=Object.freeze({
  version:['-NoProfile','-NonInteractive','-Command','$PSVersionTable.PSVersion.ToString()'],
  location:['-NoProfile','-NonInteractive','-Command','(Get-Location).Path']
});
const json=(res,code,data,origin)=>{
 res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})});
 res.end(JSON.stringify(data));
};
function equalSecret(a,b){
 if(typeof a!=='string'||typeof b!=='string')return false;
 const x=Buffer.from(a),y=Buffer.from(b);
 return x.length===y.length&&timingSafeEqual(x,y);
}
export function createLocalAgent({token=randomBytes(32).toString('hex'),origins=ALLOWED_ORIGINS,runner=runReadOnly}={}){
 let revoked=false;
 const server=createServer(async(req,res)=>{
   const origin=req.headers.origin;
   if(!origin||!origins.has(origin))return json(res,403,{ok:false,code:'ORIGIN_DENIED'});
   if(req.method==='OPTIONS'){
     if(req.headers['access-control-request-method']!=='POST')return json(res,405,{ok:false,code:'METHOD_DENIED'},origin);
     res.writeHead(204,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'0','Vary':'Origin'});return res.end();
   }
   if(req.method!=='POST'||!['/status','/execute','/revoke'].includes(req.url))return json(res,404,{ok:false,code:'NOT_FOUND'},origin);
   if(revoked||!equalSecret(req.headers.authorization?.replace(/^Bearer /,''),token))return json(res,401,{ok:false,code:'UNAUTHORIZED'},origin);
   let raw='';
   try{for await(const chunk of req){raw+=chunk;if(raw.length>4096)throw new Error('PAYLOAD_TOO_LARGE');}}
   catch{return json(res,413,{ok:false,code:'PAYLOAD_TOO_LARGE'},origin);}
   let body;try{body=JSON.parse(raw||'{}');}catch{return json(res,400,{ok:false,code:'INVALID_JSON'},origin);}
   if(req.url==='/status')return json(res,200,{ok:true,connected:true,mode:'READ_ONLY'},origin);
   if(req.url==='/revoke'){revoked=true;return json(res,200,{ok:true,revoked:true},origin);}
   if(body.action==='interactive'){
    if(body.confirm!==true||typeof body.command!=='string'||!body.command.trim()||body.command.length>2048)return json(res,403,{ok:false,code:'COMMAND_APPROVAL_REQUIRED'},origin);
    try{const result=await runInteractive(body.command);return json(res,200,{ok:true,...result},origin);}
    catch{return json(res,503,{ok:false,code:'COMMAND_FAILED'},origin);}
  }
  if(typeof body.action!=='string'||!Object.hasOwn(READ_ONLY_COMMANDS,body.action))return json(res,403,{ok:false,code:'COMMAND_DENIED'},origin);
   try{const result=await runner(body.action);return json(res,200,{ok:true,...result},origin);}
   catch{return json(res,503,{ok:false,code:'COMMAND_FAILED'},origin);}
 });
 return {server,get revoked(){return revoked;},get token(){return token;}};
}
export function runReadOnly(action){
 return new Promise((resolve,reject)=>{
  if(!Object.hasOwn(READ_ONLY_COMMANDS,action))return reject(new Error('COMMAND_DENIED'));
  const child=spawn('powershell.exe',READ_ONLY_COMMANDS[action],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let output='',error='',finished=false;
  const timer=setTimeout(()=>child.kill(),5000);
  const add=(key,chunk)=>{if(key==='out')output+=chunk;else error+=chunk;if(output.length+error.length>16384)child.kill();};
  child.stdout.on('data',chunk=>add('out',chunk));child.stderr.on('data',chunk=>add('err',chunk));
  child.on('error',e=>{if(!finished){finished=true;clearTimeout(timer);reject(e);}});
  child.on('close',code=>{clearTimeout(timer);if(finished)return;finished=true;code===0&&output.length+error.length<=16384?resolve({output:output.trim()}):reject(new Error('EXECUTION_FAILED'));});
 });
}

// Interactive commands run only after a per-command browser confirmation. No elevation.
// One-shot process: command state does not persist between executions.
export function runInteractive(command){
 return new Promise((resolve,reject)=>{
  const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe'],windowsVerbatimArguments:false});
  let output='',error='',finished=false;
  const timer=setTimeout(()=>child.kill(),15000);
  const add=(key,chunk)=>{if(key==='out')output+=chunk;else error+=chunk;if(output.length+error.length>65536)child.kill();};
  child.stdout.on('data',chunk=>add('out',chunk));child.stderr.on('data',chunk=>add('err',chunk));
  child.on('error',e=>{if(!finished){finished=true;clearTimeout(timer);reject(e);}});
  child.on('close',code=>{clearTimeout(timer);if(finished)return;finished=true;
   if(output.length+error.length>65536)return reject(new Error('OUTPUT_LIMIT'));
   resolve({output:[output.trim(),error.trim()].filter(Boolean).join('\\n'),exitCode:code});
  });
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const agent=createLocalAgent();
 agent.server.listen(DEFAULT_PORT,'127.0.0.1',()=>{
  console.log('ClusterOpt Local Agent listening on 127.0.0.1:'+DEFAULT_PORT);
  console.log('Pairing token (do not share): '+agent.token);
  console.log('Allowed origin: https://xcxc84584-prog.github.io');
 });
}

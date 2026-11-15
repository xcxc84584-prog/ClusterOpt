// v0.0.62: token retained for this browser tab only; never in URL or localStorage.
const TOKEN_KEY='clusteropt.ps.pairing.v062';
const ENDPOINT='http://127.0.0.1:43881';
export class PowerShellClient {
 #token='';
 constructor(){try{const value=sessionStorage.getItem(TOKEN_KEY);if(/^[a-f0-9]{64}$/i.test(value||''))this.#token=value;}catch{}}
 pair(token){if(typeof token!=='string'||!/^[a-f0-9]{64}$/i.test(token.trim()))return false;this.#token=token.trim();try{sessionStorage.setItem(TOKEN_KEY,this.#token);}catch{}return true;}
 clear(){this.#token='';try{sessionStorage.removeItem(TOKEN_KEY);}catch{}}
 get paired(){return this.#token.length===64;}
 async #post(path,body={}){
  if(!this.paired)throw new Error('PAIRING_REQUIRED');
  const response=await fetch(ENDPOINT+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+this.#token},body:JSON.stringify(body),cache:'no-store'});
  const result=await response.json();
  if(!response.ok)throw new Error(result.code||'AGENT_UNAVAILABLE');
  return result;
 }
 async checkConnection(){return this.#post('/status');}
 async executeAuthorized(request){return this.#post('/execute',request.action==='interactive'?{action:'interactive',command:request.command}:{action:request.action});}
 async startSession(){return this.#post('/session/start');}
 async runSession(id,command){return this.#post('/session/run',{id,command});}
 async pollSession(id){return this.#post('/session/poll',{id});}
 async interruptSession(id){return this.#post('/session/interrupt',{id});}
 async closeSession(id){return this.#post('/session/close',{id});}
 async revokeLocalAccess(){try{return await this.#post('/revoke');}finally{this.clear();}}
}

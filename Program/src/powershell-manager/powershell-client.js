// v0.0.60: browser-to-loopback transport. Token stays in memory, never in URL/storage.
const ENDPOINT='http://127.0.0.1:43881';
export class PowerShellClient {
 #token='';
 pair(token){if(typeof token!=='string'||!/^[a-f0-9]{64}$/i.test(token.trim()))return false;this.#token=token.trim();return true;}
 clear(){this.#token='';}
 get paired(){return this.#token.length===64;}
 async #post(path,body={}){
  if(!this.paired)throw new Error('PAIRING_REQUIRED');
  const response=await fetch(ENDPOINT+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+this.#token},body:JSON.stringify(body),cache:'no-store'});
  const result=await response.json();
  if(!response.ok)throw new Error(result.code||'AGENT_UNAVAILABLE');
  return result;
 }
 async checkConnection(){return this.#post('/status');}
 async executeAuthorized(request){return this.#post('/execute',request.action==='interactive'?{action:'interactive',command:request.command,confirm:request.confirm===true}:{action:request.action});}
 async revokeLocalAccess(){try{return await this.#post('/revoke');}finally{this.clear();}}
}

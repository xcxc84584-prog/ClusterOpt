import {VirtualFileSession} from '../fmc/virtual-file-session.js';
import {FileManagementCore} from '../fmc/file-management-core.js';
import {FlagUnit} from '../fmc/flag-unit.js';
import {MVCCUnit} from '../fmc/mvcc-unit.js';
import {SliceLoader} from '../fmc/slice-loader.js';

const success = (data, code = 200) => ({ok:true,code,data});
const failure = (code, message) => ({ok:false,code,message});
const MAX_KIB = 102400; // 100 MiB: keep the browser responsive.
const idValid = id => typeof id === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(id);
const clone = value => { try { return structuredClone(value); } catch { return String(value); } };

export function createVTE() {
  const files = new Map(), slices = new Map(), agents = new Map(), events = [];
  const hub = new Map();
  let sequence = 0;
  function log(action, target, result, durationMs = 0) {
    const record = Object.freeze({id:++sequence,time:new Date().toISOString(),action,target,
      code:result?.code ?? (result?.ok === false ? 500 : 200),
      ok:result?.ok !== false,durationMs});
    events.push(record);
    if (events.length > 2000) events.shift();
  }
  function record(action,target,fn) {
    const start = performance.now();
    try {
      const result = fn();
      if (result && typeof result.then === 'function') return result.then(value => {
        log(action,target,value,performance.now()-start); return value;
      },error => {
        const fail=failure(500,String(error));log(action,target,fail,performance.now()-start);return fail;
      });
      log(action,target,result,performance.now()-start);
      return result;
    } catch(error) {
      const fail=failure(500,String(error));log(action,target,fail,performance.now()-start);return fail;
    }
  }
  function getFile(name) { return files.get(name); }
  function getSlice(name) { return slices.get(name); }
  function resolveAgent(file, agentId) {
    if (!agents.has(agentId)) return null;
    return file.session.getAgentGateway(agentId);
  }
  function context(file, slice = null) {
    // Only isolated test instances are exposed; never production editor instances.
    const gateways = Object.create(null);
    for (const id of agents.keys()) gateways[id] = file.session.getAgentGateway(id);
    return Object.freeze({
      session:file.session, agents:Object.freeze(gateways),
      fmc:file.core, slice:slice && Object.freeze({id:slice.id,index:slice.index,file:slice.file}),
      file:Object.freeze({name:file.name,size:file.blob.size,sliceCount:file.session.sliceCount}),
      hub:Object.freeze({list:()=>[...hub.keys()]})
    });
  }
  function createFile(name,kib=1) {
    if (!idValid(name) || !Number.isSafeInteger(kib) || kib<0 || kib>MAX_KIB)
      return failure(400,'Expected name and integer size 0..102400 KiB');
    if (files.has(name)) return failure(409,'File already exists');
    // Blob of repeated 64 KiB pieces; avoid a giant temporary string.
    const chunk='A'.repeat(65536),parts=[];
    for(let left=kib*1024;left>0;left-=65536)parts.push(left>=65536?chunk:chunk.slice(0,left));
    const blob=new Blob(parts,{type:'text/plain'});
    const session=new VirtualFileSession('VTE-'+name,blob);
    const core=new FileManagementCore();
    const loader=new SliceLoader(core);
    const attached=loader.attach('VTE-'+name,blob);
    if(!attached.ok)return attached;
    files.set(name,{name,blob,session,core,loader});
    return success({name,byteLength:blob.size,sliceCount:session.sliceCount},201);
  }
  async function readFile(name,options={}) {
    const file=getFile(name);if(!file)return failure(404,'Unknown virtual file');
    const offset=options.offset??0,length=options.length??4096;
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<0||length>1024*1024)
      return failure(400,'Read range must be <= 1 MiB');
    // Reflect unsaved edits by assembling only the requested range from slices.
    let remaining=length,skip=offset,content='';
    for(let i=0;i<file.session.sliceCount && remaining>0;i++){
      const res=await file.session.read(i);if(!res.ok)return res;
      const text=res.data.content;
      if(skip>=text.length){skip-=text.length;continue;}
      const part=text.slice(skip,skip+remaining);content+=part;remaining-=part.length;skip=0;
    }
    return success({name,offset,content,truncated:remaining===0});
  }
  async function updateFile(name,options={}) {
    const file=getFile(name);if(!file)return failure(404,'Unknown virtual file');
    const index=options.index??0;
    if(!Number.isInteger(index)||index<0||index>=file.session.sliceCount)return failure(416,'Invalid slice index');
    const before=await file.session.read(index);if(!before.ok)return before;
    const source=before.data.content;
    const offset=options.offset??0,deleteLength=options.deleteLength??0,insertText=options.insertText??'[VTE EDIT]';
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(deleteLength)||offset<0||
      deleteLength<0||offset>source.length||offset+deleteLength>source.length||
      typeof insertText!=='string'||insertText.length>1024*1024)return failure(400,'Invalid edit');
    const result=await file.session.edit(index,source.slice(0,offset)+insertText+source.slice(offset+deleteLength));
    return result.ok?success({index,versionId:result.data.versionId}):result;
  }
  function createSlice(name,options={}) {
    if(!idValid(name)||slices.has(name))return failure(400,'Invalid or duplicate slice name');
    const file=getFile(options.file);if(!file)return failure(404,'Unknown file');
    const index=options.index??0;
    if(!Number.isInteger(index)||index<0||index>=file.session.sliceCount)return failure(416,'Invalid index');
    const id='VTE-'+options.file+':'+index;
    slices.set(name,{name,file:options.file,index,id});
    return success({name,file:options.file,index,id},201);
  }
  async function readSlice(name) {
    const slice=getSlice(name);if(!slice)return failure(404,'Unknown slice');
    const file=getFile(slice.file);
    return file.session.read(slice.index);
  }
  async function updateSlice(name,options={}) {
    const slice=getSlice(name);if(!slice)return failure(404,'Unknown slice');
    return updateFile(slice.file,{...options,index:slice.index});
  }
  async function runFile(name,api) {
    const file=getFile(name);if(!file)return failure(404,'Unknown file');
    if(typeof api!=='function')return failure(400,'Expected callback function');
    return api(context(file));
  }
  async function runSlice(name,api) {
    const slice=getSlice(name);if(!slice)return failure(404,'Unknown slice');
    if(typeof api!=='function')return failure(400,'Expected callback function');
    const file=getFile(slice.file);
    const loaded=await file.loader.load('VTE-'+slice.file,slice.index);
    if(!loaded.ok)return loaded;
    return api(context(file,slice));
  }
  const VTE = {
    Creat:Object.freeze({
      Virtual_file:(name,kib)=>record('Creat.Virtual_file',name,()=>createFile(name,kib)),
      Virtual_fileSlice:(name,options)=>record('Creat.Virtual_fileSlice',name,()=>createSlice(name,options)),
      Virtual_AGENT:name=>record('Creat.Virtual_AGENT',name,()=>{
        if(!idValid(name)||name==='USER')return failure(400,'Invalid agent ID');
        if(agents.has(name))return failure(409,'Agent exists');
        agents.set(name,{name});return success({name},201);
      })
    }),
    Read:Object.freeze({
      Virtual_file:(name,options)=>record('Read.Virtual_file',name,()=>readFile(name,options)),
      Virtual_fileSlice:name=>record('Read.Virtual_fileSlice',name,()=>readSlice(name))
    }),
    Updata:Object.freeze({
      Virtual_file:(name,options)=>record('Updata.Virtual_file',name,()=>updateFile(name,options)),
      Virtual_fileSlice:(name,options)=>record('Updata.Virtual_fileSlice',name,()=>updateSlice(name,options))
    }),
    Delete:Object.freeze({
      Virtual_file:name=>record('Delete.Virtual_file',name,()=>{
        if(!files.has(name))return failure(404,'Unknown file');
        for(const [id,s] of slices)if(s.file===name)slices.delete(id);
        files.delete(name);return success({name});
      }),
      Virtual_fileSlice:name=>record('Delete.Virtual_fileSlice',name,()=>{
        if(!slices.delete(name))return failure(404,'Unknown slice');
        return success({name});
      }),
      Virtual_AGENT:name=>record('Delete.Virtual_AGENT',name,()=>{
        if(!agents.delete(name))return failure(404,'Unknown agent');
        // Existing leases are tied to a file's isolated FMC; revoke those owned by the deleted agent.
        for(const file of files.values()){
          const leases=file.core.listOwnedFlags(name);
          for(const lease of leases)file.core.administrativeRevoke(lease.sliceId,true);
        }
        return success({name});
      })
    }),
    FileLoad:(name,api)=>record('FileLoad',name,()=>runFile(name,api)),
    FileSliceLoad:(name,api)=>record('FileSliceLoad',name,()=>runSlice(name,api)),
    Status:()=>success({files:[...files.keys()],slices:[...slices.keys()],agents:[...agents.keys()],
      api:[...hub.keys()],eventCount:events.length}),
    Log:()=>events.map(clone),
    Reset:()=>{files.clear();slices.clear();agents.clear();events.length=0;sequence=0;return success({reset:true});},
    Hub:Object.freeze({
      list:()=>[...hub.keys()],
      describe:name=>hub.get(name)??null
    })
  };
  for(const [object,methods] of Object.entries({
    FMC:['read','userWrite','acquireWTF','acquireORF','commit','agentCommit','getFlagStatus','listOwnedFlags'],
    FlagUnit:['acquire','acquireRead','validate','validateRead','renew','release','status','owned'],
    MVCCUnit:['register','read','commit','commitBatch','markPersisted','unregister'],
    SliceLoader:['attach','load','unload','detach'],
    VirtualFileSession:['window','read','edit','requestSlice','agentRead','getAgentGateway','getUserGateway']
  }))hub.set(object,Object.freeze({object,methods:Object.freeze(methods)}));
  return Object.freeze(VTE);
}

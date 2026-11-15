// v0.0.46 PMU: bounded, opt-in diagnostics. No editor data is collected.
const percent=(sorted,p)=>sorted.length?sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)]:null;
const stats=values=>{
  const a=[...values].sort((x,y)=>x-y);
  return {count:a.length,p50:percent(a,.5),p95:percent(a,.95),p99:percent(a,.99),
    max:a.length?a[a.length-1]:null};
};
export class PerformanceMonitor {
  #enabled=false;
  #samples=new Map();
  #limit=512;
  #observer=null;
  #frames=[];
  #frameId=0;
  #lastFrame=0;
  #longTaskSupported=false;
  #now;
  constructor({now=()=>performance.now()}={}){this.#now=now;}
  get enabled(){return this.#enabled;}
  start(){
    if(this.#enabled)return {ok:true,code:200,data:{running:true}};
    this.#enabled=true;
    if(typeof PerformanceObserver!=='undefined' &&
      PerformanceObserver.supportedEntryTypes?.includes('longtask')){
      try{
        this.#observer=new PerformanceObserver(list=>{
          for(const entry of list.getEntries())this.record('longTask',entry.duration);
        });
        this.#observer.observe({entryTypes:['longtask']});
        this.#longTaskSupported=true;
      }catch(_){this.#observer=null;}
    }
    if(typeof requestAnimationFrame==='function'){
      this.#lastFrame=0;
      const tick=time=>{
        if(!this.#enabled)return;
        if(this.#lastFrame&&time-this.#lastFrame<1000)this.record('frameInterval',time-this.#lastFrame);
        this.#lastFrame=time;
        this.#frameId=requestAnimationFrame(tick);
      };
      this.#frameId=requestAnimationFrame(tick);
    }
    return {ok:true,code:200,data:{running:true}};
  }
  stop(){
    this.#enabled=false;
    this.#observer?.disconnect();this.#observer=null;
    if(this.#frameId&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.#frameId);
    this.#frameId=0;this.#lastFrame=0;
    return {ok:true,code:200,data:{running:false}};
  }
  reset(){this.#samples.clear();return {ok:true,code:200};}
  record(name,duration){
    if(!this.#enabled)return false;
    if(typeof name!=='string'||!/^[a-zA-Z][\w.]{0,63}$/.test(name)||
      !Number.isFinite(duration)||duration<0)return false;
    let a=this.#samples.get(name);
    if(!a){a=[];this.#samples.set(name,a);}
    a.push(duration);
    if(a.length>this.#limit)a.shift();
    return true;
  }
  measure(name,fn){
    if(!this.#enabled)return fn();
    const start=this.#now();
    try{
      const result=fn();
      if(result&&typeof result.then==='function'){
        return result.finally(()=>this.record(name,this.#now()-start));
      }
      this.record(name,this.#now()-start);return result;
    }catch(error){this.record(name,this.#now()-start);throw error;}
  }
  snapshot(){
    const metrics={};
    for(const [key,values] of this.#samples)metrics[key]=stats(values);
    const heap=typeof performance!=='undefined'&&Number.isFinite(performance.memory?.usedJSHeapSize)
      ?performance.memory.usedJSHeapSize:null;
    return {version:'0.0.46',running:this.#enabled,metrics,
      memory:{usedJSHeapBytes:heap,supported:heap!==null},
      longTaskSupported:this.#longTaskSupported,
      timestamp:new Date().toISOString()};
  }
  export(format='json'){
    const snapshot=this.snapshot();
    if(format==='json')return {ok:true,code:200,data:JSON.stringify(snapshot,null,2)};
    if(format==='csv'){
      const rows=['metric,count,p50,p95,p99,max'];
      for(const [name,m] of Object.entries(snapshot.metrics))
        rows.push([name,m.count,m.p50??'',m.p95??'',m.p99??'',m.max??''].join(','));
      return {ok:true,code:200,data:rows.join('\n')};
    }
    return {ok:false,code:400,message:'Supported formats: json, csv'};
  }
  command(input){
    if(typeof input!=='string')return {ok:false,code:400,message:'Expected a string command'};
    const args=input.trim().split(/\s+/);
    if(args[0]!=='pmu')return {ok:false,code:404,message:'Unknown command'};
    switch(args[1]){
      case 'start':return this.start();
      case 'stop':return this.stop();
      case 'reset':return this.reset();
      case 'status':case 'report':return {ok:true,code:200,data:this.snapshot()};
      case 'export':return this.export(args[2]||'json');
      case 'benchmark':return {ok:false,code:501,message:'VTE benchmark runner not yet implemented'};
      default:return {ok:false,code:400,message:'Usage: pmu start|stop|reset|status|report|export json|csv'};
    }
  }
}

// Latest-wins syntax task scheduling. No worker: Shiki tokenization may still
// block the main thread; this layer bounds stale commits and allows cancellation.
export class HighlightTaskScheduler {
  #generation=0;
  #controller=null;
  #disposed=false;
  #schedule;
  #onError;
  constructor({schedule=fn=>setTimeout(fn,0),onError=()=>{}}={}){
    this.#schedule=schedule;this.#onError=onError;
  }
  get generation(){return this.#generation;}
  run({revision,execute,commit}){
    if(this.#disposed)return {ok:false,code:410};
    if(!Number.isSafeInteger(revision)||revision<0||
      typeof execute!=='function'||typeof commit!=='function')
      return {ok:false,code:400};
    this.cancel();
    const generation=this.#generation,controller=new AbortController();
    this.#controller=controller;
    const isCurrent=()=>!this.#disposed&&generation===this.#generation&&
      !controller.signal.aborted;
    try{
      this.#schedule(async()=>{
        if(!isCurrent())return;
        try{
          const result=await execute({signal:controller.signal,revision,generation});
          if(isCurrent())commit(result,{revision,generation});
        }catch(error){if(isCurrent())this.#onError(error);}
      });
    }catch(error){controller.abort();this.#onError(error);
      return {ok:false,code:500};}
    return {ok:true,code:202,data:{generation}};
  }
  cancel(){
    this.#generation++;
    this.#controller?.abort();this.#controller=null;
    return {ok:true,code:200};
  }
  dispose(){this.cancel();this.#disposed=true;}
}

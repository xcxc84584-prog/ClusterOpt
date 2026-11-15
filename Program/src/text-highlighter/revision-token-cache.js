// Bounded revision-aware LRU for uncolored lexical ranges.
// Exact source equality prevents equal-length content collisions.
export class RevisionTokenCache {
  #entries=new Map();
  #latest=new Map();
  #used=0;
  constructor({maxEntries=32,maxUnits=2*1024*1024}={}){
    if(!Number.isSafeInteger(maxEntries)||maxEntries<1||
      !Number.isSafeInteger(maxUnits)||maxUnits<1)throw new RangeError('Invalid cache budget');
    this.maxEntries=maxEntries;this.maxUnits=maxUnits;
  }
  get size(){return this.#entries.size;}
  get usedUnits(){return this.#used;}
  #identity(meta){return JSON.stringify([meta.documentId,meta.sliceId,meta.language]);}
  #key(meta){return JSON.stringify([meta.documentId,meta.sliceId,meta.language,meta.revision]);}
  #valid(meta){return meta&&typeof meta.documentId==='string'&&
    typeof meta.sliceId==='string'&&typeof meta.language==='string'&&
    Number.isSafeInteger(meta.revision)&&meta.revision>=0&&
    typeof meta.source==='string';}
  get(meta){
    if(!this.#valid(meta))return null;
    const key=this.#key(meta),entry=this.#entries.get(key);
    if(!entry||entry.source!==meta.source)return null;
    this.#entries.delete(key);this.#entries.set(key,entry);
    return entry.ranges.map(range=>({...range}));
  }
  put(meta,ranges){
    if(!this.#valid(meta)||!Array.isArray(ranges)||ranges.some(r=>
      !Number.isSafeInteger(r.start)||!Number.isSafeInteger(r.end)||
      r.start<0||r.end<=r.start||typeof r.token!=='string'))
      return false;
    const identity=this.#identity(meta),latest=this.#latest.get(identity);
    if(latest!==undefined&&meta.revision<latest)return false;
    const size=meta.source.length+ranges.length*24;
    if(size>this.maxUnits)return false;
    const key=this.#key(meta);
    if(this.#entries.has(key)){this.#used-=this.#entries.get(key).size;
      this.#entries.delete(key);}
    this.#latest.set(identity,meta.revision);
    this.#entries.set(key,{source:meta.source,
      ranges:ranges.map(r=>({start:r.start,end:r.end,token:r.token})),size});
    this.#used+=size;
    while(this.#entries.size>this.maxEntries||this.#used>this.maxUnits){
      const oldest=this.#entries.keys().next().value;
      this.#used-=this.#entries.get(oldest).size;this.#entries.delete(oldest);
    }
    return true;
  }
  invalidate(documentId){
    if(typeof documentId!=='string')return false;
    for(const [key,entry] of this.#entries){
      if(JSON.parse(key)[0]===documentId){this.#used-=entry.size;this.#entries.delete(key);}
    }
    for(const key of this.#latest.keys())if(JSON.parse(key)[0]===documentId)
      this.#latest.delete(key);
    return true;
  }
}

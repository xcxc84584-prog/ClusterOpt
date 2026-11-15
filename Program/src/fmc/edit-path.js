import {MicroSliceDocument} from './micro-slice-document.js';

// 49.4: per-resident-slice edit buffer. The native textarea remains authoritative.
// This is NOT a lease or MVCC commit; persistence stays in VirtualFileSession.edit().
export class EditPath {
  #document;
  #snapshot;
  #parentId;
  constructor(parentSliceId,text='',options={}){
    this.#parentId=parentSliceId;
    this.#document=new MicroSliceDocument(parentSliceId,text,options);
    this.#snapshot=text;
  }
  get parentSliceId(){return this.#parentId;}
  get revision(){return this.#document.revision;}
  get length(){return this.#document.length;}
  get lineCount(){return this.#document.lineCount;}
  get microSliceCount(){return this.#document.microSliceCount;}
  locate(offset){return this.#document.locate(offset);}
  lineStart(line){return this.#document.lineStart(line);}
  slice(start,end){return this.#document.slice(start,end);}
  get text(){return this.#snapshot;}
  reconcile(next){
    if(typeof next!=='string')throw new TypeError('Editor text must be a string');
    const previous=this.#snapshot;
    if(previous===next)return Object.freeze({changed:false,revision:this.revision,start:0,end:0,insertedLength:0});
    let start=0;
    const limit=Math.min(previous.length,next.length);
    while(start<limit&&previous.charCodeAt(start)===next.charCodeAt(start))start++;
    let oldEnd=previous.length,newEnd=next.length;
    while(oldEnd>start&&newEnd>start&&
      previous.charCodeAt(oldEnd-1)===next.charCodeAt(newEnd-1)){
      oldEnd--;newEnd--;
    }
    const inserted=next.slice(start,newEnd);
    this.#document.replace(start,oldEnd,inserted);
    this.#snapshot=next;
    return Object.freeze({changed:true,revision:this.revision,start,end:oldEnd,
      insertedLength:inserted.length});
  }
  reset(next){
    if(typeof next!=='string')throw new TypeError('Editor text must be a string');
    this.#document=new MicroSliceDocument(this.#parentId,next);
    this.#snapshot=next;
    return this.revision;
  }
}

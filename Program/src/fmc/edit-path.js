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
  // Fast path: use the browser's pre-edit range, without an O(document size)
  // prefix/suffix search. The native textarea remains authoritative.
  applyKnownPatch(patch, next) {
    if (typeof next !== 'string' || !patch ||
        !Number.isSafeInteger(patch.start) ||
        !Number.isSafeInteger(patch.end) ||
        typeof patch.text !== 'string') return false;
    const {start, end, text} = patch;
    const previous = this.#snapshot;
    if (start < 0 || end < start || end > previous.length ||
        (patch.previousLength !== undefined &&
          patch.previousLength !== previous.length) ||
        next.length !== previous.length - (end - start) + text.length ||
        next.slice(start, start + text.length) !== text) return false;
    // Bounded context checks reject unexpected edits and browser normalization.
    const prefixStart = Math.max(0, start - 32);
    const suffixEnd = Math.min(previous.length, end + 32);
    if (next.slice(prefixStart, start) !== previous.slice(prefixStart, start) ||
        next.slice(start + text.length, start + text.length + suffixEnd - end) !==
          previous.slice(end, suffixEnd)) return false;
    this.#document.replace(start, end, text);
    this.#snapshot = next;
    return true;
  }
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

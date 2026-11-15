import {PieceTree} from './piece-tree.js';

// 49.2: logical micro-slices within ONE registered physical slice.
// Offsets use UTF-16 units, matching PieceTree and textarea. This object
// does not grant write authority; FLAG/MVCC remain at the parent slice.
export class MicroSliceDocument {
  #tree;
  #boundaries;
  #maxLength;
  #parentId;
  #nextId=1;
  constructor(parentSliceId,text='',{maxLength=4096}={}){
    if(typeof parentSliceId!=='string'||!parentSliceId||
      typeof text!=='string'||!Number.isSafeInteger(maxLength)||maxLength<1)
      throw new TypeError('Invalid micro-slice configuration');
    this.#parentId=parentSliceId;
    this.#tree=new PieceTree(text);
    this.#maxLength=maxLength;
    this.#boundaries=this.#partition(text.length);
  }
  #partition(length){
    if(!length)return [{id:this.#nextId++,length:0}];
    const parts=[];
    for(let offset=0;offset<length;offset+=this.#maxLength)
      parts.push({id:this.#nextId++,length:Math.min(this.#maxLength,length-offset)});
    return parts;
  }
  get parentSliceId(){return this.#parentId;}
  get revision(){return this.#tree.revision;}
  get length(){return this.#tree.length;}
  get microSliceCount(){return this.#boundaries.length;}
  get lineCount(){return this.#tree.lineCount;}
  lineStart(line){return this.#tree.lineStart(line);}
  slice(start=0,end=this.length){return this.#tree.slice(start,end);}
  toString(){return this.#tree.toString();}
  list(){
    let offset=0;
    return this.#boundaries.map(part=>{
      const result=Object.freeze({id:part.id,parentSliceId:this.#parentId,
        start:offset,end:offset+part.length,length:part.length});
      offset+=part.length;
      return result;
    });
  }
  locate(offset){
    if(!Number.isSafeInteger(offset)||offset<0||offset>this.length)return null;
    let start=0;
    for(const part of this.#boundaries){
      const end=start+part.length;
      if(offset<end||offset===this.length&&end===this.length)
        return Object.freeze({id:part.id,parentSliceId:this.#parentId,
          start,end,localOffset:offset-start});
      start=end;
    }
    return null;
  }
  replace(start,end,text){
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||
      start<0||end<start||end>this.length)throw new RangeError('Invalid range');
    if(typeof text!=='string')throw new TypeError('Text must be a string');
    if(start===end&&!text.length)return this.revision;
    // Preserve unaffected micro-slice IDs; replace only intersecting pieces.
    // Boundary insertion belongs to the slice on its right, except EOF.
    const previous=this.list();
    let first=previous.findIndex(p=>p.end>start);
    if(first<0)first=previous.length-1;
    let last=previous.findIndex(p=>p.end>=end&&p.start<end);
    if(last<0)last=first;
    if(end===start)last=first;
    const left=previous.slice(0,first).map(p=>({id:p.id,length:p.length}));
    const right=previous.slice(last+1).map(p=>({id:p.id,length:p.length}));
    const anchorStart=previous[first].start;
    const anchorEnd=previous[last].end;
    const segment=this.#tree.slice(anchorStart,start)+text+this.#tree.slice(end,anchorEnd);
    const affected=this.#partition(segment.length);
    this.#tree.replace(start,end,text);
    this.#boundaries=[...left,...affected,...right];
    // An empty document always has one zero-length micro-slice.
    if(!this.#boundaries.length)this.#boundaries=this.#partition(0);
    return this.revision;
  }
  insert(offset,text){return this.replace(offset,offset,text);}
  delete(start,end){return this.replace(start,end,'');}
}

// v0.0.49.3: Fenwick prefix index for logical micro-slice UTF-16 lengths.
// Rebuild on structural splice; lookup/prefix are logarithmic.
export class MicroSliceIndex {
  #lengths=[];
  #tree=[];
  constructor(lengths=[]){this.rebuild(lengths);}
  rebuild(lengths){
    if(!Array.isArray(lengths)||lengths.some(n=>!Number.isSafeInteger(n)||n<0))
      throw new RangeError('Invalid micro-slice lengths');
    this.#lengths=lengths.slice();
    this.#tree=new Array(lengths.length+1).fill(0);
    for(let i=0;i<lengths.length;i++){
      this.#tree[i+1]+=lengths[i];
      const parent=i+1+((i+1)&-(i+1));
      if(parent<this.#tree.length)this.#tree[parent]+=this.#tree[i+1];
    }
  }
  get count(){return this.#lengths.length;}
  get total(){return this.prefix(this.count);}
  prefix(index){
    if(!Number.isSafeInteger(index)||index<0||index>this.count)
      throw new RangeError('Invalid prefix');
    let result=0;
    for(let i=index;i>0;i-=i&-i)result+=this.#tree[i];
    return result;
  }
  locate(offset){
    if(!Number.isSafeInteger(offset)||offset<0||offset>this.total||!this.count)return null;
    if(offset===this.total)return this.count-1;
    // Upper-bound prefix search: boundary belongs to right-hand piece.
    let index=0,sum=0,bit=1;
    while(bit*2<=this.count)bit*=2;
    for(;bit>0;bit>>=1){
      const next=index+bit;
      if(next<=this.count&&sum+this.#tree[next]<=offset){
        index=next;sum+=this.#tree[next];
      }
    }
    return Math.min(index,this.count-1);
  }
  intersect(start,end){
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||
      start<0||end<start||end>this.total)throw new RangeError('Invalid range');
    const first=this.locate(start);
    if(first===null)return null;
    const last=end===start?first:this.locate(end-1);
    return {first,last};
  }
}

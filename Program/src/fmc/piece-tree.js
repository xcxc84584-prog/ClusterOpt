// v0.0.49.1 — Piece Tree (implicit treap with subtree character/LF counts).
// Owns only an in-memory edit buffer; no FLAG, MVCC or disk mutations.
const countLF=text=>{let n=0;for(let i=0;i<text.length;i++)if(text.charCodeAt(i)===10)n++;return n;};
const lengthOf=node=>node?.length??0;
const linesOf=node=>node?.lines??0;
export class PieceTree {
  #original;
  #added='';
  #root=null;
  #seed=0x12345678;
  #revision=0;
  constructor(text=''){
    if(typeof text!=='string')throw new TypeError('Text must be a string');
    this.#original=text;
    if(text.length)this.#root=this.#node(0,0,text.length);
  }
  #random(){
    let x=this.#seed;
    x^=x<<13;x^=x>>>17;x^=x<<5;
    this.#seed=x>>>0;
    return this.#seed;
  }
  #node(buffer,start,size){
    const text=(buffer===0?this.#original:this.#added).slice(start,start+size);
    return {buffer,start,size,ownLines:countLF(text),priority:this.#random(),
      left:null,right:null,length:size,lines:countLF(text)};
  }
  #update(node){
    if(node){node.length=node.size+lengthOf(node.left)+lengthOf(node.right);
      node.lines=node.ownLines+linesOf(node.left)+linesOf(node.right);}
    return node;
  }
  #merge(a,b){
    if(!a)return b;
    if(!b)return a;
    if(a.priority>=b.priority){a.right=this.#merge(a.right,b);return this.#update(a);}
    b.left=this.#merge(a,b.left);return this.#update(b);
  }
  #split(node,index){
    if(!node)return [null,null];
    const leftLength=lengthOf(node.left);
    if(index<leftLength){
      const [a,b]=this.#split(node.left,index);
      node.left=b;return [a,this.#update(node)];
    }
    if(index>leftLength+node.size){
      const [a,b]=this.#split(node.right,index-leftLength-node.size);
      node.right=a;return [this.#update(node),b];
    }
    const offset=index-leftLength;
    if(offset===0){
      const left=node.left;node.left=null;
      return [left,this.#update(node)];
    }
    if(offset===node.size){
      const right=node.right;node.right=null;
      return [this.#update(node),right];
    }
    const left=node.left,right=node.right;
    const a=this.#node(node.buffer,node.start,offset);
    const b=this.#node(node.buffer,node.start+offset,node.size-offset);
    return [this.#merge(left,a),this.#merge(b,right)];
  }
  get length(){return lengthOf(this.#root);}
  get newlineCount(){return linesOf(this.#root);}
  get lineCount(){return this.newlineCount+1;}
  get revision(){return this.#revision;}
  #checkRange(start,end){
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||
       start<0||end<start||end>this.length)throw new RangeError('Invalid text range');
  }
  replace(start,end,text){
    this.#checkRange(start,end);
    if(typeof text!=='string')throw new TypeError('Text must be a string');
    if(start===end&&!text.length)return this.#revision;
    const [a,rest]=this.#split(this.#root,start);
    const [,b]=this.#split(rest,end-start);
    let middle=null;
    if(text.length){
      const offset=this.#added.length;
      this.#added+=text;
      middle=this.#node(1,offset,text.length);
    }
    this.#root=this.#merge(this.#merge(a,middle),b);
    return ++this.#revision;
  }
  insert(offset,text){return this.replace(offset,offset,text);}
  delete(start,end){return this.replace(start,end,'');}
  slice(start=0,end=this.length){
    this.#checkRange(start,end);
    const chunks=[];
    const visit=(node,base)=>{
      if(!node)return;
      const at=base+lengthOf(node.left);
      if(start<at)visit(node.left,base);
      if(start<at+node.size&&end>at){
        const from=Math.max(0,start-at),to=Math.min(node.size,end-at);
        chunks.push((node.buffer===0?this.#original:this.#added).slice(node.start+from,node.start+to));
      }
      if(end>at+node.size)visit(node.right,at+node.size);
    };
    visit(this.#root,0);
    return chunks.join('');
  }
  toString(){return this.slice();}
  // Zero-based logical line -> UTF-16 character offset, or null if absent.
  lineStart(line){
    if(!Number.isSafeInteger(line)||line<0||line>=this.lineCount)return null;
    if(line===0)return 0;
    let remaining=line,node=this.#root,base=0;
    while(node){
      const leftLines=linesOf(node.left),leftLength=lengthOf(node.left);
      if(remaining<=leftLines){node=node.left;continue;}
      remaining-=leftLines;
      const text=(node.buffer===0?this.#original:this.#added).slice(node.start,node.start+node.size);
      if(remaining<=node.ownLines){
        let from=0;
        for(let i=0;i<remaining;i++)from=text.indexOf('\n',from)+1;
        return base+leftLength+from;
      }
      remaining-=node.ownLines;
      base+=leftLength+node.size;
      node=node.right;
    }
    return null;
  }
}

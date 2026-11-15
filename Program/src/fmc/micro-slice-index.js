// 50.3: implicit treap with cached subtree count and UTF-16 length.
// Structural splice costs O(log N + inserted pieces), not O(total pieces).
const count=n=>n?.count??0, sum=n=>n?.sum??0;
let serial=0;
function node(length,id=undefined){
 const seed=(++serial*2654435761)>>>0;
 return {length,id,priority:seed,count:1,sum:length,left:null,right:null};
}
function pull(n){if(n){n.count=1+count(n.left)+count(n.right);
 n.sum=n.length+sum(n.left)+sum(n.right);}return n;}
function merge(a,b){
 if(!a)return b;if(!b)return a;
 if(a.priority<b.priority){a.right=merge(a.right,b);return pull(a);}
 b.left=merge(a,b.left);return pull(b);
}
function split(n,k){
 if(!n)return [null,null];
 const left=count(n.left);
 if(k<=left){const [a,b]=split(n.left,k);n.left=b;return [a,pull(n)];}
 const [a,b]=split(n.right,k-left-1);n.right=a;return [pull(n),b];
}
export class MicroSliceIndex{
 #root=null;
 constructor(lengths=[]){this.rebuild(lengths);}
 rebuild(lengths){
  if(!Array.isArray(lengths)||lengths.some(n=>!Number.isSafeInteger(n)||n<0))
   throw new RangeError('Invalid micro-slice lengths');
  this.#root=null;
  for(const n of lengths)this.#root=merge(this.#root,node(n));
 }
 get count(){return count(this.#root);}
 get total(){return sum(this.#root);}
 prefix(index){
  if(!Number.isSafeInteger(index)||index<0||index>this.count)
   throw new RangeError('Invalid prefix');
  let n=this.#root,result=0,k=index;
  while(n){const left=count(n.left);
   if(k<=left)n=n.left;
   else {result+=sum(n.left)+n.length;k-=left+1;n=n.right;}
  }
  return result;
 }
 locate(offset){
  if(!Number.isSafeInteger(offset)||offset<0||offset>this.total||!this.count)return null;
  if(offset===this.total)return this.count-1;
  let n=this.#root,index=0,position=offset;
  while(n){
   const leftSum=sum(n.left),leftCount=count(n.left);
   if(position<leftSum)n=n.left;
   else if(position<leftSum+n.length)return index+leftCount;
   else {position-=leftSum+n.length;index+=leftCount+1;n=n.right;}
  }
  return this.count-1;
 }
 intersect(start,end){
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||
   start<0||end<start||end>this.total)throw new RangeError('Invalid range');
  const first=this.locate(start);
  if(first===null)return null;
  return {first,last:end===start?first:this.locate(end-1)};
 }
 splice(start,deleteCount,lengths){
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(deleteCount)||
    start<0||deleteCount<0||start+deleteCount>this.count||
    !Array.isArray(lengths)||lengths.some(n=>!Number.isSafeInteger(n)||n<0))
   throw new RangeError('Invalid splice');
  const [left,rest]=split(this.#root,start);
  const [,right]=split(rest,deleteCount);
  let middle=null;
  for(const length of lengths)middle=merge(middle,node(length));
  this.#root=merge(merge(left,middle),right);
 }
}

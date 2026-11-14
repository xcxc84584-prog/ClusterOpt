// v0.0.34: dirty-line accumulator. Inclusive, zero-based ranges.
// Adjacent edits coalesce; a batch is strictly bounded to 100 lines.
export const MAX_DIRTY_LINES=100;
export class DirtyLineTracker {
  constructor(maxLines=MAX_DIRTY_LINES){this.maxLines=maxLines;this.ranges=[];}
  reset(){this.ranges=[];}
  add(start,end){
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start)return;
    let a=start,b=end;
    const result=[];
    for(const [left,right] of this.ranges){
      if(right+1<a||left>b+1){result.push([left,right]);continue;}
      a=Math.min(a,left);b=Math.max(b,right);
    }
    result.push([a,b]);result.sort((x,y)=>x[0]-y[0]);
    this.ranges=result;
  }
  // Shift recorded lines following an insertion/deletion; changed lines
  // inside the replacement are covered by the next add().
  shift(at,removedLines,addedLines){
    const delta=addedLines-removedLines;
    if(!delta)return;
    const stop=at+removedLines;
    const updated=[];
    for(const [a,b] of this.ranges){
      if(b<at)updated.push([a,b]);
      else if(a>stop)updated.push([Math.max(0,a+delta),Math.max(0,b+delta)]);
      else updated.push([Math.min(a,at),Math.max(at,b+delta)]);
    }
    this.ranges=[];
    for(const [a,b] of updated)this.add(a,Math.max(a,b));
  }
  take(){
    if(!this.ranges.length)return null;
    const [start,end]=this.ranges[0];
    const stop=Math.min(end,start+this.maxLines-1);
    if(stop===end)this.ranges.shift();
    else this.ranges[0]=[stop+1,end];
    return {start,end:stop};
  }
  get pending(){return this.ranges.length>0;}
}
export function countNewlines(text){
  let count=0;for(let i=0;i<text.length;i++)if(text.charCodeAt(i)===10)count++;
  return count;
}

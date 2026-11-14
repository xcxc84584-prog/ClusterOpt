// ClusterOpt v0.0.33: viewport-windowed read-only overlay.
// CodeMirror's visible-range decorations inspired this approach. The native
// textarea remains the sole owner of text, selection, IME and undo history.
export function buildLineStarts(text) {
  const starts=[0];
  for(let i=0;i<text.length;i++)if(text.charCodeAt(i)===10)starts.push(i+1);
  return starts;
}
export function lineAt(starts,offset) {
  let low=0,high=starts.length-1;
  while(low<high){
    const mid=Math.ceil((low+high)/2);
    if(starts[mid]<=offset)low=mid;
    else high=mid-1;
  }
  return low;
}
export function remapRanges(ranges,before,after) {
  let prefix=0;
  while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;
  let suffix=0;
  while(suffix<before.length-prefix&&suffix<after.length-prefix&&
    before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
  const oldEnd=before.length-suffix;
  const delta=after.length-before.length;
  return ranges.flatMap(r=>{
    if(r.end<=prefix)return [r];
    if(r.start>=oldEnd)return [{...r,start:r.start+delta,end:r.end+delta}];
    const parts=[];
    if(r.start<prefix)parts.push({...r,end:prefix});
    if(r.end>oldEnd)parts.push({...r,start:after.length-suffix,end:r.end+delta});
    return parts;
  });
}
export class HighlightRenderer {
  constructor(textarea,overlay){
    this.editor=textarea;this.overlay=overlay;
    this.lastScheme=null;this.lastText='';
    this.starts=[0];this.windowStart=-1;this.windowEnd=-1;
    this.lineNodes=new Map();
  }
  clear(){
    this.lastScheme=null;this.lastText='';this.starts=[0];
    this.windowStart=-1;this.windowEnd=-1;this.lineNodes.clear();
    this.overlay.replaceChildren();this.editor.classList.remove('highlight-active');
  }
  #lineHeight(){
    return Number.parseFloat(getComputedStyle(this.editor).lineHeight)||22;
  }
  #paint(node,index){
    const start=this.starts[index],end=index+1<this.starts.length?
      this.starts[index+1]-1:this.lastText.length;
    const text=this.lastText.slice(start,end);
    const fragment=document.createDocumentFragment();
    const ranges=this.lastScheme?.ranges||[];
    // Binary search the first overlapping token, then scan this line only.
    let lo=0,hi=ranges.length;
    while(lo<hi){const mid=(lo+hi)>>1;if(ranges[mid].end<=start)lo=mid+1;else hi=mid;}
    let cursor=0;
    for(let i=lo;i<ranges.length&&ranges[i].start<end;i++){
      const r=ranges[i];
      const from=Math.max(cursor,r.start-start),to=Math.min(text.length,r.end-start);
      if(from>cursor)fragment.append(document.createTextNode(text.slice(cursor,from)));
      if(to>from){
        const span=document.createElement('span');
        span.style.color=r.color;
        span.textContent=text.slice(from,to);
        fragment.append(span);
      }
      cursor=Math.max(cursor,to);
    }
    if(cursor<text.length)fragment.append(document.createTextNode(text.slice(cursor)));
    if(!text.length)fragment.append(document.createTextNode(' '));
    node.replaceChildren(fragment);
  }
  #draw(force=false){
    if(!this.lastScheme)return;
    const height=this.#lineHeight();
    const margin=12;
    const first=Math.max(0,Math.floor(this.editor.scrollTop/height)-margin);
    const last=Math.min(this.starts.length,Math.ceil(
      (this.editor.scrollTop+this.editor.clientHeight)/height)+margin);
    if(!force&&first===this.windowStart&&last===this.windowEnd)return;
    this.windowStart=first;this.windowEnd=last;
    const fragment=document.createDocumentFragment(),nodes=new Map();
    const top=document.createElement('div');
    top.style.height=(first*height)+'px';fragment.append(top);
    for(let i=first;i<last;i++){
      const node=this.lineNodes.get(i)||document.createElement('div');
      node.style.height=height+'px';
      node.style.lineHeight=height+'px';
      node.style.whiteSpace='pre';
      if(force||!this.lineNodes.has(i))this.#paint(node,i);
      fragment.append(node);nodes.set(i,node);
    }
    const bottom=document.createElement('div');
    bottom.style.height=((this.starts.length-last)*height)+'px';
    fragment.append(bottom);
    this.overlay.replaceChildren(fragment);this.lineNodes=nodes;
  }
  render(scheme){
    if(scheme.status!=='OK'){this.clear();return;}
    this.lastText=this.editor.value;
    this.starts=buildLineStarts(this.lastText);
    this.lastScheme={...scheme,ranges:[...scheme.ranges].sort((a,b)=>a.start-b.start)};
    this.windowStart=-1;this.#draw(true);
    this.editor.classList.add('highlight-active');this.sync();
  }
  retainDuringEdit(){
    if(!this.lastScheme||!this.editor.classList.contains('highlight-active'))return;
    const next=this.editor.value;
    if(next===this.lastText)return;
    this.lastScheme={...this.lastScheme,
      ranges:remapRanges(this.lastScheme.ranges,this.lastText,next)};
    this.lastText=next;
    this.starts=buildLineStarts(next);
    this.windowStart=-1;this.#draw(true);this.sync();
  }
  // A local edit can arrive before the asynchronous full-slice initial pass.
  // Initialize a blank decoration scheme so local region painting is not lost.
  bootstrap(text){
    if(this.lastScheme)return;
    this.lastText=text;
    this.starts=buildLineStarts(text);
    this.lastScheme={status:'OK',ranges:[]};
    this.windowStart=-1;
    this.#draw(true);
    this.editor.classList.add('highlight-active');
    this.sync();
  }
  renderRegion({startLine,endLine,ranges,status},expectedText){
    if(status!=='OK'||!this.lastScheme||expectedText!==this.editor.value)return false;
    if(startLine<0||endLine<startLine||endLine>=this.starts.length||
      endLine-startLine+1>100)return false;
    const begin=this.starts[startLine];
    const end=endLine+1<this.starts.length?this.starts[endLine+1]-1:this.lastText.length;
    const old=this.lastScheme.ranges.filter(r=>r.end<=begin||r.start>=end);
    this.lastScheme={...this.lastScheme,ranges:[
      ...old,...ranges.map(r=>({...r,start:r.start+begin,end:r.end+begin}))
    ].sort((a,b)=>a.start-b.start)};
    for(let i=startLine;i<=endLine;i++){
      const node=this.lineNodes.get(i);
      if(node)this.#paint(node,i);
    }
    return true;
  }
  renderLine({start,end,ranges,status},expectedText){
    if(status!=='OK'||!this.lastScheme||expectedText!==this.editor.value)return false;
    const index=lineAt(this.starts,start);
    const begin=this.starts[index];
    const finish=index+1<this.starts.length?this.starts[index+1]-1:this.lastText.length;
    if(end>finish)return false;
    const existing=this.lastScheme.ranges.filter(r=>r.end<=begin||r.start>=finish);
    this.lastScheme={...this.lastScheme,ranges:[
      ...existing,...ranges.map(r=>({...r,start:r.start+begin,end:r.end+begin}))
    ].sort((a,b)=>a.start-b.start)};
    const node=this.lineNodes.get(index);
    if(node)this.#paint(node,index);
    return true;
  }
  sync(){
    this.#draw();
    this.overlay.scrollTop=this.editor.scrollTop;
    this.overlay.scrollLeft=this.editor.scrollLeft;
  }
}

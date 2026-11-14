// Read-only overlay: textarea owns all editing and selection.
function lineIndex(text, offset) {
  let index=0;
  for(let i=0;i<offset&&i<text.length;i++)if(text[i]==='\n')index++;
  return index;
}
function lineStart(text, offset) {
  return text.lastIndexOf('\n',Math.max(0,offset-1))+1;
}
export class HighlightRenderer {
  constructor(textarea,overlay){
    this.editor=textarea;this.overlay=overlay;this.lastScheme=null;this.lastText='';
    this.lines=[];
  }
  clear(){
    this.lastScheme=null;this.lastText='';this.lines=[];
    this.overlay.replaceChildren();this.editor.classList.remove('highlight-active');
  }
  #paintLine(element,text,ranges){
    const fragment=document.createDocumentFragment();
    let cursor=0;
    for(const range of ranges){
      const start=Math.max(cursor,Math.min(text.length,range.start));
      const end=Math.max(start,Math.min(text.length,range.end));
      if(start>cursor)fragment.append(document.createTextNode(text.slice(cursor,start)));
      if(end>start){
        const span=document.createElement('span');
        span.style.color=range.color;
        span.textContent=text.slice(start,end);
        fragment.append(span);
      }
      cursor=end;
    }
    if(cursor<text.length)fragment.append(document.createTextNode(text.slice(cursor)));
    // One visual line per element; keep empty and trailing lines measurable.
    if(!text.length)fragment.append(document.createTextNode(' '));
    element.replaceChildren(fragment);
  }
  #lineRanges(ranges,start,end){
    return ranges.filter(r=>r.end>start&&r.start<end).map(r=>({
      ...r,start:Math.max(0,r.start-start),end:Math.min(end-start,r.end-start)
    }));
  }
  render(scheme){
    if(scheme.status!=='OK'){this.clear();return;}
    const value=this.editor.value;
    const lines=value.split('\n'),fragment=document.createDocumentFragment();
    let offset=0;this.lines=[];
    for(const text of lines){
      const element=document.createElement('div');
      element.style.height='22px';
      element.style.whiteSpace='pre';
      this.#paintLine(element,text,this.#lineRanges(scheme.ranges,offset,offset+text.length));
      fragment.append(element);this.lines.push(element);
      offset+=text.length+1;
    }
    this.overlay.replaceChildren(fragment);
    this.lastText=value;this.lastScheme=scheme;
    this.editor.classList.add('highlight-active');this.sync();
  }
  // Fast path: repaint ONLY the edited line. Other line nodes retain their colors.
  renderLine({start,end,ranges,status},expectedText){
    if(status!=='OK'||!this.lastScheme)return false;
    const value=this.editor.value;
    if(value!==expectedText)return false;
    const index=lineIndex(value,start);
    const element=this.lines[index];
    if(!element)return false;
    const begin=lineStart(value,start);
    const finish=value.indexOf('\n',begin);
    const lineEnd=finish<0?value.length:finish;
    if(end>lineEnd)return false;
    const line=value.slice(begin,lineEnd);
    this.#paintLine(element,line,ranges);
    // Preserve old ranges outside the modified line; replace this line's ranges.
    const old=this.lastScheme.ranges.filter(r=>r.end<=begin||r.start>=lineEnd);
    this.lastScheme={...this.lastScheme,ranges:[
      ...old,...ranges.map(r=>({...r,start:r.start+begin,end:r.end+begin}))
    ].sort((a,b)=>a.start-b.start)};
    this.lastText=value;this.sync();
    return true;
  }
  retainDuringEdit(){
    if(!this.lastScheme||!this.editor.classList.contains('highlight-active'))return;
    const before=this.lastText,after=this.editor.value;
    if(before===after)return;
    let prefix=0;
    while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;
    let suffix=0;
    while(suffix<before.length-prefix&&suffix<after.length-prefix&&
      before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
    const oldEnd=before.length-suffix,newEnd=after.length-suffix;
    const oldStart=lineStart(before,prefix),newStart=lineStart(after,prefix);
    const oldLineEnd=before.indexOf('\n',oldEnd);
    const newLineEnd=after.indexOf('\n',newEnd);
    const oldFinish=oldLineEnd<0?before.length:oldLineEnd;
    const newFinish=newLineEnd<0?after.length:newLineEnd;
    const first=lineIndex(before,oldStart);
    const remove=before.slice(oldStart,oldFinish).split('\n').length;
    const replacement=after.slice(newStart,newFinish).split('\n');
    const delta=after.length-before.length;
    const oldRanges=this.lastScheme.ranges;
    const preserved=oldRanges.filter(r=>r.end<=oldStart||r.start>=oldFinish)
      .map(r=>r.start>=oldFinish?{...r,start:r.start+delta,end:r.end+delta}:r);
    const elements=replacement.map(text=>{
      const node=document.createElement('div');
      node.style.height='22px';node.style.whiteSpace='pre';
      this.#paintLine(node,text,[]);return node;
    });
    const removed=this.lines.splice(first,remove,...elements);
    const anchor=this.lines[first+elements.length]||null;
    for(const node of removed)node.remove();
    for(const node of elements)this.overlay.insertBefore(node,anchor);
    this.lastScheme={...this.lastScheme,ranges:preserved};
    this.lastText=after;this.sync();
  }
  sync(){
    this.overlay.scrollTop=this.editor.scrollTop;
    this.overlay.scrollLeft=this.editor.scrollLeft;
  }
}

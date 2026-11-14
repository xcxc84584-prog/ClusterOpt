// Read-only overlay: textarea remains the only source of editable text.
export class HighlightRenderer {
  constructor(textarea,overlay){this.editor=textarea;this.overlay=overlay;this.lastScheme=null;this.lastText='';}
  clear(){this.lastScheme=null;this.lastText='';this.overlay.replaceChildren();this.editor.classList.remove('highlight-active');}
  // Keep previous token colors while the next asynchronous Shiki result is pending.
  // Shift unchanged prefix/suffix ranges across the user's edit.
  retainDuringEdit(){
    if(!this.lastScheme || !this.editor.classList.contains('highlight-active'))return;
    const before=this.lastText,after=this.editor.value;
    if(before===after)return;
    let prefix=0;
    while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;
    let suffix=0;
    while(suffix<before.length-prefix&&suffix<after.length-prefix&&
      before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
    const oldEnd=before.length-suffix,newEnd=after.length-suffix;
    const delta=after.length-before.length;
    const ranges=[];
    for(const r of this.lastScheme.ranges){
      if(r.end<=prefix)ranges.push(r);
      else if(r.start>=oldEnd)ranges.push({...r,start:r.start+delta,end:r.end+delta});
      else {
        if(r.start<prefix)ranges.push({...r,end:prefix});
        if(r.end>oldEnd)ranges.push({...r,start:newEnd,end:r.end+delta});
      }
    }
    this.render({...this.lastScheme,ranges},true);
  }
  render(scheme,provisional=false){
    if(scheme.status!=='OK'){this.clear();return;}
    const value=this.editor.value,fragment=document.createDocumentFragment();
    let cursor=0;
    for(const range of scheme.ranges){
      if(range.start<cursor||range.end>value.length)continue;
      if(range.start>cursor)fragment.append(document.createTextNode(value.slice(cursor,range.start)));
      const span=document.createElement('span');
      span.style.color=range.color;span.textContent=value.slice(range.start,range.end);
      fragment.append(span);cursor=range.end;
    }
    if(cursor<value.length)fragment.append(document.createTextNode(value.slice(cursor)));
    // Preserve trailing empty line geometry.
    if(value.endsWith('\n'))fragment.append(document.createTextNode(' '));
    this.overlay.replaceChildren(fragment);
    this.lastText=value;
    this.lastScheme=scheme;
    this.editor.classList.add('highlight-active');
    this.sync();
  }
  sync(){
    this.overlay.scrollTop=this.editor.scrollTop;
    this.overlay.scrollLeft=this.editor.scrollLeft;
  }
}

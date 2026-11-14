// Read-only overlay: textarea remains the only source of editable text.
export class HighlightRenderer {
  constructor(textarea,overlay){this.editor=textarea;this.overlay=overlay;}
  clear(){this.overlay.replaceChildren();this.editor.classList.remove('highlight-active');}
  render(scheme){
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
    this.editor.classList.add('highlight-active');
    this.sync();
  }
  sync(){
    this.overlay.scrollTop=this.editor.scrollTop;
    this.overlay.scrollLeft=this.editor.scrollLeft;
  }
}

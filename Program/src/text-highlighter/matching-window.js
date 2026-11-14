// Bounded lexical-context matching for incremental syntax repaint.
// UTF-16 offsets match textarea and Shiki. Every returned window <=100 lines.
export const MAX_CONTEXT_LINES=100;
const OPEN={'(':')','[':']','{':'}','<':'>'};
const CLOSE=Object.fromEntries(Object.entries(OPEN).map(([a,b])=>[b,a]));
export function lineStarts(text){
  const starts=[0];for(let i=0;i<text.length;i++)if(text[i]==='\n')starts.push(i+1);
  return starts;
}
export function lineFor(starts,offset){
  let lo=0,hi=starts.length-1;
  while(lo<hi){const mid=(lo+hi+1)>>1;if(starts[mid]<=offset)lo=mid;else hi=mid-1;}
  return lo;
}
export function matchingWindow(text,caret,maxLines=MAX_CONTEXT_LINES){
  const starts=lineStarts(text),anchor=lineFor(starts,Math.min(caret,text.length));
  const half=Math.floor((maxLines-1)/2);
  const lower=Math.max(0,anchor-half),upper=Math.min(starts.length-1,anchor+half);
  // Balance delimiters in a bounded scan. Angle brackets are recognized only
  // as adjacent to the edit, to avoid treating every comparison as a template.
  const stack=[],pairs=[];
  const begin=starts[lower],end=upper+1<starts.length?starts[upper+1]:text.length;
  let quote=null,comment=null;
  for(let i=begin;i<end;i++){
    const ch=text[i],next=text[i+1];
    if(comment==='line'){if(ch==='\n')comment=null;continue;}
    if(comment==='block'){if(ch==='*'&&next==='/'){comment=null;i++;}continue;}
    if(quote){if(ch==='\\'){i++;continue;}if(ch===quote)quote=null;continue;}
    if(ch==='/'&&next==='/'){comment='line';i++;continue;}
    if(ch==='/'&&next==='*'){comment='block';i++;continue;}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}
    if(OPEN[ch]){
      if(ch==='<'&&i!==caret&&i!==caret-1)continue;
      stack.push({ch,at:i});continue;
    }
    if(CLOSE[ch]){
      if(ch==='>'&&i!==caret&&i!==caret-1)continue;
      const top=stack[stack.length-1];
      if(top&&top.ch===CLOSE[ch]){stack.pop();pairs.push([top.at,i]);}
    }
  }
  let first=anchor,last=anchor;
  // Nearest enclosing matched pair (or an adjacent pair).
  const enclosing=pairs.filter(([a,b])=>a<=caret&&b>=caret)
    .sort((a,b)=>(a[1]-a[0])-(b[1]-b[0]))[0];
  const adjacent=pairs.filter(([a,b])=>Math.abs(a-caret)<=1||Math.abs(b-caret)<=1)
    .sort((a,b)=>Math.min(Math.abs(a[0]-caret),Math.abs(a[1]-caret))-
      Math.min(Math.abs(b[0]-caret),Math.abs(b[1]-caret)))[0];
  const match=enclosing||adjacent;
  if(match){first=Math.min(anchor,lineFor(starts,match[0]));
    last=Math.max(anchor,lineFor(starts,match[1]));}
  // Block comments are delimiter pairs too; find the nearest /* ... */ pair
  // around the caret within the bounded search window.
  const open=text.lastIndexOf('/*',caret);
  const close=open>=begin?text.indexOf('*/',open+2):-1;
  if(open>=begin&&close>=caret&&close<end){
    const a=lineFor(starts,open),b=lineFor(starts,close+1);
    if(b-a+1<=maxLines){first=Math.min(first,a);last=Math.max(last,b);}
  }
  if(last-first+1>maxLines){first=Math.max(lower,anchor-half);last=Math.min(upper,first+maxLines-1);}
  return {startLine:first,endLine:last,starts,matched:!!match};
}

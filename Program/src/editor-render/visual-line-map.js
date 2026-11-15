// v0.0.50.5: pure, bounded logical/visual line mapping for soft-wrap planning.
// The native textarea remains authoritative. No DOM, FLAG, MVCC or file reads.
// This model uses display columns; proportional fonts and complex graphemes
// require browser-measured layout before it can drive production rendering.
function validateInteger(n,min=0){
 if(!Number.isSafeInteger(n)||n<min)throw new RangeError('Invalid visual-line parameter');
}
function columns(char,position,tabSize){
 if(char==='\t')return tabSize-position%tabSize;
 // UTF-16 astral symbols, combining marks and East Asian glyphs are NOT
 // assumed to have browser-exact widths; caller must opt into column model.
 return 1;
}
export function wrapSegments(text,maxColumns,{tabSize=4}={}){
 if(typeof text!=='string')throw new TypeError('Text must be a string');
 validateInteger(maxColumns,1);validateInteger(tabSize,1);
 const result=[];let start=0,column=0;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(char==='\n')throw new RangeError('wrapSegments accepts one logical line');
  const width=columns(char,column,tabSize);
  if(column>0&&column+width>maxColumns){
   result.push(Object.freeze({start,end:i,columns:column}));
   start=i;column=0;
  }
  column+=columns(char,column,tabSize);
 }
 result.push(Object.freeze({start,end:text.length,columns:column}));
 return result;
}
export class VisualLineMap{
 #rows=[];#prefix=[0];#columnWidth;#tabSize;
 constructor({maxColumns,tabSize=4}={}){
  validateInteger(maxColumns,1);validateInteger(tabSize,1);
  this.#columnWidth=maxColumns;this.#tabSize=tabSize;
 }
 get logicalLineCount(){return this.#rows.length;}
 get visualLineCount(){return this.#prefix.at(-1);}
 // Incrementally replace ONLY the loaded logical lines. Lines are local to
 // the resident physical slice; never read the entire file.
 spliceLines(start,deleteCount,lines){
  validateInteger(start);validateInteger(deleteCount);
  if(start+deleteCount>this.#rows.length||!Array.isArray(lines)||
   lines.some(line=>typeof line!=='string'||line.includes('\n')))
   throw new RangeError('Invalid visual-line splice');
  const rows=lines.map(line=>wrapSegments(line,this.#columnWidth,{tabSize:this.#tabSize}));
  this.#rows.splice(start,deleteCount,...rows);
  this.#prefix.length=this.#rows.length+1;
  this.#prefix[0]=0;
  for(let i=0;i<this.#rows.length;i++)this.#prefix[i+1]=this.#prefix[i]+this.#rows[i].length;
  return this.visualLineCount;
 }
 logicalToVisual(line,offset=0){
  validateInteger(line);validateInteger(offset);
  const segments=this.#rows[line];
  if(!segments||offset>segments.at(-1).end)throw new RangeError('Invalid logical offset');
  let i=segments.findIndex((s,index)=>offset<s.end||index===segments.length-1);
  return Object.freeze({visualLine:this.#prefix[line]+i,visualColumn:offset-segments[i].start});
 }
 visualToLogical(visualLine){
  validateInteger(visualLine);
  if(visualLine>=this.visualLineCount)throw new RangeError('Invalid visual line');
  let low=0,high=this.#rows.length;
  while(low+1<high){const mid=(low+high)>>1;
   if(this.#prefix[mid]<=visualLine)low=mid;else high=mid;}
  const segment=visualLine-this.#prefix[low];
  return Object.freeze({logicalLine:low,segment,
   start:this.#rows[low][segment].start,end:this.#rows[low][segment].end});
 }
 visualWindow(start,end){
  validateInteger(start);validateInteger(end);
  if(end<start||end>this.visualLineCount)throw new RangeError('Invalid visual window');
  const result=[];
  for(let v=start;v<end;v++)result.push({visualLine:v,...this.visualToLogical(v)});
  return result;
 }
}

/** Compute a bounded visual-line window and its logical-line coverage. */
export function calculateWrappedViewport(map,{scrollTop,viewportHeight,lineHeight,overscan=2}){
 if(!(map instanceof VisualLineMap)||![scrollTop,viewportHeight,lineHeight,overscan].every(Number.isFinite)||
   scrollTop<0||viewportHeight<0||lineHeight<=0||!Number.isSafeInteger(overscan)||overscan<0)
   throw new RangeError('Invalid wrapped viewport');
 const total=map.visualLineCount;
 const start=Math.min(total,Math.max(0,Math.floor(scrollTop/lineHeight)-overscan));
 const end=Math.min(total,Math.max(start,Math.ceil((scrollTop+viewportHeight)/lineHeight)+overscan));
 const first=start<end?map.visualToLogical(start).logicalLine:null;
 const last=start<end?map.visualToLogical(end-1).logicalLine:null;
 return Object.freeze({visualStart:start,visualEnd:end,logicalStart:first,
  logicalEnd:last===null?null:last+1});
}

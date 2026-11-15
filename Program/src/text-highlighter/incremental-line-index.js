// Known UTF-16 edit fast path; avoids rescanning the resident text for LF offsets.
// Caller must validate that the beforeinput intent matches the resulting text.
export function patchLineStarts(starts,patch){
  const {start,end,text,previousLength}=patch??{};
  if(!Array.isArray(starts)||starts[0]!==0||
    ![start,end,previousLength].every(Number.isSafeInteger)||
    start<0||end<start||end>previousLength||typeof text!=='string')
    throw new RangeError('Invalid line-index patch');
  const lowerBound=value=>{
    let lo=0,hi=starts.length;
    while(lo<hi){const mid=(lo+hi)>>1;
      if(starts[mid]<value)lo=mid+1;else hi=mid;}
    return lo;
  };
  const afterStart=lowerBound(start+1);
  const afterEnd=lowerBound(end+1);
  const delta=text.length-(end-start);
  const inserted=[];
  for(let i=0;i<text.length;i++)if(text.charCodeAt(i)===10)inserted.push(start+i+1);
  return [...starts.slice(0,afterStart),...inserted,
    ...starts.slice(afterEnd).map(offset=>offset+delta)];
}
export function patchTokenRanges(ranges,patch){
  const {start,end,text}=patch;
  const delta=text.length-(end-start);
  const result=[];
  for(const range of ranges){
    if(range.end<=start){result.push(range);continue;}
    if(range.start>=end){result.push({...range,start:range.start+delta,
      end:range.end+delta});continue;}
    if(range.start<start)result.push({...range,end:start});
    if(range.end>end)result.push({...range,start:end+delta,end:range.end+delta});
  }
  return result;
}
export function validateKnownEdit(before,after,patch){
  if(typeof before!=='string'||typeof after!=='string'||!patch||
    !Number.isSafeInteger(patch.start)||!Number.isSafeInteger(patch.end)||
    patch.start<0||patch.end<patch.start||patch.end>before.length||
    patch.previousLength!==before.length||typeof patch.text!=='string'||
    after.length!==before.length+patch.text.length-(patch.end-patch.start)||
    after.slice(patch.start,patch.start+patch.text.length)!==patch.text)return false;
  const window=32;
  const left=Math.max(0,patch.start-window);
  const right=Math.min(before.length,patch.end+window);
  return before.slice(left,patch.start)===after.slice(left,patch.start)&&
    before.slice(patch.end,right)===
      after.slice(patch.start+patch.text.length,
        patch.start+patch.text.length+right-patch.end);
}

// 50.4: bounded gutter window, independent of document line count.
export function calculateGutterWindow({
 lineCount,firstLine=1,scrollTop=0,viewportHeight=0,lineHeight=22,
 paddingTop=16,overscan=4
}){
 if(!Number.isSafeInteger(lineCount)||lineCount<1||
    !Number.isSafeInteger(firstLine)||firstLine<1||
    ![scrollTop,viewportHeight,lineHeight,paddingTop,overscan].every(Number.isFinite)||
    lineHeight<=0||viewportHeight<0||overscan<0)throw new RangeError('Invalid gutter geometry');
 const top=Math.max(0,scrollTop-paddingTop);
 const start=Math.min(lineCount-1,Math.max(0,Math.floor(top/lineHeight)-Math.ceil(overscan)));
 const end=Math.min(lineCount,Math.max(start+1,
   Math.ceil((scrollTop+viewportHeight-paddingTop)/lineHeight)+Math.ceil(overscan)));
 return {start,end,offsetTop:paddingTop+start*lineHeight,
  firstNumber:firstLine+start,lastNumber:firstLine+end-1};
}

// Conservative lexical checkpoints for bounded C-family re-tokenization.
// These are NOT Shiki grammar stacks. Unsupported syntax returns null.
const SUPPORTED=new Set(['c','cpp','css','java','javascript','typescript']);
export function findLexicalRestart(source,caret,language,{maxLines=100,knownStarts=null}={}){
  if(typeof source!=='string'||!Number.isSafeInteger(caret)||caret<0||
    caret>source.length||!Number.isSafeInteger(maxLines)||maxLines<1)
    throw new RangeError('Invalid lexical checkpoint request');
  if(!SUPPORTED.has(language))return null;
  const starts=knownStarts||[0];
  if(!knownStarts)for(let i=0;i<source.length;i++)if(source.charCodeAt(i)===10)starts.push(i+1);
  let lo=0,hi=starts.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);
    if(starts[mid]<=caret)lo=mid;else hi=mid-1;}
  const line=lo,first=Math.max(0,line-maxLines+1);
  // A checkpoint at the beginning of a bounded window is safe only when
  // its lexical state is known. We refuse to invent a state beyond line zero.
  if(first!==0)return null;
  let block=false,quote=null,escape=false,lastNeutral=0;
  for(let i=0;i<starts[line];i++){
    const ch=source[i],next=source[i+1];
    if(ch==='\n'){
      if(quote)return null; // multiline strings require grammar-specific state
      if(!block)lastNeutral=i+1;
      continue;
    }
    if(block){if(ch==='*'&&next==='/'){block=false;i++;}continue;}
    if(quote){if(escape){escape=false;continue;}
      if(ch==='\\'){escape=true;continue;}
      if(ch===quote)quote=null;
      continue;
    }
    if(ch==='/'&&next==='*'){block=true;i++;continue;}
    if(ch==='/'&&next==='/'){
      const end=source.indexOf('\n',i);
      if(end<0||end>=starts[line])break;
      i=end-1;continue;
    }
    if(ch==='\x60')return null; // template literal: grammar-specific
    if(ch==='"'||ch==="'"){quote=ch;continue;}
  }
  const restartLine=starts.findIndex(v=>v===lastNeutral);
  return Object.freeze({restartLine,anchorLine:line,knownNeutral:!block&&!quote,
    starts});
}

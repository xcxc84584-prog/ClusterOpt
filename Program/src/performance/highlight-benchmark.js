import {performance} from 'node:perf_hooks';
import {buildLineStarts,remapRanges} from '../text-highlighter/highlight-renderer.js';

function summarize(samples){
  const sorted=[...samples].sort((a,b)=>a-b);
  const percentile=p=>sorted[Math.min(sorted.length-1,Math.floor(p*(sorted.length-1)))];
  return {count:sorted.length,p50:percentile(.5),p95:percentile(.95),
    p99:percentile(.99),max:sorted.at(-1)};
}
export function benchmarkHighlight({lines=10000,iterations=30,width=64}={}){
  if(![lines,iterations,width].every(Number.isSafeInteger)||
    lines<1||iterations<1||width<1||lines>1000000||iterations>10000||width>4096)
    throw new RangeError('Invalid benchmark configuration');
  const text=Array.from({length:lines},(_,i)=>'x'.repeat(width-1)+(i%2?'\n':'\n')).join('');
  const mid=Math.floor(text.length/2);
  const changed=text.slice(0,mid)+'z'+text.slice(mid);
  const ranges=Array.from({length:Math.min(lines,20000)},(_,i)=>({
    start:i*width,end:i*width+Math.min(width,8),token:'plain'
  }));
  const samples={lineIndex:[],rangeRemap:[]};
  for(let i=0;i<iterations;i++){
    let start=performance.now();
    const starts=buildLineStarts(changed);
    samples.lineIndex.push(performance.now()-start);
    if(starts.length!==lines+1)throw new Error('Unexpected line index');
    start=performance.now();
    const mapped=remapRanges(ranges,text,changed);
    samples.rangeRemap.push(performance.now()-start);
    if(!mapped.length)throw new Error('Unexpected empty range map');
  }
  return {configuration:{lines,iterations,width,bytes:text.length},
    environment:'Node.js, no Shiki network, no DOM or browser input latency',
    lineIndex:summarize(samples.lineIndex),rangeRemap:summarize(samples.rangeRemap)};
}

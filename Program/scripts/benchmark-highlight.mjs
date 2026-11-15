import {benchmarkHighlight} from '../src/performance/highlight-benchmark.js';
const [lines=10000,iterations=30,width=64]=process.argv.slice(2).map(Number);
console.log(JSON.stringify(benchmarkHighlight({lines,iterations,width}),null,2));
